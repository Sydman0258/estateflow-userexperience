"""
Create demo accounts and listings so the payment flow can be tried straight away.

    python manage.py seed_demo

Refuses to run unless DEBUG is on, so demo credentials can never reach production.
"""
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from accounts.models import User
from properties.models import Property

DEMO_PASSWORD = "Demo@Estate2026!"

LISTINGS = [
    dict(name="Lakeside Studio, Lakeside", house_number="12", street_address="Lakeside Road", suburb="Lakeside",
         town="Pokhara", district="Kaski", province="Gandaki", price=18000, bedrooms=1, bathrooms=1,
         description="Bright studio a short walk from Phewa Lake."),
    dict(name="Family Flat, Baluwatar", house_number="45", street_address="Baluwatar Marg", suburb="Baluwatar",
         town="Kathmandu", district="Kathmandu", province="Bagmati", price=45000, bedrooms=3, bathrooms=2,
         description="Spacious three-bedroom flat in a quiet, secure neighbourhood."),
    dict(name="Garden Room, Jhamsikhel", house_number="7", street_address="Jhamsikhel Chowk", suburb="Jhamsikhel",
         town="Lalitpur", district="Lalitpur", province="Bagmati", price=26500, bedrooms=2, bathrooms=1,
         description="Two-bedroom with a shared garden and rooftop."),
]


class Command(BaseCommand):
    help = "Create demo landlord, tenant and listings (DEBUG only)."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo only runs with DEBUG=True.")

        landlord, _ = User.objects.get_or_create(
            email="landlord@demo.test",
            defaults=dict(username="demo_landlord", first_name="Sita", last_name="Sharma",
                          role="LANDLORD", is_active=True, phone_number="+9779800000001"),
        )
        tenant, _ = User.objects.get_or_create(
            email="tenant@demo.test",
            defaults=dict(username="demo_tenant", first_name="Ram", last_name="Thapa",
                          role="TENANT", is_active=True, phone_number="+9779800000002"),
        )
        for u in (landlord, tenant):
            u.set_password(DEMO_PASSWORD)
            u.is_active = True
            u.save()

        for data in LISTINGS:
            Property.objects.get_or_create(landlord=landlord, name=data["name"], defaults=data)

        self.stdout.write(self.style.SUCCESS("Demo data ready."))
        self.stdout.write(f"  Tenant   : tenant@demo.test   / {DEMO_PASSWORD}")
        self.stdout.write(f"  Landlord : landlord@demo.test / {DEMO_PASSWORD}")
