import { useState } from 'react'
import { ordersApi } from '../api/client.js'
import { CURRENT_BRANCH_ID } from '../config'

/**
 * Custom hook to handle order submission via Backend API
 * The backend atomically validates stock, deducts inventory, creates the order,
 * records the payment, and generates the legal receipt within a single transaction.
 *
 * @returns {Object} { submitOrder, submitting, error, lastOrder }
 */
export function useOrderSubmit() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [lastOrder, setLastOrder] = useState(null)

  /**
   * Submit order with all related records via single API request
   * @param {Object} orderData - Order submission data
   * @returns {Object} { success, order, receipt, payment, error }
   */
  async function submitOrder(orderData) {
    const {
      cart,
      paymentMethod,
      paymentReference = null,
      customerId = null,
      orderType = 'walk_in',
      fulfillmentType = 'pickup',
    } = orderData

    setSubmitting(true)
    setError(null)

    try {
      // Map cart items for backend schema
      const items = cart.map(item => ({
        productId: item.product.id,
        weightKg: Number(item.weight_kg),
      }))

      let cashReceived = null
      let referenceNumber = paymentReference

      if (paymentMethod === 'cash') {
        cashReceived = Number(paymentReference)
        referenceNumber = null
      }

      const payload = {
        branchId: CURRENT_BRANCH_ID,
        customerId: customerId || null,
        orderType,
        fulfillmentType,
        paymentMethod,
        cashReceived,
        paymentReference: referenceNumber,
        items,
      }

      const result = await ordersApi.createOrder(payload)

      // Map response to match existing UI component property casing
      const formattedOrder = {
        ...result.order,
        orderNumber: result.order.orderNumber,
        order_number: result.order.orderNumber,
        totalAmount: result.order.totalAmount,
        total_amount: result.order.totalAmount,
        paymentMethod: result.order.paymentMethod,
        payment_method: result.order.paymentMethod,
        createdAt: result.order.createdAt,
        created_at: result.order.createdAt,
      }

      const formattedReceipt = {
        ...result.receipt,
        receiptNumber: result.receipt.receiptNumber,
        receipt_number: result.receipt.receiptNumber,
        issuedAt: result.receipt.issuedAt,
        issued_at: result.receipt.issuedAt,
      }

      setLastOrder({ order: formattedOrder, receipt: formattedReceipt, payment: result.payment })
      setSubmitting(false)

      return {
        success: true,
        order: formattedOrder,
        receipt: formattedReceipt,
        payment: result.payment,
      }
    } catch (err) {
      console.error('Order submission error:', err)
      const message = err.message || 'Failed to create order'
      setError(message)
      setSubmitting(false)

      return {
        success: false,
        error: message,
      }
    }
  }

  return {
    submitOrder,
    submitting,
    error,
    lastOrder,
  }
}
