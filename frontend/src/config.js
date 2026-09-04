// This app instance is currently wired to a single dummy shop for demo purposes.
// When this becomes a real multi-tenant product, this gets replaced by
// subdomain/URL-based shop resolution instead of a hardcoded constant.

export const CURRENT_SHOP_ID = '11111111-1111-1111-1111-111111111111' // Dela Cruz Meat Shop
export const CURRENT_BRANCH_ID = '22222222-2222-2222-2222-222222222222' // Main Branch - Poblacion

export const ORDER_RULES = {
  MIN_ORDER_AMOUNT: 50.0,
  MAX_ORDER_AMOUNT: 50000.0,
  MAX_DAILY_BRANCH_ORDERS: 500,
  MAX_DAILY_CUSTOMER_ORDERS: 10,
  MIN_ITEM_WEIGHT_KG: 0.05,
  MAX_ITEM_WEIGHT_KG: 100.0,
}
