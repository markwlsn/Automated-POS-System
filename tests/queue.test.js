import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp } from './helpers.js'

describe('Customer Queue API', () => {
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

  test('POST /api/v1/queue/tickets issues a new ticket', async () => {
    const res = await ctx.request('POST', '/api/v1/queue/tickets', {
      body: {
        branchId,
        customerName: 'Customer Alpha',
      },
    })

    assert.equal(res.status, 201)
    assert.ok(res.body.data)
    assert.equal(res.body.data.customerName, 'Customer Alpha')
    assert.ok(res.body.data.ticketNumber.startsWith('A-'))
    assert.equal(res.body.data.status, 'waiting')
  })

  test('GET /api/v1/queue returns active queue status', async () => {
    const res = await ctx.request('GET', `/api/v1/queue?branchId=${branchId}`)

    assert.equal(res.status, 200)
    assert.ok(res.body.data)
    assert.ok(Array.isArray(res.body.data.waitingTickets))
    assert.ok(res.body.data.waitingTickets.length >= 1)
  })

  test('PATCH /api/v1/queue/tickets/:id/status updates ticket to serving', async () => {
    // Create another ticket
    const ticketRes = await ctx.request('POST', '/api/v1/queue/tickets', {
      body: { branchId, customerName: 'Customer Beta' },
    })
    const ticketId = ticketRes.body.data.id

    const updateRes = await ctx.request('PATCH', `/api/v1/queue/tickets/${ticketId}/status`, {
      token: staffToken,
      body: { status: 'serving' },
    })

    assert.equal(updateRes.status, 200)
    assert.equal(updateRes.body.data.status, 'serving')

    // Verify queue board now shows this ticket as now serving
    const queueRes = await ctx.request('GET', `/api/v1/queue?branchId=${branchId}`)
    assert.equal(queueRes.body.data.nowServing, ticketRes.body.data.ticketNumber)
  })
})
