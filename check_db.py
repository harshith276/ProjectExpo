import sqlite3

conn = sqlite3.connect('backend/voltvision.db')
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
print("Tables:", tables)

try:
    cols = conn.execute("PRAGMA table_info('automations');").fetchall()
    print("Automations cols:", cols)
except Exception as e:
    print(e)
