from rest_framework import serializers
from properties.models import Property


class PropertySerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()
    price_display = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id",
            "name",
            "house_number",
            "street_address",
            "suburb",
            "town",
            "district",
            "province",
            "price",
            "price_display",
            "description",
            "bedrooms",
            "bathrooms",
            "is_available",
            "location",
            "image_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_location(self, obj):
        parts = [obj.suburb or obj.town, obj.province]
        return ", ".join(p for p in parts if p)

    def get_price_display(self, obj):
        return f"${obj.price:,}/mo"

    def get_image_url(self, obj):
        seeds = [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
        ]
        return seeds[(obj.id or 0) % len(seeds)]
