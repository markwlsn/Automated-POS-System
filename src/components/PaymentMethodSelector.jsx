/**
 * PaymentMethodSelector - Large button grid for payment method selection
 * Touch-friendly buttons for Cash, GCash, Maya, Bank Transfer
 * 
 * @param {Function} onSelectMethod - Callback when payment method is selected (method)
 * @param {Function} onCancel - Callback when cancelled
 */
export default function PaymentMethodSelector({ onSelectMethod, onCancel }) {
  const paymentMethods = [
    {
      id: 'cash',
      name: 'Cash',
      icon: '💵',
      description: 'Pay with cash',
      color: 'bg-sage/10 hover:bg-sage/20 border-sage/30',
    },
    {
      id: 'gcash',
      name: 'GCash',
      icon: '📱',
      description: 'Mobile wallet',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    {
      id: 'maya',
      name: 'Maya',
      icon: '💳',
      description: 'Mobile wallet',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: '🏦',
      description: 'Direct bank transfer',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Payment Method</h2>
        <p className="text-charcoal/60">Choose how the customer will pay</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {paymentMethods.map(method => (
          <button
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            className={`${method.color} border-2 rounded-lg p-6 transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[140px] flex flex-col items-center justify-center`}
            aria-label={`Pay with ${method.name}`}
          >
            <div className="text-5xl mb-3">{method.icon}</div>
            <div className="font-semibold text-lg mb-1">{method.name}</div>
            <div className="text-sm text-charcoal/60">{method.description}</div>
          </button>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="btn-secondary w-full py-3"
      >
        Back to Cart
      </button>
    </div>
  )
}
