/**
 * CartEmpty - Empty cart state with illustration
 */
export default function CartEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Empty cart icon */}
      <div className="w-24 h-24 mb-4 text-charcoal/20">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-charcoal/70">Cart is empty</h3>
      <p className="text-sm text-charcoal/50 max-w-xs">
        Select products from the menu to add them to the cart
      </p>
    </div>
  )
}
