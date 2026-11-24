from django.contrib import admin
from .models import Property

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("name", "landlord", "town", "price", "is_available", "created_at")
    list_filter = ("is_available", "province", "town")
    search_fields = ("name", "street_address", "landlord__email")
    raw_id_fields = ("landlord",)
