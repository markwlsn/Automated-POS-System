import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { reportsApi, inventoryApi, ordersApi } from '../../api/client'
import { CURRENT_BRANCH_ID, ORDER_RULES } from '../../config'
import { formatCurrency, formatWeight } from '../../utils/formatters'
import StockBadge from '../../components/StockBadge'

export default function OwnerDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState(null)
  const [inventory, setInventory] = useState([])
  const [rules, setRules] = useState(ORDER_RULES)
  const [inventoryFilter, setInventoryFilter] = useState('all') // 'all' | 'alerts'
  const [searchQuery, setSearchQuery] = useState('')

  // Restock Modal State
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [adjustStockAmount, setAdjustStockAmount] = useState('')
  const [adjustThreshold, setAdjustThreshold] = useState('')
  const [savingStock, setSavingStock] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const [summaryRes, inventoryRes, rulesRes] = await Promise.allSettled([
        reportsApi.getSummary({ branchId: CURRENT_BRANCH_ID }),
        inventoryApi.getInventory(CURRENT_BRANCH_ID),
        ordersApi.getOrderRules(),
      ])

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value)
      }
      if (inventoryRes.status === 'fulfilled') {
        setInventory(inventoryRes.value || [])
      }
      if (rulesRes.status === 'fulfilled') {
        setRules(rulesRes.value || ORDER_RULES)
      }
    } catch (err) {
      console.error('Failed to load owner dashboard data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadDashboardData()
  }

  function openRestockModal(item) {
    setSelectedProduct(item)
    setAdjustStockAmount(String(item.stockKg))
    setAdjustThreshold(String(item.lowStockThresholdKg))
    setSaveSuccessMsg('')
  }

  function handleQuickAddStock(additionalKg) {
    const current = parseFloat(adjustStockAmount) || 0
    setAdjustStockAmount((current + additionalKg).toFixed(2))
  }

  async function handleSaveStock(e) {
    e.preventDefault()
    if (!selectedProduct) return

    const stockKg = parseFloat(adjustStockAmount)
    const lowStockThresholdKg = parseFloat(adjustThreshold)

    if (isNaN(stockKg) || stockKg < 0) {
      alert('Please enter a valid non-negative stock quantity')
      return
    }

    setSavingStock(true)
    try {
      await inventoryApi.updateStock(
        selectedProduct.productId,
        {
          stockKg,
          lowStockThresholdKg: isNaN(lowStockThresholdKg) ? undefined : lowStockThresholdKg,
        },
        CURRENT_BRANCH_ID
      )

      setSaveSuccessMsg(`Stock updated for ${selectedProduct.productName}!`)

      // Refresh inventory list and reports
      const updated = await inventoryApi.getInventory(CURRENT_BRANCH_ID)
      setInventory(updated || [])

      const updatedSummary = await reportsApi.getSummary({ branchId: CURRENT_BRANCH_ID })
      setSummary(updatedSummary)

      setTimeout(() => {
        setSelectedProduct(null)
      }, 1000)
    } catch (err) {
      alert(`Failed to update stock: ${err.message}`)
    } finally {
      setSavingStock(false)
    }
  }

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch =
      (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (inventoryFilter === 'alerts') {
      return item.isLowStock || item.isOutOfStock
    }
    return true
  })

  // Payment method formatting
  const paymentMethods = summary?.salesByPaymentMethod || {}
  const totalSalesFromMethods = Object.values(paymentMethods).reduce((sum, v) => sum + v, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-oxblood border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-charcoal/60 font-medium">Loading Owner Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-bg text-charcoal flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-stone-line sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🥩</span>
              <h1 className="text-2xl font-bold tracking-tight">Owner Management Portal</h1>
            </div>
            <p className="text-xs text-charcoal/60 mt-0.5">
              Dela Cruz Meat Shop • Poblacion Main Branch • Welcome, {profile?.full_name || 'Owner'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <span>🔄</span> {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => navigate('/staff')}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <span>🛒</span> Staff Counter POS
            </button>
            <button
              onClick={signOut}
              className="btn-secondary text-sm text-charcoal/70 hover:text-oxblood"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-white border border-stone-line shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
              Total Revenue
            </div>
            <div className="text-2xl font-extrabold text-oxblood">
              {formatCurrency(summary?.totalSales || 0)}
            </div>
            <div className="text-xs text-charcoal/50 mt-1">Today's completed sales</div>
          </div>

          <div className="card p-5 bg-white border border-stone-line shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
              Total Transactions
            </div>
            <div className="text-2xl font-extrabold text-charcoal">
              {summary?.totalOrders || 0}
            </div>
            <div className="text-xs text-charcoal/50 mt-1">Orders processed</div>
          </div>

          <div className="card p-5 bg-white border border-stone-line shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
              Average Order Value
            </div>
            <div className="text-2xl font-extrabold text-charcoal">
              {formatCurrency(summary?.averageOrderValue || 0)}
            </div>
            <div className="text-xs text-charcoal/50 mt-1">Per transaction average</div>
          </div>

          <div className="card p-5 bg-white border border-stone-line shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-1">
              Low Stock Alerts
            </div>
            <div
              className={`text-2xl font-extrabold ${
                (summary?.lowStockCount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {summary?.lowStockCount || 0}
            </div>
            <div className="text-xs text-charcoal/50 mt-1">
              {(summary?.lowStockCount || 0) > 0 ? 'Items below threshold' : 'All cuts well-stocked'}
            </div>
          </div>
        </div>

        {/* Row 2: Sales Breakdown, Top Products & Store Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods Breakdown */}
          <div className="card p-5 bg-white border border-stone-line shadow-xs">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <span>💳</span> Revenue by Payment Method
            </h3>
            {Object.keys(paymentMethods).length === 0 ? (
              <p className="text-sm text-charcoal/50 py-4">No completed payments recorded yet today.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(paymentMethods).map(([method, amount]) => {
                  const percent =
                    totalSalesFromMethods > 0
                      ? Math.round((amount / totalSalesFromMethods) * 100)
                      : 0
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium text-charcoal">
                          {method.replace('_', ' ')}
                        </span>
                        <span className="text-charcoal/80 font-semibold">
                          {formatCurrency(amount)} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-bg h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            method === 'cash'
                              ? 'bg-emerald-600'
                              : method === 'gcash'
                              ? 'bg-blue-600'
                              : method === 'maya'
                              ? 'bg-teal-600'
                              : 'bg-purple-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Selling Meat Cuts */}
          <div className="card p-5 bg-white border border-stone-line shadow-xs">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <span>🔥</span> Top-Selling Cuts Today
            </h3>
            {!summary?.topProducts || summary.topProducts.length === 0 ? (
              <p className="text-sm text-charcoal/50 py-4">No cut sales data recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-charcoal/50 border-b border-stone-line">
                      <th className="pb-2">Cut</th>
                      <th className="pb-2 text-right">Sold</th>
                      <th className="pb-2 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-line/60">
                    {summary.topProducts.slice(0, 5).map(prod => (
                      <tr key={prod.productId}>
                        <td className="py-2.5 font-medium">{prod.name}</td>
                        <td className="py-2.5 text-right text-charcoal/70">
                          {formatWeight(prod.totalKg)}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-oxblood">
                          {formatCurrency(prod.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Store Policy & POS Order Rules */}
          <div className="card p-5 bg-stone-card border border-stone-line shadow-xs">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-charcoal">
              <span>⚖️</span> POS Store Rules & Laws
            </h3>
            <p className="text-xs text-charcoal/60 mb-4">
              Enforced automatically across all counter checkouts and customer kiosks to protect cashiers, inventory, and revenue.
            </p>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-stone-line">
                <span className="text-charcoal/70">Min. Order per Ticket:</span>
                <span className="font-bold text-charcoal">
                  {formatCurrency(rules.MIN_ORDER_AMOUNT || 50)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-line">
                <span className="text-charcoal/70">Max. Order per Ticket:</span>
                <span className="font-bold text-charcoal">
                  {formatCurrency(rules.MAX_ORDER_AMOUNT || 50000)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-line">
                <span className="text-charcoal/70">Daily Branch Capacity:</span>
                <span className="font-bold text-charcoal">
                  {rules.MAX_DAILY_BRANCH_ORDERS || 500} orders/day
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-stone-line">
                <span className="text-charcoal/70">Customer Daily Limit:</span>
                <span className="font-bold text-charcoal">
                  {rules.MAX_DAILY_CUSTOMER_ORDERS || 10} orders/day
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-charcoal/70">Item Weight Bounds:</span>
                <span className="font-bold text-charcoal">
                  {rules.MIN_ITEM_WEIGHT_KG || 0.05} kg - {rules.MAX_ITEM_WEIGHT_KG || 100} kg
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Live Branch Inventory Management Table */}
        <div className="card bg-white border border-stone-line shadow-xs overflow-hidden">
          <div className="p-5 border-b border-stone-line flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>📦</span> Branch Inventory & Stock Controls
              </h2>
              <p className="text-xs text-charcoal/60 mt-0.5">
                Manage stock levels and adjust threshold notifications for Main Branch
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Filter meat cuts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field text-sm py-1.5 px-3 w-48"
              />

              {/* Filter Tabs */}
              <div className="inline-flex rounded-md shadow-xs bg-stone-bg p-0.5">
                <button
                  onClick={() => setInventoryFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    inventoryFilter === 'all'
                      ? 'bg-white text-charcoal shadow-xs'
                      : 'text-charcoal/60 hover:text-charcoal'
                  }`}
                >
                  All Cuts ({inventory.length})
                </button>
                <button
                  onClick={() => setInventoryFilter('alerts')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    inventoryFilter === 'alerts'
                      ? 'bg-white text-oxblood shadow-xs'
                      : 'text-charcoal/60 hover:text-charcoal'
                  }`}
                >
                  Alerts ({inventory.filter(i => i.isLowStock || i.isOutOfStock).length})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-bg/60 border-b border-stone-line text-xs font-semibold text-charcoal/60 uppercase">
                <tr>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price / kg</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Alert Threshold</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-line">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-charcoal/50">
                      No products match your inventory filter.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-stone-bg/30 transition-colors">
                      <td className="p-4 font-semibold text-charcoal">{item.productName}</td>
                      <td className="p-4 text-charcoal/70">{item.categoryName}</td>
                      <td className="p-4 font-medium text-charcoal">
                        {formatCurrency(item.pricePerKg)}/kg
                      </td>
                      <td className="p-4 font-bold">
                        <span
                          className={
                            item.isOutOfStock
                              ? 'text-oxblood font-extrabold'
                              : item.isLowStock
                              ? 'text-amber-600 font-bold'
                              : 'text-charcoal'
                          }
                        >
                          {formatWeight(item.stockKg)}
                        </span>
                      </td>
                      <td className="p-4 text-charcoal/60">{formatWeight(item.lowStockThresholdKg)}</td>
                      <td className="p-4">
                        <StockBadge stockKg={item.stockKg} thresholdKg={item.lowStockThresholdKg} />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openRestockModal(item)}
                          className="btn-secondary text-xs py-1.5 px-3 hover:border-oxblood hover:text-oxblood font-semibold"
                        >
                          Restock / Adjust
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Restock / Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-line animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-line flex items-center justify-between bg-stone-card">
              <div>
                <h3 className="font-bold text-lg text-charcoal">Adjust Meat Stock</h3>
                <p className="text-xs text-charcoal/60 mt-0.5">
                  {selectedProduct.productName} ({selectedProduct.categoryName})
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full hover:bg-stone-bg text-charcoal/50 hover:text-charcoal flex items-center justify-center text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="p-6 space-y-4">
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-sm font-semibold flex items-center gap-2">
                  <span>✓</span> {saveSuccessMsg}
                </div>
              )}

              {/* Quick Restock Buttons */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/60 mb-2">
                  Quick Add Stock (kg)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAddStock(5)}
                    className="btn-secondary text-xs py-2 font-bold hover:border-oxblood"
                  >
                    +5 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddStock(10)}
                    className="btn-secondary text-xs py-2 font-bold hover:border-oxblood"
                  >
                    +10 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddStock(25)}
                    className="btn-secondary text-xs py-2 font-bold hover:border-oxblood"
                  >
                    +25 kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddStock(50)}
                    className="btn-secondary text-xs py-2 font-bold hover:border-oxblood"
                  >
                    +50 kg
                  </button>
                </div>
              </div>

              {/* Exact Stock Input */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1" htmlFor="stockAmount">
                  Total Branch Stock (kg)
                </label>
                <div className="relative">
                  <input
                    id="stockAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={adjustStockAmount}
                    onChange={e => setAdjustStockAmount(e.target.value)}
                    className="input-field text-base font-bold pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-sm font-bold text-charcoal/50">
                    kg
                  </span>
                </div>
              </div>

              {/* Threshold Input */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1" htmlFor="thresholdAmount">
                  Low-Stock Alert Threshold (kg)
                </label>
                <div className="relative">
                  <input
                    id="thresholdAmount"
                    type="number"
                    step="0.1"
                    min="0"
                    value={adjustThreshold}
                    onChange={e => setAdjustThreshold(e.target.value)}
                    className="input-field text-sm font-medium pr-12"
                  />
                  <span className="absolute right-3 top-2.5 text-sm font-bold text-charcoal/50">
                    kg
                  </span>
                </div>
                <p className="text-xs text-charcoal/50 mt-1">
                  Triggers POS and dashboard warning badge when inventory falls below this weight.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStock}
                  className="btn-primary text-sm font-semibold"
                >
                  {savingStock ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
