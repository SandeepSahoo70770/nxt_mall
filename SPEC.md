# NxT Mall — Product Specification and Phased Backlog

## Purpose

Build NxT Mall into a working e-commerce application where customers can discover products, manage a cart, pay, and track orders; store staff can manage the catalog, inventory, promotions, and fulfillment.

## Current baseline

- **Frontend:** React, TypeScript, and Vite in `Frontend/`.
- **Backend:** FastAPI in `Backend/`; currently only `GET /` is implemented.
- **Database:** Not connected yet. The project README and reference design identify PostgreSQL as the intended database.
- **Storefront already present:** Responsive landing/store page, sample product cards, category filtering, product search, sorting, local cart count/drawer, newsletter confirmation, INR display, NxT Mall branding.
- **Still demo-only:** Product data, cart contents, account, newsletter and checkout are not persisted or connected to APIs. No payment, order, admin, notification, or database features are implemented.

## Scope and shared requirements

- Customer pages: landing, category/search results, product details, cart, checkout, order confirmation, login/register, and account/order history.
- Store operations: products, categories, stock, coupons, orders, shipment status, and sales reporting.
- Data concepts in the reference design: users, addresses, categories, products, carts/cart items, orders/order items, payments, shipments, wishlists, coupons, and reviews.
- Currency: INR. Show prices and totals consistently, and calculate money using decimal-safe values.
- Preserve the current NxT Mall visual identity and responsive layout while connecting the UI to real backend data.
- Validate user input and permissions on the server. Never trust prices, discounts, stock, or payment status sent by the browser.

## Delivery phases and backlog checklist

### Phase 0 — Requirements and project foundation

**Goal:** Agree on decisions and prepare a maintainable full-stack foundation.

- [ ] **NXTM-001 — Confirm business rules:** Decide tax treatment, shipping fees, free-shipping threshold, returns, guest checkout, account roles, and order status names.
- [ ] **NXTM-002 — Choose integrations:** Select payment, email/SMS, and shipping providers; document sandbox credentials and callback requirements.
- [ ] **NXTM-003 — Configure environments:** Add validated environment settings and separate development, test, and production configuration; keep secrets out of Git.
- [ ] **NXTM-004 — Establish API conventions:** Define API prefix/version, error response shape, pagination, validation, CORS, and health endpoint.
- [ ] **NXTM-005 — Connect PostgreSQL:** Add connection management, schema migrations, and a repeatable local database setup.

**Done when:** the agreed business decisions are written down, the API starts from documented commands, and database migrations can create a clean development schema.

### Phase 1 — Accounts, authentication, and addresses

**Goal:** Support customer identity and checkout-ready address data.

- [ ] **NXTM-010 — Register and sign in:** Build registration, login, logout, password hashing, session/token handling, and validation.
- [ ] **NXTM-011 — Secure account recovery:** Add a time-limited password reset flow and rate limits.
- [ ] **NXTM-012 — Manage profile and addresses:** Allow customers to view/update profile details and add, edit, remove, and select default shipping/billing addresses.
- [ ] **NXTM-013 — Enforce roles:** Protect customer and admin routes with server-side authorization.

**Done when:** account actions persist in PostgreSQL; invalid credentials and unauthorized requests fail safely; customers can manage validated addresses.

### Phase 2 — Catalog, categories, search, and product details

**Goal:** Serve accurate, browsable product information.

- [ ] **NXTM-020 — Create catalog schema and API:** Add category/product models, image references, SKU, INR price, optional discount price, stock, and active status.
- [ ] **NXTM-021 — Browse catalog:** Provide paginated product/category listing with category, price, and availability filters plus stable sorting.
- [ ] **NXTM-022 — Search products:** Add server-side search with validation and useful empty-result behavior.
- [ ] **NXTM-023 — Build product detail page:** Show images, description, current price, discount, stock, rating, and review summary.
- [ ] **NXTM-024 — Replace sample storefront data:** Load home, category, search, and product detail views from the API with loading/error states.

**Done when:** catalog pages use API data, filters and search can be combined, and unavailable/inactive products cannot be purchased.

### Phase 3 — Cart and wishlist

**Goal:** Persist customer selections and validate them against the live catalog.

- [ ] **NXTM-030 — Implement cart API:** Create/read/update/remove cart items for signed-in users; define how guest carts are retained and merged after login.
- [ ] **NXTM-031 — Validate cart totals:** Recalculate item prices and stock on the server; return subtotal and any validation messages.
- [ ] **NXTM-032 — Connect cart UI:** Show real cart items, quantities, current prices, subtotal, and remove/update actions; replace count-only cart state.
- [ ] **NXTM-033 — Add wishlist:** Persist add/remove/list actions and connect the product save control.

**Done when:** cart contents survive reload/sign-in as agreed, quantities cannot exceed available stock, and the browser cannot set authoritative prices.

### Phase 4 — Coupons and offers

**Goal:** Apply valid promotions consistently at checkout.

- [ ] **NXTM-040 — Model coupons:** Support code, discount type/value, start/end dates, minimum order, usage limits, and active state.
- [ ] **NXTM-041 — Validate/apply coupons:** Calculate discounts on the server and explain invalid, expired, or ineligible codes.
- [ ] **NXTM-042 — Connect offer UI:** Show eligible offers and the applied discount in cart and checkout totals.

**Done when:** coupon rules are enforced server-side, usage limits cannot be bypassed by repeated requests, and totals remain consistent across cart and checkout.

### Phase 5 — Checkout and shipping selection

**Goal:** Collect delivery details and create a verified order.

- [ ] **NXTM-050 — Build checkout flow:** Collect/select shipping and billing addresses, shipping method, and order review details.
- [ ] **NXTM-051 — Calculate final total:** Recompute items, discounts, tax, shipping, and total on the server using the agreed INR business rules.
- [ ] **NXTM-052 — Create order safely:** Recheck stock and prices, save an immutable order-item price snapshot, and prevent duplicate submissions.
- [ ] **NXTM-053 — Support cash on delivery:** If confirmed in Phase 0, create COD orders with the correct pending/collect-on-delivery state.
- [ ] **NXTM-054 — Replace checkout placeholder:** Connect the UI to the checkout API and show validation, retry, and confirmation states.

**Done when:** a customer can review a server-calculated total and create one order; concurrent or repeated submissions do not oversell or duplicate orders.

### Phase 6 — Online payments

**Goal:** Process online payments through the selected provider.

- [ ] **NXTM-060 — Integrate payment provider sandbox:** Create payment sessions/intents on the server and redirect or render the provider flow.
- [ ] **NXTM-061 — Verify payment callbacks:** Validate provider signatures, make callback handling idempotent, and update payment/order status only from trusted provider results.
- [ ] **NXTM-062 — Handle failures and refunds:** Show retry/failure states and define the authorized refund workflow.

**Done when:** test transactions cover success, failure, duplicate callbacks, and cancellation; no card data or secrets are stored by NxT Mall.

### Phase 7 — Orders, shipment, and customer account

**Goal:** Let customers and staff follow an order from placement through delivery.

- [ ] **NXTM-070 — Customer order history:** List orders and show item, total, address snapshot, payment status, and order status.
- [ ] **NXTM-071 — Fulfillment workflow:** Add permitted staff transitions for processing, packed, shipped, delivered, cancelled, and returned states.
- [ ] **NXTM-072 — Shipment tracking:** Store shipping method and tracking number; show delivery progress to customers.
- [ ] **NXTM-073 — Handle cancellation/returns:** Implement eligibility rules and status tracking based on confirmed business policy.

**Done when:** each order has an auditable status history and customers see only their own orders.

### Phase 8 — Reviews and notifications

**Goal:** Support verified customer feedback and timely order updates.

- [ ] **NXTM-080 — Product reviews:** Allow eligible customers to rate/comment on purchased products; add moderation and display aggregate ratings.
- [ ] **NXTM-081 — Email notifications:** Send registration, order confirmation, payment, shipping, delivery, and reset messages through the chosen provider.
- [ ] **NXTM-082 — Notification reliability:** Record delivery status, retry transient failures, and avoid duplicate sends for repeated events.
- [ ] **NXTM-083 — Add SMS/push only if selected:** Implement opt-in, preferences, and delivery status for approved channels.
- [ ] **NXTM-084 — Newsletter subscriptions:** Store explicit signup consent, connect the approved email provider, and support unsubscribe; keep the current frontend-only confirmation marked as demo until integrated.

**Done when:** eligible events create the expected notification once, delivery failures are observable, review eligibility is enforced, and newsletter consent/unsubscribe behavior is documented and works.

### Phase 9 — Admin and store management

**Goal:** Give authorized staff tools to operate the store.

- [ ] **NXTM-090 — Admin dashboard:** Show order, revenue, conversion, and customer metrics with clear date ranges and defined calculations.
- [ ] **NXTM-091 — Manage catalog and stock:** Create/edit/archive products and categories; validate SKUs, INR prices, image references, and stock updates.
- [ ] **NXTM-092 — Manage orders and shipments:** Search orders, update allowed statuses, assign tracking details, and view fulfillment reports.
- [ ] **NXTM-093 — Manage coupons and reviews:** Configure promotions and moderate reviews with an audit trail.
- [ ] **NXTM-094 — Protect admin features:** Enforce role checks on every admin API and record sensitive actions.

**Done when:** staff can perform approved operations without direct database edits, and non-admin users cannot access admin data or APIs.

### Phase 10 — Quality, security, accessibility, and launch

**Goal:** Prepare the complete application for real customers.

- [ ] **NXTM-100 — Add automated checks:** Cover API validation, authentication, catalog/cart/order/payment rules, and key storefront flows.
- [ ] **NXTM-101 — Review security:** Check authorization, rate limits, input handling, secret management, dependency updates, and sensitive logging.
- [ ] **NXTM-102 — Review accessibility and responsive behavior:** Verify keyboard use, labels, contrast, screen-reader status messages, and mobile layouts.
- [ ] **NXTM-103 — Improve reliability/performance:** Add structured logs, error monitoring, database backups, image optimization, and useful loading/error states.
- [ ] **NXTM-104 — Deploy and document:** Configure production services, migrations, health checks, rollback steps, and setup/API documentation.

**Done when:** critical user and staff journeys pass the agreed checks, production deployment and recovery steps are documented, and known limitations are recorded.

## Suggested first backlog slice

Start with **NXTM-001 through NXTM-005**, then deliver a small end-to-end catalog slice: **NXTM-020, NXTM-021, NXTM-023, and NXTM-024**. This replaces the current sample data with persistent products before starting checkout or payment work.
