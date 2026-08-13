/**
 * StockBadge - Visual indicator for product stock status
 * Shows color-coded badge based on stock level vs threshold
 * 
 * @param {number} stockKg - Current stock in kilograms
 * @param {number} thresholdKg - Low stock threshold in kilograms
 * @param {string} size - Badge size: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} showText - Whether to show text label (default: true)
 */
export default function StockBadge({ stockKg, thresholdKg, size = 'md', showText = true }) {
  // Determine stock status
  const isOutOfStock = stockKg <= 0
  const isLowStock = stockKg > 0 && stockKg < thresholdKg

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  // Status configurations
  const statusConfig = {
    outOfStock: {
      className: 'bg-oxblood/10 text-oxblood border border-oxblood/30',
      text: 'Out of Stock',
      ariaLabel: 'Out of stock',
      icon: '●',
    },
    lowStock: {
      className: 'bg-mustard/10 text-mustard-dark border border-mustard/30',
      text: 'Low Stock',
      ariaLabel: `Low stock: ${stockKg.toFixed(2)}kg remaining`,
      icon: '▲',
    },
    inStock: {
      className: 'bg-sage/10 text-sage-dark border border-sage/30',
      text: 'In Stock',
      ariaLabel: `In stock: ${stockKg.toFixed(2)}kg available`,
      icon: '✓',
    },
  }

  // Select appropriate status
  let status
  if (isOutOfStock) {
    status = statusConfig.outOfStock
  } else if (isLowStock) {
    status = statusConfig.lowStock
  } else {
    status = statusConfig.inStock
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${status.className} ${sizeClasses[size]}`}
      role="status"
      aria-label={status.ariaLabel}
    >
      <span aria-hidden="true">{status.icon}</span>
      {showText && <span>{status.text}</span>}
    </span>
  )
}
