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

    class Method(models.TextChoices):
        ESEWA = "ESEWA", _("eSewa")
        CARD = "CARD", _("Bank card")

    # Unguessable public identifier, also used as the gateway transaction id.
    reference = models.CharField(max_length=40, unique=True, null=True, blank=True, editable=False)
    method = models.CharField(_("Method"), max_length=10, choices=Method.choices, blank=True, default="")
    failure_reason = models.CharField(_("Failure reason"), max_length=255, blank=True)
    # Only brand + last 4 digits are ever stored for cards. Never the full number / CVC.
    card_brand = models.CharField(max_length=20, blank=True)
    card_last4 = models.CharField(max_length=4, blank=True)
    charge_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    expires_at = models.DateTimeField(null=True, blank=True)

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



class PaymentEvent(models.Model):
    """
    Append-only audit trail for a payment (created, verified, failed, ...).
    Rows cannot be edited or deleted through the ORM instance API.
    """

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name="events")
    event = models.CharField(max_length=40)
    message = models.CharField(max_length=255, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "id"]

    def save(self, *args, **kwargs):
        if not self._state.adding:
            raise PermissionError("Payment events are immutable.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise PermissionError("Payment events are immutable.")

    def __str__(self) -> str:
        return f"{self.payment_id} {self.event}"
