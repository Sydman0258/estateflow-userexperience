from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.api.view import (
    ActivateAccountView,
    LandlordRegistrationView,
    LoginVerifyView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetView,
    ResendOTPView,
    TenantRegistrationView,
    TwoFactorDisableView,
    TwoFactorEnableView,
    TwoFactorSendView,
)

urlpatterns = [
    # Registration
    path("register/tenant/", TenantRegistrationView.as_view(), name="register-tenant"),
    path("register/landlord/", LandlordRegistrationView.as_view(), name="register-landlord"),

    # Activation / email verification (OTP)
    path("activate/", ActivateAccountView.as_view(), name="activate-account"),
    path("otp/resend/", ResendOTPView.as_view(), name="resend-otp"),

    # Password reset (OTP from /otp/resend/)
    path("password/reset/", PasswordResetView.as_view(), name="password-reset"),

    # 2FA Login flow
    path("login/", LoginView.as_view(), name="login"),                    # factor 1 → sends OTP
    path("login/verify/", LoginVerifyView.as_view(), name="login-verify"), # factor 2 → issues tokens + session

    # Token refresh (JWT)
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # Two-factor settings (off by default; enable from Settings)
    path("2fa/send/", TwoFactorSendView.as_view(), name="2fa-send"),
    path("2fa/enable/", TwoFactorEnableView.as_view(), name="2fa-enable"),
    path("2fa/disable/", TwoFactorDisableView.as_view(), name="2fa-disable"),

    # Session / JWT logout & profile
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
]
