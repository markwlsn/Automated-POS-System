import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('System Health API', () => {
  let ctx

  before(async () => {
    ctx = await setupTestApp()
  })

  after(async () => {
    await ctx.close()
  })

  test('GET /health returns 200 with status ok and uptime', async () => {
    const res = await ctx.request('GET', '/health')

    assert.equal(res.status, 200)
    assert.ok(res.body.data)
    assert.equal(res.body.data.status, 'ok')
    assert.ok(typeof res.body.data.uptime === 'number')
    assert.ok(res.body.data.timestamp)
  })

  test('GET non-existent route returns 404 with RESOURCE_NOT_FOUND', async () => {
    const res = await ctx.request('GET', '/api/v1/unknown-endpoint')

    assert.equal(res.status, 404)
    assert.ok(res.body.error)
    assert.equal(res.body.error.code, 'RESOURCE_NOT_FOUND')
  })
})
