import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('Products & Categories API', () => {
  let ctx
  let ownerToken
  let customerToken

  before(async () => {
    ctx = await setupTestApp()

    const ownerLogin = await ctx.request('POST', '/api/v1/auth/login', {
      body: { email: 'owner@test.com', password: 'Password123!' },
    })
    ownerToken = ownerLogin.body.data.token

    const custLogin = await ctx.request('POST', '/api/v1/auth/login', {
      body: { email: 'customer@test.com', password: 'Password123!' },
    })
    customerToken = custLogin.body.data.token
  })

  after(async () => {
    await ctx.close()
  })

  test('GET /api/v1/categories returns product categories in sort order', async () => {
    const res = await ctx.request('GET', '/api/v1/categories')

    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.ok(res.body.data.length >= 3)
    assert.equal(res.body.data[0].name, 'Pork')
  })

  test('GET /api/v1/products returns all active products with category data', async () => {
    const res = await ctx.request('GET', '/api/v1/products')

    assert.equal(res.status, 200)
    assert.ok(Array.isArray(res.body.data))
    assert.ok(res.body.data.length >= 10)

    const liempo = res.body.data.find(p => p.id === 'prod-pork-liempo')
    assert.ok(liempo)
    assert.equal(liempo.pricePerKg, 380.00)
    assert.ok(liempo.category)
    assert.equal(liempo.category.name, 'Pork')
  })

  test('GET /api/v1/products?categoryId filters by category', async () => {
    const res = await ctx.request('GET', '/api/v1/products?categoryId=cat-beef')

    assert.equal(res.status, 200)
    assert.ok(res.body.data.length >= 3)
    for (const p of res.body.data) {
      assert.equal(p.categoryId, 'cat-beef')
    }
  })

  test('POST /api/v1/products creates product when called by owner', async () => {
    const res = await ctx.request('POST', '/api/v1/products', {
      token: ownerToken,
      body: {
        name: 'Special Pork Belly Roast',
        pricePerKg: 420.00,
        categoryId: 'cat-pork',
      },
    })

    assert.equal(res.status, 201)
    assert.ok(res.body.data)
    assert.equal(res.body.data.name, 'Special Pork Belly Roast')
    assert.equal(res.body.data.pricePerKg, 420.00)
  })

  test('POST /api/v1/products returns 403 FORBIDDEN when called by customer', async () => {
    const res = await ctx.request('POST', '/api/v1/products', {
      token: customerToken,
      body: {
        name: 'Unauthorized Meat Item',
        pricePerKg: 300.00,
        categoryId: 'cat-pork',
      },
    })

    assert.equal(res.status, 403)
    assert.equal(res.body.error.code, 'FORBIDDEN')
  })
})
