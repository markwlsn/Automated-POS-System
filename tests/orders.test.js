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

  test('GET /api/v1/orders/rules returns standard POS shop limits', async () => {
    const res = await ctx.request('GET', '/api/v1/orders/rules')
    assert.equal(res.status, 200)
    assert.equal(res.body.data.MIN_ORDER_AMOUNT, 50.0)
    assert.equal(res.body.data.MAX_ORDER_AMOUNT, 50000.0)
    assert.equal(res.body.data.MAX_DAILY_BRANCH_ORDERS, 500)
    assert.equal(res.body.data.MAX_DAILY_CUSTOMER_ORDERS, 10)
    assert.equal(res.body.data.MIN_ITEM_WEIGHT_KG, 0.05)
    assert.equal(res.body.data.MAX_ITEM_WEIGHT_KG, 100.0)
  })

  test('POST /api/v1/orders rejects order if total is below MIN_ORDER_AMOUNT (₱50)', async () => {
    // Pork Chop is ₱350/kg. 0.1 kg is ₱35.00 < ₱50.00
    const res = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'cash',
        cashReceived: 50.00,
        items: [
          {
            productId: 'prod-pork-chop',
            weightKg: 0.1, // ₱35.00
          },
        ],
      },
    })

    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'ORDER_BELOW_MINIMUM')
  })

  test('POST /api/v1/orders rejects order if item weight is below MIN_ITEM_WEIGHT_KG (0.05 kg)', async () => {
    const res = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'cash',
        cashReceived: 100.00,
        items: [
          {
            productId: 'prod-pork-chop',
            weightKg: 0.02, // 20g < 50g
          },
        ],
      },
    })

    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
  })

  test('POST /api/v1/orders rejects order when daily customer order limit is reached', async () => {
    // Get customer account id
    const customerLogin = await ctx.request('POST', '/api/v1/auth/login', {
      body: { email: 'customer@test.com', password: 'Password123!' },
    })
    const customerId = customerLogin.body.data.user.id

    // Insert 10 mock completed orders for this customer today
    const db = ctx.db
    for (let i = 0; i < 10; i++) {
      db.prepare(`
        INSERT INTO orders (
          id, shop_id, branch_id, customer_id, created_by, order_number,
          order_type, fulfillment_type, status, total_amount, payment_method, payment_status, created_at
        ) VALUES (
          ?, '11111111-1111-1111-1111-111111111111', ?, ?, ?, ?,
          'walk_in', 'pickup', 'completed', 100.00, 'cash', 'paid', datetime('now')
        )
      `).run(
        `mock-cust-order-${i}-${Date.now()}`,
        branchId,
        customerId,
        customerId,
        `ORD-MOCK-CUST-${i}-${Date.now()}`
      )
    }

    const res = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        customerId,
        paymentMethod: 'cash',
        cashReceived: 500.00,
        items: [
          {
            productId: 'prod-pork-chop',
            weightKg: 1.0,
          },
        ],
      },
    })

    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'CUSTOMER_DAILY_LIMIT_REACHED')
  })

  test('POST /api/v1/orders rejects order if total exceeds MAX_ORDER_AMOUNT (₱50,000)', async () => {
    // Temporarily increase stock of ribeye (₱650/kg) to 100kg
    ctx.db.prepare('UPDATE inventory SET stock_kg = 100 WHERE product_id = ? AND branch_id = ?')
      .run('prod-beef-ribeye', branchId)

    // 80 kg * 650 = ₱52,000.00 > ₱50,000.00
    const res = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'cash',
        cashReceived: 60000.00,
        items: [
          {
            productId: 'prod-beef-ribeye',
            weightKg: 80.0,
          },
        ],
      },
    })

    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'ORDER_EXCEEDS_MAXIMUM')
  })

  test('POST /api/v1/orders rejects order when daily branch order limit is reached', async () => {
    // Insert 500 mock orders for branch today
    const db = ctx.db
    const insertStmt = db.prepare(`
      INSERT INTO orders (
        id, shop_id, branch_id, customer_id, created_by, order_number,
        order_type, fulfillment_type, status, total_amount, payment_method, payment_status, created_at
      ) VALUES (
        ?, '11111111-1111-1111-1111-111111111111', ?, NULL, NULL, ?,
        'walk_in', 'pickup', 'completed', 100.00, 'cash', 'paid', datetime('now')
      )
    `)

    db.exec('BEGIN TRANSACTION;')
    for (let i = 0; i < 500; i++) {
      insertStmt.run(
        `mock-branch-order-${i}-${Date.now()}`,
        branchId,
        `ORD-MOCK-BRANCH-${i}-${Date.now()}`
      )
    }
    db.exec('COMMIT;')

    const res = await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'cash',
        cashReceived: 500.00,
        items: [
          {
            productId: 'prod-pork-chop',
            weightKg: 1.0,
          },
        ],
      },
    })

    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'DAILY_ORDER_LIMIT_REACHED')
  })
})
