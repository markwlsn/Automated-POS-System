import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CURRENT_SHOP_ID } from '../config'

/**
 * Custom hook to fetch and manage products with categories
 * Fetches all active products for the current shop, organized by category
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
      // Fetch all products with their category information
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price_per_kg,
          is_active,
          category_id,
          product_categories (
            id,
            name,
            sort_order
          )
        `)
        .eq('shop_id', CURRENT_SHOP_ID)
        .eq('is_active', true)
        .order('name')

      if (fetchError) throw fetchError

      // Flatten the category data and organize products
      const productsWithCategories = (data || []).map(product => ({
        ...product,
        category: product.product_categories,
      }))

      setProducts(productsWithCategories)

      // Extract unique categories and sort by sort_order
      const uniqueCategories = []
      const categoryMap = new Map()

      productsWithCategories.forEach(product => {
        if (product.category && !categoryMap.has(product.category.id)) {
          categoryMap.set(product.category.id, product.category)
          uniqueCategories.push(product.category)
        }
      })

      uniqueCategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      setCategories(uniqueCategories)

      // Group products by category
      const grouped = {}
      productsWithCategories.forEach(product => {
        const categoryName = product.category?.name || 'Uncategorized'
        if (!grouped[categoryName]) {
          grouped[categoryName] = []
        }
        grouped[categoryName].push(product)
      })

      setProductsByCategory(grouped)
    } catch (err) {
      console.error('Error fetching products:', err)
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
        const { data, error: fetchError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            price_per_kg,
            is_active,
            category_id,
            product_categories (
              id,
              name,
              sort_order
            )
          `)
          .eq('id', productId)
          .single()

        if (fetchError) throw fetchError

        setProduct({
          ...data,
          category: data.product_categories,
        })
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  return { product, loading, error }
}
