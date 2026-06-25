import os
from dotenv import load_dotenv
import psycopg

load_dotenv()
DB = os.environ.get('POSTGRES_DB','cattletrace')
USER = os.environ.get('POSTGRES_USER','postgres')
PASSWORD = os.environ.get('POSTGRES_PASSWORD','')
HOST = os.environ.get('POSTGRES_HOST','localhost')
PORT = os.environ.get('POSTGRES_PORT','5432')

print('Connecting to', DB, USER, HOST, PORT)
conn = psycopg.connect(dbname=DB, user=USER, password=PASSWORD, host=HOST, port=PORT)
cur = conn.cursor()
# Check if record exists
cur.execute("SELECT 1 FROM django_migrations WHERE app=%s AND name=%s", ('CattleTrace','0001_initial'))
if cur.fetchone():
    print('Migration record already exists')
else:
    cur.execute("INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, NOW())", ('CattleTrace','0001_initial'))
    conn.commit()
    print('Inserted migration record')
cur.close()
conn.close()

