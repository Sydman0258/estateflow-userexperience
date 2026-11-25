"""
Payment business rules. Views stay thin; all state changes go through here.

Security properties enforced in this module:
  * The amount is ALWAYS derived server-side from the property, never from the client.
  * Status can only move PENDING -> COMPLETED / FAILED / CANCELLED. Terminal states are final.
  * Completion runs under a row lock so a replayed callback cannot complete a payment twice.
  * Every state change is written to the append-only PaymentEvent trail.
"""
import calendar
import secrets
from datetime import date, timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from accounts import audit
from payment.models import Payment, PaymentEvent

PAYABLE_TYPES = (Payment.PaymentType.RENT, Payment.PaymentType.DEPOSIT)

CANCEL_REASONS = {
    "user_cancelled": "Cancelled by the tenant.",
    "gateway_failure": "The payment was not completed at the gateway.",
}


class PaymentError(Exception):
    def __init__(self, message: str, status_code: int = 400, code: str = "payment_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


def log(payment: Payment, event: str, message: str = "", request=None) -> None:
    PaymentEvent.objects.create(
        payment=payment, event=event, message=message[:255], ip_address=audit.client_ip(request)
    )


def quote(prop, payment_type: str) -> int:
    """Whole NPR rupees. Deposit = one month's rent."""
    if payment_type not in PAYABLE_TYPES:
        raise PaymentError("Unsupported payment type.", code="bad_type")
    if prop.price <= 0:
        raise PaymentError("This property has no price set.", code="no_price")
    return int(prop.price)


def _add_month(d: date) -> date:
    year, month = (d.year + 1, 1) if d.month == 12 else (d.year, d.month + 1)
    return date(year, month, min(d.day, calendar.monthrange(year, month)[1]))


def _new_reference() -> str:
    for _ in range(5):
        ref = f"EF-{timezone.now():%y%m%d}-{secrets.token_hex(6)}"
        if not Payment.objects.filter(reference=ref).exists():
            return ref
    raise PaymentError("Could not allocate a payment reference.", 500)


def card_enabled() -> bool:
    return bool(settings.PAYMENT_SANDBOX)


def expire_if_needed(payment: Payment) -> Payment:
    if payment.status == Payment.Status.PENDING and payment.expires_at and payment.expires_at < timezone.now():
        _finish(payment.pk, Payment.Status.CANCELLED, reason="Payment window expired.", event="expired")
        payment.refresh_from_db()
    return payment


@transaction.atomic
def create_payment(user, prop, payment_type: str, method: str, request=None):
    """Create (or reuse) a PENDING payment. Returns (payment, reused)."""
    if getattr(user, "role", None) != "TENANT":
        raise PaymentError("Only tenants can make payments.", 403, "forbidden")
    if method not in Payment.Method.values:
        raise PaymentError("Choose a valid payment method.", code="bad_method")
    if method == Payment.Method.CARD and not card_enabled():
        raise PaymentError("Card payments are not enabled on this server.", 503, "card_disabled")
    amount = quote(prop, payment_type)

    now = timezone.now()
    existing = (
        Payment.objects.select_for_update()
        .filter(tenant=user, property=prop, payment_type=payment_type, status=Payment.Status.PENDING)
        .first()
    )
    if existing:
        if existing.expires_at and existing.expires_at < now:
            _cancel_locked(existing, "Payment window expired.", "expired", request)
        elif existing.method == method and existing.amount == amount:
            return existing, True
        else:
            _cancel_locked(existing, "Replaced by a new payment attempt.", "superseded", request)

    start = date.today()
    payment = None
    for _ in range(3):
        try:
            payment = Payment.objects.create(
                tenant=user,
                landlord=prop.landlord,
                property=prop,
                amount=amount,
                currency="NPR",
                payment_type=payment_type,
                method=method,
                reference=_new_reference(),
                period_start=start if payment_type == Payment.PaymentType.RENT else None,
                period_end=(_add_month(start) - timedelta(days=1)) if payment_type == Payment.PaymentType.RENT else None,
                expires_at=now + timedelta(minutes=settings.PAYMENT_EXPIRY_MINUTES),
            )
            break
        except IntegrityError:
            continue
    if payment is None:
        raise PaymentError("Could not create the payment. Please try again.", 500)
    log(payment, "created", f"{method} payment of NPR {amount} created.", request)
    return payment, False


def _cancel_locked(payment: Payment, reason: str, event: str, request=None):
    payment.status = Payment.Status.CANCELLED
    payment.failure_reason = reason
    payment.save(update_fields=["status", "failure_reason", "updated_at"])
    log(payment, event, reason, request)


@transaction.atomic
def _finish(payment_id: int, new_status: str, *, reason="", event="", external_reference="",
            card_brand="", card_last4="", request=None):
    """Lock the row and apply a terminal transition. Returns (payment, changed)."""
    payment = Payment.objects.select_for_update().get(pk=payment_id)
    if payment.status == new_status == Payment.Status.COMPLETED:
        return payment, False  # idempotent replay
    if payment.status != Payment.Status.PENDING:
        raise PaymentError(
            f"This payment is already {payment.get_status_display().lower()}.", 409, "already_final"
        )
    payment.status = new_status
    payment.failure_reason = reason
    fields = ["status", "failure_reason", "updated_at"]
    if new_status == Payment.Status.COMPLETED:
        payment.completed_at = timezone.now()
        payment.external_reference = external_reference
        payment.card_brand, payment.card_last4 = card_brand, card_last4
        fields += ["completed_at", "external_reference", "card_brand", "card_last4"]
    payment.save(update_fields=fields)
    log(payment, event or new_status.lower(), reason or external_reference, request)
    return payment, True


def complete_payment(payment: Payment, external_reference: str, *, card_brand="", card_last4="", request=None):
    return _finish(
        payment.pk, Payment.Status.COMPLETED, event="completed", external_reference=external_reference[:255],
        card_brand=card_brand, card_last4=card_last4, request=request,
    )


def fail_payment(payment: Payment, reason: str, request=None):
    return _finish(payment.pk, Payment.Status.FAILED, reason=reason, event="failed", request=request)


def cancel_payment(payment: Payment, reason_key: str, request=None):
    reason = CANCEL_REASONS.get(reason_key, CANCEL_REASONS["user_cancelled"])
    return _finish(payment.pk, Payment.Status.CANCELLED, reason=reason, event="cancelled", request=request)
