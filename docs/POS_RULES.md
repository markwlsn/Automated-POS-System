# POS Operational Rules & Store Policies

This document specifies the operational rules, transaction limits, and safety boundaries enforced across the Automated POS System.

---

## 1. Store Constraints Summary

| Parameter | Default Value | Code Identifier | Description |
| :--- | :--- | :--- | :--- |
| **Minimum Order Value** | **₱50.00** | `MIN_ORDER_AMOUNT` | Minimum cart subtotal required to proceed to payment |
| **Maximum Order Value** | **₱50,000.00** | `MAX_ORDER_AMOUNT` | Maximum purchase limit per single transaction |
| **Daily Branch Capacity** | **500 orders/day** | `MAX_DAILY_BRANCH_ORDERS` | Maximum daily tickets allowed per physical branch |
| **Customer Daily Limit** | **10 orders/day** | `MAX_DAILY_CUSTOMER_ORDERS` | Maximum daily orders allowed per registered customer |
| **Minimum Cut Weight** | **0.05 kg (50g)** | `MIN_ITEM_WEIGHT_KG` | Minimum weight measurable per line item on meat scale |
| **Maximum Cut Weight** | **100.0 kg** | `MAX_ITEM_WEIGHT_KG` | Maximum single item entry limit |

---

## 2. Enforcement Mechanisms

### Backend Layer
1. **Schema Validation (`src/routes/schemas.js`)**:
   - `orderItemSchema`: Enforces `weightKg` between `0.05` and `100.0`.
2. **Service Validation (`src/services/order.service.js`)**:
   - Rejects invalid item weights with `INVALID_ITEM_WEIGHT` (HTTP 400).
3. **Repository Transaction Guard (`src/repositories/order.repository.js`)**:
   - Rejects orders below ₱50.00 with `ORDER_BELOW_MINIMUM` (HTTP 400).
   - Rejects orders above ₱50,000.00 with `ORDER_EXCEEDS_MAXIMUM` (HTTP 400).
   - Rejects orders exceeding branch capacity with `DAILY_ORDER_LIMIT_REACHED` (HTTP 400).
   - Rejects orders exceeding customer limit with `CUSTOMER_DAILY_LIMIT_REACHED` (HTTP 400).

### Frontend Layer
1. **Cart Checkout (`frontend/src/components/CartSummary.jsx`)**:
   - Displays warning notice if total < ₱50.00 with remaining amount required.
   - Disables button and changes text to `Min. Order ₱50.00 Required`.
   - Displays warning notice if total > ₱50,000.00.
