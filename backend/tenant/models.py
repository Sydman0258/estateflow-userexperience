from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class TenantProfile(models.Model):
    """
    Extended profile for users with role=TENANT.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tenant_profile",
        limit_choices_to={"role": "TENANT"},
    )
    preferred_location = models.CharField(_("Preferred Location"), max_length=200, blank=True)
    max_budget = models.PositiveIntegerField(_("Max Monthly Budget"), null=True, blank=True)
    occupation = models.CharField(_("Occupation"), max_length=150, blank=True)
    emergency_contact_name = models.CharField(
        _("Emergency Contact Name"), max_length=150, blank=True
    )
    emergency_contact_phone = models.CharField(
        _("Emergency Contact Phone"), max_length=20, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Tenant Profile")
        verbose_name_plural = _("Tenant Profiles")

    def __str__(self) -> str:
        return f"Tenant: {self.user.get_full_name() or self.user.email}"
