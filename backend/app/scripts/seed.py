from app.core.config import settings
from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models import Child, Chore, ChoreCategory, ChoreType, Family, User, UserRole

DEFAULT_CHORES = [
    {"category": "Habit", "name": "Wake Up & Brush Teeth", "minutes": 5, "time": "6:00", "type": "BOOLEAN"},
    {"category": "Habit", "name": "Brush Teeth / Water / Poop", "minutes": 5, "time": "6:15", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Swimming Classes", "minutes": 60, "time": "6:30-7:30", "type": "TIME_BASED"},
    {"category": "Fun", "name": "Bath Independently", "minutes": 15, "time": "7:45-8:00", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Water Plants / Sweep", "minutes": 15, "time": "8:00-9:00", "type": "BOOLEAN"},
    {"category": "Health", "name": "Exercise", "minutes": 15, "type": "BOOLEAN"},
    {"category": "Health", "name": "Eat Vegetables", "minutes": 10, "type": "BOOLEAN"},
    {"category": "Chores", "name": "Dry Clothes", "type": "BOOLEAN"},
    {"category": "Chores", "name": "Fold Clothes", "type": "BOOLEAN"},
    {"category": "Chores", "name": "Fold Bedsheets", "type": "BOOLEAN"},
    {"category": "Skills", "name": "Practice Writing", "minutes": 15, "type": "TIME_BASED"},
    {"category": "Skills", "name": "Practice Reading", "minutes": 15, "type": "TIME_BASED"},
    {"category": "Skills", "name": "Kumon", "type": "TIME_BASED"},
    {"category": "Skills", "name": "Typing", "minutes": 20, "type": "TIME_BASED"},
    {"category": "Habit", "name": "Read Bible", "minutes": 10, "type": "BOOLEAN"},
    {"category": "Habit", "name": "Drink Water", "minutes": 2, "type": "SCORE"},
    {"category": "Habit", "name": "No Fighting", "type": "SCORE", "max_score": 2},
    {"category": "Habit", "name": "No Whining", "type": "SCORE", "max_score": 2},
    {"category": "Habit", "name": "Respectful Speaking", "type": "SCORE", "max_score": 2},
    {"category": "Habit", "name": "Cleanliness", "type": "SCORE", "max_score": 2},
    {"category": "Habit", "name": "Organized", "type": "SCORE", "max_score": 2},
    {"category": "Habit", "name": "Kindness", "type": "SCORE", "max_score": 2},
    {"category": "Habit", "name": "Respect Adults", "type": "SCORE", "max_score": 2},
    {"category": "Habit", "name": "Memory Verse", "type": "BOOLEAN"},
    {"category": "Habit", "name": "Sleep", "minutes": 60, "type": "TIME_BASED"},
    {"category": "Fun", "name": "Play Chess", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Eat Fruits", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Kids Conference", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Snacks", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Night Walk", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Dance", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Watch Videos", "minutes": 60, "type": "TIME_BASED"},
    {"category": "Fun", "name": "Keyboard Practice", "minutes": 20, "type": "TIME_BASED"},
    {"category": "Fun", "name": "Cycling", "type": "BOOLEAN"},
    {"category": "Fun", "name": "Football", "minutes": 90, "type": "TIME_BASED"},
    {"category": "Habit", "name": "No Comparison", "type": "SCORE"},
    {"category": "Habit", "name": "Eat Independently", "type": "BOOLEAN"},
]


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Chore).filter(Chore.family_id.is_(None)).count() == 0:
            for item in DEFAULT_CHORES:
                db.add(
                    Chore(
                        category=ChoreCategory(item["category"]),
                        name=item["name"],
                        duration_minutes=item.get("minutes"),
                        time_slot=item.get("time"),
                        type=ChoreType(item["type"]),
                        max_score=item.get("max_score"),
                    )
                )

        family = db.query(Family).filter(Family.name == "Francis Family").one_or_none()
        if family is None:
            family = Family(name="Francis Family", point_to_rupee_rate=1)
            db.add(family)
            db.flush()

        email = settings.default_parent_email.lower()
        if db.query(User).filter(User.email == email).one_or_none() is None:
            db.add(
                User(
                    family_id=family.id,
                    email=email,
                    password_hash=hash_password(settings.default_parent_password),
                    role=UserRole.PARENT,
                )
            )

        for name, color in [("Isaac", "sky"), ("Nehemiah", "amber")]:
            child = db.query(Child).filter(Child.family_id == family.id, Child.name == name).one_or_none()
            if child is None:
                db.add(Child(family_id=family.id, name=name, avatar_color=color))

        db.commit()
        print("Seed complete: default chores, parent, Isaac, and Nehemiah are ready.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
