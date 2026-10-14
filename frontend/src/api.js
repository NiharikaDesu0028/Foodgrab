const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeader() {
  const token = localStorage.getItem('foodgrab_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  signup: (userData) => request('/api/auth/signup', { method: 'POST', body: userData }),
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: credentials }),
  getMe: () => request('/api/auth/me'),

  // Listings
  getListings: (query = '') => {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return request(`/api/listings${q}`);
  },
  createListing: (listingData) => request('/api/listings', { method: 'POST', body: listingData }),
  getMyListings: () => request('/api/listings/mine'),
  deleteListing: (id) => request(`/api/listings/${id}`, { method: 'DELETE' }),
  updateListingStatus: (id, status) => request(`/api/listings/${id}/status`, { method: 'PATCH', body: { status } }),

  // Orders
  reserveOrder: (listingId, quantity = 1) =>
    request('/api/orders', { method: 'POST', body: { listing_id: listingId, quantity } }),
  getMyOrders: () => request('/api/orders/mine'),
  getRestaurantOrders: () => request('/api/orders/restaurant'),
  verifyPickup: (pickupCode) => request('/api/orders/pickup', { method: 'POST', body: { pickup_code: pickupCode } }),
  pickupOrderById: (id, pickupCode) =>
    request(`/api/orders/${id}/pickup`, { method: 'POST', body: { pickup_code: pickupCode } }),
};
