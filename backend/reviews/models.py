from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Review(models.Model):
    """
    Review left by a tenant about a property / landlord.
    Cross-validation: a tenant may only review a property they have
    a completed payment relationship with (enforced in serializer/view).
    """

    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews_given",
        limit_choices_to={"role": "TENANT"},
    )
    rating = models.PositiveSmallIntegerField(
        _("Rating"),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    title = models.CharField(_("Title"), max_length=200, blank=True)
    body = models.TextField(_("Review Body"))
    is_public = models.BooleanField(_("Public"), default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = [("property", "reviewer")]  # one review per tenant per property
        indexes = [
            models.Index(fields=["property", "is_public"]),
            models.Index(fields=["reviewer"]),
        ]

    def __str__(self) -> str:
        return f"Review {self.rating}★ by {self.reviewer} on {self.property}"
