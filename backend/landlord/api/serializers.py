from rest_framework import serializers

from landlord.models import LandlordProfile


class LandlordProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = LandlordProfile
        fields = [
            "company_name",
            "business_registration",
            "bio",
            "verified",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "verified",
            "created_at",
            "updated_at",
        ]