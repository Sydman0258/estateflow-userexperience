from django.conf import settings
from django.db import transaction
from django.db.models import Q, Sum
from django.http import Http404
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.settings import api_settings
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from payment import services
from payment.api.serializers import (
    CancelSerializer, CardChargeSerializer, CreatePaymentSerializer, EsewaVerifySerializer,
    PaymentDetailSerializer, PaymentSerializer, QuoteQuerySerializer,
)
from payment.gateways import card_sandbox, esewa
from payment.gateways.base import GatewayError
from payment.models import Payment
from properties.models import Property


def _error(message, http_status=400, code="payment_error", **extra):
    return Response({"detail": message, "code": code, **extra}, status=http_status)


class TenantOnlyMixin:
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def deny_non_tenant(self, request):
        if request.user.role != "TENANT":
            return _error("Only tenants can make payments.", 403, "forbidden")
        return None


def _get_payment(request, ref, *, tenant_only):
    """Fetch by reference. Anyone not involved gets a 404 (no information leak)."""
    qs = Payment.objects.select_related("property", "tenant", "landlord")
    if tenant_only:
        qs = qs.filter(tenant=request.user)
    elif not request.user.is_staff:
        qs = qs.filter(Q(tenant=request.user) | Q(landlord=request.user))
    payment = qs.filter(reference=ref).first()
    if payment is None:
        raise Http404
    return services.expire_if_needed(payment)


def _frontend_base(request) -> str:
    """Where eSewa should send the browser back to.

    Uses the origin the user is actually browsing from (so localStorage-held tokens are
    still there on return), but ONLY if it is on our CORS allow-list. Anything else
    falls back to FRONTEND_URL, so a forged value can never redirect elsewhere.
    """
    origin = (request.data.get("origin") if hasattr(request, "data") and isinstance(request.data, dict) else None) \
        or request.query_params.get("origin") or ""
    origin = str(origin).rstrip("/")
    if origin and origin in getattr(settings, "CORS_ALLOWED_ORIGINS", []):
        return origin
    return settings.FRONTEND_URL.rstrip("/")


def _checkout_for(payment, request):
    if payment.method == Payment.Method.ESEWA:
        base = _frontend_base(request)
        form = esewa.build_checkout(
            payment,
            success_url=f"{base}/payments/esewa/success/{payment.reference}",
            failure_url=f"{base}/payments/esewa/failure/{payment.reference}",
        )
        return {"type": "esewa", **form}
    return {"type": "card", "path": f"/payments/card/{payment.reference}"}


class MethodsView(APIView):
    """Which payment methods exist, and (sandbox only) the test credentials to try."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        sandbox = settings.PAYMENT_SANDBOX
        data = {
            "sandbox": sandbox,
            "currency": "NPR",
            "methods": [
                {"id": "ESEWA", "label": "eSewa", "description": "Pay with your eSewa wallet.", "available": True},
                {"id": "CARD", "label": "Credit / debit card", "description": "Visa, Mastercard or Amex.",
                 "available": services.card_enabled()},
            ],
        }
        if sandbox:
            data["esewa_test"] = {
                "ids": ["9806800001", "9806800002", "9806800003", "9806800004", "9806800005"],
                "password": "Nepal@123", "mpin": "1122", "otp": "123456",
            }
            data["card_test"] = card_sandbox.PUBLIC_TEST_CARDS
        return Response(data)


class QuoteView(TenantOnlyMixin, APIView):
    def get(self, request):
        denied = self.deny_non_tenant(request)
        if denied:
            return denied
        q = QuoteQuerySerializer(data=request.query_params)
        q.is_valid(raise_exception=True)
        prop = Property.objects.filter(pk=q.validated_data["property_id"]).first()
        if not prop:
            return _error("Property not found.", 404, "not_found")
        try:
            amount = services.quote(prop, q.validated_data["payment_type"])
        except services.PaymentError as e:
            return _error(e.message, e.status_code, e.code)
        return Response({"amount": amount, "currency": "NPR", "property_name": prop.name,
                         "payment_type": q.validated_data["payment_type"]})


class PaymentListCreateView(TenantOnlyMixin, APIView):
    throttle_scope = "payment_create"

    def get_throttles(self):
        # Creating is throttled tightly; listing uses the normal per-user rate.
        if self.request.method == "POST":
            return [ScopedRateThrottle()]
        return [cls() for cls in api_settings.DEFAULT_THROTTLE_CLASSES]

    def get(self, request):
        user = request.user
        qs = Payment.objects.select_related("property", "tenant", "landlord")
        if not user.is_staff:
            qs = qs.filter(Q(tenant=user) | Q(landlord=user))
        payments = [services.expire_if_needed(p) for p in qs[:100]]
        paid = qs.filter(status=Payment.Status.COMPLETED).aggregate(total=Sum("amount"))["total"] or 0
        pending = qs.filter(status=Payment.Status.PENDING).aggregate(total=Sum("amount"))["total"] or 0
        return Response({
            "summary": {"paid_total": paid, "pending_total": pending, "currency": "NPR",
                        "count": qs.count()},
            "results": PaymentSerializer(payments, many=True).data,
        })

    def post(self, request):
        denied = self.deny_non_tenant(request)
        if denied:
            return denied
        s = CreatePaymentSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        prop = Property.objects.select_related("landlord").filter(pk=s.validated_data["property_id"]).first()
        if not prop:
            return _error("Property not found.", 404, "not_found")
        try:
            payment, reused = services.create_payment(
                request.user, prop, s.validated_data["payment_type"], s.validated_data["method"], request
            )
        except services.PaymentError as e:
            return _error(e.message, e.status_code, e.code)
        return Response(
            {"payment": PaymentSerializer(payment).data, "checkout": _checkout_for(payment, request), "reused": reused},
            status=status.HTTP_200_OK if reused else status.HTTP_201_CREATED,
        )


class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ref):
        payment = _get_payment(request, ref, tenant_only=False)
        return Response(PaymentDetailSerializer(payment).data)


class PaymentResumeView(TenantOnlyMixin, APIView):
    """Rebuild the checkout instructions for a still-pending payment (e.g. 'Continue payment')."""

    def get(self, request, ref):
        payment = _get_payment(request, ref, tenant_only=True)
        if payment.status != Payment.Status.PENDING:
            return _error("This payment is no longer pending.", 409, "already_final")
        return Response({"payment": PaymentSerializer(payment).data, "checkout": _checkout_for(payment, request)})


class PaymentCancelView(TenantOnlyMixin, APIView):
    def post(self, request, ref):
        payment = _get_payment(request, ref, tenant_only=True)
        s = CancelSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            payment, _ = services.cancel_payment(payment, s.validated_data["reason"], request)
        except services.PaymentError as e:
            if e.code == "already_final":  # cancelling something already final is a no-op
                return Response(PaymentSerializer(payment).data)
            return _error(e.message, e.status_code, e.code)
        return Response(PaymentSerializer(payment).data)


class EsewaVerifyView(TenantOnlyMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_verify"

    def post(self, request, ref):
        payment = _get_payment(request, ref, tenant_only=True)
        if payment.method != Payment.Method.ESEWA:
            return _error("This is not an eSewa payment.", 400, "bad_method")
        if payment.status == Payment.Status.COMPLETED:
            return Response(PaymentSerializer(payment).data)  # idempotent
        if payment.status != Payment.Status.PENDING:
            return _error(f"This payment is {payment.get_status_display().lower()}.", 409, "already_final")

        s = EsewaVerifySerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            data = esewa.decode_callback(s.validated_data["data"])  # signature check
            # Every field must match OUR record, not just be validly signed.
            if data["transaction_uuid"] != payment.reference:
                raise GatewayError("This confirmation belongs to a different payment.")
            if data["product_code"] != settings.ESEWA_PRODUCT_CODE:
                raise GatewayError("Unexpected merchant code in confirmation.")
            if esewa.normalise_amount(data["total_amount"]) != payment.amount:
                raise GatewayError("Paid amount does not match the expected amount.")
            if data["status"] != "COMPLETE":
                services.fail_payment(payment, f"eSewa reported status {str(data['status'])[:30]}.", request)
                return _error("eSewa did not complete this payment.", 402, "not_complete")

            # Second, independent check straight with eSewa (server-to-server).
            remote = esewa.check_status(payment)
            if remote.get("status") != "COMPLETE" or esewa.normalise_amount(remote.get("total_amount", "")) != payment.amount:
                raise GatewayError("eSewa could not confirm this payment.")
            gateway_ref = str(remote.get("ref_id") or data.get("transaction_code") or "")
        except GatewayError as e:
            services.log(payment, "verification_failed", str(e), request)
            code = 503 if "reach eSewa" in str(e) else 400
            return _error(str(e), code, "verification_failed")

        try:
            payment, _ = services.complete_payment(payment, gateway_ref, request=request)
        except services.PaymentError as e:
            return _error(e.message, e.status_code, e.code)
        return Response(PaymentSerializer(payment).data)


class CardChargeView(TenantOnlyMixin, APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment_charge"

    def post(self, request, ref):
        if not services.card_enabled():
            return _error("Card payments are not enabled on this server.", 503, "card_disabled")
        payment = _get_payment(request, ref, tenant_only=True)
        if payment.method != Payment.Method.CARD:
            return _error("This is not a card payment.", 400, "bad_method")
        if payment.status == Payment.Status.COMPLETED:
            return Response(PaymentSerializer(payment).data)
        if payment.status != Payment.Status.PENDING:
            return _error(f"This payment is {payment.get_status_display().lower()}.", 409, "already_final")

        s = CardChargeSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        v = s.validated_data

        # Count the attempt first (under a lock) so retries cannot be used to guess cards.
        with transaction.atomic():
            locked = Payment.objects.select_for_update().get(pk=payment.pk)
            if locked.charge_attempts >= card_sandbox.MAX_ATTEMPTS:
                services.fail_payment(locked, "Too many card attempts.", request)
                return _error("Too many attempts. Please start a new payment.", 429, "too_many_attempts")
            locked.charge_attempts += 1
            locked.save(update_fields=["charge_attempts", "updated_at"])
            attempts_left = card_sandbox.MAX_ATTEMPTS - locked.charge_attempts

        result = card_sandbox.charge(v["card_number"], v["exp_month"], v["exp_year"], v["cvc"])
        # From here on the card number / CVC are no longer referenced or stored.

        if result.ok:
            try:
                payment, _ = services.complete_payment(
                    payment, result.reference, card_brand=result.brand, card_last4=result.last4, request=request
                )
            except services.PaymentError as e:
                return _error(e.message, e.status_code, e.code)
            return Response(PaymentSerializer(payment).data)

        services.log(payment, "card_declined", f"{result.brand} ****{result.last4}: {result.code}", request)
        if attempts_left <= 0:
            services.fail_payment(payment, "Too many card attempts.", request)
            return _error("Too many attempts. Please start a new payment.", 429, "too_many_attempts")
        return _error(result.message, 402, result.code, attempts_left=attempts_left)
