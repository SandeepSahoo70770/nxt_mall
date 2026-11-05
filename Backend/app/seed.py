"""Idempotently seed the current NxT Mall demo catalog into MySQL."""
from sqlalchemy import select
from app.main import Base, Category, HeroSlide, Product, SessionLocal, engine

CATEGORIES = [
    ("Fashion", "category-fashion.png"), ("Electronics", "category-electronics.png"),
    ("Home & Living", "category-home-living.png"), ("Beauty", "category-beauty.png"),
    ("Sports & Outdoors", "category-sports-outdoors.png"), ("Toys & Games", "category-toys-games.png"),
    ("Groceries", "category-groceries.png"), ("Gifts & More", "category-gifts.png"),
]
PRODUCTS = [
    ("Wireless Earbuds", "Electronics", "Bluetooth 5.3 | Noise Cancelling", 3999, 6499, "4.5", "1.2k", "-35%", "photo-1606220945770-b5b6c2c55bf1", 25),
    ("Smart Watch", "Electronics", "Fitness Tracker | Heart Rate", 2999, 3999, "4.3", "856", "-25%", "photo-1523275335684-37898b6baf30", 20),
    ("Running Shoes", "Sports & Outdoors", "Lightweight | Breathable", 1499, 1999, "4.6", "2.3k", "-20%", "photo-1552346154-21d32810aba3", 18),
    ("Backpack", "Fashion", "Stylish | Durable | Spacious", 1399, 1999, "4.4", "987", "-30%", "photo-1553062407-98eeb64c6a62", 30),
    ("Ceramic Morning Set", "Home & Living", "Everyday ceramic coffee set", 3499, 4299, "4.9", "63", None, "photo-1514228742587-6b1558fcca3d", 12),
    ("Sculpted Sun Glasses", "Beauty", "Lightweight | UV protection", 4799, 5499, "4.6", "51", None, "photo-1511499767150-a48a237f0083", 15),
    ("Instant Film Camera", "Electronics", "Instant prints | Retro style", 9899, 11999, "4.8", "142", None, "photo-1516035069371-29a1b244cc32", 8),
    ("Soft Form Lounge Chair", "Home & Living", "A softer seat for slow days", 15699, 19999, "4.9", "37", None, "photo-1506439773649-6e0eb8cfb237", 5),
]
SLIDES = [
    ("BIG SAVINGS, BIG SMILES", "Everything You Need", "Under ", "One Roof", "Fashion • Electronics • Home • Beauty • More", "/nxt-design/hero-under-one-roof.png", "A colorful collection of NxT Mall products", 0),
    ("EVERYTHING YOU NEED, ALL IN ONE PLACE", "Shop More,", "", "Live Better", "Top brands • Best deals • Fast delivery", "/nxt-design/hero-lifestyle.png", "A shopper discovering products from NxT Mall", 1),
]

def seed() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal.begin() as db:
        categories = {}
        for name, image in CATEGORIES:
            row = db.scalar(select(Category).where(Category.name == name))
            if row is None:
                row = Category(name=name, image=image)
                db.add(row)
                db.flush()
            categories[name] = row
        for name, cat, desc, price, old, rating, reviews, discount, image, stock in PRODUCTS:
            if db.scalar(select(Product).where(Product.name == name)) is None:
                db.add(Product(name=name, category_id=categories[cat].id, description=desc, price=price, old_price=old, rating=rating, reviews=reviews, discount=discount, image=image, stock=stock))
        if not db.scalar(select(HeroSlide.id).limit(1)):
            for eyebrow, first, second, highlight, desc, image, alt, order in SLIDES:
                db.add(HeroSlide(eyebrow=eyebrow, line_one=first, line_two=second, highlight=highlight, description=desc, image=image, alt=alt, sort_order=order))
    print("NxT Mall catalog seeded.")

if __name__ == "__main__":
    seed()
