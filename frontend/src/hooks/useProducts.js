import { useState, useEffect } from 'react'
import { productsApi } from '../api/client'

/**
 * Custom hook to fetch and manage products with categories
 * Fetches all active products from Backend API, organized by category
 *
 * @returns {Object} {
 *   products: Array of product objects with category information
 *   categories: Array of unique categories
 *   productsByCategory: Object with category names as keys and product arrays as values
 *   loading: Boolean indicating if data is being fetched
 *   error: Error object if fetch failed
 *   refetch: Function to manually refetch products
 * }
 */
export function useProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [productsByCategory, setProductsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchProducts() {
    setLoading(true)
    setError(null)

    try {
      const [fetchedCategories, fetchedProducts] = await Promise.all([
        productsApi.getCategories(),
        productsApi.getProducts(),
      ])

      setCategories(fetchedCategories || [])
      setProducts(fetchedProducts || [])

      // Group products by category
      const grouped = {}
      for (const product of fetchedProducts || []) {
        const categoryName = product.category?.name || 'Uncategorized'
        if (!grouped[categoryName]) {
          grouped[categoryName] = []
        }
        grouped[categoryName].push(product)
      }

      setProductsByCategory(grouped)
    } catch (err) {
      console.error('Error fetching products from API:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return {
    products,
    categories,
    productsByCategory,
    loading,
    error,
    refetch: fetchProducts,
  }
}

/**
 * Custom hook to fetch a single product by ID
 * @param {string} productId - The product UUID
 * @returns {Object} { product, loading, error }
 */
export function useProduct(productId) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    async function fetchProduct() {
      setLoading(true)
      setError(null)

      try {
        const data = await productsApi.getProductById(productId)
        setProduct(data)
      } catch (err) {
        console.error('Error fetching product from API:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  return { product, loading, error }
}
