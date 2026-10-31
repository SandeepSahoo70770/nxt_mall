# NxT Mall product requirements

## Purpose and status

NxT Mall is intended to let customers discover and purchase products in INR and let authorized staff manage catalog, orders, and fulfillment. These requirements describe the target product; they do not mean the features are already implemented. The current frontend is a sample-data prototype, and the FastAPI backend currently has only a greeting route.

## Functional requirements

All requirements below are planned unless verified and marked complete in the [phased backlog](../SPEC.md).

| ID | Requirement | Acceptance summary | Backlog mapping |
|---|---|---|---|
| FR-01 | Storefront and navigation | Customers can reach the home page, category/search results, product details, cart, account, and help pages on desktop and mobile. | NXTM-024, NXTM-054, NXTM-070 |
| FR-02 | Product catalog | Show active products with images, descriptions, SKU, INR price, discount, availability, categories, and ratings. Exclude inactive products from purchase. | NXTM-020–024 |
| FR-03 | Browse and search | Search by relevant product fields; filter by category, price, and availability; sort and paginate results; combine supported filters; show useful empty and error states. | NXTM-021–024 |
| FR-04 | Customer accounts | Register, sign in/out, recover a password, and manage profile information. Validate data and protect account access. | NXTM-010–013 |
| FR-05 | Customer addresses | Add, view, edit, remove, and select shipping and billing addresses; validate required address fields and preserve an order’s address snapshot. | NXTM-012, NXTM-050, NXTM-052 |
| FR-06 | Cart | Add products, change quantities, remove items, and view current prices and totals. Revalidate price and inventory on the server. Define guest-cart retention and merge behavior before implementation. | NXTM-030–032 |
| FR-07 | Wishlist | Signed-in customers can save, list, and remove products; handle products that later become inactive. | NXTM-033 |
| FR-08 | Coupons and promotions | Staff can configure eligible offers. Customers can apply a code and see why a code is invalid or ineligible. Compute discounts and enforce limits on the server. | NXTM-040–042, NXTM-093 |
| FR-09 | Checkout and order creation | Customers review items, address, shipping, coupon, tax, and total before submitting. Calculate final totals on the server, recheck stock, save order-item price snapshots, and prevent duplicate orders. | NXTM-050–054 |
| FR-10 | Payment | Support the payment methods approved in Phase 0. For online payments, create payment sessions server-side and trust only verified provider callbacks. Support the agreed failure, retry, cancellation, and refund flows. | NXTM-053, NXTM-060–062 |
| FR-11 | Orders and fulfillment | Customers see their order history and statuses. Authorized staff can process, pack, ship, deliver, cancel, or return orders according to defined transitions; record tracking details and status history. | NXTM-070–073, NXTM-092 |
| FR-12 | Reviews | Eligible purchasers can submit ratings and comments. Staff can moderate content; product pages show approved reviews and aggregates. | NXTM-080, NXTM-093 |
| FR-13 | Notifications | Send the agreed account and order notifications; record delivery state, retry transient failures, and avoid duplicate notifications for repeated events. Add other channels only if approved. | NXTM-081–083 |
| FR-14 | Store administration | Authorized staff can create, edit, archive, and search products/categories; update inventory; manage coupons and reviews; search orders and update permitted fulfillment fields. | NXTM-091–094 |
| FR-15 | Reporting | Staff can view defined order, sales, customer, and catalog metrics over explicit date ranges. Document metric definitions and access controls. | NXTM-090, NXTM-092 |
| FR-16 | Newsletter | Collect explicit signup consent and provide an unsubscribe path. Until a provider is integrated, keep the frontend confirmation clearly labeled as a demo. | NXTM-002, NXTM-084 |

## Non-functional requirements

The values below are proposed acceptance targets. Confirm business, hosting, and provider constraints in Phase 0 before treating them as release commitments.

| ID | Quality area | Requirement / proposed acceptance target |
|---|---|---|
| NFR-01 | Security | Use HTTPS in production; store passwords with a vetted password-hashing algorithm; keep secrets out of source control; validate inputs server-side; use secure session/token handling; rate-limit authentication and sensitive endpoints. |
| NFR-02 | Authorization | Enforce customer ownership and staff roles on every protected API. Never rely on a role, price, discount, stock count, or payment status supplied by the browser. |
| NFR-03 | Payment safety | Do not store raw card data. Verify payment-provider signatures, make callbacks idempotent, and keep provider credentials server-side. |
| NFR-04 | Privacy | Collect only data required for the agreed features, restrict access, and document retention/deletion rules and applicable privacy obligations before launch. |
| NFR-05 | Data integrity | Use database transactions for order creation, inventory changes, and payment-state updates. Store money in decimal-safe database types and calculate all authoritative totals on the server. |
| NFR-06 | Reliability and recovery | Add health checks, structured error handling, logging, and database backups. Proposed recovery targets: RPO no more than 24 hours and RTO no more than 4 hours; confirm against hosting and business needs. |
| NFR-07 | Performance | Proposed target: common catalog and cart API reads at p95 under 500 ms at the agreed launch load; storefront main content should become usable within 3 seconds on the agreed mobile test profile. Measure before release and optimize regressions. |
| NFR-08 | Scalability | Support pagination for catalog and admin lists; avoid loading the full catalog into the browser. Define the expected catalog size and concurrent-user load before production capacity planning. |
| NFR-09 | Accessibility | Support keyboard navigation, visible focus, labeled controls, meaningful image alternatives, readable contrast, and screen-reader status/error announcements. Verify desktop and mobile journeys. |
| NFR-10 | Responsive design | Support current mobile, tablet, and desktop viewport sizes without horizontal overflow or lost core actions. Test the agreed browser/device matrix. |
| NFR-11 | Compatibility | Support current stable versions of Chrome, Edge, Firefox, and Safari where they are part of the agreed customer audience. Document any unsupported browser behavior. |
| NFR-12 | Localization and money | Display and calculate prices consistently in INR using Indian number formatting. Define tax, shipping, discount rounding, and timezone rules before checkout is implemented. |
| NFR-13 | Maintainability | Keep API request/response contracts documented; use typed frontend code, input validation, migrations, and automated checks for core business rules. Keep configuration environment-specific. |
| NFR-14 | Observability | Log request IDs and important business events without passwords, payment secrets, or unnecessary personal data. Make failed payment callbacks, notification delivery, and background retries observable. |
| NFR-15 | Usability | Provide loading, empty, validation, success, and recoverable error states for customer and staff workflows. Confirmation must not be shown until the corresponding server action succeeds. |

## Cross-cutting business rules to decide

Resolve these before tickets that depend on them are considered ready:

- Tax inclusion, calculation, and invoice requirements for INR prices.
- Shipping rates, free-shipping threshold, serviceable areas, and delivery estimates.
- Guest checkout and guest-cart merge behavior.
- Payment provider/methods, cash-on-delivery availability, refund policy, and callback flow.
- Coupon stacking, limits, validity dates, and discount rounding.
- Order status transitions, cancellation/return eligibility, and stock reservation timing.
- Customer/staff roles, account recovery, session duration, and notification consent.
- Expected launch load, supported browsers/devices, uptime target, and recovery service levels.

## Definition of done for a requirement

- Acceptance behavior is demonstrated in the UI/API and matches the agreed business rule.
- Server-side validation and authorization protect any persisted or financial action.
- Relevant loading, empty, success, and failure states are present.
- Automated checks cover critical business rules; manual responsive/accessibility review is recorded where appropriate.
- User and operator documentation reflects the implemented behavior, and the linked backlog ticket is updated.
