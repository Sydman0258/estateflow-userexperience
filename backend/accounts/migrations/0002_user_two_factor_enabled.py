from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="two_factor_enabled",
            field=models.BooleanField(
                default=False,
                help_text="When enabled, login requires an emailed one-time code.",
                verbose_name="Two-factor authentication",
            ),
        ),
    ]
