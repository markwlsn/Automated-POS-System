import CartItemRow from './CartItemRow'
import CartEmpty from './CartEmpty'
import { formatCurrency, formatWeight } from '../utils/formatters'

/**
 * CartSummary - Sticky cart panel with checkout actions
 * Shows cart items, totals, and proceed to payment button
 * 
 * @param {Array} cart - Array of cart items
 * @param {Function} onUpdateWeight - Callback to update item weight
 * @param {Function} onRemoveItem - Callback to remove item
 * @param {Function} onClearCart - Callback to clear entire cart
 * @param {Function} onCheckout - Callback when proceeding to payment
 * @param {number} totalWeight - Total weight of all items
 * @param {number} totalAmount - Total amount of all items
 */
export default function CartSummary({
  cart,
  onUpdateWeight,
  onRemoveItem,
  onClearCart,
  onCheckout,
  totalWeight,
  totalAmount,
}) {
  const itemCount = cart.length
  const isEmpty = itemCount === 0

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
                onUpdateWeight={onUpdateWeight}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

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
          disabled={isEmpty}
          className="btn-primary w-full py-4 text-lg"
          aria-label={isEmpty ? 'Add items to proceed' : 'Proceed to payment'}
        >
          {isEmpty ? 'Add Items to Proceed' : 'Proceed to Payment'}
        </button>
      </div>
    </div>
  )
}
