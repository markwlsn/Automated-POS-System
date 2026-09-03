import { useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useInventory } from '../hooks/useInventory'
import CategoryTabs from '../components/CategoryTabs'
import ProductCard from '../components/ProductCard'
import StockBadge from '../components/StockBadge'
import { formatWeight } from '../utils/formatters'

/**
 * Demo page to test UI components (Task 2)
 * Access via /test-components route
 */
export default function TestComponentsDemo() {
  const { products, categories, loading: productsLoading } = useProducts()
  const { inventory, loading: inventoryLoading, getStockForProduct } = useInventory()
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  if (productsLoading || inventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-charcoal/60 mb-2">Loading...</div>
          <div className="text-sm text-charcoal/40">Fetching data from Supabase</div>
        </div>
      </div>
    )
  }

  // Filter products by selected category
  const filteredProducts = selectedCategoryId
    ? products.filter(p => p.category?.id === selectedCategoryId)
    : products

  // Find inventory item for each product
  const productsWithStock = filteredProducts.map(product => {
    const inventoryItem = inventory.find(inv => inv.product_id === product.id)
    return {
      product,
      stockKg: inventoryItem?.stock_kg || 0,
      thresholdKg: inventoryItem?.low_stock_threshold_kg || 5,
    }
  })

  return (
    <div className="min-h-screen bg-stone-bg">
      {/* Header */}
      <header className="bg-white border-b border-stone-line p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">UI Components Test</h1>
          <p className="text-charcoal/60 text-sm">
            Testing ProductCard, CategoryTabs, and StockBadge components
          </p>
        </div>
      </header>

      {/* Category Tabs */}
      <CategoryTabs
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-4 text-sm text-charcoal/60">
          Showing {productsWithStock.length} products
          {selectedCategoryId && ` in ${categories.find(c => c.id === selectedCategoryId)?.name}`}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {productsWithStock.map(({ product, stockKg, thresholdKg }) => (
            <ProductCard
              key={product.id}
              product={product}
              stockKg={stockKg}
              thresholdKg={thresholdKg}
              onClick={(p) => console.log('Product selected:', p.name)}
            />
          ))}
        </div>

        {/* Stock Badge Examples */}
        <section className="mt-12 card p-6">
          <h2 className="text-xl font-semibold mb-4">StockBadge Examples</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm text-charcoal/60">In Stock (40kg):</div>
              <StockBadge stockKg={40} thresholdKg={5} size="sm" />
              <StockBadge stockKg={40} thresholdKg={5} size="md" />
              <StockBadge stockKg={40} thresholdKg={5} size="lg" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm text-charcoal/60">Low Stock (3kg):</div>
              <StockBadge stockKg={3} thresholdKg={5} size="sm" />
              <StockBadge stockKg={3} thresholdKg={5} size="md" />
              <StockBadge stockKg={3} thresholdKg={5} size="lg" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm text-charcoal/60">Out of Stock (0kg):</div>
              <StockBadge stockKg={0} thresholdKg={5} size="sm" />
              <StockBadge stockKg={0} thresholdKg={5} size="md" />
              <StockBadge stockKg={0} thresholdKg={5} size="lg" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 text-sm text-charcoal/60">Icon only:</div>
              <StockBadge stockKg={40} thresholdKg={5} size="sm" showText={false} />
              <StockBadge stockKg={3} thresholdKg={5} size="md" showText={false} />
              <StockBadge stockKg={0} thresholdKg={5} size="lg" showText={false} />
            </div>
          </div>
        </section>

        {/* Inventory List */}
        <section className="mt-6 card p-6">
          <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-line">
                <tr className="text-left">
                  <th className="pb-2 font-semibold">Product</th>
                  <th className="pb-2 font-semibold">Category</th>
                  <th className="pb-2 font-semibold text-right">Stock</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(inv => (
                  <tr key={inv.id} className="border-b border-stone-line/50">
                    <td className="py-3">{inv.product?.name || 'Unknown'}</td>
                    <td className="py-3 text-charcoal/60">{inv.product?.category?.name || 'N/A'}</td>
                    <td className="py-3 text-right font-medium">{formatWeight(inv.stock_kg)}</td>
                    <td className="py-3">
                      <StockBadge stockKg={inv.stock_kg} thresholdKg={inv.low_stock_threshold_kg} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Success Message */}
        <div className="mt-8 p-4 bg-sage/10 border border-sage/30 rounded-lg text-sm">
          <div className="font-medium text-sage-dark mb-2">✅ Task 2 Components Working!</div>
          <ul className="text-charcoal/70 space-y-1 list-disc list-inside">
            <li>ProductCard - Touch-friendly, responsive product cards</li>
            <li>CategoryTabs - Horizontal scrolling category filter</li>
            <li>StockBadge - Color-coded stock status indicators</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
