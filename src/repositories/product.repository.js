import { getDatabase } from '../db/index.js'

export class ProductRepository {
  constructor(db = null) {
    this._db = db
  }

  get db() {
    return this._db || getDatabase()
  }

  getCategories(shopId) {
    const stmt = this.db.prepare(`
      SELECT id, name, sort_order as sortOrder, created_at as createdAt
      FROM product_categories
      WHERE shop_id = ?
      ORDER BY sort_order ASC, name ASC
    `)
    return stmt.all(shopId)
  }

  getProducts({ shopId, categoryId = null, branchId = null }) {
    let sql = `
      SELECT 
        p.id,
        p.name,
        p.price_per_kg as pricePerKg,
        p.is_active as isActive,
        p.category_id as categoryId,
        c.name as categoryName,
        c.sort_order as categorySortOrder,
        COALESCE(i.stock_kg, 0.0) as stockKg,
        COALESCE(i.low_stock_threshold_kg, 5.0) as lowStockThresholdKg
      FROM products p
      JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON i.product_id = p.id AND i.branch_id = ?
      WHERE p.shop_id = ? AND p.is_active = 1
    `
    const params = [branchId || '', shopId]

    if (categoryId) {
      sql += ' AND p.category_id = ?'
      params.push(categoryId)
    }

    sql += ' ORDER BY c.sort_order ASC, p.name ASC'

    const rows = this.db.prepare(sql).all(...params)
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      pricePerKg: r.pricePerKg,
      isActive: Boolean(r.isActive),
      categoryId: r.categoryId,
      category: {
        id: r.categoryId,
        name: r.categoryName,
        sortOrder: r.categorySortOrder,
      },
      stockKg: r.stockKg,
      lowStockThresholdKg: r.lowStockThresholdKg,
      isLowStock: r.stockKg < r.lowStockThresholdKg,
      isOutOfStock: r.stockKg <= 0,
    }))
  }

  findById(id) {
    const stmt = this.db.prepare(`
      SELECT 
        p.id,
        p.shop_id as shopId,
        p.name,
        p.price_per_kg as pricePerKg,
        p.is_active as isActive,
        p.category_id as categoryId,
        c.name as categoryName
      FROM products p
      JOIN product_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `)
    const r = stmt.get(id)
    if (!r) return null
    return {
      id: r.id,
      shopId: r.shopId,
      name: r.name,
      pricePerKg: r.pricePerKg,
      isActive: Boolean(r.isActive),
      categoryId: r.categoryId,
      category: {
        id: r.categoryId,
        name: r.categoryName,
      },
    }
  }

  create({ id, shopId, categoryId, name, pricePerKg, isActive = 1 }) {
    const stmt = this.db.prepare(`
      INSERT INTO products (id, shop_id, category_id, name, price_per_kg, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, shopId, categoryId, name, pricePerKg, isActive ? 1 : 0)
    return this.findById(id)
  }

  update(id, fields) {
    const updates = []
    const params = []

    if (fields.name !== undefined) {
      updates.push('name = ?')
      params.push(fields.name)
    }
    if (fields.pricePerKg !== undefined) {
      updates.push('price_per_kg = ?')
      params.push(fields.pricePerKg)
    }
    if (fields.categoryId !== undefined) {
      updates.push('category_id = ?')
      params.push(fields.categoryId)
    }
    if (fields.isActive !== undefined) {
      updates.push('is_active = ?')
      params.push(fields.isActive ? 1 : 0)
    }

    if (updates.length === 0) return this.findById(id)

    params.push(id)
    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`
    this.db.prepare(sql).run(...params)
    return this.findById(id)
  }
}
