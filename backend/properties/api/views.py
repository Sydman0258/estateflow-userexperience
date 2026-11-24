from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from accounts.permissions import IsLandlord, IsPropertyLandlord
from properties.api.serializers import PropertySerializer
from properties.models import Property


class PropertyViewSet(ModelViewSet):
    serializer_class = PropertySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["town", "province", "bedrooms", "is_available"]
    search_fields = ["name", "suburb", "town", "province", "street_address", "description"]
    ordering_fields = ["price", "created_at", "bedrooms"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Property.objects.select_related("landlord").all()
        if self.action in ["list", "retrieve"]:
            available = self.request.query_params.get("available")
            if available is None or available.lower() in ("1", "true", "yes"):
                qs = qs.filter(is_available=True)
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        elif self.action == "create":
            permission_classes = [IsAuthenticated, IsLandlord]
        else:
            permission_classes = [
                IsAuthenticated,
                IsLandlord,
                IsPropertyLandlord,
            ]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)
