import { useState } from 'react'
import { formatCurrency } from '../utils/formatters'

/**
 * EWalletPaymentModal - GCash/Maya payment with reference number entry
 * 
 * @param {string} method - Payment method ('gcash' or 'maya')
 * @param {number} totalAmount - Order total amount
 * @param {Function} onConfirm - Callback when payment confirmed (referenceNumber)
 * @param {Function} onCancel - Callback when cancelled
 */
export default function EWalletPaymentModal({ method, totalAmount, onConfirm, onCancel }) {
  const [referenceNumber, setReferenceNumber] = useState('')
  const [error, setError] = useState('')

  const methodName = method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : 'E-Wallet'

  function handleConfirm() {
    if (!referenceNumber.trim()) {
      setError('Reference number is required')
      return
    }

    if (referenceNumber.trim().length < 6) {
      setError('Reference number too short')
      return
    }

    onConfirm(referenceNumber.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-stone-line">
          <h3 className="text-xl font-bold mb-1">{methodName} Payment</h3>
          <p className="text-charcoal/60">Enter payment reference number</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Total Amount */}
          <div className="bg-stone-bg p-4 rounded-lg">
            <div className="text-sm text-charcoal/60 mb-1">Order Total</div>
            <div className="text-2xl font-bold text-oxblood">
              {formatCurrency(totalAmount)}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
            <div className="font-medium mb-2">Payment Instructions:</div>
            <ol className="list-decimal list-inside space-y-1 text-charcoal/70">
              <li>Customer sends payment via {methodName}</li>
              <li>Customer provides reference/transaction number</li>
              <li>Enter reference number below</li>
              <li>Confirm payment to complete order</li>
            </ol>
          </div>

          {/* Reference Number Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Reference / Transaction Number *
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={e => {
                setReferenceNumber(e.target.value)
                setError('')
              }}
              placeholder="e.g., 1234567890"
              className="input-field"
              autoFocus
            />
            <p className="text-xs text-charcoal/50 mt-1">
              Enter the {methodName} reference number provided by the customer
            </p>
          </div>

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
            disabled={!referenceNumber.trim()}
            className="btn-primary py-3"
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  )
}
