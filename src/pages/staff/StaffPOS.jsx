import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useProducts } from '../../hooks/useProducts'
import { useInventory } from '../../hooks/useInventory'
import { useCart } from '../../hooks/useCart'
import { useOrderSubmit } from '../../hooks/useOrderSubmit'
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
  const { profile, signOut } = useAuth()
  const { products, categories, loading: productsLoading } = useProducts()
  const { inventory, getStockForProduct } = useInventory()
  const {
    cart,
    addItem,
    updateWeight,
    removeItem,
    clearCart,
    getTotalWeight,
    getTotalAmount,
  } = useCart()
  const { submitOrder, submitting } = useOrderSubmit()

  const [view, setView] = useState('pos') // 'pos' | 'history'
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showWeightKeypad, setShowWeightKeypad] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)

  // Filter products by selected category
  const filteredProducts = selectedCategoryId
    ? products.filter(p => p.category?.id === selectedCategoryId)
    : products

  // Handle product selection
  function handleProductSelect(product) {
    const stockKg = getStockForProduct(product.id)
    if (stockKg <= 0) {
      alert(`${product.name} is out of stock`)
      return
    }
    setSelectedProduct(product)
    setShowWeightKeypad(true)
  }

  // Handle weight confirmation
  function handleWeightConfirm(weightKg) {
    const stockKg = getStockForProduct(selectedProduct.id)
    if (weightKg > stockKg) {
      alert(`Insufficient stock. Only ${stockKg.toFixed(2)}kg available`)
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
    const orderData = {
      cart,
      paymentMethod: selectedPaymentMethod,
      paymentReference: paymentData,
      customerId: null,
      createdBy: profile.id,
      orderType: 'walk_in',
      fulfillmentType: 'pickup',
    }

    const result = await submitOrder(orderData)

    if (result.success) {
      const orderItems = cart.map(item => ({
        product_name: item.product.name,
        weight_kg: item.weight_kg,
        unit_price: item.unit_price,
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
      <header className="bg-white border-b border-stone-line p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff Counter</h1>
            <p className="text-sm text-charcoal/60">
              {profile?.full_name} • {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView(view === 'pos' ? 'history' : 'pos')}
              className="btn-secondary"
            >
              {view === 'pos' ? '📋 Order History' : '🛒 Back to POS'}
            </button>
            <button onClick={signOut} className="btn-secondary">
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
                    const stockKg = getStockForProduct(product.id)
                    const inventoryItem = inventory.find(inv => inv.product_id === product.id)
                    const thresholdKg = inventoryItem?.low_stock_threshold_kg || 5

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        stockKg={stockKg}
                        thresholdKg={thresholdKg}
                        onClick={handleProductSelect}
                        disabled={stockKg <= 0}
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
              />
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showWeightKeypad && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px]">
            <div className="p-4 border-b border-stone-line">
              <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
              <p className="text-sm text-charcoal/60">
                Stock: {getStockForProduct(selectedProduct.id).toFixed(2)}kg available
              </p>
            </div>
            <WeightKeypad
              initialWeight={0}
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
