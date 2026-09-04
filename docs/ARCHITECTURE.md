# System Architecture & Technical Design

## 1. Overview & Core Philosophy

The **Automated POS System** is an enterprise-ready retail meat shop management platform designed following the **Backend-First Workflow Template**. It provides real-time Point of Sale counter ordering, digital queue management, live meat cut inventory tracking, and owner analytics.

```
┌─────────────────────────────────────────────────────────┐
│                    Web Browser Layer                    │
│      React 19 + Vite 8 SPA (Staff, Owner, Customer)     │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP REST + JWT Bearer
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend API Layer                     │
│    Node.js Express 4 (Strict RBAC, Zod Validation)      │
│     Routes -> Controllers -> Services -> Repositories   │
└────────────────────────────┬────────────────────────────┘
                             │  Native node:sqlite DatabaseSync
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Database Layer                       │
│    Local SQLite 3 (WAL Mode, Foreign Keys Enforced)     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Fundamental Architectural Rules

### Rule 1: Single API Boundary
- The browser **never** connects directly to the database or cloud DB clients.
- All requests flow: `Browser -> src/api/client.js -> Express REST API -> SQLite`.

### Rule 2: Multi-Table Checkout Atomicity
- Checkout operations (inventory deduction, order creation, order item rows, payment logging, receipt generation, audit log) execute inside a **single atomic SQLite transaction** (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`).
- If any item fails stock validation or payment validation, all database changes are completely rolled back.

### Rule 3: Native Zero-Dependency SQLite
- Built with Node 24 native `node:sqlite` (`DatabaseSync`), requiring zero external native compilation or cloud database tiers.
- Operates with `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;` for high concurrency read/write safety.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Endpoint Route | Customer | Staff | Owner |
| :--- | :---: | :---: | :---: |
| `POST /api/v1/auth/login` | ✅ | ✅ | ✅ |
| `POST /api/v1/auth/signup` | ✅ | ❌ | ❌ |
| `GET /api/v1/auth/me` | ✅ | ✅ | ✅ |
| `GET /api/v1/categories` | ✅ | ✅ | ✅ |
| `GET /api/v1/products` | ✅ | ✅ | ✅ |
| `POST /api/v1/products` | ❌ | ❌ | ✅ |
| `GET /api/v1/inventory` | ❌ | ✅ | ✅ |
| `PATCH /api/v1/inventory/:id` | ❌ | ❌ | ✅ |
| `POST /api/v1/orders` | ❌ | ✅ | ✅ |
| `GET /api/v1/orders` | ❌ | ✅ | ✅ |
| `GET /api/v1/orders/rules` | ✅ | ✅ | ✅ |
| `POST /api/v1/queue/tickets` | ✅ | ✅ | ✅ |
| `GET /api/v1/queue` | ✅ | ✅ | ✅ |
| `PATCH /api/v1/queue/tickets/:id` | ❌ | ✅ | ✅ |
| `GET /api/v1/reports/summary` | ❌ | ❌ | ✅ |
