import { useState, useEffect } from 'react'
import { productsApi } from '../api/client.js'

/**
 * Normalizes product object to ensure consistent property names across components
 */
export function normalizeProduct(product) {
  if (!product) return null
  const price = Number(product.price_per_kg ?? product.pricePerKg ?? 0)
  const category = product.category || {
    id: product.category_id || product.categoryId,
    name: product.category_name || product.categoryName || 'Uncategorized',
    sort_order: product.category_sort_order ?? product.categorySortOrder ?? 0,
  }

  return {
    ...product,
    price_per_kg: price,
    pricePerKg: price,
    category: {
      ...category,
      id: category.id,
      name: category.name,
      sort_order: category.sort_order ?? category.sortOrder ?? 0,
      sortOrder: category.sortOrder ?? category.sort_order ?? 0,
    },
    stock_kg: Number(product.stock_kg ?? product.stockKg ?? 0),
    stockKg: Number(product.stockKg ?? product.stock_kg ?? 0),
  }
}

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

      const normalizedCategories = (fetchedCategories || []).map(cat => ({
        ...cat,
        sort_order: cat.sortOrder ?? cat.sort_order ?? 0,
        sortOrder: cat.sortOrder ?? cat.sort_order ?? 0,
      }))

      const normalizedProducts = (fetchedProducts || []).map(normalizeProduct)

      setCategories(normalizedCategories)
      setProducts(normalizedProducts)

      // Group products by category
      const grouped = {}
      for (const product of normalizedProducts) {
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
        setProduct(normalizeProduct(data))
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
