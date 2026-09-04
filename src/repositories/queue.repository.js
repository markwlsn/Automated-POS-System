import { getDatabase } from '../db/index.js'
import { generateQueueTicketNumber } from '../utils/orderHelpers.js'

export class QueueRepository {
  constructor(db = null) {
    this._db = db
  }

  get db() {
    return this._db || getDatabase()
  }

  getNextTicketSequence(branchId) {
    const today = new Date().toISOString().slice(0, 10)
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM queue_tickets
      WHERE branch_id = ? AND date(created_at) = date(?)
    `)
    const res = stmt.get(branchId, today)
    return (res?.count || 0) + 1
  }

  createTicket({ id, branchId, customerName }) {
    const seq = this.getNextTicketSequence(branchId)
    const ticketNumber = generateQueueTicketNumber(seq)

    const stmt = this.db.prepare(`
      INSERT INTO queue_tickets (id, branch_id, customer_name, ticket_number, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'waiting', datetime('now'), datetime('now'))
    `)
    stmt.run(id, branchId, customerName, ticketNumber)

    // Count tickets waiting ahead
    const aheadStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM queue_tickets
      WHERE branch_id = ? AND status = 'waiting' AND created_at < (SELECT created_at FROM queue_tickets WHERE id = ?)
    `)
    const ahead = aheadStmt.get(branchId, id)?.count || 0

    return {
      id,
      branchId,
      customerName,
      ticketNumber,
      status: 'waiting',
      waitingAhead: ahead,
      createdAt: new Date().toISOString(),
    }
  }

  getActiveQueue(branchId) {
    const nowServingStmt = this.db.prepare(`
      SELECT ticket_number as ticketNumber, customer_name as customerName, status, updated_at as updatedAt
      FROM queue_tickets
      WHERE branch_id = ? AND status IN ('calling', 'serving')
      ORDER BY updated_at DESC
      LIMIT 1
    `)
    const nowServing = nowServingStmt.get(branchId) || null

    const waitingStmt = this.db.prepare(`
      SELECT id, ticket_number as ticketNumber, customer_name as customerName, status, created_at as createdAt
      FROM queue_tickets
      WHERE branch_id = ? AND status = 'waiting'
      ORDER BY created_at ASC
    `)
    const waitingTickets = waitingStmt.all(branchId)

    return {
      nowServing: nowServing ? nowServing.ticketNumber : null,
      nowServingDetails: nowServing,
      waitingTickets,
      totalWaiting: waitingTickets.length,
    }
  }

  updateTicketStatus(ticketId, status) {
    const stmt = this.db.prepare(`
      UPDATE queue_tickets
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    stmt.run(status, ticketId)

    const fetchStmt = this.db.prepare(`
      SELECT id, branch_id as branchId, customer_name as customerName, ticket_number as ticketNumber, status, updated_at as updatedAt
      FROM queue_tickets
      WHERE id = ?
    `)
    return fetchStmt.get(ticketId) || null
  }
}
