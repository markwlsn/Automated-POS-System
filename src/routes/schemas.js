import { z } from 'zod'
import { ORDER_RULES } from '../config/constants.js'

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().optional().nullable(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  pricePerKg: z.number().positive('Price per kg must be positive'),
  categoryId: z.string().min(1, 'Category ID is required'),
  isActive: z.boolean().optional(),
})

export const updateStockSchema = z.object({
  stockKg: z.number().nonnegative('Stock cannot be negative').optional(),
  lowStockThresholdKg: z.number().nonnegative().optional(),
})

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  weightKg: z
    .number()
    .min(ORDER_RULES.MIN_ITEM_WEIGHT_KG, `Weight must be at least ${ORDER_RULES.MIN_ITEM_WEIGHT_KG} kg`)
    .max(ORDER_RULES.MAX_ITEM_WEIGHT_KG, `Weight cannot exceed ${ORDER_RULES.MAX_ITEM_WEIGHT_KG} kg`),
})

export const createOrderSchema = z.object({
  branchId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  orderType: z.enum(['walk_in', 'online', 'kiosk']).default('walk_in'),
  fulfillmentType: z.enum(['pickup', 'dine_in', 'delivery']).default('pickup'),
  paymentMethod: z.enum(['cash', 'gcash', 'maya', 'bank_transfer']),
  cashReceived: z.number().optional().nullable(),
  paymentReference: z.string().optional().nullable(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
})

export const issueTicketSchema = z.object({
  branchId: z.string().optional().nullable(),
  customerName: z.string().default('Guest'),
})

export const updateTicketStatusSchema = z.object({
  status: z.enum(['waiting', 'calling', 'serving', 'completed', 'cancelled']),
})
