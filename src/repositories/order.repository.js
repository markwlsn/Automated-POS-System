import crypto from 'node:crypto'
import { getDatabase } from '../db/index.js'
import { generateOrderNumber, generateReceiptNumber } from '../utils/orderHelpers.js'
import { ORDER_RULES, ERROR_CODES } from '../config/constants.js'

export class OrderRepository {
  constructor(db = null) {
    this._db = db
  }

  get db() {
    return this._db || getDatabase()
  }

  getOrders({ branchId = null, date = null, search = null, limit = 50 }) {
    let sql = `
      SELECT 
        o.id,
        o.order_number as orderNumber,
        o.total_amount as totalAmount,
        o.payment_method as paymentMethod,
        o.payment_status as paymentStatus,
        o.status,
        o.order_type as orderType,
        o.fulfillment_type as fulfillmentType,
        o.created_at as createdAt,
        COALESCE(p.full_name, 'Walk-in Customer') as customerName,
        r.receipt_number as receiptNumber,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as itemsCount
      FROM orders o
      LEFT JOIN profiles p ON o.customer_id = p.id
      LEFT JOIN receipts r ON r.order_id = o.id
      WHERE 1=1
    `
    const params = []

    if (branchId) {
      sql += ' AND o.branch_id = ?'
      params.push(branchId)
    }

    if (date) {
      sql += ' AND date(o.created_at) = date(?)'
      params.push(date)
    }

    if (search) {
      sql += ' AND (lower(o.order_number) LIKE ? OR lower(p.full_name) LIKE ?)'
      const query = `%${search.toLowerCase()}%`
      params.push(query, query)
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ?'
    params.push(limit)

    return this.db.prepare(sql).all(...params)
  }

  getOrderById(id) {
    const orderStmt = this.db.prepare(`
      SELECT 
        o.id,
        o.shop_id as shopId,
        o.branch_id as branchId,
        o.customer_id as customerId,
        o.created_by as createdBy,
        o.order_number as orderNumber,
        o.order_type as orderType,
        o.fulfillment_type as fulfillmentType,
        o.status,
        o.total_amount as totalAmount,
        o.payment_method as paymentMethod,
        o.payment_status as paymentStatus,
        o.created_at as createdAt,
        COALESCE(p.full_name, 'Walk-in Customer') as customerName
      FROM orders o
      LEFT JOIN profiles p ON o.customer_id = p.id
      WHERE o.id = ?
    `)
    const order = orderStmt.get(id)
    if (!order) return null

    const itemsStmt = this.db.prepare(`
      SELECT 
        oi.id,
        oi.product_id as productId,
        p.name as productName,
        oi.weight_kg as weightKg,
        oi.unit_price as unitPrice,
        oi.subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `)
    const items = itemsStmt.all(id)

    const paymentStmt = this.db.prepare(`
      SELECT 
        id,
        method,
        amount,
        cash_received as cashReceived,
        change,
        reference_number as referenceNumber,
        created_at as createdAt
      FROM payments
      WHERE order_id = ?
    `)
    const payment = paymentStmt.get(id) || null

    const receiptStmt = this.db.prepare(`
      SELECT 
        id,
        receipt_number as receiptNumber,
        issued_at as issuedAt
      FROM receipts
      WHERE order_id = ?
    `)
    const receipt = receiptStmt.get(id) || null

    return {
      order,
      items,
      payment,
      receipt,
    }
  }

  getNextOrderSequence(branchId) {
    const today = new Date().toISOString().slice(0, 10)
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM orders
      WHERE branch_id = ? AND date(created_at) = date(?)
    `)
    const res = stmt.get(branchId, today)
    return (res?.count || 0) + 1
  }

  getNextReceiptSequence() {
    const today = new Date().toISOString().slice(0, 10)
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM receipts
      WHERE date(issued_at) = date(?)
    `)
    const res = stmt.get(today)
    return (res?.count || 0) + 1
  }

  createOrderTransaction({
    shopId,
    branchId,
    customerId = null,
    createdBy,
    orderType = 'walk_in',
    fulfillmentType = 'pickup',
    paymentMethod,
    cashReceived = null,
    paymentReference = null,
    items,
  }) {
    // Run entire checkout within a single atomic SQLite transaction
    this.db.exec('BEGIN TRANSACTION;')

    try {
      // Step 0: Enforce daily order limits (store rules)
      const branchDailyStmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM orders
        WHERE branch_id = ? AND date(created_at) = date('now')
      `)
      const branchDailyOrders = branchDailyStmt.get(branchId)?.count || 0
      if (branchDailyOrders >= ORDER_RULES.MAX_DAILY_BRANCH_ORDERS) {
        const err = new Error(
          `Daily branch order capacity limit of ${ORDER_RULES.MAX_DAILY_BRANCH_ORDERS} orders reached for today`
        )
        err.code = ERROR_CODES.DAILY_ORDER_LIMIT_REACHED
        err.status = 400
        throw err
      }

      if (customerId) {
        const custDailyStmt = this.db.prepare(`
          SELECT COUNT(*) as count
          FROM orders
          WHERE customer_id = ? AND date(created_at) = date('now')
        `)
        const custDailyOrders = custDailyStmt.get(customerId)?.count || 0
        if (custDailyOrders >= ORDER_RULES.MAX_DAILY_CUSTOMER_ORDERS) {
          const err = new Error(
            `Daily customer order limit of ${ORDER_RULES.MAX_DAILY_CUSTOMER_ORDERS} orders reached for today`
          )
          err.code = ERROR_CODES.CUSTOMER_DAILY_LIMIT_REACHED
          err.status = 400
          throw err
        }
      }

      // Step 1: Validate stock & fetch fresh pricing for all items
      let totalAmount = 0.0
      const processedItems = []

      for (const item of items) {
        // Lock/fetch product
        const prodStmt = this.db.prepare(`
          SELECT id, name, price_per_kg as pricePerKg, is_active as isActive
          FROM products
          WHERE id = ? AND shop_id = ?
        `)
        const product = prodStmt.get(item.productId, shopId)
        if (!product || !product.isActive) {
          const err = new Error(`Product not found or inactive: ${item.productId}`)
          err.code = 'RESOURCE_NOT_FOUND'
          throw err
        }

        // Fetch current inventory
        const invStmt = this.db.prepare(`
          SELECT stock_kg as stockKg
          FROM inventory
          WHERE branch_id = ? AND product_id = ?
        `)
        const inv = invStmt.get(branchId, item.productId)
        const currentStock = inv ? inv.stockKg : 0.0

        if (currentStock < item.weightKg) {
          const err = new Error(
            `Insufficient stock for ${product.name}. Requested: ${item.weightKg.toFixed(2)} kg, Available: ${currentStock.toFixed(2)} kg`
          )
          err.code = 'INSUFFICIENT_STOCK'
          err.details = {
            productId: item.productId,
            productName: product.name,
            requestedKg: item.weightKg,
            availableKg: currentStock,
          }
          throw err
        }

        const subtotal = Math.round(item.weightKg * product.pricePerKg * 100) / 100
        totalAmount += subtotal

        processedItems.push({
          productId: product.id,
          productName: product.name,
          weightKg: item.weightKg,
          unitPrice: product.pricePerKg,
          subtotal,
          newStockKg: Math.round((currentStock - item.weightKg) * 100) / 100,
        })
      }

      totalAmount = Math.round(totalAmount * 100) / 100

      // Enforce POS shop order value limits
      if (totalAmount < ORDER_RULES.MIN_ORDER_AMOUNT) {
        const err = new Error(
          `Order total ₱${totalAmount.toFixed(2)} is below minimum allowed order amount of ₱${ORDER_RULES.MIN_ORDER_AMOUNT.toFixed(2)}`
        )
        err.code = ERROR_CODES.ORDER_BELOW_MINIMUM
        err.status = 400
        throw err
      }

      if (totalAmount > ORDER_RULES.MAX_ORDER_AMOUNT) {
        const err = new Error(
          `Order total ₱${totalAmount.toFixed(2)} exceeds maximum allowed transaction limit of ₱${ORDER_RULES.MAX_ORDER_AMOUNT.toFixed(2)}`
        )
        err.code = ERROR_CODES.ORDER_EXCEEDS_MAXIMUM
        err.status = 400
        throw err
      }

      // Step 2: Validate cash payment if applicable
      let change = 0.0
      if (paymentMethod === 'cash') {
        if (cashReceived == null || cashReceived < totalAmount) {
          const err = new Error(`Insufficient cash received. Order total is ₱${totalAmount.toFixed(2)}, received ₱${(cashReceived || 0).toFixed(2)}`)
          err.code = 'INSUFFICIENT_PAYMENT'
          throw err
        }
        change = Math.round((cashReceived - totalAmount) * 100) / 100
      }

      // Step 3: Deduct inventory for all items
      const updateInvStmt = this.db.prepare(`
        UPDATE inventory
        SET stock_kg = ?, updated_at = datetime('now')
        WHERE branch_id = ? AND product_id = ?
      `)
      for (const item of processedItems) {
        updateInvStmt.run(item.newStockKg, branchId, item.productId)
      }

      // Step 4: Create Order record
      const orderSeq = this.getNextOrderSequence(branchId)
      const orderNumber = generateOrderNumber(branchId, orderSeq)
      const orderId = crypto.randomUUID()

      const insertOrderStmt = this.db.prepare(`
        INSERT INTO orders (
          id, shop_id, branch_id, customer_id, created_by, order_number,
          order_type, fulfillment_type, status, total_amount, payment_method, payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, 'paid', datetime('now'))
      `)
      insertOrderStmt.run(
        orderId, shopId, branchId, customerId, createdBy, orderNumber,
        orderType, fulfillmentType, totalAmount, paymentMethod
      )

      // Step 5: Create Order Items
      const insertItemStmt = this.db.prepare(`
        INSERT INTO order_items (id, order_id, product_id, weight_kg, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      for (const item of processedItems) {
        insertItemStmt.run(
          crypto.randomUUID(), orderId, item.productId, item.weightKg, item.unitPrice, item.subtotal
        )
      }

      // Step 6: Create Payment record
      const paymentId = crypto.randomUUID()
      const insertPaymentStmt = this.db.prepare(`
        INSERT INTO payments (id, order_id, method, amount, cash_received, change, reference_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      insertPaymentStmt.run(
        paymentId, orderId, paymentMethod, totalAmount, cashReceived, change, paymentReference
      )

      // Step 7: Create Receipt record
      const receiptSeq = this.getNextReceiptSequence()
      const receiptNumber = generateReceiptNumber(receiptSeq)
      const receiptId = crypto.randomUUID()
      const insertReceiptStmt = this.db.prepare(`
        INSERT INTO receipts (id, order_id, receipt_number, issued_at)
        VALUES (?, ?, ?, datetime('now'))
      `)
      insertReceiptStmt.run(receiptId, orderId, receiptNumber)

      // Step 8: Create Activity Log
      const insertLogStmt = this.db.prepare(`
        INSERT INTO activity_log (id, shop_id, actor_id, action, entity_type, entity_id, details, created_at)
        VALUES (?, ?, ?, 'order.created', 'order', ?, ?, datetime('now'))
      `)
      insertLogStmt.run(
        crypto.randomUUID(), shopId, createdBy, orderId,
        JSON.stringify({ orderNumber, totalAmount, paymentMethod, itemsCount: items.length })
      )

      // Commit transaction!
      this.db.exec('COMMIT;')

      return this.getOrderById(orderId)
    } catch (error) {
      this.db.exec('ROLLBACK;')
      throw error
    }
  }
}
