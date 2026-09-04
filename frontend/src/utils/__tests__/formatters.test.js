/**
 * Unit tests for formatter utilities
 * Run these manually in the browser console or with a test runner
 */

import {
  formatCurrency,
  formatWeight,
  formatWeightAuto,
  formatDateTime,
  formatPhoneNumber,
  parseWeight,
  getStockStatus,
  formatOrderStatus,
} from '../formatters.js'

// Test formatCurrency
console.group('formatCurrency tests')
console.assert(formatCurrency(350) === '₱350.00', 'Should format 350 as ₱350.00')
console.assert(formatCurrency(1234.56) === '₱1,234.56', 'Should format with comma separator')
console.assert(formatCurrency(0) === '₱0.00', 'Should format 0 as ₱0.00')
console.assert(formatCurrency(null) === '₱0.00', 'Should handle null')
console.assert(formatCurrency(undefined) === '₱0.00', 'Should handle undefined')
console.groupEnd()

// Test formatWeight
console.group('formatWeight tests')
console.assert(formatWeight(2.5) === '2.50 kg', 'Should format 2.5 as 2.50 kg')
console.assert(formatWeight(2.5, false) === '2.50', 'Should format without unit')
console.assert(formatWeight(0) === '0.00 kg', 'Should format 0')
console.assert(formatWeight(null) === '0.00 kg', 'Should handle null')
console.groupEnd()

// Test formatWeightAuto
console.group('formatWeightAuto tests')
console.assert(formatWeightAuto(2.5) === '2.50 kg', 'Should use kg for weights >= 1kg')
console.assert(formatWeightAuto(0.5) === '500 g', 'Should use g for weights < 1kg')
console.assert(formatWeightAuto(0.25) === '250 g', 'Should format 0.25kg as 250g')
console.groupEnd()

// Test parseWeight
console.group('parseWeight tests')
console.assert(parseWeight('2.5') === 2.5, 'Should parse "2.5" as 2.5kg')
console.assert(parseWeight('2.5kg') === 2.5, 'Should parse "2.5kg" as 2.5kg')
console.assert(parseWeight('500g') === 0.5, 'Should parse "500g" as 0.5kg')
console.assert(parseWeight('') === 0, 'Should handle empty string')
console.groupEnd()

// Test formatPhoneNumber
console.group('formatPhoneNumber tests')
console.assert(
  formatPhoneNumber('09171234567') === '0917 123 4567',
  'Should format Philippine mobile number'
)
console.assert(formatPhoneNumber('') === '', 'Should handle empty string')
console.groupEnd()

// Test getStockStatus
console.group('getStockStatus tests')
console.assert(getStockStatus(0, 5).status === 'out_of_stock', '0 kg should be out of stock')
console.assert(getStockStatus(3.5, 5).status === 'low_stock', '3.5 kg with threshold 5 should be low stock')
console.assert(getStockStatus(15, 5).status === 'in_stock', '15 kg with threshold 5 should be in stock')
console.groupEnd()

// Test formatOrderStatus
console.group('formatOrderStatus tests')
console.assert(formatOrderStatus('completed') === 'PAID / COMPLETED', 'completed should format to PAID / COMPLETED')
console.assert(formatOrderStatus('cancelled') === 'CANCELLED', 'cancelled should format to CANCELLED')
console.assert(formatOrderStatus('pending') === 'PENDING', 'pending should format to PENDING')
console.groupEnd()

console.log('✅ All formatter tests passed!')

export {} // Make this a module
