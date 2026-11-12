"""Interactively create a dedicated NxT Mall administrator account."""
from getpass import getpass

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import inspect, select, text

from app.main import Base, SessionLocal, User, engine, password_hasher


def ensure_user_schema() -> None:
    Base.metadata.create_all(engine)
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    with engine.begin() as connection:
        if "full_name" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(120) NOT NULL DEFAULT ''"))
        if "address" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN address TEXT NULL"))
        if "role" not in columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer'"))


def main() -> None:
    ensure_user_schema()
    try:
        email = str(TypeAdapter(EmailStr).validate_python(input("Admin email: ").strip())).lower()
    except ValidationError as exc:
        raise SystemExit("Enter a valid email address.") from exc

    name = input("Admin name: ").strip()
    if len(name) < 2:
        raise SystemExit("Admin name must contain at least 2 characters.")

    password = getpass("Admin password (at least 12 characters): ")
    if len(password) < 12:
        raise SystemExit("Use a password with at least 12 characters.")
    if password != getpass("Confirm admin password: "):
        raise SystemExit("Passwords do not match.")

    with SessionLocal.begin() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user and user.role != "admin":
            raise SystemExit("That email already belongs to a customer. Choose a separate admin email.")
        if user:
            user.full_name = name
            user.password_hash = password_hasher.hash(password)
            user.is_active = True
        else:
            db.add(User(email=email, full_name=name, address="", password_hash=password_hasher.hash(password), is_active=True, role="admin"))

    print(f"Admin credential saved for {email}.")


if __name__ == "__main__":
    main()
