/**
 * Order-related helper functions for generating order numbers,
 * calculating totals, and other order business logic
 */

export function generateOrderNumber(branchId, sequenceNumber, date = new Date()) {
  const branchCode = branchId.slice(-6).toUpperCase()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  const seqStr = String(sequenceNumber).padStart(3, '0')
  return `${branchCode}-${dateStr}-${seqStr}`
}

export function generateReceiptNumber(sequenceNumber, date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  const seqStr = String(sequenceNumber).padStart(3, '0')
  return `RCP-${dateStr}-${seqStr}`
}

export function generateQueueTicketNumber(sequenceNumber, prefix = 'A') {
  const seqStr = String(sequenceNumber).padStart(3, '0')
  return `${prefix}-${seqStr}`
}

export function calculateSubtotal(weightKg, pricePerKg) {
  if (!weightKg || !pricePerKg) return 0
  const subtotal = weightKg * pricePerKg
  return Math.round(subtotal * 100) / 100
}

export function calculateChange(total, cashReceived) {
  if (!cashReceived || cashReceived < total) return 0
  return Math.round((cashReceived - total) * 100) / 100
}

export function validateOrderRules({
  totalAmount,
  branchDailyOrders = 0,
  customerDailyOrders = 0,
  rules = {
    MIN_ORDER_AMOUNT: 50.0,
    MAX_ORDER_AMOUNT: 50000.0,
    MAX_DAILY_BRANCH_ORDERS: 500,
    MAX_DAILY_CUSTOMER_ORDERS: 10,
  },
}) {
  if (branchDailyOrders >= rules.MAX_DAILY_BRANCH_ORDERS) {
    return {
      isValid: false,
      code: 'DAILY_ORDER_LIMIT_REACHED',
      message: `Daily branch order limit of ${rules.MAX_DAILY_BRANCH_ORDERS} reached for today`,
    }
  }

  if (customerDailyOrders >= rules.MAX_DAILY_CUSTOMER_ORDERS) {
    return {
      isValid: false,
      code: 'CUSTOMER_DAILY_LIMIT_REACHED',
      message: `Daily customer order limit of ${rules.MAX_DAILY_CUSTOMER_ORDERS} reached for today`,
    }
  }

  if (totalAmount < rules.MIN_ORDER_AMOUNT) {
    return {
      isValid: false,
      code: 'ORDER_BELOW_MINIMUM',
      message: `Order total ₱${totalAmount.toFixed(2)} is below minimum ₱${rules.MIN_ORDER_AMOUNT.toFixed(2)}`,
    }
  }

  if (totalAmount > rules.MAX_ORDER_AMOUNT) {
    return {
      isValid: false,
      code: 'ORDER_EXCEEDS_MAXIMUM',
      message: `Order total ₱${totalAmount.toFixed(2)} exceeds maximum limit of ₱${rules.MAX_ORDER_AMOUNT.toFixed(2)}`,
    }
  }

  return { isValid: true, code: null, message: null }
}
