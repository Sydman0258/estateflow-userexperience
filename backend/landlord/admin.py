from django.contrib import admin
from .models import LandlordProfile

@admin.register(LandlordProfile)
class LandlordProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "verified", "created_at")
    search_fields = ("user__email", "company_name")
    list_filter = ("verified",)
