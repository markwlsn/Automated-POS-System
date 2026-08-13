import { formatCurrency } from '../utils/formatters'
import StockBadge from './StockBadge'

/**
 * ProductCard - Touch-friendly product card for POS interface
 * Minimum 120x120px for easy touch interaction
 * 
 * @param {Object} product - Product object with { id, name, price_per_kg, category }
 * @param {number} stockKg - Current stock in kilograms
 * @param {number} thresholdKg - Low stock threshold
 * @param {Function} onClick - Callback when product is selected
 * @param {boolean} disabled - Whether the product is disabled (out of stock)
 */
export default function ProductCard({ product, stockKg, thresholdKg, onClick, disabled = false }) {
  const isOutOfStock = stockKg <= 0

  return (
    <button
      onClick={() => !disabled && onClick(product)}
      disabled={disabled || isOutOfStock}
      className={`card p-4 w-full min-h-[140px] flex flex-col justify-between transition-all ${
        disabled || isOutOfStock
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:shadow-md hover:border-oxblood/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
      }`}
      aria-label={`Select ${product.name}, ${formatCurrency(product.price_per_kg)} per kilogram`}
      aria-disabled={disabled || isOutOfStock}
    >
      {/* Product Name */}
      <div className="text-left mb-2">
        <h3 className="font-semibold text-base leading-tight line-clamp-2">{product.name}</h3>
        <p className="text-xs text-charcoal/50 mt-0.5">{product.category?.name || 'Uncategorized'}</p>
      </div>

      {/* Price and Stock */}
      <div className="mt-auto">
        <div className="text-lg font-bold text-oxblood mb-2">
          {formatCurrency(product.price_per_kg)}
          <span className="text-sm font-normal text-charcoal/60">/kg</span>
        </div>

        {/* Stock Badge */}
        <StockBadge stockKg={stockKg} thresholdKg={thresholdKg} size="sm" showText={false} />
      </div>
    </button>
  )
}
