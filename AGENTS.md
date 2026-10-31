# NxT Mall

- `Frontend/`: React, TypeScript, and Vite storefront.
- `Backend/`: FastAPI app; currently only `GET /` is implemented. No database or commerce APIs yet.
- The storefront uses sample data and local UI state. Checkout is a placeholder.

## Conventions

- Follow the existing responsive design and accessibility patterns.
- Keep styles in `Frontend/src/index.css` (global) and `Frontend/src/App.css` (storefront).
- Preserve the current brand styling and INR prices unless asked to change them.
- Don’t imply sample data, cart, checkout, or newsletter are connected to a backend.

## Commands

From `Frontend/`: `npm run dev`, `npm run build`, `npm run lint`.

From `Backend/` (Python 3.13+, `uv`): `uv sync` then `uv run uvicorn main:app --reload`.
