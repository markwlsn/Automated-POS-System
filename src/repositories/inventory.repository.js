import { getDatabase } from '../db/index.js'

export class InventoryRepository {
  constructor(db = null) {
    this._db = db
  }

  get db() {
    return this._db || getDatabase()
  }

  getBranchInventory(branchId) {
    const stmt = this.db.prepare(`
      SELECT 
        i.id,
        i.branch_id as branchId,
        i.product_id as productId,
        p.name as productName,
        c.name as categoryName,
        p.price_per_kg as pricePerKg,
        i.stock_kg as stockKg,
        i.low_stock_threshold_kg as lowStockThresholdKg,
        i.updated_at as updatedAt
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN product_categories c ON p.category_id = c.id
      WHERE i.branch_id = ?
      ORDER BY i.stock_kg ASC, p.name ASC
    `)
    const rows = stmt.all(branchId)
    return rows.map(r => ({
      id: r.id,
      branchId: r.branchId,
      productId: r.productId,
      productName: r.productName,
      categoryName: r.categoryName,
      pricePerKg: r.pricePerKg,
      stockKg: r.stockKg,
      lowStockThresholdKg: r.lowStockThresholdKg,
      isLowStock: r.stockKg < r.lowStockThresholdKg,
      isOutOfStock: r.stockKg <= 0,
      updatedAt: r.updatedAt,
    }))
  }

  getByProduct(branchId, productId) {
    const stmt = this.db.prepare(`
      SELECT 
        i.id,
        i.branch_id as branchId,
        i.product_id as productId,
        p.name as productName,
        i.stock_kg as stockKg,
        i.low_stock_threshold_kg as lowStockThresholdKg,
        i.updated_at as updatedAt
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.branch_id = ? AND i.product_id = ?
    `)
    const r = stmt.get(branchId, productId)
    if (!r) return null
    return {
      id: r.id,
      branchId: r.branchId,
      productId: r.productId,
      productName: r.productName,
      stockKg: r.stockKg,
      lowStockThresholdKg: r.lowStockThresholdKg,
      isLowStock: r.stockKg < r.lowStockThresholdKg,
      isOutOfStock: r.stockKg <= 0,
      updatedAt: r.updatedAt,
    }
  }

  upsertStock(id, branchId, productId, stockKg, lowStockThresholdKg = 5.0) {
    const stmt = this.db.prepare(`
      INSERT INTO inventory (id, branch_id, product_id, stock_kg, low_stock_threshold_kg, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(branch_id, product_id) DO UPDATE SET
        stock_kg = excluded.stock_kg,
        low_stock_threshold_kg = COALESCE(excluded.low_stock_threshold_kg, inventory.low_stock_threshold_kg),
        updated_at = datetime('now')
    `)
    stmt.run(id, branchId, productId, stockKg, lowStockThresholdKg)
    return this.getByProduct(branchId, productId)
  }

  updateThreshold(branchId, productId, thresholdKg) {
    const stmt = this.db.prepare(`
      UPDATE inventory
      SET low_stock_threshold_kg = ?, updated_at = datetime('now')
      WHERE branch_id = ? AND product_id = ?
    `)
    stmt.run(thresholdKg, branchId, productId)
    return this.getByProduct(branchId, productId)
  }
}
