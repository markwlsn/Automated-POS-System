import crypto from 'node:crypto'
import { InventoryRepository } from '../repositories/inventory.repository.js'
import { env } from '../config/env.js'

export class InventoryService {
  constructor(inventoryRepo = new InventoryRepository()) {
    this.inventoryRepo = inventoryRepo
  }

  getBranchInventory(branchId = env.DEFAULT_BRANCH_ID) {
    return this.inventoryRepo.getBranchInventory(branchId)
  }

  getProductInventory(branchId = env.DEFAULT_BRANCH_ID, productId) {
    const item = this.inventoryRepo.getByProduct(branchId, productId)
    if (!item) {
      const err = new Error('Inventory record not found for product')
      err.code = 'RESOURCE_NOT_FOUND'
      err.status = 404
      throw err
    }
    return item
  }

  updateStock(branchId = env.DEFAULT_BRANCH_ID, productId, { stockKg, lowStockThresholdKg }) {
    if (stockKg !== undefined && stockKg < 0) {
      const err = new Error('Stock cannot be negative')
      err.code = 'VALIDATION_ERROR'
      err.status = 400
      throw err
    }

    const existing = this.inventoryRepo.getByProduct(branchId, productId)
    if (existing) {
      if (stockKg !== undefined) {
        return this.inventoryRepo.upsertStock(
          existing.id,
          branchId,
          productId,
          stockKg,
          lowStockThresholdKg !== undefined ? lowStockThresholdKg : existing.lowStockThresholdKg
        )
      }
      if (lowStockThresholdKg !== undefined) {
        return this.inventoryRepo.updateThreshold(branchId, productId, lowStockThresholdKg)
      }
      return existing
    } else {
      const id = crypto.randomUUID()
      return this.inventoryRepo.upsertStock(
        id,
        branchId,
        productId,
        stockKg !== undefined ? stockKg : 0.0,
        lowStockThresholdKg !== undefined ? lowStockThresholdKg : 5.0
      )
    }
  }
}
