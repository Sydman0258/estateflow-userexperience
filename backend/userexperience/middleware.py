class SecurityHeadersMiddleware:
    """Extra response hardening for an API that returns personal and payment data."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith("/api/"):
            # Auth and payment responses must never be stored by browsers or proxies.
            response.setdefault("Cache-Control", "no-store")
            response.setdefault("Pragma", "no-cache")
        response.setdefault("X-Content-Type-Options", "nosniff")
        response.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        return response
