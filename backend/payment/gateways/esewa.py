"""
eSewa ePay v2 integration (sandbox by default).

Flow
  1. Server builds a signed form (HMAC-SHA256 over total_amount, transaction_uuid, product_code).
  2. Browser POSTs the form to eSewa; the user pays on eSewa's own page.
  3. eSewa redirects the browser to success_url?data=<base64 JSON>.
  4. Our frontend forwards `data` to the backend, which (a) verifies the signature,
     (b) checks every field against the Payment row, and (c) asks eSewa's status API
     server-to-server. Only then is the payment marked COMPLETED.

The browser redirect is never trusted on its own.
"""
import base64
import hashlib
import hmac
import json
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal, InvalidOperation

from django.conf import settings

from .base import GatewayError

REQUEST_SIGNED_FIELDS = "total_amount,transaction_uuid,product_code"


def sign(message: str) -> str:
    digest = hmac.new(settings.ESEWA_SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
    return base64.b64encode(digest).decode()


def _message(fields: dict, names: str) -> str:
    return ",".join(f"{n}={fields[n]}" for n in names.split(","))


def normalise_amount(value) -> Decimal:
    """eSewa may return amounts such as '1,000.0'. Normalise before comparing."""
    try:
        return Decimal(str(value).replace(",", "").strip())
    except (InvalidOperation, ValueError):
        raise GatewayError("Unreadable amount in gateway response.")


def build_checkout(payment, success_url: str, failure_url: str) -> dict:
    """Return the URL and signed fields the browser must POST to eSewa."""
    amount = str(int(payment.amount))
    fields = {
        "amount": amount,
        "tax_amount": "0",
        "total_amount": amount,
        "transaction_uuid": payment.reference,
        "product_code": settings.ESEWA_PRODUCT_CODE,
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        "success_url": success_url,
        "failure_url": failure_url,
        "signed_field_names": REQUEST_SIGNED_FIELDS,
    }
    fields["signature"] = sign(_message(fields, REQUEST_SIGNED_FIELDS))
    return {"action": settings.ESEWA_FORM_URL, "method": "POST", "fields": fields}


def decode_callback(data_b64: str) -> dict:
    """Decode and verify the signature of eSewa's redirect payload."""
    if not data_b64 or len(data_b64) > 4096:
        raise GatewayError("Missing or oversized payment data.")
    try:
        padded = data_b64 + "=" * (-len(data_b64) % 4)
        data = json.loads(base64.b64decode(padded, validate=False).decode("utf-8"))
    except Exception:
        raise GatewayError("Payment data could not be decoded.")
    if not isinstance(data, dict):
        raise GatewayError("Payment data is malformed.")

    names = data.get("signed_field_names")
    signature = data.get("signature")
    if not isinstance(names, str) or not isinstance(signature, str):
        raise GatewayError("Payment data is not signed.")
    wanted = names.split(",")
    # The signature must cover the fields we rely on, otherwise it proves nothing.
    for required in ("transaction_uuid", "total_amount", "product_code", "status"):
        if required not in wanted:
            raise GatewayError("Signed fields do not cover the payment details.")
    if any(n not in data for n in wanted):
        raise GatewayError("Signed field is missing from payment data.")

    expected = sign(_message(data, names))
    if not hmac.compare_digest(expected, signature):
        raise GatewayError("Payment signature is invalid.")
    return data


def check_status(payment) -> dict:
    """Server-to-server status lookup. Raises GatewayError if eSewa cannot be reached."""
    qs = urllib.parse.urlencode(
        {
            "product_code": settings.ESEWA_PRODUCT_CODE,
            "total_amount": str(int(payment.amount)),
            "transaction_uuid": payment.reference,
        }
    )
    url = f"{settings.ESEWA_STATUS_URL}?{qs}"
    if not url.startswith("https://"):
        raise GatewayError("Gateway status URL must use HTTPS.")
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:  # noqa: S310 (https enforced above)
            return json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise GatewayError("Could not reach eSewa to confirm the payment. Please try again shortly.")
