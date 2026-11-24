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
