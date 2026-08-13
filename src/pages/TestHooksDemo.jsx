import { useProducts } from '../hooks/useProducts'
import { useInventory } from '../hooks/useInventory'
import { formatCurrency, formatWeight } from '../utils/formatters'
import { calculateSubtotal } from '../utils/orderHelpers'

/**
 * Demo page to test hooks and utilities
 * Access via /test-hooks route (add to App.jsx temporarily)
 */
export default function TestHooksDemo() {
  const { products, categories, productsByCategory, loading: productsLoading } = useProducts()
  const { inventory, loading: inventoryLoading, getStockForProduct } = useInventory()

  if (productsLoading || inventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal/60 mb-2">Loading...</div>
          <div className="text-sm text-charcoal/40">
            Fetching products and inventory from Supabase
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-stone-bg">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Hooks & Utilities Test</h1>
        <p className="text-charcoal/60 mb-8">
          Testing useProducts, useInventory, and formatter utilities
        </p>

        {/* Categories Section */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Categories ({categories.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <span
                key={category.id}
                className="px-3 py-1 bg-oxblood/10 text-oxblood rounded-full text-sm"
              >
                {category.name} (Sort: {category.sort_order})
              </span>
            ))}
          </div>
        </section>

        {/* Products by Category Section */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Products by Category ({products.length} total)
          </h2>
          {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
            <div key={categoryName} className="mb-6 last:mb-0">
              <h3 className="font-semibold text-lg mb-3 text-oxblood">{categoryName}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryProducts.map(product => {
                  const stock = getStockForProduct(product.id)
                  const testWeight = 2.5
                  const testSubtotal = calculateSubtotal(testWeight, product.price_per_kg)

                  return (
                    <div key={product.id} className="border border-stone-line rounded-lg p-4">
                      <div className="font-medium mb-1">{product.name}</div>
                      <div className="text-sm text-charcoal/60 mb-2">
                        {formatCurrency(product.price_per_kg)}/kg
                      </div>
                      <div className="text-sm mb-2">
                        <span className="font-medium">Stock:</span> {formatWeight(stock)}
                      </div>
                      <div className="text-xs bg-sage/10 text-sage-dark px-2 py-1 rounded">
                        Test calc: {formatWeight(testWeight)} × {formatCurrency(product.price_per_kg)}{' '}
                        = {formatCurrency(testSubtotal)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Inventory Section */}
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">
            Inventory Status ({inventory.length} items)
          </h2>
          <div className="text-sm text-charcoal/60 mb-4">
            Real-time updates enabled - inventory changes will reflect automatically
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-line">
                <tr className="text-left">
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 font-semibold">Category</th>
                  <th className="pb-2 font-semibold text-right">Stock</th>
                  <th className="pb-2 font-semibold text-right">Threshold</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(inv => {
                  const isLow = inv.stock_kg < inv.low_stock_threshold_kg
                  const isOut = inv.stock_kg <= 0

                  return (
                    <tr key={inv.id} className="border-b border-stone-line/50">
                      <td className="py-3">{inv.product?.name || 'Unknown'}</td>
                      <td className="py-3 text-charcoal/60">
                        {inv.product?.category?.name || 'N/A'}
                      </td>
                      <td className="py-3 text-right font-medium">
                        {formatWeight(inv.stock_kg)}
                      </td>
                      <td className="py-3 text-right text-charcoal/60">
                        {formatWeight(inv.low_stock_threshold_kg)}
                      </td>
                      <td className="py-3">
                        {isOut ? (
                          <span className="text-xs px-2 py-1 bg-oxblood/10 text-oxblood rounded">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-xs px-2 py-1 bg-mustard/10 text-mustard-dark rounded">
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-sage/10 text-sage-dark rounded">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Console Instructions */}
        <div className="mt-8 p-4 bg-charcoal/5 rounded-lg text-sm">
          <div className="font-medium mb-2">✅ Hooks are working!</div>
          <div className="text-charcoal/60">
            Open browser console to see detailed logs. Real-time updates are active - try updating
            inventory in Supabase dashboard to see live changes.
          </div>
        </div>
      </div>
    </div>
  )
}
