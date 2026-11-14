"""Seed the store's category and hero content into MySQL."""
from sqlalchemy import select
from app.main import Base, Category, HeroSlide, SessionLocal, engine

CATEGORIES = [
    ("Fashion", "category-fashion.png"), ("Electronics", "category-electronics.png"),
    ("Home & Living", "category-home-living.png"), ("Beauty", "category-beauty.png"),
    ("Sports & Outdoors", "category-sports-outdoors.png"), ("Toys & Games", "category-toys-games.png"),
    ("Groceries", "category-groceries.png"), ("Gifts & More", "category-gifts.png"),
]
SLIDES = [
    ("BIG SAVINGS, BIG SMILES", "Everything You Need", "Under ", "One Roof", "Fashion • Electronics • Home • Beauty • More", "/nxt-design/hero-under-one-roof.png", "A colorful collection of NxT Mall products", 0),
    ("EVERYTHING YOU NEED, ALL IN ONE PLACE", "Shop More,", "", "Live Better", "Top brands • Best deals • Fast delivery", "/nxt-design/hero-shop-more.png", "A shopper discovering products from NxT Mall", 1),
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
        if not db.scalar(select(HeroSlide.id).limit(1)):
            for eyebrow, first, second, highlight, desc, image, alt, order in SLIDES:
                db.add(HeroSlide(eyebrow=eyebrow, line_one=first, line_two=second, highlight=highlight, description=desc, image=image, alt=alt, sort_order=order))
    print("NxT Mall categories and hero content seeded. Add products through Admin → Products.")

if __name__ == "__main__":
    seed()
