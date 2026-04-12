from django.db import migrations


def seed_theme_items(apps, schema_editor):
    StoreItem = apps.get_model("gamification", "StoreItem")

    items = [
        {
            "name": "Tema Sunset Focus",
            "description": "Um tema quente e acolhedor com tons de pôr do sol.",
            "category": "theme",
            "rarity": "Raro",
            "price": 220,
            "visual_resource": "sunset_focus",
            "required_level": 2,
        },
        {
            "name": "Tema Forest Calm",
            "description": "Paleta verde suave para uma experiência mais tranquila.",
            "category": "theme",
            "rarity": "Raro",
            "price": 240,
            "visual_resource": "forest_calm",
            "required_level": 2,
        },
        {
            "name": "Tema Aurora Bloom",
            "description": "Mistura delicada de rosa e brilho para um visual vibrante.",
            "category": "theme",
            "rarity": "Épico",
            "price": 320,
            "visual_resource": "aurora_bloom",
            "required_level": 3,
        },
        {
            "name": "Tema Ocean Breeze",
            "description": "Tema azul claro inspirado em mar e céu para manter o foco.",
            "category": "theme",
            "rarity": "Épico",
            "price": 340,
            "visual_resource": "ocean_breeze",
            "required_level": 3,
        },
        {
            "name": "Tema Lavender Mist",
            "description": "Tema lilás suave com contraste confortável e elegante.",
            "category": "theme",
            "rarity": "Lendário",
            "price": 420,
            "visual_resource": "lavender_mist",
            "required_level": 4,
        },
    ]

    for item in items:
        StoreItem.objects.update_or_create(
            name=item["name"],
            defaults=item,
        )


def remove_theme_items(apps, schema_editor):
    StoreItem = apps.get_model("gamification", "StoreItem")
    names = [
        "Tema Sunset Focus",
        "Tema Forest Calm",
        "Tema Aurora Bloom",
        "Tema Ocean Breeze",
        "Tema Lavender Mist",
    ]
    StoreItem.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("gamification", "0006_userprofile_daily_challenge_state"),
    ]

    operations = [
        migrations.RunPython(seed_theme_items, remove_theme_items),
    ]
