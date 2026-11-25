import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_user_two_factor_enabled"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="password_changed_at",
            field=models.DateTimeField(blank=True, editable=False, null=True),
        ),
        migrations.CreateModel(
            name="AuthEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "event",
                    models.CharField(
                        choices=[
                        ('LOGIN_SUCCESS', 'Signed in'),
                        ('LOGIN_FAILED', 'Failed sign-in attempt'),
                        ('LOGOUT', 'Signed out'),
                        ('PASSWORD_CHANGED', 'Password changed'),
                        ('PASSWORD_RESET', 'Password reset'),
                        ('TWO_FACTOR_ENABLED', 'Two-factor enabled'),
                        ('TWO_FACTOR_DISABLED', 'Two-factor disabled'),
                        ('PROFILE_UPDATED', 'Profile updated'),
                        ('SESSIONS_REVOKED', 'Signed out of all devices'),
                        ('ACCOUNT_ACTIVATED', 'Account activated'),
                        ('ACCOUNT_DEACTIVATED', 'Account deactivated'),
                        ('DATA_EXPORTED', 'Personal data exported')
                        ],
                        max_length=32,
                    ),
                ),
                ("success", models.BooleanField(default=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="auth_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
