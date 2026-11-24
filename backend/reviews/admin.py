from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("property", "reviewer", "rating", "is_public", "created_at")
    list_filter = ("rating", "is_public")
    search_fields = ("reviewer__email", "title", "body")
    raw_id_fields = ("property", "reviewer")
