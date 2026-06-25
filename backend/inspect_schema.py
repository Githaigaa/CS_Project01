import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "DjangoProject.settings")

import django
from django.db import connection

django.setup()

with connection.cursor() as cursor:
    cursor.execute(
        "select tablename from pg_tables where schemaname = 'public' order by tablename"
    )
    print("TABLES")
    for (table_name,) in cursor.fetchall():
        print(table_name)

    cursor.execute(
        "select app, name from django_migrations order by app, name"
    )
    print("MIGRATIONS")
    for app, name in cursor.fetchall():
        print(f"{app}.{name}")
