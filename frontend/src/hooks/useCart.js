import { useState, useEffect } from 'react'
import { calculateSubtotal } from '../utils/orderHelpers'

/**
 * Custom hook to manage shopping cart state
 * Persists cart in sessionStorage to survive page refresh
 * 
 * Cart item structure:
 * {
 *   id: string (unique cart item ID),
 *   product: object (full product data),
 *   weight_kg: number,
 *   unit_price: number (price per kg snapshot),
 *   subtotal: number
 * }
 * 
 * @returns {Object} Cart state and actions
 */
export function useCart() {
  const STORAGE_KEY = 'meat-shop-cart'
  
  // Initialize cart from sessionStorage or empty array
  const [cart, setCart] = useState(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading cart from storage:', error)
      return []
    }
  })

  // Persist cart to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch (error) {
      console.error('Error saving cart to storage:', error)
    }
  }, [cart])

  /**
   * Add item to cart or update if already exists
   * @param {Object} product - Product object
   * @param {number} weightKg - Weight in kilograms
   */
  function addItem(product, weightKg) {
    if (!product || !weightKg || weightKg <= 0) {
      console.error('Invalid product or weight')
      return
    }

    const unitPrice = product.price_per_kg
    const subtotal = calculateSubtotal(weightKg, unitPrice)

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id)

    if (existingIndex >= 0) {
      // Update existing item - add to existing weight
      const updatedCart = [...cart]
      const newWeight = updatedCart[existingIndex].weight_kg + weightKg
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        weight_kg: newWeight,
        subtotal: calculateSubtotal(newWeight, unitPrice),
      }
      setCart(updatedCart)
    } else {
      // Add new item
      const newItem = {
        id: `${product.id}-${Date.now()}`, // Unique cart item ID
        product,
        weight_kg: weightKg,
        unit_price: unitPrice,
        subtotal,
      }
      setCart([...cart, newItem])
    }
  }

  /**
   * Update weight of a cart item
   * @param {string} cartItemId - Cart item ID
   * @param {number} newWeightKg - New weight in kilograms
   */
  function updateWeight(cartItemId, newWeightKg) {
    if (!cartItemId || newWeightKg <= 0) {
      console.error('Invalid cart item ID or weight')
      return
    }

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === cartItemId) {
          return {
            ...item,
            weight_kg: newWeightKg,
            subtotal: calculateSubtotal(newWeightKg, item.unit_price),
          }
        }
        return item
      })
    )
  }

  /**
   * Remove item from cart
   * @param {string} cartItemId - Cart item ID
   */
  function removeItem(cartItemId) {
    setCart(prevCart => prevCart.filter(item => item.id !== cartItemId))
  }

  /**
   * Clear entire cart
   */
  function clearCart() {
    setCart([])
  }

  /**
   * Get total number of items in cart
   */
  function getItemCount() {
    return cart.length
  }

  /**
   * Get total weight of all items
   */
  function getTotalWeight() {
    return cart.reduce((total, item) => total + item.weight_kg, 0)
  }

  /**
   * Get total amount of all items
   */
  function getTotalAmount() {
    return cart.reduce((total, item) => total + item.subtotal, 0)
  }

  /**
   * Check if cart is empty
   */
  function isEmpty() {
    return cart.length === 0
  }

  return {
    cart,
    addItem,
    updateWeight,
    removeItem,
    clearCart,
    getItemCount,
    getTotalWeight,
    getTotalAmount,
    isEmpty,
  }
}
