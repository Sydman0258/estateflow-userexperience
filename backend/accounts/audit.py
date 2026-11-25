"""Security audit helpers. Never pass passwords, OTPs or tokens in here."""
from django.conf import settings

from accounts.models import AuthEvent


def client_ip(request):
    if request is None:
        return None
    # X-Forwarded-For is client-controlled unless a trusted proxy sets it.
    if getattr(settings, "TRUST_X_FORWARDED_FOR", False):
        xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if xff:
            return xff.split(",")[0].strip() or None
    return request.META.get("REMOTE_ADDR") or None


def record(request, user, event, success=True):
    """Write an audit row. Audit failures must never break the user's request."""
    if user is None:
        return
    try:
        AuthEvent.objects.create(
            user=user,
            event=event,
            success=success,
            ip_address=client_ip(request),
            user_agent=(request.META.get("HTTP_USER_AGENT", "") if request else "")[:255],
        )
    except Exception:  # noqa: BLE001
        pass
