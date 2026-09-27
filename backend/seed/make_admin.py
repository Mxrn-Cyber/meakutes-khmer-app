"""Give an existing account the admin role.

    cd ~/Desktop/meakutes-khmer-app/backend
    source venv/bin/activate
    python seed/make_admin.py you@example.com

Sign up on the website first, then run this with the same email.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal  # noqa: E402
from app.models.user import Role, User  # noqa: E402


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("Usage: python seed/make_admin.py you@example.com")
    email = sys.argv[1].strip().lower()

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            sys.exit(f"No account with email {email}. Sign up on the website first.")

        role = db.query(Role).filter(Role.name == "admin").first()
        if not role:
            role = Role(name="admin")
            db.add(role)
            db.flush()

        if user.has_role("admin"):
            print(f"{email} is already an admin.")
            return

        user.roles.append(role)
        db.commit()
        print(f"Done: {email} is now an admin. Sign out and sign in again.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
