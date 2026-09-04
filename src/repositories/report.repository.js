import { getDatabase } from '../db/index.js'

export class ReportRepository {
  constructor(db = null) {
    this._db = db
  }

  get db() {
    return this._db || getDatabase()
  }

  getSummary({ shopId, branchId = null, startDate = null, endDate = null }) {
    let orderWhere = "WHERE o.shop_id = ? AND o.status = 'completed'"
    const orderParams = [shopId]

    if (branchId) {
      orderWhere += ' AND o.branch_id = ?'
      orderParams.push(branchId)
    }

    if (startDate) {
      orderWhere += ' AND date(o.created_at) >= date(?)'
      orderParams.push(startDate)
    }

    if (endDate) {
      orderWhere += ' AND date(o.created_at) <= date(?)'
      orderParams.push(endDate)
    }

    // 1. Overall sales & order totals
    const totalsStmt = this.db.prepare(`
      SELECT 
        COALESCE(SUM(o.total_amount), 0.0) as totalSales,
        COUNT(o.id) as totalOrders
      FROM orders o
      ${orderWhere}
    `)
    const totals = totalsStmt.get(...orderParams)
    const totalSales = Math.round(totals.totalSales * 100) / 100
    const totalOrders = totals.totalOrders || 0
    const averageOrderValue = totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0.0

    // 2. Sales by payment method
    const paymentStmt = this.db.prepare(`
      SELECT 
        o.payment_method as paymentMethod,
        COALESCE(SUM(o.total_amount), 0.0) as total
      FROM orders o
      ${orderWhere}
      GROUP BY o.payment_method
    `)
    const paymentRows = paymentStmt.all(...orderParams)
    const salesByPaymentMethod = {}
    for (const r of paymentRows) {
      salesByPaymentMethod[r.paymentMethod] = Math.round(r.total * 100) / 100
    }

    // 3. Top selling products
    let itemsWhere = "WHERE o.shop_id = ? AND o.status = 'completed'"
    const itemsParams = [shopId]
    if (branchId) {
      itemsWhere += ' AND o.branch_id = ?'
      itemsParams.push(branchId)
    }
    if (startDate) {
      itemsWhere += ' AND date(o.created_at) >= date(?)'
      itemsParams.push(startDate)
    }
    if (endDate) {
      itemsWhere += ' AND date(o.created_at) <= date(?)'
      itemsParams.push(endDate)
    }

    const topProductsStmt = this.db.prepare(`
      SELECT 
        p.id as productId,
        p.name,
        COALESCE(SUM(oi.weight_kg), 0.0) as totalKg,
        COALESCE(SUM(oi.subtotal), 0.0) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      ${itemsWhere}
      GROUP BY p.id, p.name
      ORDER BY revenue DESC
      LIMIT 10
    `)
    const topProducts = topProductsStmt.all(...itemsParams).map(r => ({
      productId: r.productId,
      name: r.name,
      totalKg: Math.round(r.totalKg * 100) / 100,
      revenue: Math.round(r.revenue * 100) / 100,
    }))

    // 4. Low stock count
    let invWhere = 'WHERE i.stock_kg < i.low_stock_threshold_kg'
    const invParams = []
    if (branchId) {
      invWhere += ' AND i.branch_id = ?'
      invParams.push(branchId)
    }
    const lowStockStmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM inventory i
      ${invWhere}
    `)
    const lowStockCount = lowStockStmt.get(...invParams)?.count || 0

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      lowStockCount,
      salesByPaymentMethod,
      topProducts,
    }
  }
}
