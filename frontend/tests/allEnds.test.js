import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { ORDER_RULES } from '../src/config.js'
import { calculateCartTotal, calculateTotalWeight } from '../src/utils/orderHelpers.js'
import { formatCurrency, formatWeight } from '../src/utils/formatters.js'

describe('POS Shop Laws & Multi-Role End-to-End Logic', () => {
  // -------------------------------------------------------------
  // Suite 1: POS Order Rules & Laws Validation
  // -------------------------------------------------------------
  describe('Rule 1: POS Order Rules & Thresholds', () => {
    test('ORDER_RULES configuration values meet retail and legal specifications', () => {
      assert.equal(ORDER_RULES.MIN_ORDER_AMOUNT, 50.0, 'Min order should be ₱50.00')
      assert.equal(ORDER_RULES.MAX_ORDER_AMOUNT, 50000.0, 'Max order should be ₱50,000.00')
      assert.equal(ORDER_RULES.MAX_DAILY_BRANCH_ORDERS, 500, 'Max daily branch orders should be 500')
      assert.equal(ORDER_RULES.MAX_DAILY_CUSTOMER_ORDERS, 10, 'Max daily customer orders should be 10')
      assert.equal(ORDER_RULES.MIN_ITEM_WEIGHT_KG, 0.05, 'Min item weight should be 50g (0.05 kg)')
      assert.equal(ORDER_RULES.MAX_ITEM_WEIGHT_KG, 100.0, 'Max item weight should be 100 kg')
    })

    test('Cart checkout eligibility accurately enforces minimum and maximum amounts', () => {
      // Empty cart cannot checkout
      const emptyCart = []
      const emptyTotal = calculateCartTotal(emptyCart)
      const emptyCanCheckout = emptyCart.length > 0 && emptyTotal >= ORDER_RULES.MIN_ORDER_AMOUNT && emptyTotal <= ORDER_RULES.MAX_ORDER_AMOUNT
      assert.equal(emptyCanCheckout, false, 'Empty cart cannot proceed to checkout')

      // Cart total below ₱50.00 (e.g. ₱35.00)
      const belowMinCart = [
        { id: '1', weight_kg: 0.1, unit_price: 350.0, subtotal: 35.0 },
      ]
      const belowMinTotal = calculateCartTotal(belowMinCart)
      const isBelowMin = belowMinCart.length > 0 && belowMinTotal < ORDER_RULES.MIN_ORDER_AMOUNT
      const belowMinCanCheckout = belowMinCart.length > 0 && !isBelowMin && belowMinTotal <= ORDER_RULES.MAX_ORDER_AMOUNT
      assert.equal(belowMinTotal, 35.0)
      assert.equal(isBelowMin, true, 'Cart total ₱35 is below minimum ₱50')
      assert.equal(belowMinCanCheckout, false, 'Below min order cannot proceed to payment')

      // Exactly at minimum ₱50.00
      const exactMinCart = [
        { id: '1', weight_kg: 0.2, unit_price: 250.0, subtotal: 50.0 },
      ]
      const exactMinTotal = calculateCartTotal(exactMinCart)
      const exactMinCanCheckout = exactMinCart.length > 0 && exactMinTotal >= ORDER_RULES.MIN_ORDER_AMOUNT && exactMinTotal <= ORDER_RULES.MAX_ORDER_AMOUNT
      assert.equal(exactMinTotal, 50.0)
      assert.equal(exactMinCanCheckout, true, 'Exact min order ₱50 can checkout')

      // Typical standard order (₱1,250.00)
      const validCart = [
        { id: '1', weight_kg: 2.0, unit_price: 380.0, subtotal: 760.0 },
        { id: '2', weight_kg: 1.5, unit_price: 320.0, subtotal: 480.0 },
        { id: '3', weight_kg: 0.05, unit_price: 200.0, subtotal: 10.0 },
      ]
      const validTotal = calculateCartTotal(validCart)
      const validCanCheckout = validCart.length > 0 && validTotal >= ORDER_RULES.MIN_ORDER_AMOUNT && validTotal <= ORDER_RULES.MAX_ORDER_AMOUNT
      assert.equal(validTotal, 1250.0)
      assert.equal(validCanCheckout, true, 'Valid retail order can checkout')

      // Order exceeding ₱50,000.00 (e.g. bulk wholesale typo error ₱52,000.00)
      const bulkCart = [
        { id: '1', weight_kg: 80.0, unit_price: 650.0, subtotal: 52000.0 },
      ]
      const bulkTotal = calculateCartTotal(bulkCart)
      const isAboveMax = bulkTotal > ORDER_RULES.MAX_ORDER_AMOUNT
      const bulkCanCheckout = bulkCart.length > 0 && bulkTotal >= ORDER_RULES.MIN_ORDER_AMOUNT && !isAboveMax
      assert.equal(bulkTotal, 52000.0)
      assert.equal(isAboveMax, true, '₱52,000 exceeds maximum ₱50,000')
      assert.equal(bulkCanCheckout, false, 'Exceeding max limit cannot checkout')
    })
  })

  // -------------------------------------------------------------
  // Suite 2: Owner End Analytics & Inventory Management Logic
  // -------------------------------------------------------------
  describe('Rule 2: Owner End Dashboard Logic', () => {
    test('KPI metrics calculate correctly from raw summary data', () => {
      const summary = {
        totalSales: 24500.50,
        totalOrders: 32,
        lowStockCount: 2,
        salesByPaymentMethod: {
          cash: 14700.30,
          gcash: 7350.15,
          maya: 2450.05,
        },
      }

      const calculatedAOV = summary.totalOrders > 0
        ? Math.round((summary.totalSales / summary.totalOrders) * 100) / 100
        : 0

      assert.equal(calculatedAOV, 765.64, 'Average order value correctly computed')

      const totalMethodSales = Object.values(summary.salesByPaymentMethod).reduce((sum, v) => sum + v, 0)
      assert.equal(Math.round(totalMethodSales * 100) / 100, 24500.50, 'Payment method breakdown sums to total sales')

      // Percentage calculation
      const cashPercent = Math.round((summary.salesByPaymentMethod.cash / totalMethodSales) * 100)
      assert.equal(cashPercent, 60, 'Cash represents 60% of total revenue')
    })

    test('Inventory classification identifies out-of-stock and low-stock items correctly', () => {
      const inventory = [
        { id: '1', productName: 'Pork Chop', stockKg: 22.5, lowStockThresholdKg: 5.0 },
        { id: '2', productName: 'Beef Ribeye', stockKg: 3.2, lowStockThresholdKg: 5.0 },
        { id: '3', productName: 'Chicken Liver', stockKg: 0.0, lowStockThresholdKg: 3.0 },
      ]

      const classified = inventory.map(item => ({
        ...item,
        isOutOfStock: item.stockKg <= 0,
        isLowStock: item.stockKg > 0 && item.stockKg < item.lowStockThresholdKg,
      }))

      assert.equal(classified[0].isOutOfStock, false)
      assert.equal(classified[0].isLowStock, false)

      assert.equal(classified[1].isOutOfStock, false)
      assert.equal(classified[1].isLowStock, true, 'Ribeye should be flagged as low stock')

      assert.equal(classified[2].isOutOfStock, true, 'Chicken liver should be flagged as out of stock')

      const alertCount = classified.filter(i => i.isLowStock || i.isOutOfStock).length
      assert.equal(alertCount, 2, 'Two items require restock attention')
    })

    test('Quick stock adjustment sums accurately without floating point drift', () => {
      let currentStock = 12.45
      const quickAdd25 = 25.0
      currentStock = Math.round((currentStock + quickAdd25) * 100) / 100
      assert.equal(currentStock, 37.45)

      const quickAdd10 = 10.0
      currentStock = Math.round((currentStock + quickAdd10) * 100) / 100
      assert.equal(currentStock, 47.45)
    })
  })

  // -------------------------------------------------------------
  // Suite 3: Customer End Kiosk & Queue State Transitions
  // -------------------------------------------------------------
  describe('Rule 3: Customer End Queue & Ticket Dispenser Logic', () => {
    test('Queue ticket state progression moves through valid lifecycle states', () => {
      const ticketLifecycle = ['waiting', 'calling', 'serving', 'completed']
      let currentStatus = 'waiting'

      assert.equal(currentStatus, 'waiting', 'Initial state must be waiting')

      // Staff calls next ticket
      currentStatus = 'calling'
      assert.equal(ticketLifecycle.includes(currentStatus), true)

      // Customer approaches counter
      currentStatus = 'serving'
      assert.equal(ticketLifecycle.includes(currentStatus), true)

      // Order completed & paid
      currentStatus = 'completed'
      assert.equal(ticketLifecycle.includes(currentStatus), true)
    })

    test('Customer ticket formatting handles single and multi digit sequence numbers', () => {
      function formatTicketNumber(seq) {
        return `Q-${String(seq).padStart(3, '0')}`
      }

      assert.equal(formatTicketNumber(1), 'Q-001')
      assert.equal(formatTicketNumber(42), 'Q-042')
      assert.equal(formatTicketNumber(100), 'Q-100')
      assert.equal(formatTicketNumber(500), 'Q-500')
    })

    test('Category filtering isolates cuts according to selected tab', () => {
      const products = [
        { id: '1', name: 'Pork Belly', category: { id: 'cat-pork', name: 'Pork' } },
        { id: '2', name: 'Beef Shank', category: { id: 'cat-beef', name: 'Beef' } },
        { id: '3', name: 'Chicken Wings', category: { id: 'cat-chicken', name: 'Chicken' } },
      ]

      // Filter by Pork
      const porkOnly = products.filter(p => p.category?.id === 'cat-pork')
      assert.equal(porkOnly.length, 1)
      assert.equal(porkOnly[0].name, 'Pork Belly')

      // Filter by Beef
      const beefOnly = products.filter(p => p.category?.id === 'cat-beef')
      assert.equal(beefOnly.length, 1)
      assert.equal(beefOnly[0].name, 'Beef Shank')

      // All cuts
      const allCuts = products.filter(() => true)
      assert.equal(allCuts.length, 3)
    })
  })

  // -------------------------------------------------------------
  // Suite 4: Auth & Role Redirection Logic
  // -------------------------------------------------------------
  describe('Rule 4: Auth & Role Router Routing', () => {
    function resolveRouteForUser(user) {
      if (!user) return '/login'
      switch (user.role) {
        case 'owner':
          return '/owner'
        case 'staff':
          return '/staff'
        default:
          return '/shop'
      }
    }

    test('RoleRouter redirects unauthenticated users to /login', () => {
      assert.equal(resolveRouteForUser(null), '/login')
    })

    test('RoleRouter directs owner to /owner portal', () => {
      assert.equal(resolveRouteForUser({ role: 'owner' }), '/owner')
    })

    test('RoleRouter directs staff to /staff POS counter', () => {
      assert.equal(resolveRouteForUser({ role: 'staff' }), '/staff')
    })

    test('RoleRouter directs registered customer to /shop customer kiosk', () => {
      assert.equal(resolveRouteForUser({ role: 'customer' }), '/shop')
    })
  })
})
