import { formatCurrency, formatDateTime, formatWeight } from '../utils/formatters'

/**
 * ReceiptModal - Display order receipt with print functionality
 * 
 * @param {Object} order - Order object with items
 * @param {Object} receipt - Receipt object
 * @param {Array} orderItems - Array of order items with product details
 * @param {Function} onClose - Callback when modal is closed
 * @param {Function} onNewOrder - Callback to start a new order
 */
export default function ReceiptModal({ order = {}, receipt = {}, orderItems = [], onClose, onNewOrder }) {
  function handlePrint() {
    window.print()
  }

  function handleNewOrder() {
    if (onNewOrder) onNewOrder()
    if (onClose) onClose()
  }

  const receiptNumber = receipt?.receipt_number || receipt?.receiptNumber || 'N/A'
  const orderNumber = order?.order_number || order?.orderNumber || 'N/A'
  const orderDate = order?.created_at || order?.createdAt || new Date().toISOString()
  const paymentMethod = String(order?.payment_method || order?.paymentMethod || 'cash').replace('_', ' ')
  const totalAmount = Number(order?.total_amount ?? order?.totalAmount ?? 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Success Header - Hide on print */}
        <div className="p-6 text-center border-b border-stone-line print:hidden">
          <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sage-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Complete!</h2>
          <p className="text-charcoal/60">Receipt #{receiptNumber}</p>
        </div>

        {/* Receipt Content - Printable */}
        <div className="p-6 receipt-content">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-1">Dela Cruz Meat Shop</h1>
            <p className="text-sm text-charcoal/60">Main Branch - Poblacion</p>
            <p className="text-sm text-charcoal/60">123 Rizal St., Sample City</p>
            <p className="text-sm text-charcoal/60">Tel: 0917 123 4567</p>
          </div>

          <div className="border-t border-b border-charcoal/20 py-3 mb-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-charcoal/60">Receipt No:</span>
              <span className="font-medium">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/60">Order No:</span>
              <span className="font-medium">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/60">Date:</span>
              <span className="font-medium">{formatDateTime(orderDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/60">Payment:</span>
              <span className="font-medium uppercase">{paymentMethod}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead className="border-b border-charcoal/20">
                <tr className="text-left">
                  <th className="pb-2">Item</th>
                  <th className="pb-2 text-right">Wt.</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(orderItems || []).map((item, index) => {
                  const weight = Number(item.weight_kg ?? item.weightKg ?? 0)
                  const unitPrice = Number(item.unit_price ?? item.unitPrice ?? 0)
                  const subtotal = Number(item.subtotal ?? 0)
                  const name = item.product_name || item.productName || item.product?.name || 'Item'

                  return (
                    <tr key={index} className="border-b border-charcoal/10">
                      <td className="py-2">{name}</td>
                      <td className="py-2 text-right">{formatWeight(weight, false)}</td>
                      <td className="py-2 text-right text-xs">{formatCurrency(unitPrice)}/kg</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(subtotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-charcoal/20 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-charcoal/60">Subtotal</span>
              <span className="font-medium">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-charcoal/60">
            <p>Thank you for your purchase!</p>
            <p className="mt-2">This serves as your official receipt.</p>
          </div>
        </div>

        {/* Action Buttons - Hide on print */}
        <div className="p-6 border-t border-stone-line grid grid-cols-2 gap-3 print:hidden">
          <button onClick={handlePrint} className="btn-secondary py-3">
            🖨️ Print Receipt
          </button>
          <button onClick={handleNewOrder} className="btn-primary py-3">
            New Order
          </button>
        </div>
      </div>
    </div>
  )
}
