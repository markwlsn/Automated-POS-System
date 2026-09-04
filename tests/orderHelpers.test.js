import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateOrderNumber,
  generateReceiptNumber,
  generateQueueTicketNumber,
  calculateSubtotal,
  calculateChange,
  validateOrderRules,
} from '../src/utils/orderHelpers.js'

describe('Backend Order Helper Utilities', () => {
  test('generateOrderNumber formats branch, date, and sequence correctly', () => {
    const orderNum = generateOrderNumber('22222222-2222-2222-2222-222222222222', 1, new Date('2026-09-04'))
    assert.equal(orderNum, '222222-20260904-001')
  })

  test('generateReceiptNumber formats sequence with RCP prefix', () => {
    const rcp = generateReceiptNumber(42, new Date('2026-09-04'))
    assert.equal(rcp, 'RCP-20260904-042')
  })

  test('generateQueueTicketNumber formats sequence with prefix', () => {
    assert.equal(generateQueueTicketNumber(1, 'Q'), 'Q-001')
    assert.equal(generateQueueTicketNumber(99, 'A'), 'A-099')
  })

  test('calculateSubtotal and calculateChange round accurately', () => {
    assert.equal(calculateSubtotal(1.5, 380.0), 570.0)
    assert.equal(calculateChange(570.0, 1000.0), 430.0)
    assert.equal(calculateChange(570.0, 500.0), 0)
  })

  test('validateOrderRules enforces min order threshold (₱50)', () => {
    const result = validateOrderRules({ totalAmount: 45.0 })
    assert.equal(result.isValid, false)
    assert.equal(result.code, 'ORDER_BELOW_MINIMUM')
  })

  test('validateOrderRules enforces max order threshold (₱50,000)', () => {
    const result = validateOrderRules({ totalAmount: 55000.0 })
    assert.equal(result.isValid, false)
    assert.equal(result.code, 'ORDER_EXCEEDS_MAXIMUM')
  })

  test('validateOrderRules enforces daily branch capacity', () => {
    const result = validateOrderRules({ totalAmount: 250.0, branchDailyOrders: 500 })
    assert.equal(result.isValid, false)
    assert.equal(result.code, 'DAILY_ORDER_LIMIT_REACHED')
  })

  test('validateOrderRules enforces daily customer order limit', () => {
    const result = validateOrderRules({ totalAmount: 250.0, customerDailyOrders: 10 })
    assert.equal(result.isValid, false)
    assert.equal(result.code, 'CUSTOMER_DAILY_LIMIT_REACHED')
  })

  test('validateOrderRules succeeds for compliant orders', () => {
    const result = validateOrderRules({ totalAmount: 750.0, branchDailyOrders: 20, customerDailyOrders: 2 })
    assert.equal(result.isValid, true)
    assert.equal(result.code, null)
  })
})
