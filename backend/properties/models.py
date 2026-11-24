from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Property(models.Model):
    """
    Rental property owned by a landlord.
    All access control is enforced at the view/permission layer using
    IsPropertyLandlord + role checks. ORM only – no raw SQL.
    """

    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="properties",
        limit_choices_to={"role": "LANDLORD"},
    )

    name = models.CharField(_("Name"), max_length=150)
    house_number = models.CharField(_("House Number"), max_length=20)
    street_address = models.CharField(_("Street Address"), max_length=150)
    suburb = models.CharField(_("Suburb/Tol"), max_length=150)
    town = models.CharField(_("Town/Municipality"), max_length=150)
    district = models.CharField(_("District"), max_length=150)
    province = models.CharField(_("Province"), max_length=120)

    price = models.PositiveIntegerField(
        _("Price Per Month"),
        validators=[MinValueValidator(0)],
        help_text=_("Monthly rent in the smallest currency unit (e.g. cents) or whole units."),
    )

    description = models.TextField(_("Description"), blank=True)
    bedrooms = models.PositiveSmallIntegerField(_("Bedrooms"), default=1)
    bathrooms = models.PositiveSmallIntegerField(_("Bathrooms"), default=1)
    is_available = models.BooleanField(_("Available"), default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "properties"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["landlord"]),
            models.Index(fields=["is_available"]),
            models.Index(fields=["province", "town"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.house_number} {self.street_address})"
