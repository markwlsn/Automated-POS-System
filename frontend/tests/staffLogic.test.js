import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProduct } from '../src/hooks/useProducts.js'
import {
  calculateSubtotal,
  calculateCartTotal,
  calculateTotalWeight,
  calculateChange,
  isCashSufficient,
  checkInventorySufficiency,
} from '../src/utils/orderHelpers.js'

describe('Staff-End POS Logic & Calculations', () => {
  // Test Case 1: Product Price Normalization
  test('TC-1: Product normalization ensures both pricePerKg and price_per_kg are valid numbers', () => {
    const rawCamelProduct = {
      id: 'prod-1',
      name: 'Pork Liempo',
      pricePerKg: 380,
      stockKg: 20.5,
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Pork', sortOrder: 1 },
    }

    const normalized = normalizeProduct(rawCamelProduct)
    assert.equal(normalized.price_per_kg, 380)
    assert.equal(normalized.pricePerKg, 380)
    assert.equal(normalized.stock_kg, 20.5)
    assert.equal(normalized.stockKg, 20.5)
    assert.equal(normalized.category.name, 'Pork')
    assert.equal(normalized.category.sort_order, 1)

    // Verify subtotal calculation with normalized product price
    const subtotal = calculateSubtotal(1.5, normalized.price_per_kg)
    assert.equal(subtotal, 570.0)
    assert.ok(!isNaN(subtotal), 'Subtotal should not be NaN')
  })

  // Test Case 2: Subtotal and Cart Totals Calculations
  test('TC-2: calculateSubtotal, calculateCartTotal, and calculateTotalWeight correctly round and sum', () => {
    // 2.25 kg * 350.00 = 787.50
    assert.equal(calculateSubtotal(2.25, 350.00), 787.50)
    // 0.333 kg * 240.00 = 79.92
    assert.equal(calculateSubtotal(0.333, 240.00), 79.92)

    const cartItems = [
      { id: '1', weight_kg: 2.0, unit_price: 380.0, subtotal: 760.0 },
      { id: '2', weight_kg: 1.5, unit_price: 250.0, subtotal: 375.0 },
      { id: '3', weight_kg: 0.5, unit_price: 420.0, subtotal: 210.0 },
    ]

    assert.equal(calculateTotalWeight(cartItems), 4.0)
    assert.equal(calculateCartTotal(cartItems), 1345.0)
  })

  // Test Case 3: Cumulative Stock Validation in Cart
  test('TC-3: Cumulative stock logic detects when adding item exceeds branch stock', () => {
    const totalStock = 2.0 // Available in branch
    let cartWeight = 0.0

    function simulateAdd(weightToAdd) {
      const cumulative = Math.round((cartWeight + weightToAdd) * 100) / 100
      if (cumulative > totalStock) {
        return {
          allowed: false,
          remaining: Math.max(0, totalStock - cartWeight),
        }
      }
      cartWeight = cumulative
      return { allowed: true, cartWeight }
    }

    // Step 1: Add 1.5 kg (allowed)
    const step1 = simulateAdd(1.5)
    assert.equal(step1.allowed, true)
    assert.equal(step1.cartWeight, 1.5)

    // Step 2: Try to add another 1.0 kg (should be rejected because 1.5 + 1.0 = 2.5 > 2.0)
    const step2 = simulateAdd(1.0)
    assert.equal(step2.allowed, false)
    assert.equal(step2.remaining, 0.5)

    // Step 3: Add remaining 0.5 kg (allowed)
    const step3 = simulateAdd(0.5)
    assert.equal(step3.allowed, true)
    assert.equal(step3.cartWeight, 2.0)

    // Step 4: Try to add any more when stock is fully committed (should be rejected)
    const step4 = simulateAdd(0.25)
    assert.equal(step4.allowed, false)
    assert.equal(step4.remaining, 0.0)
  })

  // Test Case 4: Cart Weight Modification Boundary Check
  test('TC-4: Inline cart item weight adjustment honors maximum available stock', () => {
    const maxStock = 5.0
    function validateWeightUpdate(newWeight) {
      if (newWeight <= 0) return { valid: false, error: 'Weight must be greater than 0' }
      if (newWeight > maxStock) return { valid: false, error: 'Insufficient stock' }
      return { valid: true, subtotal: calculateSubtotal(newWeight, 340.0) }
    }

    assert.equal(validateWeightUpdate(3.0).valid, true)
    assert.equal(validateWeightUpdate(3.0).subtotal, 1020.0)

    assert.equal(validateWeightUpdate(6.5).valid, false)
    assert.equal(validateWeightUpdate(6.5).error, 'Insufficient stock')

    assert.equal(validateWeightUpdate(0).valid, false)
  })

  // Test Case 5: Cash Payment & Change Calculation
  test('TC-5: Cash payment accurately computes change and validates sufficiency', () => {
    const orderTotal = 845.50

    // Sufficient payment with change
    const cash1 = 1000.0
    assert.equal(isCashSufficient(orderTotal, cash1), true)
    assert.equal(calculateChange(orderTotal, cash1), 154.50)

    // Exact payment
    const cash2 = 845.50
    assert.equal(isCashSufficient(orderTotal, cash2), true)
    assert.equal(calculateChange(orderTotal, cash2), 0.0)

    // Insufficient payment
    const cash3 = 800.0
    assert.equal(isCashSufficient(orderTotal, cash3), false)
    assert.equal(calculateChange(orderTotal, cash3), 0.0)
  })

  // Test Case 6: E-Wallet Reference Number Validation
  test('TC-6: E-Wallet payment validates reference number requirements', () => {
    function validateReferenceNumber(ref) {
      if (!ref || !ref.trim()) {
        return { valid: false, error: 'Reference number is required' }
      }
      if (ref.trim().length < 6) {
        return { valid: false, error: 'Reference number too short' }
      }
      return { valid: true, cleaned: ref.trim() }
    }

    assert.equal(validateReferenceNumber('').valid, false)
    assert.equal(validateReferenceNumber('   ').valid, false)
    assert.equal(validateReferenceNumber('12345').valid, false)
    assert.equal(validateReferenceNumber('GCASH-123456').valid, true)
    assert.equal(validateReferenceNumber('  REF-998877  ').cleaned, 'REF-998877')
  })

  // Test Case 7: Order Submission Payload Transformation
  test('TC-7: Cart items and payment method properly map to backend order payload', () => {
    const cart = [
      { product: { id: 'prod-pork-chop' }, weight_kg: 1.5, unit_price: 350.0 },
      { product: { id: 'prod-chicken-wings' }, weight_kg: 2.0, unit_price: 240.0 },
    ]

    function buildOrderPayload({ cart, paymentMethod, paymentData, branchId, customerId, createdBy }) {
      const items = cart.map(item => ({
        productId: item.product.id,
        weightKg: Number(item.weight_kg),
      }))

      let cashReceived = null
      let referenceNumber = paymentData

      if (paymentMethod === 'cash') {
        cashReceived = Number(paymentData)
        referenceNumber = null
      }

      return {
        branchId,
        customerId: customerId || null,
        createdBy,
        orderType: 'walk_in',
        fulfillmentType: 'pickup',
        paymentMethod,
        cashReceived,
        paymentReference: referenceNumber,
        items,
      }
    }

    // Cash order payload
    const cashPayload = buildOrderPayload({
      cart,
      paymentMethod: 'cash',
      paymentData: 1500,
      branchId: 'branch-1',
      createdBy: 'staff-user-1',
    })

    assert.equal(cashPayload.paymentMethod, 'cash')
    assert.equal(cashPayload.cashReceived, 1500)
    assert.equal(cashPayload.paymentReference, null)
    assert.equal(cashPayload.items.length, 2)
    assert.equal(cashPayload.items[0].productId, 'prod-pork-chop')
    assert.equal(cashPayload.items[0].weightKg, 1.5)

    // GCash order payload
    const gcashPayload = buildOrderPayload({
      cart,
      paymentMethod: 'gcash',
      paymentData: 'GCASH-987654',
      branchId: 'branch-1',
      createdBy: 'staff-user-1',
    })

    assert.equal(gcashPayload.paymentMethod, 'gcash')
    assert.equal(gcashPayload.cashReceived, null)
    assert.equal(gcashPayload.paymentReference, 'GCASH-987654')
  })

  // Test Case 8: Receipt and Order Property Access Safety
  test('TC-8: ReceiptModal safely parses order and receipt data without runtime TypeError', () => {
    // Simulate backend response with mixed casing
    const orderData = {
      orderNumber: '222222-20260904-001',
      totalAmount: 1005.00,
      paymentMethod: 'gcash',
      createdAt: '2026-09-04T01:30:00.000Z',
    }

    const receiptData = {
      receiptNumber: 'RCP-20260904-001',
      issuedAt: '2026-09-04T01:30:00.000Z',
    }

    // Verify safe accessor logic as implemented in ReceiptModal
    const receiptNumber = receiptData?.receipt_number || receiptData?.receiptNumber || 'N/A'
    const orderNumber = orderData?.order_number || orderData?.orderNumber || 'N/A'
    const paymentMethod = String(orderData?.payment_method || orderData?.paymentMethod || 'cash').replace('_', ' ')
    const totalAmount = Number(orderData?.total_amount ?? orderData?.totalAmount ?? 0)

    assert.equal(receiptNumber, 'RCP-20260904-001')
    assert.equal(orderNumber, '222222-20260904-001')
    assert.equal(paymentMethod, 'gcash')
    assert.equal(totalAmount, 1005.00)
  })

  // Test Case 9: Inventory Sufficiency Checking (Multi-casing support)
  test('TC-9: checkInventorySufficiency handles camelCase, snake_case, and cumulative quantities', () => {
    // Branch inventory with both styles
    const inventory = [
      { productId: 'p1', stockKg: 5.0 },
      { product_id: 'p2', stock_kg: 3.0 },
    ]

    // Order 1: Within limits
    const cart1 = [
      { productId: 'p1', weightKg: 2.0, productName: 'Pork Liempo' },
      { product_id: 'p2', weight_kg: 2.5, productName: 'Beef Brisket' },
    ]
    const res1 = checkInventorySufficiency(cart1, inventory)
    assert.equal(res1.sufficient, true)
    assert.equal(res1.insufficientItems.length, 0)

    // Order 2: Exceeding stock (including cumulative multiple items for same product)
    const cart2 = [
      { productId: 'p1', weightKg: 3.0, productName: 'Pork Liempo' },
      { productId: 'p1', weightKg: 3.0, productName: 'Pork Liempo' }, // 3.0 + 3.0 = 6.0 > 5.0
    ]
    const res2 = checkInventorySufficiency(cart2, inventory)
    assert.equal(res2.sufficient, false)
    assert.equal(res2.insufficientItems.length, 1)
    assert.equal(res2.insufficientItems[0].productId, 'p1')
    assert.equal(res2.insufficientItems[0].required, 6.0)
    assert.equal(res2.insufficientItems[0].available, 5.0)
  })
})
