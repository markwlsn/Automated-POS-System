import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('Authentication & RBAC API', () => {
  let ctx
  const uniqueEmail = `newcustomer-${Date.now()}@test.com`

  before(async () => {
    ctx = await setupTestApp()
  })

  after(async () => {
    await ctx.close()
  })

  test('POST /api/v1/auth/signup creates a new customer account', async () => {
    const res = await ctx.request('POST', '/api/v1/auth/signup', {
      body: {
        email: uniqueEmail,
        password: 'Password123!',
        fullName: 'New Customer',
        phoneNumber: '09191234567',
      },
    })

    assert.equal(res.status, 201)
    assert.ok(res.body.data)
    assert.ok(res.body.data.user)
    assert.equal(res.body.data.user.email, uniqueEmail)
    assert.equal(res.body.data.user.role, 'customer')
    assert.ok(res.body.data.token)
  })

  test('POST /api/v1/auth/signup rejects duplicate email with 409 CONFLICT', async () => {
    const res = await ctx.request('POST', '/api/v1/auth/signup', {
      body: {
        email: uniqueEmail,
        password: 'Password123!',
        fullName: 'Duplicate Customer',
      },
    })

    assert.equal(res.status, 409)
    assert.ok(res.body.error)
    assert.equal(res.body.error.code, 'CONFLICT')
  })

  test('POST /api/v1/auth/login succeeds with valid credentials', async () => {
    const res = await ctx.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'staff@test.com',
        password: 'Password123!',
      },
    })

    assert.equal(res.status, 200)
    assert.ok(res.body.data)
    assert.ok(res.body.data.token)
    assert.equal(res.body.data.user.email, 'staff@test.com')
    assert.equal(res.body.data.user.role, 'staff')
  })

  test('POST /api/v1/auth/login fails with invalid password', async () => {
    const res = await ctx.request('POST', '/api/v1/auth/login', {
      body: {
        email: 'staff@test.com',
        password: 'WrongPassword!',
      },
    })

    assert.equal(res.status, 401)
    assert.ok(res.body.error)
    assert.equal(res.body.error.code, 'UNAUTHORIZED')
  })

  test('GET /api/v1/auth/me returns profile for authenticated user', async () => {
    // Login to get token
    const loginRes = await ctx.request('POST', '/api/v1/auth/login', {
      body: { email: 'owner@test.com', password: 'Password123!' },
    })
    const token = loginRes.body.data.token

    const meRes = await ctx.request('GET', '/api/v1/auth/me', { token })
    assert.equal(meRes.status, 200)
    assert.ok(meRes.body.data.user)
    assert.equal(meRes.body.data.user.email, 'owner@test.com')
    assert.equal(meRes.body.data.user.role, 'owner')
  })

  test('Protected endpoint returns 401 when token is missing', async () => {
    const res = await ctx.request('GET', '/api/v1/orders')
    assert.equal(res.status, 401)
    assert.equal(res.body.error.code, 'UNAUTHORIZED')
  })
})
