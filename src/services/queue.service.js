import crypto from 'node:crypto'
import { QueueRepository } from '../repositories/queue.repository.js'
import { env } from '../config/env.js'

export class QueueService {
  constructor(queueRepo = new QueueRepository()) {
    this.queueRepo = queueRepo
  }

  issueTicket(branchId = env.DEFAULT_BRANCH_ID, customerName = 'Guest') {
    const id = crypto.randomUUID()
    return this.queueRepo.createTicket({ id, branchId, customerName })
  }

  getQueue(branchId = env.DEFAULT_BRANCH_ID) {
    return this.queueRepo.getActiveQueue(branchId)
  }

  updateTicketStatus(ticketId, status) {
    const validStatuses = ['waiting', 'calling', 'serving', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      const err = new Error(`Invalid queue status: ${status}`)
      err.code = 'VALIDATION_ERROR'
      err.status = 400
      throw err
    }

    const updated = this.queueRepo.updateTicketStatus(ticketId, status)
    if (!updated) {
      const err = new Error('Ticket not found')
      err.code = 'RESOURCE_NOT_FOUND'
      err.status = 404
      throw err
    }
    return updated
  }
}
