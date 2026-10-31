# NxT Mall specifications

This folder holds the requirements supporting the phased delivery backlog.

## Documents

- [Product requirements](REQUIREMENTS.md) — functional requirements, quality targets, and acceptance guidance.
- [Phased backlog](../SPEC.md) — sequenced phases, ticket IDs, dependencies, and `[ ]` to-do checkboxes.

## How to use

1. Confirm open business decisions in Phase 0 of the backlog before implementing dependent flows.
2. Select a ticket, check its mapped requirements, and add or refine acceptance criteria before development.
3. Mark a checkbox `[x]` only after the ticket’s acceptance criteria are met; the documents describe intended work, not proof of implementation.
4. Update both documents when scope, business rules, or phase dependencies change.

The current baseline is a React/Vite storefront with sample products and local UI state, plus a FastAPI backend that only exposes `GET /`. Database persistence, payment, order processing, admin tools, and the other planned workflows are not implemented yet.
