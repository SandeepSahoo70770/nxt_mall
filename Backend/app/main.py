"""NxT Mall API. Persistent commerce data is stored in MySQL."""
from contextlib import asynccontextmanager
import os
from typing import Generator

from datetime import datetime, timedelta, timezone
import secrets

import jwt
from pwdlib import PasswordHash
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://nxtmall:nxtmall@127.0.0.1:3306/nxt_mall?charset=utf8mb4")
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=1800)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    image: Mapped[str] = mapped_column(String(255))
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(String(500))
    price: Mapped[float] = mapped_column(Numeric(12, 2))
    old_price: Mapped[float] = mapped_column(Numeric(12, 2))
    rating: Mapped[str] = mapped_column(String(8), default="0.0")
    reviews: Mapped[str] = mapped_column(String(24), default="0")
    discount: Mapped[str | None] = mapped_column(String(16), nullable=True)
    image: Mapped[str] = mapped_column(String(500))
    stock: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    category: Mapped[Category] = relationship(back_populates="products")


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (UniqueConstraint("session_key", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    session_key: Mapped[str] = mapped_column(String(80), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    product: Mapped[Product] = relationship()


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (UniqueConstraint("session_key", "product_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    session_key: Mapped[str] = mapped_column(String(80), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))


class Subscriber(Base):
    __tablename__ = "newsletter_subscribers"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)


class HeroSlide(Base):
    __tablename__ = "hero_slides"
    id: Mapped[int] = mapped_column(primary_key=True)
    eyebrow: Mapped[str] = mapped_column(String(160))
    line_one: Mapped[str] = mapped_column(String(160))
    line_two: Mapped[str] = mapped_column(String(160), default="")
    highlight: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(String(300))
    image: Mapped[str] = mapped_column(String(500))
    alt: Mapped[str] = mapped_column(String(300))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as db:
        yield db


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="NxT Mall API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-this-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": str(user.id), "email": user.email, "iat": now, "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES), "jti": secrets.token_urlsafe(12)}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def authenticated_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise HTTPException(401, "Invalid or expired access token", headers={"WWW-Authenticate": "Bearer"})
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(401, "User is unavailable", headers={"WWW-Authenticate": "Bearer"})
    return user


@app.post("/api/auth/signup", status_code=201, tags=["authentication"])
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists")
    user = User(email=email, password_hash=password_hash.hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": create_access_token(user), "token_type": "bearer", "expires_in": JWT_EXPIRE_MINUTES * 60, "user": {"id": user.id, "email": user.email}}


@app.post("/api/auth/login", tags=["authentication"])
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not password_hash.verify(payload.password, user.password_hash):
        raise HTTPException(401, "Email or password is incorrect", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(403, "This account is disabled")
    return {"access_token": create_access_token(user), "token_type": "bearer", "expires_in": JWT_EXPIRE_MINUTES * 60, "user": {"id": user.id, "email": user.email}}


@app.get("/api/auth/me", tags=["authentication"])
def current_user(user: User = Depends(authenticated_user)):
    return {"id": user.id, "email": user.email}


class CartRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class SubscribeRequest(BaseModel):
    email: EmailStr


def product_json(product: Product) -> dict:
    return {"id": product.id, "name": product.name, "category": product.category.name, "description": product.description, "price": float(product.price), "oldPrice": float(product.old_price), "rating": product.rating, "reviews": product.reviews, "discount": product.discount, "image": product.image, "stock": product.stock}


@app.get("/", tags=["health"])
def health():
    return {"service": "NxT Mall API", "status": "ok", "docs": "/docs"}


@app.get("/api/health", tags=["health"])
def db_health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"status": "ok", "database": "mysql"}


@app.get("/api/categories")
def list_categories(db: Session = Depends(get_db)):
    return [{"id": c.id, "name": c.name, "image": c.image} for c in db.scalars(select(Category).order_by(Category.id))]


@app.get("/api/products")
def list_products(category: str | None = None, q: str | None = None, sort: str = "featured", limit: int = Query(100, ge=1, le=200), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    stmt = select(Product).join(Category).where(Product.active.is_(True))
    if category:
        stmt = stmt.where(Category.name == category)
    if q:
        stmt = stmt.where(Product.name.ilike(f"%{q}%"))
    if sort == "price_asc":
        stmt = stmt.order_by(Product.price)
    elif sort == "top_rated":
        stmt = stmt.order_by(Product.rating.desc())
    else:
        stmt = stmt.order_by(Product.id)
    return [product_json(p) for p in db.scalars(stmt.offset(offset).limit(limit)).all()]


@app.get("/api/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product or not product.active:
        raise HTTPException(404, "Product not found")
    return product_json(product)


@app.get("/api/hero-slides")
def list_hero_slides(db: Session = Depends(get_db)):
    return [{"eyebrow": h.eyebrow, "lineOne": h.line_one, "lineTwo": h.line_two, "highlight": h.highlight, "description": h.description, "image": h.image, "alt": h.alt} for h in db.scalars(select(HeroSlide).order_by(HeroSlide.sort_order))]


@app.get("/api/cart")
def get_cart(session_key: str = Query(min_length=8, max_length=80), db: Session = Depends(get_db)):
    items = db.scalars(select(CartItem).where(CartItem.session_key == session_key)).all()
    return {"items": [{"product": product_json(i.product), "quantity": i.quantity} for i in items], "count": sum(i.quantity for i in items)}


@app.post("/api/cart", status_code=201)
def add_cart_item(payload: CartRequest, session_key: str = Query(min_length=8, max_length=80), db: Session = Depends(get_db)):
    if not db.get(Product, payload.product_id):
        raise HTTPException(404, "Product not found")
    item = db.scalar(select(CartItem).where(CartItem.session_key == session_key, CartItem.product_id == payload.product_id))
    if item:
        item.quantity = min(item.quantity + payload.quantity, 99)
    else:
        db.add(CartItem(session_key=session_key, product_id=payload.product_id, quantity=payload.quantity))
    db.commit()
    return get_cart(session_key, db)


@app.delete("/api/cart/{product_id}")
def remove_cart_item(product_id: int, session_key: str = Query(min_length=8, max_length=80), db: Session = Depends(get_db)):
    item = db.scalar(select(CartItem).where(CartItem.session_key == session_key, CartItem.product_id == product_id))
    if item:
        db.delete(item)
        db.commit()
    return get_cart(session_key, db)


@app.get("/api/wishlist")
def get_wishlist(session_key: str = Query(min_length=8, max_length=80), db: Session = Depends(get_db)):
    ids = db.scalars(select(WishlistItem.product_id).where(WishlistItem.session_key == session_key)).all()
    return {"productIds": ids}


@app.put("/api/wishlist/{product_id}")
def toggle_wishlist(product_id: int, session_key: str = Query(min_length=8, max_length=80), db: Session = Depends(get_db)):
    if not db.get(Product, product_id):
        raise HTTPException(404, "Product not found")
    item = db.scalar(select(WishlistItem).where(WishlistItem.session_key == session_key, WishlistItem.product_id == product_id))
    if item:
        db.delete(item)
        saved = False
    else:
        db.add(WishlistItem(session_key=session_key, product_id=product_id))
        saved = True
    db.commit()
    return {"productId": product_id, "saved": saved}


@app.post("/api/newsletter", status_code=201)
def subscribe(payload: SubscribeRequest, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(Subscriber).where(Subscriber.email == email)):
        return {"message": "Already subscribed"}
    db.add(Subscriber(email=email))
    db.commit()
    return {"message": "Subscription saved"}
