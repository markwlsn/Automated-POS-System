import { useState, useEffect, useCallback } from 'react'
import { inventoryApi } from '../api/client'
import { CURRENT_BRANCH_ID } from '../config'

/**
 * Custom hook to fetch and manage inventory via Backend API
 * Periodically polls for updates to keep stock synchronized
 *
 * @param {string} branchId - Optional branch ID (defaults to CURRENT_BRANCH_ID)
 * @returns {Object} {
 *   inventory: Array of inventory records with product information
 *   loading: Boolean indicating if initial data is being fetched
 *   error: Error object if fetch failed
 *   refetch: Function to manually refetch inventory
 *   getStockForProduct: Function to get stock_kg for a specific product_id
 *   isLowStock: Function to check if a product is low on stock
 *   isOutOfStock: Function to check if a product is out of stock
 * }
 */
export function useInventory(branchId = CURRENT_BRANCH_ID) {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInventory = useCallback(async () => {
    if (!branchId) {
      setLoading(false)
      return
    }

    try {
      const data = await inventoryApi.getInventory(branchId)
      // Format product shape to preserve existing component expectations
      const mapped = (data || []).map(inv => ({
        ...inv,
        product_id: inv.productId,
        stock_kg: inv.stockKg,
        low_stock_threshold_kg: inv.lowStockThresholdKg,
        product: {
          id: inv.productId,
          name: inv.productName,
          price_per_kg: inv.pricePerKg,
          category: {
            name: inv.categoryName,
          },
        },
      }))
      setInventory(mapped)
      setError(null)
    } catch (err) {
      console.error('Error fetching inventory from API:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => {
    fetchInventory()

    // Poll inventory every 5 seconds for live multi-terminal stock updates
    const interval = setInterval(() => {
      fetchInventory()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchInventory])

  function getStockForProduct(productId) {
    const item = inventory.find(inv => (inv.product_id || inv.productId) === productId)
    return item?.stock_kg ?? item?.stockKg ?? 0
  }

  function isLowStock(productId) {
    const item = inventory.find(inv => (inv.product_id || inv.productId) === productId)
    if (!item) return false
    const stock = item.stock_kg ?? item.stockKg ?? 0
    const threshold = item.low_stock_threshold_kg ?? item.lowStockThresholdKg ?? 5
    return stock < threshold
  }

  function isOutOfStock(productId) {
    const item = inventory.find(inv => (inv.product_id || inv.productId) === productId)
    if (!item) return true
    const stock = item.stock_kg ?? item.stockKg ?? 0
    return stock <= 0
  }

  return {
    inventory,
    loading,
    error,
    refetch: fetchInventory,
    getStockForProduct,
    isLowStock,
    isOutOfStock,
  }
}

/**
 * Custom hook to get inventory for a specific product
 */
export function useProductInventory(productId, branchId = CURRENT_BRANCH_ID) {
  const [inventoryItem, setInventoryItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!productId || !branchId) {
      setLoading(false)
      return
    }

    async function fetchItem() {
      try {
        const data = await inventoryApi.getInventory(branchId)
        const item = (data || []).find(i => i.productId === productId)
        setInventoryItem(item || null)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [productId, branchId])

  return { inventoryItem, loading, error }
}
