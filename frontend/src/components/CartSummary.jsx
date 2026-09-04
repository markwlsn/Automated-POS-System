import CartItemRow from './CartItemRow'
import CartEmpty from './CartEmpty'
import { formatCurrency, formatWeight } from '../utils/formatters'
import { ORDER_RULES } from '../config'

/**
 * CartSummary - Sticky cart panel with checkout actions
 * Shows cart items, totals, and proceed to payment button with POS law limits
 */
export default function CartSummary({
  cart = [],
  onUpdateWeight,
  onRemoveItem,
  onClearCart,
  onCheckout,
  totalWeight = 0,
  totalAmount = 0,
  getStockForProduct,
}) {
  const itemCount = cart.length
  const isEmpty = itemCount === 0

  const isBelowMin = !isEmpty && totalAmount < ORDER_RULES.MIN_ORDER_AMOUNT
  const isAboveMax = totalAmount > ORDER_RULES.MAX_ORDER_AMOUNT
  const canCheckout = !isEmpty && !isBelowMin && !isAboveMax

  let checkoutButtonText = 'Proceed to Payment'
  if (isEmpty) {
    checkoutButtonText = 'Add Items to Proceed'
  } else if (isBelowMin) {
    checkoutButtonText = `Min. Order ${formatCurrency(ORDER_RULES.MIN_ORDER_AMOUNT)} Required`
  } else if (isAboveMax) {
    checkoutButtonText = `Exceeds Max Limit (${formatCurrency(ORDER_RULES.MAX_ORDER_AMOUNT)})`
  }

  return (
    <div className="flex flex-col h-full bg-stone-card">
      {/* Header */}
      <div className="p-4 border-b border-stone-line">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Current Order</h2>
          {!isEmpty && (
            <button
              onClick={onClearCart}
              className="text-sm text-oxblood hover:underline"
              aria-label="Clear cart"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="text-sm text-charcoal/60">
          {isEmpty ? 'No items' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        </div>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEmpty ? (
          <CartEmpty />
        ) : (
          <div className="space-y-0">
            {cart.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                maxStock={getStockForProduct ? getStockForProduct(item.product.id) : undefined}
                onUpdateWeight={onUpdateWeight}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* POS Rule Policy Notices */}
      {isBelowMin && (
        <div className="mx-4 mb-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          <div className="font-semibold flex items-center gap-1">
            <span>⚠️</span> Store Minimum Order: {formatCurrency(ORDER_RULES.MIN_ORDER_AMOUNT)}
          </div>
          <div className="text-amber-700 mt-0.5">
            Add {formatCurrency(ORDER_RULES.MIN_ORDER_AMOUNT - totalAmount)} more to meet store checkout policy.
          </div>
        </div>
      )}

      {isAboveMax && (
        <div className="mx-4 mb-2 p-2.5 bg-red-50 border border-red-200 text-red-900 rounded-md text-xs">
          <div className="font-semibold flex items-center gap-1">
            <span>⛔</span> Exceeds Limit: {formatCurrency(ORDER_RULES.MAX_ORDER_AMOUNT)}
          </div>
          <div className="text-red-700 mt-0.5">
            Maximum transaction limit is {formatCurrency(ORDER_RULES.MAX_ORDER_AMOUNT)}. Please split into multiple orders.
          </div>
        </div>
      )}

      {/* Totals Summary */}
      {!isEmpty && (
        <div className="p-4 border-t border-stone-line bg-white space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60">Total Weight</span>
            <span className="font-medium">{formatWeight(totalWeight)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-charcoal/60">Items</span>
            <span className="font-medium">{itemCount}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-stone-line">
            <span>Total</span>
            <span className="text-oxblood">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <div className="p-4 border-t border-stone-line">
        <button
          onClick={onCheckout}
          disabled={!canCheckout}
          className={`btn-primary w-full py-4 text-base font-semibold ${
            !canCheckout && !isEmpty ? 'opacity-50 cursor-not-allowed bg-charcoal/40 hover:bg-charcoal/40' : ''
          }`}
          aria-label={checkoutButtonText}
        >
          {checkoutButtonText}
        </button>
      </div>
    </div>
  )
}
