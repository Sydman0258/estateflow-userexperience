from django.urls import path

from .views import (
    CardChargeView, EsewaVerifyView, MethodsView, PaymentCancelView, PaymentDetailView,
    PaymentListCreateView, PaymentResumeView, QuoteView,
)

urlpatterns = [
    path("", PaymentListCreateView.as_view(), name="payment-list-create"),
    path("methods/", MethodsView.as_view(), name="payment-methods"),
    path("quote/", QuoteView.as_view(), name="payment-quote"),
    path("<str:ref>/", PaymentDetailView.as_view(), name="payment-detail"),
    path("<str:ref>/resume/", PaymentResumeView.as_view(), name="payment-resume"),
    path("<str:ref>/cancel/", PaymentCancelView.as_view(), name="payment-cancel"),
    path("<str:ref>/esewa/verify/", EsewaVerifyView.as_view(), name="payment-esewa-verify"),
    path("<str:ref>/card/charge/", CardChargeView.as_view(), name="payment-card-charge"),
]
