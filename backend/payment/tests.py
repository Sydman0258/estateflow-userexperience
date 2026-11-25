"""
Security-focused payment tests. Run with:  python manage.py test payment

NOTE: eSewa's status API is mocked, so no network access is needed.
"""
import base64
import json
from unittest import mock

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import User
from payment.gateways import esewa
from payment.models import Payment
from properties.models import Property


def make_user(email, role, username):
    return User.objects.create_user(
        email=email, password="Str0ng!Passw0rd", username=username,
        first_name="T", last_name="U", role=role, is_active=True,
    )


def signed_callback(payment, **over):
    d = {
        "transaction_code": "000TEST", "status": "COMPLETE", "total_amount": f"{payment.amount:,}.0",
        "transaction_uuid": payment.reference, "product_code": "EPAYTEST",
        "signed_field_names": "transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names",
    }
    d.update(over)
    d["signature"] = esewa.sign(esewa._message(d, d["signed_field_names"]))
    return base64.b64encode(json.dumps(d).encode()).decode()


@override_settings(PAYMENT_SANDBOX=True)
class PaymentSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.landlord = make_user("l@test.dev", "LANDLORD", "landlord1")
        self.tenant = make_user("t@test.dev", "TENANT", "tenant1")
        self.other = make_user("o@test.dev", "TENANT", "tenant2")
        self.prop = Property.objects.create(
            landlord=self.landlord, name="Flat", house_number="1", street_address="Main", suburb="S",
            town="Kathmandu", district="Kathmandu", province="Bagmati", price=25000,
        )

    def create(self, method="ESEWA", **extra):
        self.client.force_authenticate(self.tenant)
        r = self.client.post("/api/payments/", {"property_id": self.prop.id, "payment_type": "RENT",
                                                "method": method, **extra}, format="json")
        return r

    def test_amount_comes_from_server_not_client(self):
        r = self.create(amount=1)
        self.assertEqual(r.status_code, 201)
        self.assertEqual(Payment.objects.get().amount, 25000)

    def test_landlord_cannot_create_payment(self):
        self.client.force_authenticate(self.landlord)
        r = self.client.post("/api/payments/", {"property_id": self.prop.id, "payment_type": "RENT",
                                                "method": "ESEWA"}, format="json")
        self.assertEqual(r.status_code, 403)

    def test_other_tenant_gets_404(self):
        ref = self.create().data["payment"]["reference"]
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(f"/api/payments/{ref}/").status_code, 404)

    def test_esewa_rejects_bad_signature_and_stays_pending(self):
        ref = self.create().data["payment"]["reference"]
        data = json.loads(base64.b64decode(signed_callback(Payment.objects.get(reference=ref))))
        data["signature"] = "AAAA"
        bad = base64.b64encode(json.dumps(data).encode()).decode()
        r = self.client.post(f"/api/payments/{ref}/esewa/verify/", {"data": bad}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Payment.objects.get(reference=ref).status, "PENDING")

    def test_esewa_rejects_wrong_amount_even_if_signed(self):
        ref = self.create().data["payment"]["reference"]
        p = Payment.objects.get(reference=ref)
        r = self.client.post(f"/api/payments/{ref}/esewa/verify/",
                             {"data": signed_callback(p, total_amount="100.0")}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Payment.objects.get(reference=ref).status, "PENDING")

    def test_esewa_success_is_idempotent(self):
        ref = self.create().data["payment"]["reference"]
        p = Payment.objects.get(reference=ref)
        remote = {"status": "COMPLETE", "total_amount": "25000.0", "ref_id": "0001ABC"}
        with mock.patch("payment.gateways.esewa.check_status", return_value=remote):
            for _ in range(2):
                r = self.client.post(f"/api/payments/{ref}/esewa/verify/",
                                     {"data": signed_callback(p)}, format="json")
                self.assertEqual(r.status_code, 200)
        p.refresh_from_db()
        self.assertEqual(p.status, "COMPLETED")
        self.assertEqual(p.events.filter(event="completed").count(), 1)

    def test_esewa_fails_closed_when_status_api_unreachable(self):
        ref = self.create().data["payment"]["reference"]
        p = Payment.objects.get(reference=ref)
        with mock.patch("payment.gateways.esewa.check_status", side_effect=esewa.GatewayError("Could not reach eSewa")):
            r = self.client.post(f"/api/payments/{ref}/esewa/verify/", {"data": signed_callback(p)}, format="json")
        self.assertEqual(r.status_code, 503)
        self.assertEqual(Payment.objects.get(reference=ref).status, "PENDING")

    def card(self, ref, number="4242424242424242", cvc="123"):
        return self.client.post(f"/api/payments/{ref}/card/charge/", {
            "card_number": number, "exp_month": 12, "exp_year": 2035, "cvc": cvc, "cardholder_name": "Ram Thapa",
        }, format="json")

    def test_card_success_stores_only_last4(self):
        ref = self.create("CARD").data["payment"]["reference"]
        r = self.card(ref)
        self.assertEqual(r.status_code, 200)
        p = Payment.objects.get(reference=ref)
        self.assertEqual((p.status, p.card_last4, p.card_brand), ("COMPLETED", "4242", "Visa"))
        dump = json.dumps(r.data) + " ".join(e.message for e in p.events.all())
        self.assertNotIn("4242424242424242", dump)

    def test_declined_card_then_attempt_cap(self):
        ref = self.create("CARD").data["payment"]["reference"]
        first = self.card(ref, "4000000000000002")
        self.assertEqual(first.status_code, 402)
        for _ in range(3):
            self.card(ref, "4000000000000002")
        last = self.card(ref, "4000000000000002")
        self.assertEqual(last.status_code, 429)
        self.assertEqual(Payment.objects.get(reference=ref).status, "FAILED")
        # A failed payment cannot be revived with a good card.
        self.assertEqual(self.card(ref).status_code, 409)

    def test_real_card_numbers_are_refused_by_sandbox(self):
        ref = self.create("CARD").data["payment"]["reference"]
        r = self.card(ref, "4111111111111111")
        self.assertEqual(r.status_code, 402)
        self.assertEqual(r.data["code"], "not_a_test_card")

    @override_settings(PAYMENT_SANDBOX=False)
    def test_card_disabled_outside_sandbox(self):
        self.assertEqual(self.create("CARD").status_code, 503)

    def test_events_are_immutable(self):
        self.create()
        ev = Payment.objects.get().events.first()
        ev.message = "tamper"
        with self.assertRaises(PermissionError):
            ev.save()
