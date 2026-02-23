import os
import sys

# Add the current directory to sys.path so we can import app
sys.path.append(os.getcwd())

from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
import sqlalchemy

def wipe_and_seed():
    print("🗑️ Wiping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("🏗️ Creating new tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("🌱 Seeding Nagpur Pilot data...")
        seed_database(db)
        print("✅ Success!")
    finally:
        db.close()

if __name__ == "__main__":
    wipe_and_seed()
