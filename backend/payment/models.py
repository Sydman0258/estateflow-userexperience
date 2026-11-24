from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Payment(models.Model):
    """
    Rent / deposit payment record.
    All monetary values are stored as integers (smallest currency unit)
    to avoid floating-point issues. Status transitions are controlled
    in service/view layer, never by untrusted client input alone.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", _("Pending")
        COMPLETED = "COMPLETED", _("Completed")
        FAILED = "FAILED", _("Failed")
        REFUNDED = "REFUNDED", _("Refunded")
        CANCELLED = "CANCELLED", _("Cancelled")

    class PaymentType(models.TextChoices):
        RENT = "RENT", _("Rent")
        DEPOSIT = "DEPOSIT", _("Security Deposit")
        OTHER = "OTHER", _("Other")

    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments_made",
        limit_choices_to={"role": "TENANT"},
    )
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="payments_received",
        limit_choices_to={"role": "LANDLORD"},
    )
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.PROTECT,
        related_name="payments",
    )

    amount = models.PositiveIntegerField(
        _("Amount"),
        validators=[MinValueValidator(1)],
        help_text=_("Amount in smallest currency unit."),
    )
    currency = models.CharField(_("Currency"), max_length=3, default="NPR")
    payment_type = models.CharField(
        _("Type"), max_length=20, choices=PaymentType.choices, default=PaymentType.RENT
    )
    status = models.CharField(
        _("Status"), max_length=20, choices=Status.choices, default=Status.PENDING
    )

    # External reference (payment gateway id) – never trust client-supplied status alone
    external_reference = models.CharField(
        _("External Reference"), max_length=255, blank=True, db_index=True
    )
    period_start = models.DateField(_("Period Start"), null=True, blank=True)
    period_end = models.DateField(_("Period End"), null=True, blank=True)
    notes = models.TextField(_("Notes"), blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["landlord", "status"]),
            models.Index(fields=["property"]),
            models.Index(fields=["external_reference"]),
        ]

    def __str__(self) -> str:
        return f"Payment {self.id} – {self.amount} {self.currency} ({self.status})"
