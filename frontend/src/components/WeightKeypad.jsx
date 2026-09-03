import { useState } from 'react'

/**
 * WeightKeypad - Touch-friendly numeric keypad for weight entry
 * Large buttons (80x80px minimum) optimized for tablet/countertop POS
 * 
 * @param {number} initialWeight - Initial weight value
 * @param {Function} onConfirm - Callback when weight is confirmed (weight)
 * @param {Function} onCancel - Callback when cancelled
 */
export default function WeightKeypad({ initialWeight = 0, onConfirm, onCancel }) {
  const [display, setDisplay] = useState(initialWeight.toString())

  function handleNumberClick(num) {
    // Prevent multiple decimal points
    if (num === '.' && display.includes('.')) return
    
    // Prevent leading zeros except for decimals
    if (display === '0' && num !== '.') {
      setDisplay(num)
      return
    }

    setDisplay(display + num)
  }

  function handleBackspace() {
    if (display.length <= 1) {
      setDisplay('0')
    } else {
      setDisplay(display.slice(0, -1))
    }
  }

  function handleClear() {
    setDisplay('0')
  }

  function handleQuickWeight(weight) {
    setDisplay(weight.toString())
  }

  function handleConfirm() {
    const weight = parseFloat(display)
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight')
      return
    }
    onConfirm(weight)
  }

  const currentWeight = parseFloat(display) || 0

  return (
    <div className="flex flex-col h-full">
      {/* Display */}
      <div className="bg-charcoal/5 p-6 border-b border-stone-line">
        <div className="text-center">
          <div className="text-sm text-charcoal/60 mb-2">Enter Weight</div>
          <div className="text-5xl font-bold text-charcoal font-display mb-1">
            {display}
          </div>
          <div className="text-lg text-charcoal/60">kilograms</div>
        </div>
      </div>

      {/* Quick Weight Buttons */}
      <div className="p-4 border-b border-stone-line">
        <div className="text-xs text-charcoal/60 mb-2">Quick Select</div>
        <div className="grid grid-cols-4 gap-2">
          {[0.25, 0.5, 1, 2].map(weight => (
            <button
              key={weight}
              onClick={() => handleQuickWeight(weight)}
              className="btn-secondary py-2 text-sm"
            >
              {weight}kg
            </button>
          ))}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-3 gap-3 h-full">
          {/* Numbers 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="bg-white hover:bg-charcoal/5 border-2 border-stone-line rounded-lg text-2xl font-semibold transition-colors active:scale-95 min-h-[80px]"
              aria-label={`Enter ${num}`}
            >
              {num}
            </button>
          ))}

          {/* Bottom row: decimal, 0, backspace */}
          <button
            onClick={() => handleNumberClick('.')}
            className="bg-white hover:bg-charcoal/5 border-2 border-stone-line rounded-lg text-2xl font-semibold transition-colors active:scale-95 min-h-[80px]"
            aria-label="Decimal point"
          >
            .
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="bg-white hover:bg-charcoal/5 border-2 border-stone-line rounded-lg text-2xl font-semibold transition-colors active:scale-95 min-h-[80px]"
            aria-label="Enter 0"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="bg-white hover:bg-charcoal/5 border-2 border-stone-line rounded-lg text-xl font-semibold transition-colors active:scale-95 min-h-[80px]"
            aria-label="Backspace"
          >
            ⌫
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-stone-line grid grid-cols-2 gap-3">
        <button
          onClick={handleClear}
          className="btn-secondary py-4 text-lg"
          aria-label="Clear"
        >
          Clear
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary py-4 text-lg"
          aria-label="Cancel"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={currentWeight <= 0}
          className="btn-primary py-4 text-lg col-span-2"
          aria-label={`Confirm weight ${currentWeight} kilograms`}
        >
          Confirm ({currentWeight.toFixed(2)} kg)
        </button>
      </div>
    </div>
  )
}
