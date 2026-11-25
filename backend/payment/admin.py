from django.contrib import admin

from .models import Payment, PaymentEvent


class PaymentEventInline(admin.TabularInline):
    model = PaymentEvent
    extra = 0
    can_delete = False
    readonly_fields = ("event", "message", "ip_address", "created_at")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "tenant", "landlord", "property", "amount", "method", "status", "created_at")
    list_filter = ("status", "method", "payment_type", "currency")
    search_fields = ("reference", "tenant__email", "landlord__email", "external_reference")
    raw_id_fields = ("tenant", "landlord", "property")
    # Money and status are changed only by the payment service, never by hand.
    readonly_fields = (
        "reference", "amount", "currency", "status", "method", "external_reference", "failure_reason",
        "card_brand", "card_last4", "charge_attempts", "created_at", "updated_at", "completed_at", "expires_at",
    )
    inlines = [PaymentEventInline]
