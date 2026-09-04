import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { queueApi, productsApi, inventoryApi, ordersApi } from '../../api/client'
import { CURRENT_BRANCH_ID, ORDER_RULES } from '../../config'
import { formatCurrency, formatWeight } from '../../utils/formatters'
import CategoryTabs from '../../components/CategoryTabs'
import StockBadge from '../../components/StockBadge'

export default function CustomerHome() {
  const { profile, signOut } = useAuth()

  const [queueStatus, setQueueStatus] = useState(null)
  const [myTicket, setMyTicket] = useState(null)
  const [issuingTicket, setIssuingTicket] = useState(false)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [inventory, setInventory] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [rules, setRules] = useState(ORDER_RULES)
  const [loading, setLoading] = useState(true)

  const TICKET_STORAGE_KEY = `pos_customer_ticket_${CURRENT_BRANCH_ID}`

  useEffect(() => {
    // Restore saved ticket if stored locally
    const savedTicket = localStorage.getItem(TICKET_STORAGE_KEY)
    if (savedTicket) {
      try {
        setMyTicket(JSON.parse(savedTicket))
      } catch {
        localStorage.removeItem(TICKET_STORAGE_KEY)
      }
    }

    loadCustomerPortalData()

    // Poll queue status every 8 seconds for live updates
    const interval = setInterval(refreshQueueStatus, 8000)
    return () => clearInterval(interval)
  }, [])

  async function loadCustomerPortalData() {
    setLoading(true)
    try {
      const [queueRes, catRes, prodRes, invRes, rulesRes] = await Promise.allSettled([
        queueApi.getQueue(CURRENT_BRANCH_ID),
        productsApi.getCategories(),
        productsApi.getProducts({ branchId: CURRENT_BRANCH_ID }),
        inventoryApi.getInventory(CURRENT_BRANCH_ID),
        ordersApi.getOrderRules(),
      ])

      if (queueRes.status === 'fulfilled') {
        setQueueStatus(queueRes.value)
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value || [])
      }
      if (prodRes.status === 'fulfilled') {
        setProducts(prodRes.value || [])
      }
      if (invRes.status === 'fulfilled') {
        setInventory(invRes.value || [])
      }
      if (rulesRes.status === 'fulfilled') {
        setRules(rulesRes.value || ORDER_RULES)
      }
    } catch (err) {
      console.error('Failed to load customer portal data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function refreshQueueStatus() {
    try {
      const q = await queueApi.getQueue(CURRENT_BRANCH_ID)
      setQueueStatus(q)

      // If customer has a ticket, check if its status changed
      if (myTicket) {
        const waitingMatch = (q.waitingTickets || []).find(t => t.id === myTicket.id)
        if (waitingMatch) {
          const updated = { ...myTicket, status: waitingMatch.status }
          setMyTicket(updated)
          localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(updated))
        } else if (q.nowServing === myTicket.ticketNumber) {
          const updated = { ...myTicket, status: 'serving' }
          setMyTicket(updated)
          localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(updated))
        }
      }
    } catch {
      // Ignore polling errors
    }
  }

  async function handleTakeTicket() {
    setIssuingTicket(true)
    try {
      const customerName = profile?.full_name || profile?.fullName || 'Walk-in Guest'
      const ticket = await queueApi.issueTicket({
        branchId: CURRENT_BRANCH_ID,
        customerName,
      })

      setMyTicket(ticket)
      localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(ticket))
      await refreshQueueStatus()
    } catch (err) {
      alert(`Failed to issue queue ticket: ${err.message}`)
    } finally {
      setIssuingTicket(false)
    }
  }

  function handleDismissTicket() {
    localStorage.removeItem(TICKET_STORAGE_KEY)
    setMyTicket(null)
  }

  // Get stock for product
  function getStockForProduct(productId) {
    const item = inventory.find(i => (i.product_id || i.productId) === productId)
    return item ? Number(item.stock_kg ?? item.stockKg ?? 0) : 0
  }

  function getThresholdForProduct(productId) {
    const item = inventory.find(i => (i.product_id || i.productId) === productId)
    return item ? Number(item.low_stock_threshold_kg ?? item.lowStockThresholdKg ?? 5) : 5
  }

  // Filter products by category
  const filteredProducts = selectedCategoryId
    ? products.filter(p => (p.category?.id || p.category_id) === selectedCategoryId)
    : products

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-oxblood border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-charcoal/60 font-medium">Connecting to Meat Shop Counter...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-bg text-charcoal flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-stone-line sticky top-0 z-30 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥩</span>
              <h1 className="text-2xl font-bold tracking-tight">Dela Cruz Meat Shop</h1>
            </div>
            <p className="text-xs text-charcoal/60 mt-0.5">
              Poblacion Main Branch • Customer Kiosk & Price Board • Welcome,{' '}
              <span className="font-semibold text-charcoal">
                {profile?.full_name || 'Valued Customer'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshQueueStatus}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <span>🔄</span> Refresh Status
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Section 1: Digital Queue Board & Ticket Dispenser */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Now Serving Display Board */}
          <div className="card p-6 bg-gradient-to-br from-white to-stone-card border border-stone-line shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-oxblood">
                Counter Status
              </span>
              <h2 className="text-base font-semibold text-charcoal/80 mt-1">Now Serving Ticket</h2>
            </div>

            <div className="my-4 text-center py-4 bg-white rounded-xl border border-stone-line/70 shadow-xs">
              <div className="text-4xl sm:text-5xl font-extrabold text-oxblood tracking-wider">
                {queueStatus?.nowServing || '---'}
              </div>
              <p className="text-xs text-charcoal/60 mt-1 font-medium">
                {queueStatus?.nowServing
                  ? `Customer: ${queueStatus.nowServingDetails?.customerName || 'Walk-in'}`
                  : 'Counter is ready for next customer'}
              </p>
            </div>

            <div className="flex justify-between items-center text-xs text-charcoal/70 pt-2 border-t border-stone-line">
              <span>Customers in Queue:</span>
              <span className="font-bold text-charcoal text-sm">
                {queueStatus?.totalWaiting || 0} waiting
              </span>
            </div>
          </div>

          {/* Customer Ticket Card / Dispenser */}
          <div className="card p-6 bg-white border border-stone-line shadow-xs md:col-span-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal/60">
                Digital Queue Dispenser
              </span>
              <h2 className="text-xl font-bold text-charcoal mt-1">
                {myTicket ? 'Your Active Queue Ticket' : 'Get Your Turn at the Counter'}
              </h2>
            </div>

            {myTicket ? (
              <div className="my-4 p-5 bg-stone-bg rounded-xl border border-stone-line flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-oxblood text-white flex flex-col items-center justify-center font-black text-xl shadow-md">
                    <span className="text-2xs uppercase tracking-tighter opacity-80">Ticket</span>
                    <span>{myTicket.ticketNumber}</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-charcoal">
                      {myTicket.customerName || profile?.full_name || 'Guest Customer'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                          myTicket.status === 'serving'
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : myTicket.status === 'calling'
                            ? 'bg-amber-100 text-amber-800 animate-bounce'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {myTicket.status === 'serving'
                          ? '🔔 NOW SERVING AT COUNTER'
                          : myTicket.status === 'calling'
                          ? '📢 CALLING NOW'
                          : '⏳ WAITING IN LINE'}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/60 mt-1">
                      {myTicket.status === 'serving'
                        ? 'Please proceed to the meat weighing counter now.'
                        : 'Staff will call your ticket number shortly.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDismissTicket}
                    className="btn-secondary text-xs py-2 px-3 hover:text-oxblood"
                  >
                    Done / Reset Ticket
                  </button>
                </div>
              </div>
            ) : (
              <div className="my-4 p-5 bg-stone-card rounded-xl border border-dashed border-stone-line text-center">
                <p className="text-sm text-charcoal/70 mb-3">
                  Take a digital number to secure your place in line while you browse cuts below.
                </p>
                <button
                  onClick={handleTakeTicket}
                  disabled={issuingTicket}
                  className="btn-primary text-base px-6 py-3 shadow-md hover:shadow-lg transition-all"
                >
                  {issuingTicket ? 'Generating Ticket...' : '🎟️ Take Queue Ticket'}
                </button>
              </div>
            )}

            <div className="text-2xs text-charcoal/50 flex items-center justify-between pt-2 border-t border-stone-line">
              <span>Automatic counter calling enabled</span>
              <span>Updated in real-time</span>
            </div>
          </div>
        </div>

        {/* Section 2: Store Policies & POS Law Card */}
        <div className="card p-4 bg-stone-card border border-stone-line text-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-base">⚖️</span>
            <div>
              <span className="font-bold text-charcoal">Store Counter Policy:</span> Minimum purchase per ticket is{' '}
              <strong className="text-oxblood font-semibold">
                {formatCurrency(rules.MIN_ORDER_AMOUNT || 50)}
              </strong>
              . Maximum limit per order is {formatCurrency(rules.MAX_ORDER_AMOUNT || 50000)}.
            </div>
          </div>
          <div className="flex items-center gap-2 text-charcoal/60">
            <span>Payment Accepted:</span>
            <span className="font-medium text-charcoal">Cash • GCash • Maya • Bank Transfer</span>
          </div>
        </div>

        {/* Section 3: Live Digital Meat Catalog & Price Board */}
        <div className="card bg-white border border-stone-line shadow-xs p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-line pb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🍖</span> Today's Fresh Meat Cuts & Prices
              </h2>
              <p className="text-xs text-charcoal/60 mt-0.5">
                All cuts prepared fresh daily and weighed to precision at the counter
              </p>
            </div>

            <CategoryTabs
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {filteredProducts.map(product => {
              const stockKg = getStockForProduct(product.id)
              const thresholdKg = getThresholdForProduct(product.id)
              const isOut = stockKg <= 0
              const price = Number(product.price_per_kg || product.pricePerKg || 0)

              return (
                <div
                  key={product.id}
                  className={`card p-4 border transition-all ${
                    isOut
                      ? 'bg-stone-bg/50 border-stone-line/60 opacity-70'
                      : 'bg-white border-stone-line hover:border-oxblood/40 hover:shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider">
                      {product.category?.name || 'Meat Cut'}
                    </span>
                    <StockBadge stockKg={stockKg} thresholdKg={thresholdKg} />
                  </div>

                  <h3 className="font-bold text-base text-charcoal mb-1">{product.name}</h3>

                  <div className="mt-3 flex items-baseline justify-between border-t border-stone-line/60 pt-2">
                    <div>
                      <span className="text-xl font-extrabold text-oxblood">
                        {formatCurrency(price)}
                      </span>
                      <span className="text-xs text-charcoal/60 font-normal"> / kg</span>
                    </div>

                    <div className="text-2xs text-charcoal/50 text-right">
                      {isOut ? 'Out of stock' : `Avail: ${formatWeight(stockKg)}`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
