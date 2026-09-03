/**
 * Centralized API client for Automated POS System
 * Enforces single API boundary: Browser -> Backend API -> Database
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

const TOKEN_KEY = 'pos_auth_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token, persist = true) {
  if (persist) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

/**
 * Core HTTP fetch wrapper with standardized error handling and envelope unwrapping
 */
export async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const fetchOptions = {
    ...options,
    headers,
  }

  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body)
  }

  let response
  try {
    response = await fetch(url, fetchOptions)
  } catch (err) {
    const networkError = new Error('Unable to connect to POS server. Please check your connection.')
    networkError.code = 'NETWORK_ERROR'
    throw networkError
  }

  let json = null
  try {
    json = await response.json()
  } catch {
    json = null
  }

  if (!response.ok) {
    const errorInfo = json?.error || {}
    const err = new Error(errorInfo.message || `Request failed with status ${response.status}`)
    err.code = errorInfo.code || 'UNKNOWN_ERROR'
    err.status = response.status
    err.details = errorInfo.details || {}
    throw err
  }

  // Unwrap standard { data: ... } envelope
  return json?.data !== undefined ? json.data : json
}

// -------------------------------------------------------------
// Authentication API
// -------------------------------------------------------------
export const authApi = {
  async login({ email, password }) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    if (data.token) {
      setToken(data.token)
    }
    return data
  },

  async signup({ email, password, fullName, phoneNumber }) {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: { email, password, fullName, phoneNumber },
    })
    if (data.token) {
      setToken(data.token)
    }
    return data
  },

  async getMe() {
    return request('/auth/me')
  },

  logout() {
    clearToken()
  },
}

// -------------------------------------------------------------
// Products API
// -------------------------------------------------------------
export const productsApi = {
  async getCategories() {
    return request('/categories')
  },

  async getProducts({ categoryId, branchId } = {}) {
    const params = new URLSearchParams()
    if (categoryId) params.append('categoryId', categoryId)
    if (branchId) params.append('branchId', branchId)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/products${query}`)
  },

  async getProductById(id) {
    return request(`/products/${id}`)
  },
}

// -------------------------------------------------------------
// Inventory API
// -------------------------------------------------------------
export const inventoryApi = {
  async getInventory(branchId) {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
    return request(`/inventory${query}`)
  },

  async updateStock(productId, { stockKg, lowStockThresholdKg }, branchId) {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
    return request(`/inventory/${productId}${query}`, {
      method: 'PATCH',
      body: { stockKg, lowStockThresholdKg },
    })
  },
}

// -------------------------------------------------------------
// Orders API
// -------------------------------------------------------------
export const ordersApi = {
  async createOrder(orderData) {
    return request('/orders', {
      method: 'POST',
      body: orderData,
    })
  },

  async getOrders({ branchId, date, search, limit } = {}) {
    const params = new URLSearchParams()
    if (branchId) params.append('branchId', branchId)
    if (date) params.append('date', date)
    if (search) params.append('search', search)
    if (limit) params.append('limit', String(limit))
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/orders${query}`)
  },

  async getOrderById(id) {
    return request(`/orders/${id}`)
  },
}

// -------------------------------------------------------------
// Queue API
// -------------------------------------------------------------
export const queueApi = {
  async getQueue(branchId) {
    const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''
    return request(`/queue${query}`)
  },

  async issueTicket({ branchId, customerName }) {
    return request('/queue/tickets', {
      method: 'POST',
      body: { branchId, customerName },
    })
  },

  async updateTicketStatus(id, status) {
    return request(`/queue/tickets/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  },
}

// -------------------------------------------------------------
// Reports API
// -------------------------------------------------------------
export const reportsApi = {
  async getSummary({ branchId, startDate, endDate } = {}) {
    const params = new URLSearchParams()
    if (branchId) params.append('branchId', branchId)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/reports/summary${query}`)
  },
}
