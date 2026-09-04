import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '../utils/formatters'

/**
 * WeightKeypad - Touch-friendly numeric keypad for weight entry
 * Compact, responsive, and supports physical keyboard & numpad input
 * 
 * @param {number} initialWeight - Initial weight value
 * @param {number} productPrice - Optional price per kg to display live subtotal
 * @param {Function} onConfirm - Callback when weight is confirmed (weight)
 * @param {Function} onCancel - Callback when cancelled
 */
export default function WeightKeypad({
  initialWeight = 0,
  productPrice = 0,
  onConfirm,
  onCancel,
}) {
  const [display, setDisplay] = useState(() => {
    return initialWeight > 0 ? initialWeight.toString() : '0'
  })

  const currentWeight = parseFloat(display) || 0
  const subtotal = Math.round(currentWeight * Number(productPrice || 0) * 100) / 100

  const handleNumberClick = useCallback((num) => {
    setDisplay((prev) => {
      // Prevent multiple decimal points
      if (num === '.' && prev.includes('.')) return prev

      // Prevent leading zeros except when typing decimal
      if (prev === '0' && num !== '.') {
        return num
      }

      // Limit to 3 decimal places
      if (prev.includes('.')) {
        const [, decimals] = prev.split('.')
        if (decimals && decimals.length >= 3) return prev
      }

      // Limit max digits
      if (prev.length >= 7) return prev

      return prev + num
    })
  }, [])

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (prev.length <= 1 || prev === '0') {
        return '0'
      }
      return prev.slice(0, -1)
    })
  }, [])

  const handleClear = useCallback(() => {
    setDisplay('0')
  }, [])

  const handleQuickWeight = useCallback((weight) => {
    setDisplay(weight.toString())
  }, [])

  const handleConfirm = useCallback(() => {
    const weight = parseFloat(display)
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight greater than 0')
      return
    }
    onConfirm(weight)
  }, [display, onConfirm])

  // Keyboard shortcut support (Physical keyboard & POS Numpad)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleNumberClick(e.key)
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault()
        handleNumberClick('.')
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (onCancel) onCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNumberClick, handleBackspace, handleConfirm, onCancel])

  return (
    <div className="flex flex-col w-full">
      {/* Display Screen */}
      <div className="bg-stone-bg/80 px-6 py-4 border-b border-stone-line flex flex-col items-center justify-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-charcoal/50 mb-1">
          Measured Weight
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold text-charcoal font-display tracking-tight">
            {display}
          </span>
          <span className="text-xl font-medium text-charcoal/60">kg</span>
        </div>

        {/* Live Subtotal Preview */}
        {productPrice > 0 && (
          <div className="mt-1 text-sm font-semibold text-oxblood">
            {currentWeight > 0 ? (
              <span>
                {formatCurrency(subtotal)}{' '}
                <span className="text-xs text-charcoal/50 font-normal">
                  ({display} kg × {formatCurrency(productPrice)}/kg)
                </span>
              </span>
            ) : (
              <span className="text-xs text-charcoal/40 font-normal">
                Rate: {formatCurrency(productPrice)}/kg
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick Select Buttons */}
      <div className="px-4 py-2.5 bg-white border-b border-stone-line">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-charcoal/50 shrink-0">Quick:</span>
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            {[0.25, 0.5, 1, 2].map((weight) => {
              const isSelected = display === weight.toString()
              return (
                <button
                  key={weight}
                  type="button"
                  onClick={() => handleQuickWeight(weight)}
                  className={`py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    isSelected
                      ? 'bg-oxblood text-white border-oxblood shadow-sm'
                      : 'bg-stone-bg hover:bg-stone-line/60 text-charcoal border-stone-line'
                  }`}
                >
                  {weight}kg
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Numeric Keypad Grid */}
      <div className="p-3 sm:p-4 bg-white">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberClick(num.toString())}
              className="h-12 sm:h-13 bg-white hover:bg-stone-bg border border-stone-line rounded-lg text-xl sm:text-2xl font-bold text-charcoal transition-all active:scale-95 shadow-sm flex items-center justify-center"
              aria-label={`Digit ${num}`}
            >
              {num}
            </button>
          ))}

          {/* Bottom Row: Decimal, 0, Backspace */}
          <button
            type="button"
            onClick={() => handleNumberClick('.')}
            className="h-12 sm:h-13 bg-stone-bg/60 hover:bg-stone-bg border border-stone-line rounded-lg text-2xl font-bold text-charcoal transition-all active:scale-95 flex items-center justify-center"
            aria-label="Decimal"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleNumberClick('0')}
            className="h-12 sm:h-13 bg-white hover:bg-stone-bg border border-stone-line rounded-lg text-xl sm:text-2xl font-bold text-charcoal transition-all active:scale-95 shadow-sm flex items-center justify-center"
            aria-label="Digit 0"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 sm:h-13 bg-stone-bg/60 hover:bg-stone-bg border border-stone-line rounded-lg text-lg font-bold text-oxblood transition-all active:scale-95 flex items-center justify-center"
            aria-label="Backspace"
          >
            ⌫
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 sm:p-4 border-t border-stone-line bg-stone-bg/40 flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-3 rounded-lg border border-stone-line bg-white hover:bg-stone-bg text-sm font-semibold text-charcoal/70 transition-colors"
          title="Clear (reset to 0)"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 rounded-lg border border-stone-line bg-white hover:bg-stone-bg text-sm font-semibold text-charcoal transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={currentWeight <= 0}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-1.5 ${
            currentWeight > 0
              ? 'bg-oxblood hover:bg-oxblood/90 text-white active:scale-[0.98]'
              : 'bg-charcoal/20 text-charcoal/40 cursor-not-allowed'
          }`}
          aria-label="Confirm weight"
        >
          <span>Add to Order</span>
          {subtotal > 0 && <span className="opacity-90">• {formatCurrency(subtotal)}</span>}
        </button>
      </div>
    </div>
  )
}
