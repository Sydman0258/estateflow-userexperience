import base64
import os
from datetime import timedelta

import pyotp
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import F
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class OTPService:
    """
    Time-based OTP service (TOTP) with email delivery.
    Security:
    - Secret is generated with os.urandom and stored only on the user model.
    - OTP window is short (3 minutes).
    - Rate limiting of sends is enforced via last_otp_sent_at.
    - Never log or return the raw OTP in API responses in production.
    - All DB access via ORM (immune to SQL injection).
    """

    INTERVAL = 120  # seconds
    DIGITS = 6
    MIN_RESEND_SECONDS = 30  # prevent email flooding
    MAX_ATTEMPTS = 5

    def __init__(self, user):
        self.user = user
        self.email = user.email

    def generate_otp_secret_key(self) -> str:
        # Correct base32 encoding of 20 random bytes
        return base64.b32encode(os.urandom(20)).decode("utf-8")

    def _get_totp(self) -> pyotp.TOTP:
        if not self.user.otp_secret_key:
            raise ValueError(_("OTP secret key has not been generated yet."))
        return pyotp.TOTP(
            self.user.otp_secret_key,
            interval=self.INTERVAL,
            digits=self.DIGITS,
        )

    def generate_otp(self) -> str:
        return self._get_totp().now()

    def verify_otp(self, otp: str, valid_window: int = 1) -> bool:
        """
        Verify OTP. valid_window=1 allows the previous/next step for clock skew.
        """
        if not self.user.otp_secret_key:
            return False
        # Refresh from DB to get current attempt count
        self.user.refresh_from_db(fields=["otp_attempts", "otp_secret_key"])
        if self.user.otp_attempts >= self.MAX_ATTEMPTS:
            return False
        try:
            totp = self._get_totp()
            ok = totp.verify(str(otp).strip(), valid_window=valid_window)
        except Exception:
            ok = False

        if not ok:
            type(self.user).objects.filter(pk=self.user.pk).update(
                otp_attempts=F("otp_attempts") + 1
            )
            self.user.refresh_from_db(fields=["otp_attempts"])
        else:
            type(self.user).objects.filter(pk=self.user.pk).update(otp_attempts=0)
            self.user.otp_attempts = 0
        return ok

    def can_send(self) -> bool:
        if not self.user.last_otp_sent_at:
            return True
        delta = timezone.now() - self.user.last_otp_sent_at
        return delta >= timedelta(seconds=self.MIN_RESEND_SECONDS)

    def send_otp(self, purpose: str = "verification") -> bool:
        """
        Generate OTP and send via email.
        Returns True if sent, False if rate-limited.
        """
        self.user.refresh_from_db(fields=["last_otp_sent_at", "otp_secret_key"])
        if not self.can_send():
            return False

        if not self.user.otp_secret_key:
            self.user.otp_secret_key = self.generate_otp_secret_key()
            self.user.save(update_fields=["otp_secret_key"])

        otp = self.generate_otp()
        subject = f"Your verification code – {getattr(settings, 'SITE_NAME', 'UserExperience')}"
        message = (
            f"Hello {self.user.get_full_name() or self.email},\n\n"
            f"Your one-time verification code is: {otp}\n\n"
            f"This code is valid for {self.INTERVAL // 60} minutes.\n"
            f"If you did not request this, please ignore this email.\n\n"
            f"— {getattr(settings, 'SITE_NAME', 'UserExperience')} Security"
        )
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@example.com")

        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[self.email],
            fail_silently=False,
        )

        self.user.last_otp_sent_at = timezone.now()
        self.user.otp_attempts = 0
        self.user.save(update_fields=["last_otp_sent_at", "otp_attempts"])
        return True
