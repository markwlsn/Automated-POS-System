# Agent Handoff: Automated POS System (`docs/AGENT_HANDOFF.md`)

## Current State & Metadata

- **Current Phase**: `Phase 5: End-to-End QA / Readiness`
- **Root Path**: `C:\Users\User.MIS\Documents\Projects\Automated-POS-System`
- **Backend Stack**: Node.js (v24), Express, `node:sqlite` (Node 24 native SQLite engine), Zod, JWT, bcryptjs, Helmet, CORS
- **Frontend Stack**: React 19, Vite 8, Tailwind CSS 3 (isolated in `frontend/`)
- **API Base URL**: `http://localhost:3000/api/v1`
- **UI Local URL**: `http://localhost:5173`
- **Active Branch**: `main`

---

## What is Implemented

1. **Repository Layout**:
   - Clean separation conforming to `PROJECT_WORKFLOW.md`:
     - Backend at root (`src/`, `tests/`, `scripts/`, `package.json`, `.env.example`).
     - Frontend isolated in `frontend/` (`src/`, `public/`, `package.json`, `vite.config.js`).
2. **Database Engine & Migrations**:
   - Schema defined in `scripts/migrations/001_init_schema.sql` (`shops`, `branches`, `profiles`, `product_categories`, `products`, `inventory`, `orders`, `order_items`, `payments`, `receipts`, `queue_tickets`, `activity_log`).
   - Seed data in `scripts/seeds/001_seed_data.sql` with default shops, branches, user accounts (owner, staff, customer), products, and inventory.
   - Migration and seed runners in `scripts/migrate.js` and `scripts/seed.js`.
   - Master Supabase SQL script provided in `scripts/supabase_master_schema.sql` for future cloud deployments.
3. **Backend Architecture**:
   - Layered separation:
     - `src/repositories/`: SQL queries with prepared statements.
     - `src/services/`: Business logic, JWT tokens, bcrypt password hashing, and atomic transaction coordination.
     - `src/controllers/`: Request handling and status management.
     - `src/routes/`: Zod validated routes (`auth`, `categories`, `products`, `inventory`, `orders`, `queue`, `reports`).
     - `src/middleware/`: JWT verification, role-based authorization (`owner`, `staff`, `customer`), Zod validation, global error handling, standard response wrapper (`{ data }`, `{ error }`).
4. **Automated Test Suite (27/27 Tests Passing)**:
   - `tests/health.test.js`: System health and 404 handler.
   - `tests/auth.test.js`: Signup, duplicate rejection, login, invalid credentials, profile, missing token.
   - `tests/products.test.js`: Category sorting, product catalog with stock, category filtering, owner product creation, customer RBAC block.
   - `tests/inventory.test.js`: Stock queries, stock & threshold updates, negative stock rejection.
   - `tests/orders.test.js`: POS multi-item checkout, atomic inventory deduction, change calculation, insufficient stock rollback, insufficient cash rejection, order history search.
   - `tests/queue.test.js`: Ticket generation, queue board, status transitions to `serving`.
   - `tests/reports.test.js`: Owner analytics summary (sales, orders, average order value, payment method breakdown, top products), staff RBAC block.
   - `tests/contract.test.js`: Strict validation that all success responses follow `{ data: ... }` and error responses follow `{ error: { message, code, details } }`.
5. **Frontend API Integration (Phase 4 Completed)**:
   - Built centralized API client in `frontend/src/api/client.js` wrapping all endpoints with JWT management.
   - Refactored `AuthContext.jsx` to authenticate via `POST /api/v1/auth/login` and `POST /api/v1/auth/signup`.
   - Refactored `useProducts.js`, `useInventory.js`, and `useOrderSubmit.js` to consume Backend API endpoints.
   - Refactored `OrderHistory.jsx` to fetch and view receipts via `GET /api/v1/orders`.
   - Completely retired `@supabase/supabase-js` from browser code, fulfilling Rule 5: `Browser -> Backend API -> Database`.

---

## Verification Commands & Results

| Check | Command | Result |
| --- | --- | --- |
| Backend Tests | `npm test` | **27 / 27 passing (100%)** |
| Backend Lint | `npm run lint` | **0 errors, 0 warnings** |
| Backend Audit | `npm audit --omit=dev` | **0 vulnerabilities** |
| Frontend Tests | `npm test` (in `frontend/`) | **Passing** |
| Frontend Build | `npm run build` (in `frontend/`) | **Built successfully in 2.09s** |
| Frontend Lint | `npm run lint` (in `frontend/`) | **Passing** |
| Frontend Audit | `npm audit --omit=dev` | **0 vulnerabilities** |

---

## How to Run the Application

```powershell
# 1. Start Backend Server (Terminal 1)
npm run dev

# 2. Start Frontend App (Terminal 2)
cd frontend
npm run dev
```

---

## Successor Agent Prompt

```text
Take over Automated POS System at C:\Users\User.MIS\Documents\Projects\Automated-POS-System. Read PROJECT_WORKFLOW.md and docs/AGENT_HANDOFF.md completely before acting.

Both the backend and frontend integration are complete, tested (27/27 backend tests passing, frontend builds cleanly), and audited with 0 vulnerabilities.
The application operates on the built-in local SQLite database with zero cloud dependencies.

Next actions:
Run end-to-end smoke testing of the POS workflow by starting both backend and frontend dev servers.
```
