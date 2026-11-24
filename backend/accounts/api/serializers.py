from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers

from accounts.models import User
from accounts.otpservice import OTPService


class BaseRegistrationSerializer(serializers.ModelSerializer):
    """
    Shared registration logic.
    Cross-validation performed here:
    - Password strength (Django validators)
    - Email & username uniqueness (model + explicit checks)
    - Role is forced by the subclass (cannot be client-supplied)
    - Account starts inactive until OTP verification
    """

    password = serializers.CharField(write_only=True, min_length=9, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "username",
            "email",
            "phone_number",
            "password",
            "password_confirm",
        ]
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "username": {"required": True},
            "email": {"required": True},
        }

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        user = User(
            **validated_data,
            role=self.user_role,
            is_active=False,  # requires OTP verification
        )
        user.set_password(password)

        otp_service = OTPService(user)
        user.otp_secret_key = otp_service.generate_otp_secret_key()
        user.save()

        # Send activation OTP
        otp_service.send_otp(purpose="activation")
        return user


class TenantRegistrationSerializer(BaseRegistrationSerializer):
    user_role = User.Role.TENANT


class LandlordRegistrationSerializer(BaseRegistrationSerializer):
    user_role = User.Role.LANDLORD


class OTPVerifySerializer(serializers.Serializer):
    """Activate account or complete 2FA step with email + OTP."""

    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        otp = attrs["otp"].strip()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or OTP.")

        # Cross-check lockout
        if user.locked_until and user.locked_until > timezone.now():
            raise serializers.ValidationError("Account temporarily locked. Try again later.")

        otp_service = OTPService(user)
        if not otp_service.verify_otp(otp):
            # Increment failed attempts for the user
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 8:
                user.locked_until = timezone.now() + timedelta(minutes=30)
            user.save(update_fields=["failed_login_attempts", "locked_until"])
            raise serializers.ValidationError("Invalid or expired OTP.")

        attrs["user"] = user
        return attrs


class LoginSerializer(serializers.Serializer):
    """
    First factor: email + password.
    If the user has enabled two-factor authentication, we send a fresh OTP and
    require a second step (OTPLoginVerifySerializer). Otherwise the view issues
    tokens straight away.
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, style={"input_type": "password"}, write_only=True)

    def validate(self, attrs):
        email = attrs.get("email", "").lower().strip()
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password,
        )

        if not user:
            # Generic message to avoid user enumeration
            raise serializers.ValidationError("Invalid email or password.")

        if user.locked_until and user.locked_until > timezone.now():
            raise serializers.ValidationError("Account temporarily locked due to too many failed attempts.")

        if not user.is_active:
            raise serializers.ValidationError(
                "Your account is not activated. Please verify your email with the OTP we sent."
            )

        # Reset failed attempts on successful password check
        if user.failed_login_attempts:
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save(update_fields=["failed_login_attempts", "locked_until"])

        attrs["user"] = user
        return attrs


class OTPLoginVerifySerializer(serializers.Serializer):
    """
    Second factor after password success.
    Client must supply email + otp (password is already verified in previous step
    via a short-lived server-side flag or by re-supplying it; we re-verify password
    here for extra safety / statelessness).
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})
    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        password = attrs["password"]
        otp = attrs["otp"].strip()

        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password,
        )
        if not user:
            raise serializers.ValidationError("Invalid credentials.")

        if not user.is_active:
            raise serializers.ValidationError("Account is not active.")

        if user.locked_until and user.locked_until > timezone.now():
            raise serializers.ValidationError("Account temporarily locked.")

        otp_service = OTPService(user)
        if not otp_service.verify_otp(otp):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 8:
                user.locked_until = timezone.now() + timedelta(minutes=30)
            user.save(update_fields=["failed_login_attempts", "locked_until"])
            raise serializers.ValidationError("Invalid or expired OTP.")

        # Success – clear counters
        user.failed_login_attempts = 0
        user.locked_until = None
        user.otp_attempts = 0
        user.save(update_fields=["failed_login_attempts", "locked_until", "otp_attempts"])

        attrs["user"] = user
        return attrs


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class UserPublicSerializer(serializers.ModelSerializer):
    """Safe public representation – never includes secrets."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "is_active",
            "two_factor_enabled",
            "date_joined",
        ]
        read_only_fields = fields


class PasswordResetSerializer(serializers.Serializer):
    """Reset a password using the emailed OTP."""

    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, min_length=6, max_length=6)
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired OTP.")

        if user.locked_until and user.locked_until > timezone.now():
            raise serializers.ValidationError("Account temporarily locked. Try again later.")

        if not OTPService(user).verify_otp(attrs["otp"].strip()):
            raise serializers.ValidationError("Invalid or expired OTP.")

        validate_password(attrs["password"], user=user)
        attrs["user"] = user
        return attrs


class TwoFactorEnableSerializer(serializers.Serializer):
    """Confirm the emailed OTP to switch 2FA on for the logged-in user."""

    otp = serializers.CharField(required=True, min_length=6, max_length=6)

    def validate(self, attrs):
        user = self.context["request"].user
        if not OTPService(user).verify_otp(attrs["otp"].strip()):
            raise serializers.ValidationError("Invalid or expired OTP.")
        return attrs


class TwoFactorDisableSerializer(serializers.Serializer):
    """Require the current password to switch 2FA off."""

    password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})

    def validate_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value
