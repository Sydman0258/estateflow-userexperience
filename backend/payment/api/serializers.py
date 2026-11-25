from rest_framework import serializers

from payment.models import Payment, PaymentEvent


class PaymentEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentEvent
        fields = ["event", "message", "created_at"]  # IP addresses are never exposed
        read_only_fields = fields


class PaymentSerializer(serializers.ModelSerializer):
    property_id = serializers.IntegerField(source="property.id", read_only=True)
    property_name = serializers.CharField(source="property.name", read_only=True)
    property_location = serializers.SerializerMethodField()
    tenant_name = serializers.SerializerMethodField()
    landlord_name = serializers.SerializerMethodField()
    payment_type_label = serializers.CharField(source="get_payment_type_display", read_only=True)
    method_label = serializers.CharField(source="get_method_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "reference", "property_id", "property_name", "property_location",
            "tenant_name", "landlord_name",
            "amount", "currency", "payment_type", "payment_type_label",
            "method", "method_label", "status", "status_label",
            "external_reference", "card_brand", "card_last4", "failure_reason",
            "period_start", "period_end", "created_at", "completed_at", "expires_at",
        ]
        read_only_fields = fields

    @staticmethod
    def _name(user):
        return (user.get_full_name() or user.username or user.email) if user else ""

    def get_property_location(self, obj):
        p = obj.property
        return ", ".join(x for x in (p.suburb, p.town, p.district) if x)

    def get_tenant_name(self, obj):
        return self._name(obj.tenant)

    def get_landlord_name(self, obj):
        return self._name(obj.landlord)


class PaymentDetailSerializer(PaymentSerializer):
    events = PaymentEventSerializer(many=True, read_only=True)

    class Meta(PaymentSerializer.Meta):
        fields = PaymentSerializer.Meta.fields + ["events"]
        read_only_fields = fields


class CreatePaymentSerializer(serializers.Serializer):
    """Note what is NOT here: amount, currency, status. The server decides those."""

    property_id = serializers.IntegerField(min_value=1)
    payment_type = serializers.ChoiceField(choices=["RENT", "DEPOSIT"])
    method = serializers.ChoiceField(choices=["ESEWA", "CARD"])
    origin = serializers.CharField(required=False, allow_blank=True, max_length=200)  # validated against CORS list


class QuoteQuerySerializer(serializers.Serializer):
    property_id = serializers.IntegerField(min_value=1)
    payment_type = serializers.ChoiceField(choices=["RENT", "DEPOSIT"])


class EsewaVerifySerializer(serializers.Serializer):
    data = serializers.CharField(max_length=4096)


class CardChargeSerializer(serializers.Serializer):
    card_number = serializers.CharField(max_length=30, write_only=True, trim_whitespace=True)
    exp_month = serializers.IntegerField(min_value=1, max_value=12, write_only=True)
    exp_year = serializers.IntegerField(min_value=0, max_value=2100, write_only=True)
    cvc = serializers.CharField(max_length=4, min_length=3, write_only=True)
    cardholder_name = serializers.CharField(max_length=80, min_length=2, write_only=True)


class CancelSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=["user_cancelled", "gateway_failure"], default="user_cancelled")
