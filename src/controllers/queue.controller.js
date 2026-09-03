import { QueueService } from '../services/queue.service.js'

const queueService = new QueueService()

export function issueTicket(req, res, next) {
  try {
    const { branchId, customerName } = req.body
    const finalBranchId = branchId || req.user?.branchId
    const ticket = queueService.issueTicket(finalBranchId, customerName)
    return res.status(201).json({ data: ticket })
  } catch (err) {
    next(err)
  }
}

export function getQueue(req, res, next) {
  try {
    const branchId = req.query.branchId || req.user?.branchId
    const queue = queueService.getQueue(branchId)
    return res.success(queue)
  } catch (err) {
    next(err)
  }
}

export function updateTicketStatus(req, res, next) {
  try {
    const { id } = req.params
    const { status } = req.body
    const updated = queueService.updateTicketStatus(id, status)
    return res.success(updated)
  } catch (err) {
    next(err)
  }
}
