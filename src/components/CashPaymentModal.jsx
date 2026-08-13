import { useState } from 'react'
import { formatCurrency } from '../utils/formatters'
import { calculateChange, isCashSufficient } from '../utils/orderHelpers'

/**
 * CashPaymentModal - Cash payment with change calculation
 * 
 * @param {number} totalAmount - Order total amount
 * @param {Function} onConfirm - Callback when payment confirmed (cashReceived)
 * @param {Function} onCancel - Callback when cancelled
 */
export default function CashPaymentModal({ totalAmount, onConfirm, onCancel }) {
  const [cashReceived, setCashReceived] = useState('')
  const [error, setError] = useState('')

  const cashAmount = parseFloat(cashReceived) || 0
  const change = calculateChange(totalAmount, cashAmount)
  const isSufficient = isCashSufficient(totalAmount, cashAmount)

  function handleQuickAmount(amount) {
    setCashReceived(amount.toString())
    setError('')
  }

  function handleConfirm() {
    if (!isSufficient) {
      setError('Insufficient cash received')
      return
    }
    onConfirm(cashAmount)
  }

  // Quick amounts based on total (rounded up to nearest 50/100/500)
  const quickAmounts = [
    Math.ceil(totalAmount / 50) * 50,
    Math.ceil(totalAmount / 100) * 100,
    Math.ceil(totalAmount / 500) * 500,
    Math.ceil(totalAmount / 1000) * 1000,
  ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-stone-line">
          <h3 className="text-xl font-bold mb-1">Cash Payment</h3>
          <p className="text-charcoal/60">Enter cash received from customer</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Total Amount */}
          <div className="bg-stone-bg p-4 rounded-lg">
            <div className="text-sm text-charcoal/60 mb-1">Order Total</div>
            <div className="text-2xl font-bold text-oxblood">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          {/* Cash Received Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Cash Received</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cashReceived}
              onChange={e => {
                setCashReceived(e.target.value)
                setError('')
              }}
              placeholder="0.00"
              className="input-field text-xl font-semibold"
              autoFocus
            />
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <div className="text-sm text-charcoal/60 mb-2">Quick Select</div>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => handleQuickAmount(amount)}
                  className="btn-secondary py-2 text-sm"
                >
                  ₱{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Change Calculation */}
          {cashAmount > 0 && (
            <div className={`p-4 rounded-lg ${isSufficient ? 'bg-sage/10' : 'bg-oxblood/10'}`}>
              <div className="text-sm font-medium mb-1">
                {isSufficient ? 'Change' : 'Insufficient'}
              </div>
              <div className={`text-2xl font-bold ${isSufficient ? 'text-sage-dark' : 'text-oxblood'}`}>
                {isSufficient ? formatCurrency(change) : `Need ${formatCurrency(totalAmount - cashAmount)} more`}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-oxblood/10 border border-oxblood/30 rounded text-sm text-oxblood">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-stone-line grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="btn-secondary py-3">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isSufficient || cashAmount === 0}
            className="btn-primary py-3"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}
