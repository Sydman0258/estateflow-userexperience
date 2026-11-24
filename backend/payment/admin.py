from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "tenant", "landlord", "property", "amount", "status", "created_at")
    list_filter = ("status", "payment_type", "currency")
    search_fields = ("tenant__email", "landlord__email", "external_reference")
    raw_id_fields = ("tenant", "landlord", "property")
    readonly_fields = ("created_at", "updated_at", "completed_at")
