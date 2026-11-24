from django.contrib.auth import login, logout
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.api.serializers import (
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
from accounts.models import User
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
        user.save(update_fields=["password", "failed_login_attempts", "locked_until"])

        return Response(
            {"detail": "Password reset successfully. You may now log in."},
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """Invalidate session and (optionally) blacklist the refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
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
        return Response(
            {"detail": "Two-factor authentication disabled.", "user": UserPublicSerializer(user).data}
        )


class MeView(APIView):
    """Return the currently authenticated user (works for both JWT and session)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)
