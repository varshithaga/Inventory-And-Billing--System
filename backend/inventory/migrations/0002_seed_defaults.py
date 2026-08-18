from django.db import migrations


def seed_defaults(apps, schema_editor):
    Branch = apps.get_model("inventory", "Branch")
    ShopProfile = apps.get_model("inventory", "ShopProfile")

    if not Branch.objects.exists():
        Branch.objects.create(name="Main", is_main=True)

    if not ShopProfile.objects.exists():
        ShopProfile.objects.create(name="My Shop", invoice_prefix="INV")


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_defaults, noop),
    ]
