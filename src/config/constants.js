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
  INTERNAL_ERROR: 'INTERNAL_ERROR',
}
