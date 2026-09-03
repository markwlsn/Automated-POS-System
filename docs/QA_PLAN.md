# Automated POS System: QA Plan (`docs/QA_PLAN.md`)

## Overview
This document details test cases across authentication, catalog, inventory, order processing, queue management, and owner reporting.

---

## QA-101: System Health Verification
- **Priority**: Critical
- **Area**: API / Infrastructure
- **Preconditions**: Backend service running
- **Steps**:
  1. Send `GET /health` without headers.
- **Expected Result**:
  - HTTP `200 OK`
  - Body contains `{ "data": { "status": "ok", "uptime": ..., "timestamp": ... } }`

---

## QA-102: Customer Registration & Duplicate Protection
- **Priority**: High
- **Area**: Auth / Security
- **Preconditions**: None
- **Steps**:
  1. Send `POST /api/v1/auth/signup` with valid email, password, full name, phone number.
  2. Send identical request again.
- **Expected Result**:
  - Request 1: HTTP `201 Created` with `{ "data": { "user": ..., "token": ... } }`.
  - Request 2: HTTP `409 Conflict` with code `CONFLICT`.

---

## QA-103: Staff Login & Token Generation
- **Priority**: Critical
- **Area**: Auth
- **Preconditions**: Seeded staff account (`staff@test.com`)
- **Steps**:
  1. Send `POST /api/v1/auth/login` with correct password.
  2. Send `POST /api/v1/auth/login` with wrong password.
- **Expected Result**:
  - Success: HTTP `200 OK`, user role is `staff`, valid JWT token returned.
  - Failure: HTTP `401 Unauthorized` with code `UNAUTHORIZED`.

---

## QA-104: Role-Based Access Control (RBAC)
- **Priority**: Critical
- **Area**: Security
- **Preconditions**: Customer token, Staff token, Owner token
- **Steps**:
  1. Access `GET /api/v1/reports/summary` using Customer token.
  2. Access `GET /api/v1/reports/summary` using Staff token.
  3. Access `GET /api/v1/reports/summary` using Owner token.
- **Expected Result**:
  - 1 & 2: HTTP `403 Forbidden` with code `FORBIDDEN`.
  - 3: HTTP `200 OK` with summary data.

---

## QA-105: Product Catalog & Category Grouping
- **Priority**: High
- **Area**: API / Products
- **Preconditions**: Seeded catalog
- **Steps**:
  1. Send `GET /api/v1/categories`.
  2. Send `GET /api/v1/products`.
  3. Send `GET /api/v1/products?categoryId=cat-pork`.
- **Expected Result**:
  - HTTP `200 OK` with category objects and active products filtered correctly.

---

## QA-106: POS Order Submission with Atomic Inventory Deduction
- **Priority**: Critical
- **Area**: POS / Orders / Inventory
- **Preconditions**: Product with known stock (e.g. 20.00 kg)
- **Steps**:
  1. Submit order for 5.00 kg of the product via `POST /api/v1/orders`.
  2. Check product inventory via `GET /api/v1/inventory`.
- **Expected Result**:
  - HTTP `201 Created` with order, payment (change calculated), receipt number.
  - Inventory reduced exactly to 15.00 kg.

---

## QA-107: Insufficient Inventory Transaction Rollback
- **Priority**: Critical
- **Area**: POS / Inventory / Concurrency
- **Preconditions**: Product with 5.00 kg stock
- **Steps**:
  1. Submit order requesting 10.00 kg via `POST /api/v1/orders`.
- **Expected Result**:
  - HTTP `400 Bad Request` with code `INSUFFICIENT_STOCK`.
  - No order, payment, or receipt created.
  - Inventory remains untouched at 5.00 kg.

---

## QA-108: Cash Payment Change Calculation & Validation
- **Priority**: High
- **Area**: POS / Finance
- **Preconditions**: Order total is ₱500.00
- **Steps**:
  1. Submit cash payment with ₱400.00 (insufficient).
  2. Submit cash payment with ₱1,000.00.
- **Expected Result**:
  - 1: HTTP `400 Bad Request` with code `INSUFFICIENT_PAYMENT`.
  - 2: HTTP `201 Created`, change is exactly ₱500.00.

---

## QA-109: Order History & Search
- **Priority**: High
- **Area**: Staff POS
- **Preconditions**: Completed orders exist for today
- **Steps**:
  1. Send `GET /api/v1/orders`.
  2. Search by order number `GET /api/v1/orders?search=001`.
- **Expected Result**:
  - HTTP `200 OK` with matching orders list including receipt numbers.

---

## QA-110: Customer Queue Ticketing & Serving Flow
- **Priority**: High
- **Area**: Queue
- **Preconditions**: None
- **Steps**:
  1. Issue ticket `POST /api/v1/queue/tickets`.
  2. View queue `GET /api/v1/queue`.
  3. Call ticket `PATCH /api/v1/queue/tickets/:id/status` to `serving`.
- **Expected Result**:
  - Ticket issued with formatted number (e.g. A-001).
  - Queue board reflects currently serving ticket and waiting count.
