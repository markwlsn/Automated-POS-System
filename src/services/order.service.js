import { OrderRepository } from '../repositories/order.repository.js'
import { env } from '../config/env.js'

export class OrderService {
  constructor(orderRepo = new OrderRepository()) {
    this.orderRepo = orderRepo
  }

  createOrder({
    shopId = env.DEFAULT_SHOP_ID,
    branchId = env.DEFAULT_BRANCH_ID,
    customerId = null,
    createdBy,
    orderType = 'walk_in',
    fulfillmentType = 'pickup',
    paymentMethod,
    cashReceived = null,
    paymentReference = null,
    items,
  }) {
    if (!items || items.length === 0) {
      const err = new Error('Order must contain at least one item')
      err.code = 'VALIDATION_ERROR'
      err.status = 400
      throw err
    }

    for (const item of items) {
      if (!item.productId || typeof item.weightKg !== 'number' || item.weightKg <= 0) {
        const err = new Error('Each order item must have a valid productId and weightKg > 0')
        err.code = 'VALIDATION_ERROR'
        err.status = 400
        throw err
      }
    }

    return this.orderRepo.createOrderTransaction({
      shopId,
      branchId,
      customerId,
      createdBy,
      orderType,
      fulfillmentType,
      paymentMethod,
      cashReceived,
      paymentReference,
      items,
    })
  }

  getOrders({ branchId = env.DEFAULT_BRANCH_ID, date = null, search = null, limit = 50 }) {
    return this.orderRepo.getOrders({ branchId, date, search, limit })
  }

  getOrderById(id) {
    const order = this.orderRepo.getOrderById(id)
    if (!order) {
      const err = new Error('Order not found')
      err.code = 'RESOURCE_NOT_FOUND'
      err.status = 404
      throw err
    }
    return order
  }
}
