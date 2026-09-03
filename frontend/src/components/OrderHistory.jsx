import { useState, useEffect } from 'react'
import { ordersApi } from '../api/client'
import { CURRENT_BRANCH_ID } from '../config'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import ReceiptModal from './ReceiptModal'

/**
 * OrderHistory - Display recent orders with reprint capability
 * Uses Backend REST API to fetch orders and details
 */
export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const data = await ordersApi.getOrders({ branchId: CURRENT_BRANCH_ID })
      // Map properties for UI rendering
      const mapped = (data || []).map(o => ({
        ...o,
        order_number: o.orderNumber,
        total_amount: o.totalAmount,
        payment_method: o.paymentMethod,
        payment_status: o.paymentStatus,
        created_at: o.createdAt,
        customer_name: o.customerName,
        receipt_number: o.receiptNumber,
      }))
      setOrders(mapped)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewOrder(order) {
    try {
      const details = await ordersApi.getOrderById(order.id)

      const items = (details.items || []).map(item => ({
        product_name: item.productName,
        weight_kg: item.weightKg,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      }))

      setOrderItems(items)
      setSelectedOrder({
        ...details.order,
        order_number: details.order.orderNumber,
        total_amount: details.order.totalAmount,
        created_at: details.order.createdAt,
        customer_name: details.order.customerName,
      })
      setSelectedReceipt({
        receipt_number: details.receipt?.receiptNumber || order.receipt_number || 'N/A',
      })
    } catch (error) {
      console.error('Error fetching order details:', error)
      alert('Failed to load order details')
    }
  }

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (order.order_number || '').toLowerCase().includes(query) ||
      (order.customer_name || '').toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-charcoal/60">Loading orders...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Order History</h2>
        <p className="text-charcoal/60 mb-4">Today's orders</p>

        {/* Search */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field flex-1"
          />
          <button onClick={fetchOrders} className="btn-secondary">
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-charcoal/60">
            {searchQuery ? 'No orders found matching your search' : 'No orders yet today'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-bg border-b border-stone-line">
                <tr className="text-left">
                  <th className="p-3 font-semibold text-sm">Order #</th>
                  <th className="p-3 font-semibold text-sm">Time</th>
                  <th className="p-3 font-semibold text-sm">Customer</th>
                  <th className="p-3 font-semibold text-sm">Total</th>
                  <th className="p-3 font-semibold text-sm">Payment</th>
                  <th className="p-3 font-semibold text-sm">Status</th>
                  <th className="p-3 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-stone-line hover:bg-stone-bg/50">
                    <td className="p-3 font-medium text-sm">{order.order_number}</td>
                    <td className="p-3 text-sm text-charcoal/60">
                      {formatDateTime(order.created_at, 'time')}
                    </td>
                    <td className="p-3 text-sm">
                      {order.customer_name || 'Walk-in'}
                    </td>
                    <td className="p-3 text-sm font-semibold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="p-3 text-sm uppercase text-charcoal/60">
                      {(order.payment_method || '').replace('_', ' ')}
                    </td>
                    <td className="p-3">
                      <span className={`stamp ${
                        order.status === 'completed' ? 'stamp-paid' :
                        order.status === 'cancelled' ? 'stamp-cancelled' :
                        'stamp-pending'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="text-oxblood hover:underline text-sm font-medium"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedOrder && (
        <ReceiptModal
          order={selectedOrder}
          receipt={selectedReceipt || { receipt_number: selectedOrder.receipt_number || 'N/A' }}
          orderItems={orderItems}
          onClose={() => {
            setSelectedOrder(null)
            setSelectedReceipt(null)
            setOrderItems([])
          }}
          onNewOrder={() => {
            setSelectedOrder(null)
            setSelectedReceipt(null)
            setOrderItems([])
          }}
        />
      )}
    </div>
  )
}
