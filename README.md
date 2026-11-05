# NxT Mall

NxT Mall is an e-commerce storefront built with React, TypeScript, Vite, FastAPI, and MySQL.

## Project structure

- `Frontend/`: responsive storefront and JWT login/signup page.
- `Backend/`: FastAPI API, SQLAlchemy database schema, and catalog seed command.
- `specs/`: product requirements and design notes.

## Run locally

1. Follow [Backend MySQL setup](Backend/README.md) to create the database, configure `Backend/.env`, sync Python dependencies, seed the existing storefront catalog, and start FastAPI.
2. Copy `Frontend/.env.example` to `Frontend/.env.local`.
3. In `Frontend/`, run `npm install` and `npm run dev`.

Products, categories, hero slides, cart, wishlist, newsletter subscriptions, and JWT accounts use the backend's MySQL database. Checkout and order fulfillment are not implemented yet.
