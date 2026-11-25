from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from accounts.manager import UserManager


class User(AbstractUser):
    """
    Custom user model.
    Security notes:
    - Email is the unique identifier (USERNAME_FIELD).
    - OTP secret is stored server-side only; never exposed in API responses.
    - is_active gates login until email OTP verification succeeds.
    - failed_login_attempts + lockout support brute-force mitigation.
    """

    class Role(models.TextChoices):
        ADMIN = "ADMIN", _("Admin")
        TENANT = "TENANT", _("Tenant")
        LANDLORD = "LANDLORD", _("Landlord")

    first_name = models.CharField(_("First Name"), max_length=150)
    last_name = models.CharField(_("Last Name"), max_length=150)

    username = models.CharField(
        _("Username"),
        max_length=150,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[\w.@+-]+$",
                message=_("Enter a valid username."),
            )
        ],
    )

    email = models.EmailField(_("Email"), unique=True)

    role = models.CharField(
        _("Role"),
        max_length=8,
        choices=Role.choices,
    )

    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message=_("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."),
    )
    phone_number = models.CharField(
        _("Phone Number"),
        validators=[phone_regex],
        max_length=20,
        blank=True,
        null=True,
    )

    # Two-factor authentication is OFF by default; users opt in from Settings.
    two_factor_enabled = models.BooleanField(
        _("Two-factor authentication"),
        default=False,
        help_text=_("When enabled, login requires an emailed one-time code."),
    )

    password_changed_at = models.DateTimeField(null=True, blank=True, editable=False)

    # OTP / 2FA fields – never serialize these
    otp_secret_key = models.CharField(
        max_length=64,
        blank=True,
        null=True,
        editable=False,
        help_text=_("Base32 secret used for TOTP generation. Never expose."),
    )
    last_otp_sent_at = models.DateTimeField(blank=True, null=True, editable=False)
    otp_attempts = models.PositiveSmallIntegerField(default=0, editable=False)

    # Brute-force protection
    failed_login_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    locked_until = models.DateTimeField(blank=True, null=True, editable=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    objects = UserManager()

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self) -> str:
        return self.email

    def get_full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_tenant(self) -> bool:
        return self.role == self.Role.TENANT

    @property
    def is_landlord(self) -> bool:
        return self.role == self.Role.LANDLORD

    @property
    def is_admin_role(self) -> bool:
        return self.role == self.Role.ADMIN or self.is_superuser



class AuthEvent(models.Model):
    """
    Security audit trail shown to the user under Settings > Security.
    Stores event type, IP and user-agent only. Never secrets, passwords or OTPs.
    """

    class Event(models.TextChoices):
        LOGIN_SUCCESS = "LOGIN_SUCCESS", _("Signed in")
        LOGIN_FAILED = "LOGIN_FAILED", _("Failed sign-in attempt")
        LOGOUT = "LOGOUT", _("Signed out")
        PASSWORD_CHANGED = "PASSWORD_CHANGED", _("Password changed")
        PASSWORD_RESET = "PASSWORD_RESET", _("Password reset")
        TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED", _("Two-factor enabled")
        TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED", _("Two-factor disabled")
        PROFILE_UPDATED = "PROFILE_UPDATED", _("Profile updated")
        SESSIONS_REVOKED = "SESSIONS_REVOKED", _("Signed out of all devices")
        ACCOUNT_ACTIVATED = "ACCOUNT_ACTIVATED", _("Account activated")
        ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED", _("Account deactivated")
        DATA_EXPORTED = "DATA_EXPORTED", _("Personal data exported")

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="auth_events"
    )
    event = models.CharField(max_length=32, choices=Event.choices)
    success = models.BooleanField(default=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user_id} {self.event} {self.created_at:%Y-%m-%d %H:%M}"
