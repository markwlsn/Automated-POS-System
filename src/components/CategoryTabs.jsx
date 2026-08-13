import { useState } from 'react'

/**
 * CategoryTabs - Horizontal scrolling tabs for product category filtering
 * Touch-friendly with smooth scrolling for mobile/tablet
 * 
 * @param {Array} categories - Array of category objects with { id, name }
 * @param {string} selectedCategoryId - Currently selected category ID (null for "All")
 * @param {Function} onSelectCategory - Callback when category is selected (categoryId)
 */
export default function CategoryTabs({ categories, selectedCategoryId, onSelectCategory }) {
  const [showAll, setShowAll] = useState(!selectedCategoryId)

  function handleSelectAll() {
    setShowAll(true)
    onSelectCategory(null)
  }

  function handleSelectCategory(categoryId) {
    setShowAll(false)
    onSelectCategory(categoryId)
  }

  return (
    <div className="border-b border-stone-line bg-stone-card">
      <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-stone-line scrollbar-track-transparent">
        <div className="flex gap-1 p-2 min-w-max">
          {/* All Products Tab */}
          <button
            onClick={handleSelectAll}
            className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap min-w-[120px] text-center ${
              showAll
                ? 'bg-oxblood text-white shadow-sm'
                : 'bg-white text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal'
            }`}
            aria-pressed={showAll}
            aria-label="Show all products"
          >
            All Products
          </button>

          {/* Category Tabs */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelectCategory(category.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap min-w-[120px] text-center ${
                selectedCategoryId === category.id
                  ? 'bg-oxblood text-white shadow-sm'
                  : 'bg-white text-charcoal/70 hover:bg-charcoal/5 hover:text-charcoal'
              }`}
              aria-pressed={selectedCategoryId === category.id}
              aria-label={`Filter by ${category.name}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
