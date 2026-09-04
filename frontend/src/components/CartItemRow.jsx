import { useState } from 'react'
import { formatCurrency, formatWeight } from '../utils/formatters'
import WeightKeypad from './WeightKeypad'

/**
 * CartItemRow - Editable cart line item
 * Shows product info with inline weight editing via modal keypad
 * 
 * @param {Object} item - Cart item object
 * @param {number} maxStock - Maximum available stock in kilograms
 * @param {Function} onUpdateWeight - Callback to update weight (itemId, newWeight)
 * @param {Function} onRemove - Callback to remove item (itemId)
 */
export default function CartItemRow({ item, maxStock, onUpdateWeight, onRemove }) {
  const [showKeypad, setShowKeypad] = useState(false)

  function handleWeightConfirm(newWeight) {
    if (maxStock !== undefined && newWeight > maxStock) {
      alert(`Insufficient stock. Only ${Number(maxStock).toFixed(2)}kg available`)
      return
    }
    onUpdateWeight(item.id, newWeight)
    setShowKeypad(false)
  }

  const unitPrice = Number(item.unit_price ?? item.unitPrice ?? item.product?.price_per_kg ?? item.product?.pricePerKg ?? 0)
  const weight = Number(item.weight_kg ?? item.weightKg ?? 0)
  const subtotal = Number(item.subtotal ?? 0)

  return (
    <>
      <div className="flex items-center gap-3 py-3 border-b border-stone-line last:border-b-0">
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{item.product.name}</div>
          <div className="text-xs text-charcoal/60">
            {formatCurrency(unitPrice)}/kg
          </div>
        </div>

        {/* Weight (clickable to edit) */}
        <button
          onClick={() => setShowKeypad(true)}
          className="px-3 py-1.5 bg-charcoal/5 hover:bg-charcoal/10 rounded text-sm font-medium transition-colors"
          aria-label={`Edit weight for ${item.product.name}`}
        >
          {formatWeight(weight)}
        </button>

        {/* Subtotal */}
        <div className="text-sm font-semibold min-w-[80px] text-right">
          {formatCurrency(subtotal)}
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-oxblood hover:bg-oxblood/10 rounded transition-colors"
          aria-label={`Remove ${item.product.name} from cart`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Weight Keypad Modal */}
      {showKeypad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-stone-bg rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-stone-card border-b border-stone-line p-4">
              <h3 className="font-semibold text-lg">{item.product.name}</h3>
              <p className="text-sm text-charcoal/60">
                Adjust weight {maxStock !== undefined ? `(Max: ${Number(maxStock).toFixed(2)}kg)` : ''}
              </p>
            </div>
            <WeightKeypad
              initialWeight={weight}
              onConfirm={handleWeightConfirm}
              onCancel={() => setShowKeypad(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
