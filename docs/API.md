# Automated POS System - API Specification (`docs/API.md`)

Version: `1.0.0`  
Base URL: `http://localhost:3000/api/v1`  
Convention: All endpoints return either a success envelope `{ "data": ... }` or an error envelope `{ "error": { "message": "...", "code": "...", "details": { ... } } }`.

---

## Authentication & Headers

Protected routes require an HTTP `Authorization` header:
```http
Authorization: Bearer <JWT_TOKEN>
```

Role definitions:
- `owner`: Full management access (sales reporting, product management, staff management, orders, inventory).
- `staff`: Counter POS operations (create orders, check inventory, view order history, reprint receipts, call queue tickets).
- `customer`: View public catalog, track orders, join queue.

---

## Standard Error Codes

| Code | HTTP Status | Description |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `VALIDATION_ERROR` | 400 | Request body/query failed schema validation |
| `RESOURCE_NOT_FOUND` | 404 | Requested record does not exist |
| `CONFLICT` | 409 | Duplicate unique resource (e.g., email already registered) |
| `INSUFFICIENT_STOCK` | 400 | Order item requested more weight than available inventory |
| `INSUFFICIENT_PAYMENT` | 400 | Cash received is less than order total |
| `INTERNAL_ERROR` | 500 | Unexpected server exception |

---

## 1. System Health

### `GET /health`
Returns system health, uptime, and current server time.

- **Auth**: None
- **Response `200 OK`**:
```json
{
  "data": {
    "status": "ok",
    "uptime": 12.34,
    "timestamp": "2026-09-03T14:45:00.000Z",
    "environment": "development"
  }
}
```

---

## 2. Authentication

### `POST /api/v1/auth/signup`
Registers a new customer account.

- **Auth**: None
- **Body**:
```json
{
  "email": "customer@test.com",
  "password": "Password123!",
  "fullName": "Juan Dela Cruz",
  "phoneNumber": "09171234567"
}
```
- **Response `201 Created`**:
```json
{
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "customer@test.com",
      "fullName": "Juan Dela Cruz",
      "role": "customer",
      "phoneNumber": "09171234567"
    },
    "token": "jwt-token-string"
  }
}
```
- **Error `409 Conflict`**:
```json
{
  "error": {
    "message": "Email is already registered",
    "code": "CONFLICT",
    "details": {}
  }
}
```

### `POST /api/v1/auth/login`
Authenticates a user and returns a JWT token with their profile and permissions.

- **Auth**: None
- **Body**:
```json
{
  "email": "staff@test.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "data": {
    "user": {
      "id": "uuid-staff",
      "email": "staff@test.com",
      "fullName": "Maria Santos",
      "role": "staff",
      "branchId": "22222222-2222-2222-2222-222222222222",
      "phoneNumber": "09181234567"
    },
    "token": "jwt-token-string"
  }
}
```
- **Error `401 Unauthorized`**:
```json
{
  "error": {
    "message": "Invalid email or password",
    "code": "UNAUTHORIZED",
    "details": {}
  }
}
```

### `GET /api/v1/auth/me`
Retrieves the currently authenticated user's profile.

- **Auth**: Bearer token
- **Response `200 OK`**:
```json
{
  "data": {
    "user": {
      "id": "uuid-staff",
      "email": "staff@test.com",
      "fullName": "Maria Santos",
      "role": "staff",
      "branchId": "22222222-2222-2222-2222-222222222222"
    }
  }
}
```

---

## 3. Products & Categories

### `GET /api/v1/categories`
Retrieves product categories sorted by display order.

- **Auth**: None
- **Response `200 OK`**:
```json
{
  "data": [
    { "id": "cat-pork", "name": "Pork", "sortOrder": 1 },
    { "id": "cat-beef", "name": "Beef", "sortOrder": 2 },
    { "id": "cat-chicken", "name": "Chicken", "sortOrder": 3 }
  ]
}
```

### `GET /api/v1/products`
Retrieves all active products with category information and optional category filter.

- **Auth**: None
- **Query Parameters**:
  - `categoryId` (optional): Filter products by category UUID
  - `branchId` (optional): Include real-time branch stock
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "prod-liempo",
      "name": "Pork Liempo",
      "pricePerKg": 380.00,
      "isActive": true,
      "categoryId": "cat-pork",
      "category": { "id": "cat-pork", "name": "Pork" },
      "stockKg": 45.50
    }
  ]
}
```

### `POST /api/v1/products`
Creates a new product (Owner only).

- **Auth**: Required (`owner`)
- **Body**:
```json
{
  "name": "Pork Kasim",
  "pricePerKg": 340.00,
  "categoryId": "cat-pork"
}
```
- **Response `201 Created`**:
```json
{
  "data": {
    "id": "prod-kasim",
    "name": "Pork Kasim",
    "pricePerKg": 340.00,
    "categoryId": "cat-pork",
    "isActive": true
  }
}
```

---

## 4. Inventory

### `GET /api/v1/inventory`
Retrieves current inventory levels for a branch.

- **Auth**: Required (`owner`, `staff`)
- **Query Parameters**:
  - `branchId` (optional, defaults to current branch)
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "inv-1",
      "productId": "prod-liempo",
      "productName": "Pork Liempo",
      "categoryName": "Pork",
      "stockKg": 45.50,
      "lowStockThresholdKg": 10.00,
      "isLowStock": false,
      "isOutOfStock": false,
      "updatedAt": "2026-09-03T14:00:00.000Z"
    }
  ]
}
```

### `PATCH /api/v1/inventory/:productId`
Updates stock level or low-stock threshold (Owner or Staff).

- **Auth**: Required (`owner`, `staff`)
- **Body**:
```json
{
  "stockKg": 50.00,
  "lowStockThresholdKg": 15.00
}
```
- **Response `200 OK`**:
```json
{
  "data": {
    "productId": "prod-liempo",
    "stockKg": 50.00,
    "lowStockThresholdKg": 15.00
  }
}
```

---

## 5. Orders & Checkout (POS Core)

### `POST /api/v1/orders`
Creates a completed order, validates inventory, atomically deducts stock, creates order items, records payment, creates receipt, and logs activity within a single atomic database transaction.

- **Auth**: Required (`owner`, `staff`)
- **Body**:
```json
{
  "branchId": "22222222-2222-2222-2222-222222222222",
  "customerId": null,
  "orderType": "walk_in",
  "fulfillmentType": "pickup",
  "paymentMethod": "cash",
  "cashReceived": 1000.00,
  "paymentReference": null,
  "items": [
    {
      "productId": "prod-liempo",
      "weightKg": 2.50
    }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "data": {
    "order": {
      "id": "order-uuid",
      "orderNumber": "222222-20260903-001",
      "branchId": "22222222-2222-2222-2222-222222222222",
      "status": "completed",
      "totalAmount": 950.00,
      "paymentMethod": "cash",
      "paymentStatus": "paid",
      "createdAt": "2026-09-03T14:50:00.000Z"
    },
    "payment": {
      "id": "pay-uuid",
      "method": "cash",
      "amount": 950.00,
      "cashReceived": 1000.00,
      "change": 50.00,
      "referenceNumber": null
    },
    "receipt": {
      "id": "rcp-uuid",
      "receiptNumber": "RCP-20260903-001",
      "issuedAt": "2026-09-03T14:50:00.000Z"
    },
    "items": [
      {
        "productId": "prod-liempo",
        "productName": "Pork Liempo",
        "weightKg": 2.50,
        "unitPrice": 380.00,
        "subtotal": 950.00
      }
    ]
  }
}
```
- **Error `400 Bad Request` (Insufficient Stock)**:
```json
{
  "error": {
    "message": "Insufficient stock for Pork Liempo. Requested: 50.00 kg, Available: 12.50 kg",
    "code": "INSUFFICIENT_STOCK",
    "details": {
      "productId": "prod-liempo",
      "productName": "Pork Liempo",
      "requestedKg": 50.00,
      "availableKg": 12.50
    }
  }
}
```

### `GET /api/v1/orders`
Retrieves order history with filters for date range, order number search, and customer.

- **Auth**: Required (`owner`, `staff`)
- **Query Parameters**:
  - `branchId` (optional)
  - `date` (optional, `YYYY-MM-DD`, defaults to today)
  - `search` (optional, matches order number or customer name)
  - `limit` (optional, default 50)
- **Response `200 OK`**:
```json
{
  "data": [
    {
      "id": "order-uuid",
      "orderNumber": "222222-20260903-001",
      "totalAmount": 950.00,
      "paymentMethod": "cash",
      "paymentStatus": "paid",
      "status": "completed",
      "createdAt": "2026-09-03T14:50:00.000Z",
      "customerName": "Walk-in Customer",
      "receiptNumber": "RCP-20260903-001",
      "itemsCount": 1
    }
  ]
}
```

### `GET /api/v1/orders/:id`
Retrieves full details for a specific order including items, payment, and receipt.

- **Auth**: Required (`owner`, `staff`)
- **Response `200 OK`**: Full order object matching the `POST /orders` response structure.

---

## 6. Customer Queue System

### `POST /api/v1/queue/tickets`
Issues a new queue ticket for a customer at a branch.

- **Auth**: None or Customer / Staff
- **Body**:
```json
{
  "branchId": "22222222-2222-2222-2222-222222222222",
  "customerName": "Maria Santos"
}
```
- **Response `201 Created`**:
```json
{
  "data": {
    "id": "ticket-uuid",
    "ticketNumber": "A-042",
    "branchId": "22222222-2222-2222-2222-222222222222",
    "customerName": "Maria Santos",
    "status": "waiting",
    "waitingAhead": 3,
    "createdAt": "2026-09-03T15:00:00.000Z"
  }
}
```

### `GET /api/v1/queue`
Retrieves the active queue board for a branch.

- **Auth**: None
- **Query Parameters**: `branchId`
- **Response `200 OK`**:
```json
{
  "data": {
    "nowServing": "A-039",
    "waitingTickets": [
      { "ticketNumber": "A-040", "status": "waiting" },
      { "ticketNumber": "A-041", "status": "waiting" },
      { "ticketNumber": "A-042", "status": "waiting" }
    ],
    "totalWaiting": 3
  }
}
```

### `PATCH /api/v1/queue/tickets/:id/status`
Updates ticket status (`calling`, `serving`, `completed`, `cancelled`).

- **Auth**: Required (`owner`, `staff`)
- **Body**:
```json
{
  "status": "serving"
}
```

---

## 7. Owner Analytics & Reports

### `GET /api/v1/reports/summary`
Retrieves sales performance, revenue, total orders, and low-stock alerts.

- **Auth**: Required (`owner`)
- **Query Parameters**:
  - `branchId` (optional)
  - `startDate` (optional, ISO date)
  - `endDate` (optional, ISO date)
- **Response `200 OK`**:
```json
{
  "data": {
    "totalSales": 28450.00,
    "totalOrders": 34,
    "averageOrderValue": 836.76,
    "lowStockCount": 2,
    "salesByPaymentMethod": {
      "cash": 18200.00,
      "gcash": 8450.00,
      "maya": 1800.00
    },
    "topProducts": [
      { "productId": "prod-liempo", "name": "Pork Liempo", "totalKg": 42.50, "revenue": 16150.00 }
    ]
  }
}
```
