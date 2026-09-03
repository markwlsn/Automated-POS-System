import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('Orders & Checkout POS API', () => {
  let ctx
  let staffToken
  const branchId = '22222222-2222-2222-2222-222222222222'

  before(async () => {
    ctx = await setupTestApp()

    const staffLogin = await ctx.request('POST', '/api/v1/auth/login', {
      body: { email: 'staff@test.com', password: 'Password123!' },
    })
    staffToken = staffLogin.body.data.token
  })

  after(async () => {
    await ctx.close()
  })

  test('POST /api/v1/orders completes transaction, deducts inventory, and returns receipt', async () => {
    // Check initial stock for Pork Chop (price 350/kg, stock 25.0 kg)
    const initialInv = await ctx.request('GET', '/api/v1/inventory', { token: staffToken })
    const porkChopBefore = initialInv.body.data.find(i => i.productId === 'prod-pork-chop')
    const stockBefore = porkChopBefore.stockKg

    const orderRes = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'cash',
        cashReceived: 1000.00,
        items: [
          {
            productId: 'prod-pork-chop',
            weightKg: 2.0, // 2.0 * 350 = 700.00
          },
        ],
      },
    })

    assert.equal(orderRes.status, 201)
    assert.ok(orderRes.body.data)

    const { order, payment, receipt, items } = orderRes.body.data
    assert.ok(order.orderNumber)
    assert.ok(order.orderNumber.includes('-2026'))
    assert.equal(order.totalAmount, 700.00)
    assert.equal(order.status, 'completed')

    // Verify payment & change
    assert.equal(payment.amount, 700.00)
    assert.equal(payment.cashReceived, 1000.00)
    assert.equal(payment.change, 300.00)

    // Verify receipt
    assert.ok(receipt.receiptNumber)
    assert.ok(receipt.receiptNumber.startsWith('RCP-'))

    // Verify items
    assert.equal(items.length, 1)
    assert.equal(items[0].weightKg, 2.0)
    assert.equal(items[0].subtotal, 700.00)

    // Verify atomic inventory deduction in database
    const afterInv = await ctx.request('GET', '/api/v1/inventory', { token: staffToken })
    const porkChopAfter = afterInv.body.data.find(i => i.productId === 'prod-pork-chop')
    assert.equal(porkChopAfter.stockKg, stockBefore - 2.0)
  })

  test('POST /api/v1/orders rejects order if stock is insufficient and rolls back', async () => {
    // Current stock of beef ribeye is 15.0 kg
    const initialInv = await ctx.request('GET', '/api/v1/inventory', { token: staffToken })
    const ribeyeBefore = initialInv.body.data.find(i => i.productId === 'prod-beef-ribeye')
    const stockBefore = ribeyeBefore.stockKg

    const res = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'cash',
        cashReceived: 50000.00,
        items: [
          {
            productId: 'prod-beef-ribeye',
            weightKg: 50.0, // Exceeds available 15.0 kg
          },
        ],
      },
    })

    assert.equal(res.status, 400)
    assert.ok(res.body.error)
    assert.equal(res.body.error.code, 'INSUFFICIENT_STOCK')

    // Confirm inventory was NOT changed
    const afterInv = await ctx.request('GET', '/api/v1/inventory', { token: staffToken })
    const ribeyeAfter = afterInv.body.data.find(i => i.productId === 'prod-beef-ribeye')
    assert.equal(ribeyeAfter.stockKg, stockBefore)
  })

  test('POST /api/v1/orders rejects cash payment if cashReceived is less than total', async () => {
    const res = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'cash',
        cashReceived: 100.00, // Insufficient for 1kg of Chicken Breast (₱250)
        items: [
          {
            productId: 'prod-chicken-breast',
            weightKg: 1.0,
          },
        ],
      },
    })

    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'INSUFFICIENT_PAYMENT')
  })

  test('GET /api/v1/orders returns order history with search', async () => {
    const res = await ctx.request('GET', '/api/v1/orders', { token: staffToken })

    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.ok(res.body.data.length >= 1)

    const firstOrder = res.body.data[0]
    assert.ok(firstOrder.orderNumber)
    assert.ok(firstOrder.receiptNumber)

    // Search by order number
    const searchRes = await ctx.request(
      'GET',
      `/api/v1/orders?search=${firstOrder.orderNumber.slice(-3)}`,
      { token: staffToken }
    )
    assert.equal(searchRes.status, 200)
    assert.ok(searchRes.body.data.some(o => o.orderNumber === firstOrder.orderNumber))
  })
})
