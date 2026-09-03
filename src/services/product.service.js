import crypto from 'node:crypto'
import { ProductRepository } from '../repositories/product.repository.js'
import { env } from '../config/env.js'

export class ProductService {
  constructor(productRepo = new ProductRepository()) {
    this.productRepo = productRepo
  }

  getCategories(shopId = env.DEFAULT_SHOP_ID) {
    return this.productRepo.getCategories(shopId)
  }

  getProducts({ shopId = env.DEFAULT_SHOP_ID, categoryId = null, branchId = null }) {
    return this.productRepo.getProducts({ shopId, categoryId, branchId })
  }

  getProductById(id) {
    const product = this.productRepo.findById(id)
    if (!product) {
      const err = new Error('Product not found')
      err.code = 'RESOURCE_NOT_FOUND'
      err.status = 404
      throw err
    }
    return product
  }

  createProduct({ shopId = env.DEFAULT_SHOP_ID, categoryId, name, pricePerKg, isActive = 1 }) {
    const id = crypto.randomUUID()
    return this.productRepo.create({
      id,
      shopId,
      categoryId,
      name,
      pricePerKg,
      isActive,
    })
  }
}
