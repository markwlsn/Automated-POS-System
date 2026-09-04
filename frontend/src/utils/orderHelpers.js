/**
 * Order-related helper functions for generating order numbers,
 * calculating totals, and other order business logic
 */

/**
 * Generate a unique order number in format: BRANCH-YYYYMMDD-SEQ
 * @param {string} branchId - UUID of the branch
 * @param {number} sequenceNumber - Sequential number for the day (1, 2, 3, ...)
 * @returns {string} Generated order number (e.g., "BRANCH-20260813-001")
 */
export function generateOrderNumber(branchId, sequenceNumber) {
  // Use last 6 chars of branch UUID as identifier
  const branchCode = branchId.slice(-6).toUpperCase()
  
  // Format date as YYYYMMDD
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  
  // Format sequence number with leading zeros (001, 002, etc.)
  const seqStr = String(sequenceNumber).padStart(3, '0')
  
  return `${branchCode}-${dateStr}-${seqStr}`
}

/**
 * Generate a unique receipt number in format: RCP-YYYYMMDD-SEQ
 * @param {number} sequenceNumber - Sequential number for the day
 * @returns {string} Generated receipt number (e.g., "RCP-20260813-001")
 */
export function generateReceiptNumber(sequenceNumber) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  
  const seqStr = String(sequenceNumber).padStart(3, '0')
  
  return `RCP-${dateStr}-${seqStr}`
}

/**
 * Calculate subtotal for an order item
 * @param {number} weightKg - Weight in kilograms
 * @param {number} pricePerKg - Price per kilogram
 * @returns {number} Subtotal rounded to 2 decimal places
 */
export function calculateSubtotal(weightKg, pricePerKg) {
  if (!weightKg || !pricePerKg) return 0
  const subtotal = weightKg * pricePerKg
  return Math.round(subtotal * 100) / 100
}

/**
 * Calculate total amount from cart items
 * @param {Array} cartItems - Array of cart items with subtotal property
 * @returns {number} Total amount
 */
export function calculateCartTotal(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return 0
  
  const total = cartItems.reduce((sum, item) => {
    return sum + (item.subtotal || 0)
  }, 0)
  
  return Math.round(total * 100) / 100
}

/**
 * Calculate total weight from cart items
 * @param {Array} cartItems - Array of cart items with weight_kg property
 * @returns {number} Total weight in kilograms
 */
export function calculateTotalWeight(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return 0
  
  const totalWeight = cartItems.reduce((sum, item) => {
    return sum + (item.weight_kg || 0)
  }, 0)
  
  return Math.round(totalWeight * 100) / 100
}

/**
 * Calculate change for cash payment
 * @param {number} total - Order total amount
 * @param {number} cashReceived - Cash amount received from customer
 * @returns {number} Change amount (0 if insufficient)
 */
export function calculateChange(total, cashReceived) {
  if (!cashReceived || cashReceived < total) return 0
  const change = cashReceived - total
  return Math.round(change * 100) / 100
}

/**
 * Validate if cash received is sufficient
 * @param {number} total - Order total amount
 * @param {number} cashReceived - Cash amount received from customer
 * @returns {boolean} True if sufficient, false otherwise
 */
export function isCashSufficient(total, cashReceived) {
  return cashReceived >= total
}

/**
 * Get today's date range for filtering (start and end of day)
 * @returns {Object} Object with startDate and endDate as ISO strings
 */
export function getTodayDateRange() {
  const now = new Date()
  
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

/**
 * Get date range for filtering (start and end of specific date)
 * @param {Date} date - The date to get range for
 * @returns {Object} Object with startDate and endDate as ISO strings
 */
export function getDateRange(date) {
  const d = new Date(date)
  
  const startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
  const endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

/**
 * Check if inventory is sufficient for an order
 * @param {Array} cartItems - Cart items with product_id and weight_kg
 * @param {Array} inventory - Inventory records with product_id and stock_kg
 * @returns {Object} { sufficient: boolean, insufficientItems: Array }
 */
export function checkInventorySufficiency(cartItems, inventory) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { sufficient: true, insufficientItems: [] }
  }

  const insufficientItems = []
  const invList = Array.isArray(inventory) ? inventory : []

  // Aggregate cart weights per product to validate cumulative demand
  const requiredWeights = new Map()
  for (const item of cartItems) {
    const productId = item.productId || item.product_id || item.product?.id
    const weight = Number(item.weightKg ?? item.weight_kg ?? 0)
    const productName = item.productName || item.product?.name || 'Product'

    if (!productId) continue

    if (requiredWeights.has(productId)) {
      const existing = requiredWeights.get(productId)
      existing.weight += weight
    } else {
      requiredWeights.set(productId, { productId, productName, weight })
    }
  }

  for (const [productId, req] of requiredWeights.entries()) {
    const stockRecord = invList.find(
      inv => (inv.productId || inv.product_id) === productId
    )

    const available = Number(stockRecord?.stockKg ?? stockRecord?.stock_kg ?? 0)

    if (req.weight > available) {
      insufficientItems.push({
        productId,
        productName: req.productName,
        required: req.weight,
        available,
      })
    }
  }

  return {
    sufficient: insufficientItems.length === 0,
    insufficientItems,
  }
}
