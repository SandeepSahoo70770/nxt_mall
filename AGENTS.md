# NxT Mall

- `Frontend/`: React, TypeScript, and Vite storefront.
- `Backend/`: FastAPI app with SQLAlchemy models and MySQL APIs for JWT accounts, catalog, cart, wishlist, and newsletter.
- Catalog content is loaded from the backend; `Backend/app/seed.py` imports the current storefront catalog into MySQL.
- Cart and wishlist are persisted in MySQL per browser session. Checkout is still a placeholder.

## Conventions

- Follow the existing responsive design and accessibility patterns.
- Keep styles in `Frontend/src/index.css` (global) and `Frontend/src/App.css` (storefront).
- Preserve the current brand styling and INR prices unless asked to change them.
- Keep database connection details in ignored `.env` files; commit only `.env.example` templates.
- Don’t imply checkout or order fulfillment is connected to a backend.

## Commands

From `Frontend/`: `npm run dev`, `npm run build`, `npm run lint`.

From `Backend/` (Python 3.13+, `uv`): configure `.env`, run `uv sync`, seed with `uv run python -m app.seed`, then start `uv run uvicorn app.main:app --reload`.
