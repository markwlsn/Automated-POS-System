import { ProductService } from '../services/product.service.js'

const productService = new ProductService()

export function getCategories(req, res, next) {
  try {
    const categories = productService.getCategories()
    return res.success(categories)
  } catch (err) {
    next(err)
  }
}

export function getProducts(req, res, next) {
  try {
    const { categoryId, branchId } = req.query
    const products = productService.getProducts({ categoryId, branchId })
    return res.success(products)
  } catch (err) {
    next(err)
  }
}

export function getProductById(req, res, next) {
  try {
    const product = productService.getProductById(req.params.id)
    return res.success(product)
  } catch (err) {
    next(err)
  }
}

export function createProduct(req, res, next) {
  try {
    const product = productService.createProduct(req.body)
    return res.status(201).json({ data: product })
  } catch (err) {
    next(err)
  }
}
