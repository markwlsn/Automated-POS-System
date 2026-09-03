import { InventoryService } from '../services/inventory.service.js'

const inventoryService = new InventoryService()

export function getInventory(req, res, next) {
  try {
    const branchId = req.query.branchId || req.user?.branchId
    const inventory = inventoryService.getBranchInventory(branchId)
    return res.success(inventory)
  } catch (err) {
    next(err)
  }
}

export function updateStock(req, res, next) {
  try {
    const branchId = req.query.branchId || req.user?.branchId
    const { productId } = req.params
    const { stockKg, lowStockThresholdKg } = req.body
    const updated = inventoryService.updateStock(branchId, productId, { stockKg, lowStockThresholdKg })
    return res.success(updated)
  } catch (err) {
    next(err)
  }
}
