"""Remove only untouched product rows from the original static demo catalog."""
from sqlalchemy import delete, select
from sqlalchemy.orm import joinedload

from app.main import CartItem, Product, SessionLocal, WishlistItem


# Each signature includes the original identifying catalog fields. If someone
# edited a demo row in Admin, it no longer matches and will be preserved.
DEMO_ROWS = {
    "Wireless Earbuds": ("Electronics", "Bluetooth 5.3 | Noise Cancelling", 3999, 6499, "4.5", "1.2k", "-35%", "photo-1606220945770-b5b6c2c55bf1", 25),
    "Smart Watch": ("Electronics", "Fitness Tracker | Heart Rate", 2999, 3999, "4.3", "856", "-25%", "photo-1523275335684-37898b6baf30", 20),
    "Running Shoes": ("Sports & Outdoors", "Lightweight | Breathable", 1499, 1999, "4.6", "2.3k", "-20%", "photo-1552346154-21d32810aba3", 18),
    "Backpack": ("Fashion", "Stylish | Durable | Spacious", 1399, 1999, "4.4", "987", "-30%", "photo-1553062407-98eeb64c6a62", 30),
    "Ceramic Morning Set": ("Home & Living", "Everyday ceramic coffee set", 3499, 4299, "4.9", "63", None, "photo-1514228742587-6b1558fcca3d", 12),
    "Sculpted Sun Glasses": ("Beauty", "Lightweight | UV protection", 4799, 5499, "4.6", "51", None, "photo-1511499767150-a48a237f0083", 15),
    "Instant Film Camera": ("Electronics", "Instant prints | Retro style", 9899, 11999, "4.8", "142", None, "photo-1516035069371-29a1b244cc32", 8),
    "Soft Form Lounge Chair": ("Home & Living", "A softer seat for slow days", 15699, 19999, "4.9", "37", None, "photo-1506439773649-6e0eb8cfb237", 5),
}


def remove_demo_products() -> None:
    with SessionLocal.begin() as db:
        products = db.scalars(select(Product).options(joinedload(Product.category))).all()
        demo_ids = []
        for product in products:
            signature = DEMO_ROWS.get(product.name)
            if signature is None:
                continue
            actual = (
                product.category.name,
                product.description,
                product.price,
                product.old_price,
                product.rating,
                product.reviews,
                product.discount,
                product.image,
                product.stock,
            )
            if actual == signature:
                demo_ids.append(product.id)

        if demo_ids:
            db.execute(delete(CartItem).where(CartItem.product_id.in_(demo_ids)))
            db.execute(delete(WishlistItem).where(WishlistItem.product_id.in_(demo_ids)))
            db.execute(delete(Product).where(Product.id.in_(demo_ids)))

    print(f"Removed {len(demo_ids)} unchanged demo product(s). Other products were preserved.")


if __name__ == "__main__":
    remove_demo_products()
