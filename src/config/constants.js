export const ROLES = {
  OWNER: 'owner',
  STAFF: 'staff',
  CUSTOMER: 'customer',
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const PAYMENT_METHODS = {
  CASH: 'cash',
  GCASH: 'gcash',
  MAYA: 'maya',
  BANK_TRANSFER: 'bank_transfer',
}

export const QUEUE_STATUS = {
  WAITING: 'waiting',
  CALLING: 'calling',
  SERVING: 'serving',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INSUFFICIENT_PAYMENT: 'INSUFFICIENT_PAYMENT',
  ORDER_BELOW_MINIMUM: 'ORDER_BELOW_MINIMUM',
  ORDER_EXCEEDS_MAXIMUM: 'ORDER_EXCEEDS_MAXIMUM',
  DAILY_ORDER_LIMIT_REACHED: 'DAILY_ORDER_LIMIT_REACHED',
  CUSTOMER_DAILY_LIMIT_REACHED: 'CUSTOMER_DAILY_LIMIT_REACHED',
  INVALID_ITEM_WEIGHT: 'INVALID_ITEM_WEIGHT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
}

export const ORDER_RULES = {
  MIN_ORDER_AMOUNT: 50.0, // Minimum order amount in PHP
  MAX_ORDER_AMOUNT: 50000.0, // Maximum order amount in PHP
  MAX_DAILY_BRANCH_ORDERS: 500, // Maximum orders per day for a single branch
  MAX_DAILY_CUSTOMER_ORDERS: 10, // Maximum orders per day for a registered customer
  MIN_ITEM_WEIGHT_KG: 0.05, // 50 grams
  MAX_ITEM_WEIGHT_KG: 100.0, // 100 kg
}
