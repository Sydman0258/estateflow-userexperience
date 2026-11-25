"""
Sandbox card gateway (test cards only).

This stands in for a hosted card processor so the whole flow can be demonstrated
without real money. Design rules that mirror a real integration:

  * The full card number and CVC are used for the single request and then discarded.
    Only brand + last 4 digits are persisted. Nothing is written to logs.
  * Disabled unless settings.PAYMENT_SANDBOX is True (never active in production).
  * Attempts per payment are capped to blunt card-testing attacks.

In production, replace this module with a tokenising provider (e.g. Stripe Elements
or a local acquirer's hosted fields) so card data never reaches this server at all.
"""
import secrets
from dataclasses import dataclass
from datetime import date

# number -> (outcome code, human message)
TEST_CARDS = {
    "4242424242424242": ("success", ""),
    "5555555555554444": ("success", ""),
    "378282246310005": ("success", ""),
    "4000000000000002": ("card_declined", "Your card was declined by the issuing bank."),
    "4000000000009995": ("insufficient_funds", "Your card has insufficient funds."),
    "4000000000000069": ("expired_card", "Your card has expired."),
    "4000000000000127": ("incorrect_cvc", "The security code (CVC) is incorrect."),
}

PUBLIC_TEST_CARDS = [
    {"number": "4242 4242 4242 4242", "brand": "Visa", "result": "Succeeds"},
    {"number": "5555 5555 5555 4444", "brand": "Mastercard", "result": "Succeeds"},
    {"number": "3782 822463 10005", "brand": "Amex (4-digit CVC)", "result": "Succeeds"},
    {"number": "4000 0000 0000 0002", "brand": "Visa", "result": "Declined"},
    {"number": "4000 0000 0000 9995", "brand": "Visa", "result": "Insufficient funds"},
]

MAX_ATTEMPTS = 5


@dataclass
class ChargeResult:
    ok: bool
    code: str
    message: str
    brand: str = ""
    last4: str = ""
    reference: str = ""


def digits_only(value: str) -> str:
    return "".join(ch for ch in str(value) if ch.isdigit())


def luhn_ok(number: str) -> bool:
    total, alt = 0, False
    for ch in reversed(number):
        d = int(ch)
        if alt:
            d *= 2
            if d > 9:
                d -= 9
        total += d
        alt = not alt
    return total % 10 == 0


def brand_of(number: str) -> str:
    if number.startswith("4"):
        return "Visa"
    if number[:2] in {"51", "52", "53", "54", "55"} or (number[:1] == "2" and len(number) == 16):
        return "Mastercard"
    if number[:2] in {"34", "37"}:
        return "Amex"
    return "Card"


def validate_format(number: str, exp_month: int, exp_year: int, cvc: str):
    """Return an error message, or None when the card details are well-formed."""
    if not (13 <= len(number) <= 19) or not luhn_ok(number):
        return "That card number is not valid."
    if not (1 <= exp_month <= 12):
        return "Enter a valid expiry month."
    if exp_year < 100:
        exp_year += 2000
    today = date.today()
    if (exp_year, exp_month) < (today.year, today.month):
        return "Your card has expired."
    expected_cvc = 4 if brand_of(number) == "Amex" else 3
    if not cvc.isdigit() or len(cvc) != expected_cvc:
        return f"Security code must be {expected_cvc} digits."
    return None


def charge(number: str, exp_month: int, exp_year: int, cvc: str) -> ChargeResult:
    number = digits_only(number)
    cvc = digits_only(cvc)
    error = validate_format(number, exp_month, exp_year, cvc)
    brand, last4 = brand_of(number), number[-4:]
    if error:
        return ChargeResult(False, "invalid_card", error, brand, last4)

    outcome = TEST_CARDS.get(number)
    if outcome is None:
        return ChargeResult(
            False, "not_a_test_card",
            "This sandbox only accepts the listed test cards. Real cards are never charged.",
            brand, last4,
        )
    code, message = outcome
    if code == "success":
        return ChargeResult(True, "success", "", brand, last4, f"SBX-{secrets.token_hex(5).upper()}")
    return ChargeResult(False, code, message, brand, last4)
