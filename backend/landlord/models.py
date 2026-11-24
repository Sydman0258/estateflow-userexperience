from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class LandlordProfile(models.Model):
    """
    Extended profile for users with role=LANDLORD.
    One-to-one with the custom User model.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="landlord_profile",
        limit_choices_to={"role": "LANDLORD"},
    )
    company_name = models.CharField(_("Company Name"), max_length=200, blank=True)
    business_registration = models.CharField(
        _("Business Registration Number"), max_length=100, blank=True
    )
    bio = models.TextField(_("Bio"), blank=True)
    verified = models.BooleanField(_("Verified Landlord"), default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Landlord Profile")
        verbose_name_plural = _("Landlord Profiles")

    def __str__(self) -> str:
        return f"Landlord: {self.user.get_full_name() or self.user.email}"
