import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('Owner Reports & Analytics API', () => {
  let ctx
  let ownerToken
  let staffToken
  const branchId = '22222222-2222-2222-2222-222222222222'

  before(async () => {
    ctx = await setupTestApp()

    const ownerLogin = await ctx.request('POST', '/api/v1/auth/login', {
      body: { email: 'owner@test.com', password: 'Password123!' },
    })
    ownerToken = ownerLogin.body.data.token

    const staffLogin = await ctx.request('POST', '/api/v1/auth/login', {
      body: { email: 'staff@test.com', password: 'Password123!' },
    })
    staffToken = staffLogin.body.data.token

    // Create a completed order as staff
    await ctx.request('POST', '/api/v1/orders', {
      token: staffToken,
      body: {
        branchId,
        paymentMethod: 'gcash',
        paymentReference: 'GCASH-REF-12345',
        items: [
          { productId: 'prod-chicken-whole', weightKg: 2.0 }, // 2 * 220 = 440
        ],
      },
    })
  })

  after(async () => {
    await ctx.close()
  })

  test('GET /api/v1/reports/summary succeeds for owner', async () => {
    const res = await ctx.request('GET', '/api/v1/reports/summary', { token: ownerToken })

    assert.equal(res.status, 200)
    assert.ok(res.body.data)
    assert.ok(res.body.data.totalSales >= 440.00)
    assert.ok(res.body.data.totalOrders >= 1)
    assert.ok(res.body.data.salesByPaymentMethod)
    assert.ok(res.body.data.salesByPaymentMethod.gcash >= 440.00)
    assert.ok(Array.isArray(res.body.data.topProducts))
  })

  test('GET /api/v1/reports/summary returns 403 FORBIDDEN for staff', async () => {
    const res = await ctx.request('GET', '/api/v1/reports/summary', { token: staffToken })

    assert.equal(res.status, 403)
    assert.equal(res.body.error.code, 'FORBIDDEN')
  })
})
