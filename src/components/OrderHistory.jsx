import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CURRENT_BRANCH_ID } from '../config'
import { formatCurrency, formatDateTime } from '../utils/formatters'
import ReceiptModal from './ReceiptModal'

/**
 * OrderHistory - Display recent orders with reprint capability
 * Shows today's orders by default with search and filter options
 */
export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      // Fetch today's orders
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          payment_method,
          payment_status,
          status,
          created_at,
          profiles:customer_id (full_name),
          receipts (receipt_number)
        `)
        .eq('branch_id', CURRENT_BRANCH_ID)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewOrder(order) {
    try {
      // Fetch order items
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          weight_kg,
          unit_price,
          subtotal,
          products (name)
        `)
        .eq('order_id', order.id)

      if (error) throw error

      const items = data.map(item => ({
        product_name: item.products?.name || 'Unknown',
        weight_kg: item.weight_kg,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }))

      setOrderItems(items)
      setSelectedOrder(order)
    } catch (error) {
      console.error('Error fetching order items:', error)
      alert('Failed to load order details')
    }
  }

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.profiles?.full_name?.toLowerCase().includes(query)
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
                      {order.profiles?.full_name || 'Walk-in'}
                    </td>
                    <td className="p-3 text-sm font-semibold">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="p-3 text-sm uppercase text-charcoal/60">
                      {order.payment_method.replace('_', ' ')}
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
          receipt={{ receipt_number: selectedOrder.receipts?.[0]?.receipt_number || 'N/A' }}
          orderItems={orderItems}
          onClose={() => {
            setSelectedOrder(null)
            setOrderItems([])
          }}
          onNewOrder={() => {
            setSelectedOrder(null)
            setOrderItems([])
          }}
        />
      )}
    </div>
  )
}
