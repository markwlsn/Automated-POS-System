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

    const unitPrice = Number(product.price_per_kg ?? product.pricePerKg ?? 0)
    const weight = Number(weightKg)
    const subtotal = calculateSubtotal(weight, unitPrice)

    // Check if product already in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id)

    if (existingIndex >= 0) {
      // Update existing item - add to existing weight
      const updatedCart = [...cart]
      const newWeight = Math.round((updatedCart[existingIndex].weight_kg + weight) * 100) / 100
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
        product: {
          ...product,
          price_per_kg: unitPrice,
          pricePerKg: unitPrice,
        },
        weight_kg: weight,
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

    const weight = Number(newWeightKg)

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === cartItemId) {
          return {
            ...item,
            weight_kg: weight,
            subtotal: calculateSubtotal(weight, item.unit_price),
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
    return Math.round(cart.reduce((total, item) => total + (item.weight_kg || 0), 0) * 100) / 100
  }

  /**
   * Get total amount of all items
   */
  function getTotalAmount() {
    return Math.round(cart.reduce((total, item) => total + (item.subtotal || 0), 0) * 100) / 100
  }

  /**
   * Get total weight currently in cart for a specific product ID
   * @param {string} productId - Product UUID
   * @returns {number} Committed weight in cart
   */
  function getCartWeightForProduct(productId) {
    const item = cart.find(i => i.product?.id === productId)
    return item ? item.weight_kg : 0
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
    getCartWeightForProduct,
    isEmpty,
  }
}
