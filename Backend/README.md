# NxT Mall API

FastAPI backend backed by MySQL. Products, categories, hero slides, cart items, wishlist selections, and newsletter subscribers are persisted in MySQL. Cart and wishlist rows are scoped to a generated client session key until customer accounts are implemented.

## Setup

1. Create a MySQL database and user, then configure `DATABASE_URL` (example: `mysql+pymysql://nxtmall:password@localhost:3306/nxt_mall?charset=utf8mb4`).
2. In this folder run `uv sync`.
3. Seed the current storefront catalog with `uv run python -m app.seed`.
4. Start the API with `uv run uvicorn app.main:app --reload`.
5. Open `/docs` for the OpenAPI interface; `/api/health` checks the MySQL connection.

Set `CORS_ORIGINS` to a comma-separated list of allowed frontend origins. The default permits Vite at `http://localhost:5173`.

## API

- `GET /api/categories`
- `GET /api/products?category=&q=&sort=featured|price_asc|top_rated&limit=&offset=`
- `GET /api/products/{product_id}`
- `GET /api/hero-slides`
- `GET /api/cart?session_key=...`; `POST /api/cart?session_key=...`; `DELETE /api/cart/{product_id}?session_key=...`
- `GET /api/wishlist?session_key=...`; `PUT /api/wishlist/{product_id}?session_key=...`
- `POST /api/newsletter`

Tables are created at application startup. `seed.py` is safe to run repeatedly and only inserts missing catalog rows. Use a proper migration tool such as Alembic before applying schema changes in production. Configure secrets through environment variables; do not commit production credentials.
