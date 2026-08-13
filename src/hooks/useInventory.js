import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CURRENT_BRANCH_ID } from '../config'

/**
 * Custom hook to fetch and manage inventory with real-time updates
 * Subscribes to inventory changes for the current branch
 * 
 * @param {string} branchId - Optional branch ID (defaults to CURRENT_BRANCH_ID)
 * @returns {Object} {
 *   inventory: Array of inventory records with product information
 *   loading: Boolean indicating if initial data is being fetched
 *   error: Error object if fetch failed
 *   refetch: Function to manually refetch inventory
 *   getStockForProduct: Function to get stock_kg for a specific product_id
 * }
 */
export function useInventory(branchId = CURRENT_BRANCH_ID) {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchInventory() {
    if (!branchId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          stock_kg,
          low_stock_threshold_kg,
          updated_at,
          products (
            id,
            name,
            price_per_kg,
            is_active,
            product_categories (
              id,
              name
            )
          )
        `)
        .eq('branch_id', branchId)
        .order('stock_kg', { ascending: true })

      if (fetchError) throw fetchError

      // Flatten product and category data
      const inventoryWithProducts = (data || []).map(inv => ({
        ...inv,
        product: inv.products ? {
          ...inv.products,
          category: inv.products.product_categories,
        } : null,
      }))

      setInventory(inventoryWithProducts)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()

    // Set up real-time subscription to inventory changes
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'inventory',
          filter: `branch_id=eq.${branchId}`,
        },
        (payload) => {
          console.log('Inventory change detected:', payload)
          // Refetch inventory when changes occur
          fetchInventory()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [branchId])

  /**
   * Get stock quantity for a specific product
   * @param {string} productId - The product UUID
   * @returns {number} Stock quantity in kg, or 0 if not found
   */
  function getStockForProduct(productId) {
    const item = inventory.find(inv => inv.product_id === productId)
    return item?.stock_kg || 0
  }

  /**
   * Check if a product is low on stock
   * @param {string} productId - The product UUID
   * @returns {boolean} True if stock is below threshold
   */
  function isLowStock(productId) {
    const item = inventory.find(inv => inv.product_id === productId)
    if (!item) return false
    return item.stock_kg < item.low_stock_threshold_kg
  }

  /**
   * Check if a product is out of stock
   * @param {string} productId - The product UUID
   * @returns {boolean} True if stock is 0 or less
   */
  function isOutOfStock(productId) {
    const item = inventory.find(inv => inv.product_id === productId)
    return !item || item.stock_kg <= 0
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
 * @param {string} productId - The product UUID
 * @param {string} branchId - Optional branch ID
 * @returns {Object} { inventoryItem, loading, error }
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

    async function fetchProductInventory() {
      setLoading(true)
      setError(null)

      try {
        const { data, error: fetchError } = await supabase
          .from('inventory')
          .select(`
            id,
            product_id,
            stock_kg,
            low_stock_threshold_kg,
            updated_at
          `)
          .eq('branch_id', branchId)
          .eq('product_id', productId)
          .single()

        if (fetchError) throw fetchError

        setInventoryItem(data)
      } catch (err) {
        console.error('Error fetching product inventory:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProductInventory()

    // Set up real-time subscription
    const channel = supabase
      .channel(`inventory-product-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `product_id=eq.${productId}`,
        },
        () => {
          fetchProductInventory()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId, branchId])

  return { inventoryItem, loading, error }
}
