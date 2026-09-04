import { OrderService } from '../services/order.service.js'

const orderService = new OrderService()

export function createOrder(req, res, next) {
  try {
    const {
      branchId,
      customerId,
      orderType,
      fulfillmentType,
      paymentMethod,
      cashReceived,
      paymentReference,
      items,
    } = req.body

    const createdBy = req.user.id
    const finalBranchId = branchId || req.user.branchId

    const orderData = orderService.createOrder({
      branchId: finalBranchId,
      customerId,
      createdBy,
      orderType,
      fulfillmentType,
      paymentMethod,
      cashReceived,
      paymentReference,
      items,
    })

    return res.status(201).json({ data: orderData })
  } catch (err) {
    next(err)
  }
}

export function getOrders(req, res, next) {
  try {
    const { branchId, date, search, limit } = req.query
    const finalBranchId = branchId || req.user?.branchId
    const orders = orderService.getOrders({
      branchId: finalBranchId,
      date,
      search,
      limit: limit ? parseInt(limit, 10) : 50,
    })
    return res.success(orders)
  } catch (err) {
    next(err)
  }
}

export function getOrderById(req, res, next) {
  try {
    const order = orderService.getOrderById(req.params.id)
    return res.success(order)
  } catch (err) {
    next(err)
  }
}

export function getOrderRules(req, res, next) {
  try {
    const rules = orderService.getOrderRules()
    return res.success(rules)
  } catch (err) {
    next(err)
  }
}
