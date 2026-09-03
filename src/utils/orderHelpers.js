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
