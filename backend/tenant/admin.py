from django.contrib import admin
from .models import TenantProfile

@admin.register(TenantProfile)
class TenantProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "occupation", "max_budget", "created_at")
    search_fields = ("user__email", "occupation")
