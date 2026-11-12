"""NxT Mall API. Persistent commerce data is stored in MySQL."""
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import os
import secrets
from typing import Generator

from dotenv import load_dotenv
import jwt
from pwdlib import PasswordHash
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, create_engine, func, inspect, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


load_dotenv()

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
    full_name: Mapped[str | None] = mapped_column(String(120), default="", nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role: Mapped[str] = mapped_column(String(20), default="customer", server_default="customer", nullable=False, index=True)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", index=True)
    total: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)


class Coupon(Base):
    __tablename__ = "coupons"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    discount_type: Mapped[str] = mapped_column(String(16))
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class StoreSetting(Base):
    __tablename__ = "store_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True)
    value: Mapped[str] = mapped_column(Text)


def get_db() -> Generator[Session, None, None]:
    with SessionLocal() as db:
        yield db


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    # create_all creates new columns on fresh databases but does not alter existing tables.
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    with engine.begin() as connection:
        if "full_name" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(120) NOT NULL DEFAULT ''"))
        if "address" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN address TEXT NULL"))
        if "role" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer'"))
    yield


app = FastAPI(title="NxT Mall API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-this-secret")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
password_hasher = PasswordHash.recommended()
bearer_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class SignupCredentials(Credentials):
    full_name: str = Field(min_length=2, max_length=120)
    address: str = Field(min_length=5, max_length=1000)


def issue_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    claims = {"sub": str(user.id), "email": user.email, "iat": now, "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES), "jti": secrets.token_urlsafe(12)}
    return jwt.encode(claims, JWT_SECRET, algorithm="HS256")


def require_user(token: str = Depends(bearer_scheme), db: Session = Depends(get_db)) -> User:
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = db.get(User, int(claims["sub"]))
    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(401, "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
    if user is None or not user.is_active:
        raise HTTPException(401, "User is unavailable", headers={"WWW-Authenticate": "Bearer"})
    return user


def require_admin(user: User = Depends(require_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Administrator access is required")
    return user


@app.post("/api/auth/signup", status_code=201, tags=["authentication"])
def signup(payload: SignupCredentials, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists")
    user = User(email=email, full_name=payload.full_name.strip(), address=payload.address.strip(), password_hash=password_hasher.hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"access_token": issue_token(user), "token_type": "bearer", "expires_in": JWT_EXPIRE_MINUTES * 60, "user": {"id": user.id, "email": user.email, "full_name": user.full_name}}


@app.post("/api/auth/login", tags=["authentication"])
def login(payload: Credentials, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not password_hasher.verify(payload.password, user.password_hash):
        raise HTTPException(401, "Email or password is incorrect", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(403, "Account is disabled")
    return {"access_token": issue_token(user), "token_type": "bearer", "expires_in": JWT_EXPIRE_MINUTES * 60, "user": {"id": user.id, "email": user.email, "full_name": user.full_name}}


@app.post("/api/admin/auth/login", tags=["admin authentication"])
def admin_login(payload: Credentials, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or user.role != "admin" or not password_hasher.verify(payload.password, user.password_hash):
        raise HTTPException(401, "Admin email or password is incorrect", headers={"WWW-Authenticate": "Bearer"})
    if not user.is_active:
        raise HTTPException(403, "Admin account is disabled")
    return {"access_token": issue_token(user), "token_type": "bearer", "expires_in": JWT_EXPIRE_MINUTES * 60, "user": {"id": user.id, "email": user.email, "full_name": user.full_name}}


@app.get("/api/admin/auth/me", tags=["admin authentication"])
def admin_current_user(user: User = Depends(require_admin)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "address": user.address}


@app.get("/api/auth/me", tags=["authentication"])
def current_user(user: User = Depends(require_user)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "address": user.address}


class CartRequest(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=99)


class SubscribeRequest(BaseModel):
    email: EmailStr


class AdminProductInput(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    category_id: int
    description: str = Field(max_length=500)
    price: float = Field(gt=0)
    old_price: float = Field(gt=0)
    image: str = Field(min_length=1, max_length=500)
    stock: int = Field(ge=0)
    discount: str | None = Field(default=None, max_length=16)
    active: bool = True


class AdminCategoryInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    image: str = Field(min_length=1, max_length=255)


class AdminCouponInput(BaseModel):
    code: str = Field(min_length=2, max_length=64)
    discount_type: str = Field(pattern="^(percent|amount)$")
    discount_value: float = Field(gt=0)
    active: bool = True
    expires_at: datetime | None = None


class AdminProfileInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    address: str = Field(min_length=5, max_length=1000)


class AdminSettingInput(BaseModel):
    values: dict[str, str]


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


def admin_product_json(product: Product) -> dict:
    return {**product_json(product), "category_id": product.category_id, "active": product.active}


@app.get("/api/admin/overview")
def admin_overview(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    latest = db.scalars(select(Order).order_by(Order.created_at.desc(), Order.id.desc()).limit(6)).all()
    return {
        "products": db.scalar(select(func.count(Product.id))) or 0,
        "customers": db.scalar(select(func.count(User.id)).where(User.role == "customer")) or 0,
        "orders": db.scalar(select(func.count(Order.id))) or 0,
        "revenue": float(db.scalar(select(func.coalesce(func.sum(Order.total), 0))) or 0),
        "recent_orders": [{"id": o.id, "customer": db.get(User, o.user_id).email if o.user_id and db.get(User, o.user_id) else "", "status": o.status, "total": float(o.total), "created_at": o.created_at.isoformat() if o.created_at else None} for o in latest],
    }


@app.get("/api/admin/products")
def admin_products(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [admin_product_json(p) for p in db.scalars(select(Product).order_by(Product.id.desc())).all()]


@app.post("/api/admin/products", status_code=201)
def admin_create_product(payload: AdminProductInput, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    if not db.get(Category, payload.category_id):
        raise HTTPException(404, "Category not found")
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return admin_product_json(product)


@app.put("/api/admin/products/{product_id}")
def admin_update_product(product_id: int, payload: AdminProductInput, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    if not db.get(Category, payload.category_id):
        raise HTTPException(404, "Category not found")
    for key, value in payload.model_dump().items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return admin_product_json(product)


@app.delete("/api/admin/products/{product_id}", status_code=204)
def admin_delete_product(product_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    db.delete(product)
    db.commit()


@app.get("/api/admin/categories")
def admin_categories(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": c.id, "name": c.name, "image": c.image, "product_count": db.scalar(select(func.count(Product.id)).where(Product.category_id == c.id)) or 0} for c in db.scalars(select(Category).order_by(Category.name)).all()]


@app.post("/api/admin/categories", status_code=201)
def admin_create_category(payload: AdminCategoryInput, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    category = Category(name=payload.name.strip(), image=payload.image.strip())
    db.add(category)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(409, "A category with this name already exists")
    db.refresh(category)
    return {"id": category.id, "name": category.name, "image": category.image, "product_count": 0}


@app.put("/api/admin/categories/{category_id}")
def admin_update_category(category_id: int, payload: AdminCategoryInput, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(404, "Category not found")
    category.name = payload.name.strip()
    category.image = payload.image.strip()
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(409, "A category with this name already exists")
    db.refresh(category)
    return {"id": category.id, "name": category.name, "image": category.image, "product_count": db.scalar(select(func.count(Product.id)).where(Product.category_id == category.id)) or 0}


@app.delete("/api/admin/categories/{category_id}", status_code=204)
def admin_delete_category(category_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(404, "Category not found")
    if db.scalar(select(func.count(Product.id)).where(Product.category_id == category_id)):
        raise HTTPException(409, "Move or delete this category's products before deleting it")
    db.delete(category)
    db.commit()


@app.get("/api/admin/customers")
def admin_customers(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": u.id, "email": u.email, "full_name": u.full_name or "", "address": u.address or "", "is_active": u.is_active} for u in db.scalars(select(User).where(User.role == "customer").order_by(User.id.desc())).all()]


@app.get("/api/admin/orders")
def admin_orders(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": o.id, "customer": db.get(User, o.user_id).email if o.user_id and db.get(User, o.user_id) else "", "status": o.status, "total": float(o.total), "created_at": o.created_at.isoformat() if o.created_at else None} for o in db.scalars(select(Order).order_by(Order.id.desc())).all()]


@app.patch("/api/admin/orders/{order_id}/status")
def admin_update_order_status(order_id: int, status: str = Query(pattern="^(pending|processing|shipped|delivered|cancelled)$"), _: User = Depends(require_admin), db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = status
    db.commit()
    return {"id": order.id, "status": order.status}


@app.get("/api/admin/coupons")
def admin_coupons(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": c.id, "code": c.code, "discount_type": c.discount_type, "discount_value": float(c.discount_value), "active": c.active, "expires_at": c.expires_at.isoformat() if c.expires_at else None} for c in db.scalars(select(Coupon).order_by(Coupon.id.desc())).all()]


@app.post("/api/admin/coupons", status_code=201)
def admin_create_coupon(payload: AdminCouponInput, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    coupon = Coupon(**{**payload.model_dump(), "code": payload.code.strip().upper()})
    db.add(coupon)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(409, "A coupon with this code already exists")
    db.refresh(coupon)
    return {"id": coupon.id, "code": coupon.code, "discount_type": coupon.discount_type, "discount_value": float(coupon.discount_value), "active": coupon.active, "expires_at": coupon.expires_at.isoformat() if coupon.expires_at else None}


@app.delete("/api/admin/coupons/{coupon_id}", status_code=204)
def admin_delete_coupon(coupon_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    coupon = db.get(Coupon, coupon_id)
    if not coupon:
        raise HTTPException(404, "Coupon not found")
    db.delete(coupon)
    db.commit()


@app.get("/api/admin/settings")
def admin_settings(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return {setting.key: setting.value for setting in db.scalars(select(StoreSetting)).all()}


@app.put("/api/admin/settings")
def admin_update_settings(payload: AdminSettingInput, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    for key, value in payload.values.items():
        setting = db.scalar(select(StoreSetting).where(StoreSetting.key == key))
        if setting:
            setting.value = value
        else:
            db.add(StoreSetting(key=key, value=value))
    db.commit()
    return {setting.key: setting.value for setting in db.scalars(select(StoreSetting)).all()}


@app.put("/api/admin/profile")
def admin_update_profile(payload: AdminProfileInput, user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user.full_name = payload.full_name.strip()
    user.address = payload.address.strip()
    db.commit()
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "address": user.address}
