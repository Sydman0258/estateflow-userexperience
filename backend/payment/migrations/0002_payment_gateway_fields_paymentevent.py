import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payment", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="reference",
            field=models.CharField(blank=True, editable=False, max_length=40, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="payment",
            name="method",
            field=models.CharField(
                blank=True,
                choices=[("ESEWA", "eSewa"), ("CARD", "Bank card")],
                default="",
                max_length=10,
                verbose_name="Method",
            ),
        ),
        migrations.AddField(
            model_name="payment",
            name="failure_reason",
            field=models.CharField(blank=True, max_length=255, verbose_name="Failure reason"),
        ),
        migrations.AddField(
            model_name="payment",
            name="card_brand",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="payment",
            name="card_last4",
            field=models.CharField(blank=True, max_length=4),
        ),
        migrations.AddField(
            model_name="payment",
            name="charge_attempts",
            field=models.PositiveSmallIntegerField(default=0, editable=False),
        ),
        migrations.AddField(
            model_name="payment",
            name="expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name="PaymentEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event", models.CharField(max_length=40)),
                ("message", models.CharField(blank=True, max_length=255)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "payment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="payment.payment",
                    ),
                ),
            ],
            options={"ordering": ["created_at", "id"]},
        ),
    ]
