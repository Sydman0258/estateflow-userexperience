import json

from django.contrib.auth import login, logout
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts import audit
from accounts.api.serializers import (
    AuthEventSerializer,
    ChangePasswordSerializer,
    PasswordConfirmSerializer,
    ProfileUpdateSerializer,
    LandlordRegistrationSerializer,
    LoginSerializer,
    OTPLoginVerifySerializer,
    OTPVerifySerializer,
    PasswordResetSerializer,
    ResendOTPSerializer,
    TenantRegistrationSerializer,
    TwoFactorDisableSerializer,
    TwoFactorEnableSerializer,
    UserPublicSerializer,
)
from accounts.models import AuthEvent, User
from accounts.tokens import revoke_all_tokens
from accounts.otpservice import OTPService


class TenantRegistrationView(CreateAPIView):
    serializer_class = TenantRegistrationSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    authentication_classes = []
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "detail": "Registration successful. An OTP has been sent to your email. "
                "Please verify to activate your account.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class LandlordRegistrationView(CreateAPIView):
    serializer_class = LandlordRegistrationSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    authentication_classes = []
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "detail": "Registration successful. An OTP has been sent to your email. "
                "Please verify to activate your account.",
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class ActivateAccountView(APIView):
    """Verify OTP to set is_active=True (email verification / first 2FA)."""

    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if user.is_active:
            return Response({"detail": "Account is already active."}, status=status.HTTP_200_OK)

        user.is_active = True
        user.failed_login_attempts = 0
        user.locked_until = None
        user.otp_attempts = 0
        user.last_otp_sent_at = None  # let the first login send a fresh code immediately
        user.save(
            update_fields=[
                "is_active",
                "failed_login_attempts",
                "locked_until",
                "otp_attempts",
                "last_otp_sent_at",
            ]
        )

        audit.record(request, user, "ACCOUNT_ACTIVATED")
        return Response(
            {
                "detail": "Account activated successfully. You may now log in.",
                "email": user.email,
            },
            status=status.HTTP_200_OK,
        )


def _issue_session(request, user, detail):
    """Create JWT pair + Django session and build the standard login response."""
    refresh = RefreshToken.for_user(user)
    login(request, user)
    audit.record(request, user, "LOGIN_SUCCESS")
    return Response(
        {
            "detail": detail,
            "user": UserPublicSerializer(user).data,
            "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)},
            "session": True,
            "requires_otp": False,
        },
        status=status.HTTP_200_OK,
    )


class LoginView(APIView):
    """
    First factor: email + password.
    - 2FA OFF (default): tokens are issued immediately.
    - 2FA ON: a fresh OTP is emailed and the client must call /auth/login/verify/.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if not user.two_factor_enabled:
            return _issue_session(request, user, "Login successful.")

        otp_service = OTPService(user)
        sent = otp_service.send_otp(purpose="login")
        if not sent:
            # A code was emailed less than MIN_RESEND_SECONDS ago and is still valid
            # (codes last several minutes), so let the user continue to the OTP step.
            return Response(
                {
                    "detail": "A code was sent to your email moments ago. "
                    "Enter that code to complete login.",
                    "email": user.email,
                    "requires_otp": True,
                    "already_sent": True,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "detail": "Credentials accepted. An OTP has been sent to your email. "
                "Submit it to /api/auth/login/verify/ to complete login.",
                "email": user.email,
                "requires_otp": True,
            },
            status=status.HTTP_200_OK,
        )


class LoginVerifyView(APIView):
    """
    Second factor: email + password + OTP.
    On success issues JWT pair AND establishes a Django session.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = OTPLoginVerifySerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # Issue JWT
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        # Also create a server-side session (session-based auth)
        login(request, user)
        audit.record(request, user, "LOGIN_SUCCESS")

        return Response(
            {
                "detail": "Login successful (2FA completed).",
                "user": UserPublicSerializer(user).data,
                "tokens": {
                    "access": access,
                    "refresh": refresh_token,
                },
                "session": True,
            },
            status=status.HTTP_200_OK,
        )


class ResendOTPView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Do not reveal whether the email exists
            return Response(
                {"detail": "If an account exists for this email, an OTP has been sent."},
                status=status.HTTP_200_OK,
            )

        otp_service = OTPService(user)
        sent = otp_service.send_otp(purpose="resend")
        if not sent:
            return Response(
                {
                    "detail": "Please wait before requesting another OTP.",
                    "retry_after_seconds": OTPService.MIN_RESEND_SECONDS,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        return Response(
            {"detail": "If an account exists for this email, an OTP has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetView(APIView):
    """Set a new password using email + OTP (request the OTP via /otp/resend/)."""

    authentication_classes = []
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        user.set_password(serializer.validated_data["password"])
        user.failed_login_attempts = 0
        user.locked_until = None
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "failed_login_attempts", "locked_until", "password_changed_at"])
        revoke_all_tokens(user)  # a reset invalidates every existing session
        audit.record(request, user, "PASSWORD_RESET")

        return Response(
            {"detail": "Password reset successfully. You may now log in."},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """Invalidate session and (optionally) blacklist the refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        audit.record(request, request.user, "LOGOUT")
        # Session logout
        logout(request)

        # JWT blacklist if a refresh token is supplied
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # already invalid or blacklist not configured

        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)


class TwoFactorSendView(APIView):
    """Email a code the logged-in user must confirm before 2FA can be enabled."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.two_factor_enabled:
            return Response({"detail": "Two-factor authentication is already enabled."})
        sent = OTPService(user).send_otp(purpose="enable_2fa")
        detail = (
            "A verification code has been sent to your email."
            if sent
            else "A code was sent to your email moments ago. Enter that code."
        )
        return Response({"detail": detail})


class TwoFactorEnableView(APIView):
    """Turn 2FA on after proving access to the email address."""

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = TwoFactorEnableSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.two_factor_enabled = True
        user.save(update_fields=["two_factor_enabled"])
        audit.record(request, user, "TWO_FACTOR_ENABLED")
        return Response(
            {"detail": "Two-factor authentication enabled.", "user": UserPublicSerializer(user).data}
        )


class TwoFactorDisableView(APIView):
    """Turn 2FA off; requires the current password."""

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = TwoFactorDisableSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.two_factor_enabled = False
        user.save(update_fields=["two_factor_enabled"])
        audit.record(request, user, "TWO_FACTOR_DISABLED")
        return Response(
            {"detail": "Two-factor authentication disabled.", "user": UserPublicSerializer(user).data}
        )


def _fresh_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class MeView(APIView):
    """Return (GET) or update (PATCH) the authenticated user's own profile."""

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        audit.record(request, request.user, "PROFILE_UPDATED")
        return Response(UserPublicSerializer(request.user).data)


class ChangePasswordView(APIView):
    """
    Change password (requires current password).
    Every other session is signed out; the caller receives fresh tokens.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at"])
        revoke_all_tokens(user)
        audit.record(request, user, "PASSWORD_CHANGED")
        return Response(
            {
                "detail": "Password changed. You were signed out of all other devices.",
                "tokens": _fresh_tokens(user),
                "user": UserPublicSerializer(user).data,
            }
        )


class RevokeSessionsView(APIView):
    """Sign out of every device (blacklist all refresh tokens); keep this one signed in."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        revoke_all_tokens(request.user)
        audit.record(request, request.user, "SESSIONS_REVOKED")
        return Response(
            {
                "detail": "Signed out of all other devices.",
                "tokens": _fresh_tokens(request.user),
            }
        )


class SecurityActivityView(APIView):
    """Most recent security events for the signed-in user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = AuthEvent.objects.filter(user=request.user)[:20]
        return Response(AuthEventSerializer(events, many=True).data)


class DeactivateAccountView(APIView):
    """Deactivate the account after password confirmation. Re-activation needs an emailed OTP."""

    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        serializer = PasswordConfirmSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        audit.record(request, user, "ACCOUNT_DEACTIVATED")
        revoke_all_tokens(user)
        user.is_active = False
        user.save(update_fields=["is_active"])
        logout(request)
        return Response({"detail": "Your account has been deactivated."})


class ExportDataView(APIView):
    """Download everything we hold about the signed-in user as JSON (privacy / data portability)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from payment.models import Payment

        user = request.user
        payments = Payment.objects.filter(Q(tenant=user) | Q(landlord=user)).select_related("property")
        data = {
            "exported_at": timezone.now().isoformat(),
            "profile": UserPublicSerializer(user).data,
            "security_events": AuthEventSerializer(AuthEvent.objects.filter(user=user), many=True).data,
            "payments": [
                {
                    "reference": p.reference,
                    "property": p.property.name,
                    "amount": p.amount,
                    "currency": p.currency,
                    "type": p.payment_type,
                    "method": p.method,
                    "status": p.status,
                    "created_at": p.created_at.isoformat(),
                    "completed_at": p.completed_at.isoformat() if p.completed_at else None,
                }
                for p in payments
            ],
        }
        audit.record(request, user, "DATA_EXPORTED")
        resp = HttpResponse(json.dumps(data, indent=2, default=str), content_type="application/json")
        resp["Content-Disposition"] = 'attachment; filename="estateflow-my-data.json"'
        return resp
