import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CURRENT_SHOP_ID, CURRENT_BRANCH_ID } from '../config'
import { generateOrderNumber, generateReceiptNumber } from '../utils/orderHelpers'

/**
 * Custom hook to handle order submission with inventory deduction
 * Manages multi-step order creation: order, items, payment, receipt, inventory updates
 * 
 * @returns {Object} { submitOrder, submitting, error, lastOrder }
 */
export function useOrderSubmit() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [lastOrder, setLastOrder] = useState(null)

  /**
   * Submit order with all related records
   * @param {Object} orderData - Order submission data
   * @returns {Object} { success, order, receipt, error }
   */
  async function submitOrder(orderData) {
    const {
      cart,
      paymentMethod,
      paymentReference = null,
      customerId = null,
      createdBy,
      orderType = 'walk_in',
      fulfillmentType = 'pickup',
    } = orderData

    setSubmitting(true)
    setError(null)

    try {
      // Step 1: Get next order number
      const { data: recentOrders, error: orderNumError } = await supabase
        .from('orders')
        .select('order_number')
        .eq('branch_id', CURRENT_BRANCH_ID)
        .order('created_at', { ascending: false })
        .limit(1)

      if (orderNumError) throw orderNumError

      // Extract sequence number from last order or start at 1
      let sequenceNumber = 1
      if (recentOrders && recentOrders.length > 0) {
        const lastOrderNum = recentOrders[0].order_number
        const parts = lastOrderNum.split('-')
        if (parts.length === 3) {
          sequenceNumber = parseInt(parts[2]) + 1
        }
      }

      const orderNumber = generateOrderNumber(CURRENT_BRANCH_ID, sequenceNumber)

      // Calculate total from cart
      const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0)

      // Step 2: Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          shop_id: CURRENT_SHOP_ID,
          branch_id: CURRENT_BRANCH_ID,
          customer_id: customerId,
          created_by: createdBy,
          order_number: orderNumber,
          order_type: orderType,
          fulfillment_type: fulfillmentType,
          status: 'completed',
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: 'paid',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Step 3: Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        weight_kg: item.weight_kg,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Step 4: Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          method: paymentMethod,
          amount: totalAmount,
          reference_number: paymentReference,
        })

      if (paymentError) throw paymentError

      // Step 5: Get next receipt number and create receipt
      const { data: recentReceipts } = await supabase
        .from('receipts')
        .select('receipt_number')
        .order('issued_at', { ascending: false })
        .limit(1)

      let receiptSequence = 1
      if (recentReceipts && recentReceipts.length > 0) {
        const lastReceiptNum = recentReceipts[0].receipt_number
        const parts = lastReceiptNum.split('-')
        if (parts.length === 3) {
          receiptSequence = parseInt(parts[2]) + 1
        }
      }

      const receiptNumber = generateReceiptNumber(receiptSequence)

      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          order_id: order.id,
          receipt_number: receiptNumber,
        })
        .select()
        .single()

      if (receiptError) throw receiptError

      // Step 6: Deduct inventory for each item
      for (const item of cart) {
        // Get current inventory
        const { data: inventory, error: invFetchError } = await supabase
          .from('inventory')
          .select('stock_kg')
          .eq('branch_id', CURRENT_BRANCH_ID)
          .eq('product_id', item.product.id)
          .single()

        if (invFetchError) throw invFetchError

        if (!inventory || inventory.stock_kg < item.weight_kg) {
          throw new Error(`Insufficient stock for ${item.product.name}`)
        }

        // Update inventory
        const newStock = inventory.stock_kg - item.weight_kg
        const { error: invUpdateError } = await supabase
          .from('inventory')
          .update({ stock_kg: newStock })
          .eq('branch_id', CURRENT_BRANCH_ID)
          .eq('product_id', item.product.id)

        if (invUpdateError) throw invUpdateError
      }

      // Step 7: Log activity
      const { error: logError } = await supabase
        .from('activity_log')
        .insert({
          shop_id: CURRENT_SHOP_ID,
          actor_id: createdBy,
          action: 'order.created',
          entity_type: 'order',
          entity_id: order.id,
          details: {
            order_number: orderNumber,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            items_count: cart.length,
          },
        })

      if (logError) console.error('Failed to log activity:', logError)

      setLastOrder({ ...order, receipt })
      setSubmitting(false)

      return {
        success: true,
        order,
        receipt,
      }
    } catch (err) {
      console.error('Order submission error:', err)
      setError(err.message || 'Failed to create order')
      setSubmitting(false)

      return {
        success: false,
        error: err.message || 'Failed to create order',
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
