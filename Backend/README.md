# NxT Mall API

FastAPI backend backed by MySQL. Products, categories, hero slides, cart items, wishlist selections, and newsletter subscribers are persisted in MySQL. Cart and wishlist rows are scoped to a generated client session key until customer accounts are implemented.

## MySQL setup

1. Install and start MySQL Server. In a MySQL client, create the database and a local application user:

   ```sql
   CREATE DATABASE nxt_mall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'nxtmall'@'127.0.0.1' IDENTIFIED BY 'choose-a-password';
   GRANT ALL PRIVILEGES ON nxt_mall.* TO 'nxtmall'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```

2. Copy `.env.example` to `.env`, set the MySQL password in `DATABASE_URL`, and replace `JWT_SECRET` with a long random value. `.env` is ignored by Git.
3. In this folder run `uv sync`.
4. Create the tables and load categories and hero content with `uv run python -m app.seed`. Products are not seeded; add real products through Admin → Products. To remove any untouched rows from the old demo catalog, run `uv run python -m app.remove_demo_products` once.
5. Start the API with `uv run uvicorn app.main:app --reload` or `uv run fastapi dev main.py`. Both commands start the same API from `app.main`.
6. Set `Frontend/.env.local` to `VITE_API_BASE_URL=http://localhost:8000`, then start Vite from `Frontend/` with `npm run dev`.
7. Visit `http://localhost:8000/api/health` to confirm the API can reach MySQL and `/docs` to inspect endpoints.

## API

- `GET /api/categories`
- `GET /api/products?category=&q=&sort=featured|price_asc|top_rated&limit=&offset=`
- `GET /api/products/{product_id}`
- `GET /api/hero-slides`
- `GET /api/cart?session_key=...`; `POST /api/cart?session_key=...`; `DELETE /api/cart/{product_id}?session_key=...`
- `GET /api/wishlist?session_key=...`; `PUT /api/wishlist/{product_id}?session_key=...`
- `POST /api/newsletter`

Tables are created at application startup. The schema includes users, categories, products, hero slides, cart items, wishlist items, and newsletter subscribers. Cart and wishlist are stored in MySQL under a persistent browser session key; user account linkage is not implemented yet. Use a proper migration tool such as Alembic before applying schema changes in production. Never commit production credentials.
