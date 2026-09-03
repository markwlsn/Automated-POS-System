/**
 * Formatting utilities for currency, weight, dates, etc.
 */

/**
 * Format a number as Philippine Peso currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "₱350.00")
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₱0.00'
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format weight in kilograms
 * @param {number} weightKg - Weight in kilograms
 * @param {boolean} showUnit - Whether to include the 'kg' unit (default: true)
 * @returns {string} Formatted weight string (e.g., "2.50 kg" or "2.50")
 */
export function formatWeight(weightKg, showUnit = true) {
  if (weightKg == null || isNaN(weightKg)) return showUnit ? '0.00 kg' : '0.00'
  
  const formatted = Number(weightKg).toFixed(2)
  return showUnit ? `${formatted} kg` : formatted
}

/**
 * Format weight with automatic unit selection (kg or g)
 * Uses grams for weights less than 1kg
 * @param {number} weightKg - Weight in kilograms
 * @returns {string} Formatted weight string (e.g., "2.50 kg" or "500 g")
 */
export function formatWeightAuto(weightKg) {
  if (weightKg == null || isNaN(weightKg)) return '0 g'
  
  if (weightKg < 1) {
    const grams = Math.round(weightKg * 1000)
    return `${grams} g`
  }
  
  return formatWeight(weightKg, true)
}

/**
 * Format date and time for display
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'full', 'date', 'time' (default: 'full')
 * @returns {string} Formatted date string
 */
export function formatDateTime(date, format = 'full') {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  const dateOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
  
  switch (format) {
    case 'date':
      return new Intl.DateTimeFormat('en-PH', dateOptions).format(d)
    case 'time':
      return new Intl.DateTimeFormat('en-PH', timeOptions).format(d)
    case 'full':
    default:
      return new Intl.DateTimeFormat('en-PH', {
        ...dateOptions,
        ...timeOptions,
      }).format(d)
  }
}

/**
 * Format a phone number for display
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return ''
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '')
  
  // Format as Philippine mobile number (09XX XXX XXXX)
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  
  // Return as-is if not a standard format
  return phoneNumber
}

/**
 * Parse a weight string to number
 * @param {string} weightStr - Weight string (e.g., "2.5", "2.5kg", "500g")
 * @returns {number} Weight in kilograms
 */
export function parseWeight(weightStr) {
  if (!weightStr || typeof weightStr !== 'string') return 0
  
  // Remove spaces and convert to lowercase
  const cleaned = weightStr.trim().toLowerCase()
  
  // Check if it's in grams
  if (cleaned.endsWith('g') && !cleaned.endsWith('kg')) {
    const grams = parseFloat(cleaned)
    return isNaN(grams) ? 0 : grams / 1000
  }
  
  // Parse as kilograms (with or without 'kg' suffix)
  const kg = parseFloat(cleaned)
  return isNaN(kg) ? 0 : kg
}
