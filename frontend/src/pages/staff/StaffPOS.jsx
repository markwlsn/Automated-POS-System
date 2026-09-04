import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProducts } from '../../hooks/useProducts'
import { useInventory } from '../../hooks/useInventory'
import { useCart } from '../../hooks/useCart'
import { useOrderSubmit } from '../../hooks/useOrderSubmit'
import { queueApi } from '../../api/client'
import { CURRENT_BRANCH_ID } from '../../config'
import CategoryTabs from '../../components/CategoryTabs'
import ProductCard from '../../components/ProductCard'
import CartSummary from '../../components/CartSummary'
import WeightKeypad from '../../components/WeightKeypad'
import PaymentMethodSelector from '../../components/PaymentMethodSelector'
import CashPaymentModal from '../../components/CashPaymentModal'
import EWalletPaymentModal from '../../components/EWalletPaymentModal'
import ReceiptModal from '../../components/ReceiptModal'
import OrderHistory from '../../components/OrderHistory'

export default function StaffPOS() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const { products, categories, loading: productsLoading } = useProducts()
  const { inventory, getStockForProduct, refetch: refetchInventory } = useInventory()
  const {
    cart,
    addItem,
    updateWeight,
    removeItem,
    clearCart,
    getTotalWeight,
    getTotalAmount,
    getCartWeightForProduct,
  } = useCart()
  const { submitOrder, submitting } = useOrderSubmit()

  const [view, setView] = useState('pos') // 'pos' | 'history'
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showWeightKeypad, setShowWeightKeypad] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [queueData, setQueueData] = useState(null)
  const [callingNext, setCallingNext] = useState(false)

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchQueue() {
    try {
      const q = await queueApi.getQueue(CURRENT_BRANCH_ID)
      setQueueData(q)
    } catch {
      // Ignore polling errors
    }
  }

  async function handleCallNextTicket() {
    if (!queueData?.waitingTickets || queueData.waitingTickets.length === 0) {
      alert('No customers are currently waiting in the queue.')
      return
    }
    const nextTicket = queueData.waitingTickets[0]
    setCallingNext(true)
    try {
      await queueApi.updateTicketStatus(nextTicket.id, 'serving')
      await fetchQueue()
    } catch (err) {
      alert(`Failed to call ticket: ${err.message}`)
    } finally {
      setCallingNext(false)
    }
  }

  // Filter products by selected category
  const filteredProducts = selectedCategoryId
    ? products.filter(p => p.category?.id === selectedCategoryId)
    : products

  // Handle product selection with cumulative stock validation
  function handleProductSelect(product) {
    const totalStockKg = getStockForProduct(product.id)
    if (totalStockKg <= 0) {
      alert(`${product.name} is out of stock`)
      return
    }

    const cartWeight = getCartWeightForProduct(product.id)
    const remainingAvailable = totalStockKg - cartWeight

    if (remainingAvailable <= 0) {
      alert(
        `All available stock of ${product.name} (${totalStockKg.toFixed(2)}kg) is already added to your current order.`
      )
      return
    }

    setSelectedProduct(product)
    setShowWeightKeypad(true)
  }

  // Handle weight confirmation with cumulative cart weight validation
  function handleWeightConfirm(weightKg) {
    if (!selectedProduct) return

    const totalStockKg = getStockForProduct(selectedProduct.id)
    const cartWeight = getCartWeightForProduct(selectedProduct.id)
    const cumulativeWeight = Math.round((cartWeight + weightKg) * 100) / 100

    if (cumulativeWeight > totalStockKg) {
      const remainingAvailable = Math.max(0, totalStockKg - cartWeight)
      alert(
        `Insufficient stock for ${selectedProduct.name}.\n` +
        `Only ${remainingAvailable.toFixed(2)}kg remaining available.\n` +
        `(Total stock: ${totalStockKg.toFixed(2)}kg, already in cart: ${cartWeight.toFixed(2)}kg)`
      )
      return
    }

    addItem(selectedProduct, weightKg)
    setShowWeightKeypad(false)
    setSelectedProduct(null)
  }

  // Handle checkout
  function handleCheckout() {
    setCheckoutStep('payment')
  }

  // Handle payment method selection
  function handlePaymentMethodSelect(method) {
    setSelectedPaymentMethod(method)
    if (method === 'cash') {
      setCheckoutStep('cash')
    } else if (method === 'gcash' || method === 'maya' || method === 'bank_transfer') {
      setCheckoutStep('ewallet')
    }
  }

  // Handle payment confirmation
  async function handlePaymentConfirm(paymentData) {
    const staffId = profile?.id || user?.id || null

    const orderData = {
      cart,
      paymentMethod: selectedPaymentMethod,
      paymentReference: paymentData,
      customerId: null,
      createdBy: staffId,
      orderType: 'walk_in',
      fulfillmentType: 'pickup',
    }

    const result = await submitOrder(orderData)

    if (result.success) {
      const orderItems = cart.map(item => ({
        product_name: item.product.name,
        productName: item.product.name,
        weight_kg: item.weight_kg,
        weightKg: item.weight_kg,
        unit_price: item.unit_price,
        unitPrice: item.unit_price,
        subtotal: item.subtotal,
      }))

      setCompletedOrder({
        order: result.order,
        receipt: result.receipt,
        orderItems,
      })

      clearCart()
      setCheckoutStep(null)
      setSelectedPaymentMethod(null)

      // Immediately refresh inventory so product cards show updated stock
      if (typeof refetchInventory === 'function') {
        refetchInventory()
      }
    } else {
      alert(`Order failed: ${result.error}`)
    }
  }

  // Handle new order
  function handleNewOrder() {
    setCompletedOrder(null)
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-charcoal/60">Loading POS...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-stone-bg">
      {/* Header */}
      <header className="bg-white border-b border-stone-line px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold leading-tight">Staff Counter POS</h1>
              <p className="text-xs text-charcoal/60">
                {profile?.full_name || profile?.fullName || 'Staff User'} • {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Live Queue Calling Widget */}
            <div className="flex items-center gap-2 bg-stone-bg border border-stone-line rounded-lg px-3 py-1.5 shadow-2xs">
              <div className="text-xs">
                <span className="text-charcoal/60">Now Serving:</span>{' '}
                <strong className="text-oxblood font-extrabold text-sm ml-1">
                  {queueData?.nowServing || '---'}
                </strong>
              </div>
              <span className="text-stone-line">•</span>
              <div className="text-xs text-charcoal/70">
                Waiting: <strong className="text-charcoal">{queueData?.totalWaiting || 0}</strong>
              </div>
              <button
                type="button"
                onClick={handleCallNextTicket}
                disabled={callingNext || !queueData?.totalWaiting}
                className="btn-primary text-xs py-1 px-2.5 ml-1 disabled:opacity-40 shadow-2xs"
                title="Advance queue and serve next ticket"
              >
                {callingNext ? 'Calling...' : '📢 Call Next'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {profile?.role === 'owner' && (
              <button
                type="button"
                onClick={() => navigate('/owner')}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <span>📊</span> Owner Portal
              </button>
            )}
            <button
              onClick={() => setView(view === 'pos' ? 'history' : 'pos')}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {view === 'pos' ? '📋 Order History' : '🛒 Back to POS'}
            </button>
            <button onClick={signOut} className="btn-secondary text-xs py-1.5 px-3">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* View Toggle */}
      {view === 'history' ? (
        <div className="flex-1 overflow-y-auto">
          <OrderHistory />
        </div>
      ) : (
        <>
          {/* POS View */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Products */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <CategoryTabs
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(product => {
                    const totalStock = getStockForProduct(product.id)
                    const cartWeight = getCartWeightForProduct(product.id)
                    const remainingAvailable = Math.max(0, totalStock - cartWeight)

                    const inventoryItem = (inventory || []).find(
                      inv => (inv.product_id || inv.productId) === product.id
                    )
                    const thresholdKg = Number(
                      inventoryItem?.low_stock_threshold_kg ?? inventoryItem?.lowStockThresholdKg ?? 5
                    )

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        stockKg={remainingAvailable}
                        thresholdKg={thresholdKg}
                        onClick={handleProductSelect}
                        disabled={remainingAvailable <= 0}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="w-96 border-l border-stone-line">
              <CartSummary
                cart={cart}
                onUpdateWeight={updateWeight}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
                onCheckout={handleCheckout}
                totalWeight={getTotalWeight()}
                totalAmount={getTotalAmount()}
                getStockForProduct={getStockForProduct}
              />
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showWeightKeypad && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-stone-line my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-stone-line flex items-center justify-between bg-white">
              <div className="pr-2">
                <h3 className="font-bold text-lg text-charcoal leading-tight">
                  {selectedProduct.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-oxblood">
                    ₱{Number(selectedProduct.price_per_kg || selectedProduct.pricePerKg || 0).toFixed(2)}/kg
                  </span>
                  <span className="text-stone-line">•</span>
                  <span className="text-xs text-charcoal/60">
                    Avail: {Math.max(0, getStockForProduct(selectedProduct.id) - getCartWeightForProduct(selectedProduct.id)).toFixed(2)}kg
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowWeightKeypad(false)
                  setSelectedProduct(null)
                }}
                className="w-8 h-8 rounded-full hover:bg-stone-bg text-charcoal/50 hover:text-charcoal flex items-center justify-center text-lg font-bold transition-colors shrink-0"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Keypad Content */}
            <WeightKeypad
              initialWeight={0}
              productPrice={selectedProduct.price_per_kg || selectedProduct.pricePerKg}
              onConfirm={handleWeightConfirm}
              onCancel={() => {
                setShowWeightKeypad(false)
                setSelectedProduct(null)
              }}
            />
          </div>
        </div>
      )}

      {checkoutStep === 'payment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <PaymentMethodSelector
              onSelectMethod={handlePaymentMethodSelect}
              onCancel={() => setCheckoutStep(null)}
            />
          </div>
        </div>
      )}

      {checkoutStep === 'cash' && (
        <CashPaymentModal
          totalAmount={getTotalAmount()}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setCheckoutStep('payment')}
        />
      )}

      {checkoutStep === 'ewallet' && (
        <EWalletPaymentModal
          method={selectedPaymentMethod}
          totalAmount={getTotalAmount()}
          onConfirm={handlePaymentConfirm}
          onCancel={() => setCheckoutStep('payment')}
        />
      )}

      {completedOrder && (
        <ReceiptModal
          order={completedOrder.order}
          receipt={completedOrder.receipt}
          orderItems={completedOrder.orderItems}
          onClose={() => setCompletedOrder(null)}
          onNewOrder={handleNewOrder}
        />
      )}

      {submitting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-16 h-16 border-4 border-oxblood border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg font-semibold">Processing Order...</div>
          </div>
        </div>
      )}
    </div>
  )
}
