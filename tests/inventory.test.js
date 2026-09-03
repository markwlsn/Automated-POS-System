import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('Inventory API', () => {
  let ctx
  let staffToken

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

  test('GET /api/v1/inventory returns stock levels for branch', async () => {
    const res = await ctx.request('GET', '/api/v1/inventory', { token: staffToken })

    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.ok(res.body.data.length >= 10)

    const kasim = res.body.data.find(i => i.productId === 'prod-pork-kasim')
    assert.ok(kasim)
    assert.ok(typeof kasim.stockKg === 'number')
    assert.ok(kasim.stockKg > 0)
    assert.ok(typeof kasim.lowStockThresholdKg === 'number')
  })

  test('PATCH /api/v1/inventory/:productId updates stock amount and threshold', async () => {
    const res = await ctx.request('PATCH', '/api/v1/inventory/prod-pork-kasim', {
      token: staffToken,
      body: {
        stockKg: 40.0,
        lowStockThresholdKg: 8.0,
      },
    })

    assert.equal(res.status, 200)
    assert.ok(res.body.data)
    assert.equal(res.body.data.stockKg, 40.0)
    assert.equal(res.body.data.lowStockThresholdKg, 8.0)
  })

  test('PATCH /api/v1/inventory/:productId rejects negative stock', async () => {
    const res = await ctx.request('PATCH', '/api/v1/inventory/prod-pork-kasim', {
      token: staffToken,
      body: {
        stockKg: -5.0,
      },
    })

    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
  })
})
