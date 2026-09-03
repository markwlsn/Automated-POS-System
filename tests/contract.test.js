import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('API Contract & Envelope Compliance', () => {
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

  test('All success responses conform to { data: ... } envelope', async () => {
    const endpoints = [
      { method: 'GET', path: '/health', headers: {} },
      { method: 'GET', path: '/api/v1/categories', headers: {} },
      { method: 'GET', path: '/api/v1/products', headers: {} },
      { method: 'GET', path: '/api/v1/inventory', token: staffToken },
      { method: 'GET', path: '/api/v1/orders', token: staffToken },
      { method: 'GET', path: '/api/v1/queue', headers: {} },
    ]

    for (const ep of endpoints) {
      const res = await ctx.request(ep.method, ep.path, { token: ep.token, headers: ep.headers })
      assert.equal(res.status, 200, `Failed for ${ep.path}`)
      assert.ok('data' in res.body, `Missing 'data' in ${ep.path}`)
      assert.ok(!('error' in res.body), `Unexpected 'error' in successful response ${ep.path}`)
    }
  })

  test('All error responses conform to { error: { message, code, details } } envelope', async () => {
    const errorEndpoints = [
      // 404
      { method: 'GET', path: '/api/v1/non-existent' },
      // 401
      { method: 'GET', path: '/api/v1/orders' },
      // 400 validation error
      { method: 'POST', path: '/api/v1/auth/signup', body: { email: 'not-an-email' } },
    ]

    for (const ep of errorEndpoints) {
      const res = await ctx.request(ep.method, ep.path, { body: ep.body })
      assert.ok(res.status >= 400, `Expected error status for ${ep.path}, got ${res.status}`)
      assert.ok('error' in res.body, `Missing 'error' in error response for ${ep.path}`)
      assert.ok(!('data' in res.body), `Unexpected 'data' in error response for ${ep.path}`)
      assert.ok(typeof res.body.error.message === 'string')
      assert.ok(typeof res.body.error.code === 'string')
      assert.ok(typeof res.body.error.details === 'object')
    }
  })
})
