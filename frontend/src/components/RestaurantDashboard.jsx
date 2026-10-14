import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  PlusCircle,
  CheckCircle,
  PackageCheck,
  AlertCircle,
  Trash2,
  Clock,
  Store,
  DollarSign,
  TrendingDown,
  ShoppingBag,
  Layers,
  KeyRound,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function RestaurantDashboard({ user }) {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  // New Listing Form State
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('3');
  const [pickupBy, setPickupBy] = useState('Today 8:00 PM - 9:30 PM');
  const [creating, setCreating] = useState(false);

  // Pickup Verification Input
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  const restaurant = user.restaurant || {};

  const loadData = async () => {
    try {
      setLoading(true);
      const [listingsData, ordersData] = await Promise.all([
        api.getMyListings(),
        api.getRestaurantOrders(),
      ]);
      setListings(listingsData.listings || []);
      setOrders(ordersData.orders || []);
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to load restaurant data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setCreating(true);

    try {
      const payload = {
        item_name: itemName,
        description,
        original_price: parseFloat(originalPrice),
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        pickup_by: pickupBy,
      };

      await api.createListing(payload);
      setFeedback({ type: 'success', message: `Successfully published "${itemName}" for pickup!` });

      // Reset form
      setItemName('');
      setDescription('');
      setOriginalPrice('');
      setPrice('');
      setQuantity('3');

      // Refresh listings
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create listing.' });
    } finally {
      setCreating(false);
    }
  };

  const handleVerifyPickup = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!pickupCodeInput.trim()) return;

    setVerifying(true);
    try {
      const res = await api.verifyPickup(pickupCodeInput.trim().toUpperCase());
      setFeedback({
        type: 'success',
        message: `Order verified! Code ${res.order.pickup_code} marked as picked up for ${res.order.buyer_name || 'Customer'}.`,
      });
      setPickupCodeInput('');
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Pickup code verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleMarkOrderPickedUp = async (orderId, pickupCode) => {
    setFeedback(null);
    try {
      const res = await api.pickupOrderById(orderId, pickupCode);
      setFeedback({
        type: 'success',
        message: `Order #${orderId} (${res.order.item_name}) confirmed picked up!`,
      });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update order status.' });
    }
  };

  const handleDeleteListing = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.deleteListing(id);
      setFeedback({ type: 'success', message: `Listing "${name}" deleted.` });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete listing.' });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'closed' : 'available';
    try {
      await api.updateListingStatus(id, nextStatus);
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  // Metrics
  const activeListings = listings.filter((l) => l.status === 'available' && l.quantity > 0);
  const totalStockAvailable = activeListings.reduce((sum, l) => sum + l.quantity, 0);
  const pendingOrders = orders.filter((o) => o.status === 'reserved');
  const completedOrders = orders.filter((o) => o.status === 'picked_up');

  // Discount calculation preview
  const orig = parseFloat(originalPrice) || 0;
  const disc = parseFloat(price) || 0;
  const discountPercent = orig > 0 && disc > 0 && orig > disc ? Math.round(((orig - disc) / orig) * 100) : 0;

  return (
    <div>
      {/* Header Info */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Store color="var(--primary)" />
            {restaurant.name || 'Restaurant Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {restaurant.address} {restaurant.phone && `• ${restaurant.phone}`}
          </p>
        </div>

        <button type="button" className="btn-secondary" onClick={loadData}>
          <RefreshCw size={16} /> Refresh Dashboard
        </button>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-metrics">
        <div className="metric-card">
          <div className="metric-icon-wrap green">
            <Layers size={22} />
          </div>
          <div>
            <div className="metric-value">{activeListings.length}</div>
            <div className="metric-label">Active Listings</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap blue">
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="metric-value">{totalStockAvailable}</div>
            <div className="metric-label">Portions Available</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="metric-value">{pendingOrders.length}</div>
            <div className="metric-label">Awaiting Pickup</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple">
            <PackageCheck size={22} />
          </div>
          <div>
            <div className="metric-value">{completedOrders.length}</div>
            <div className="metric-label">Completed Pickups</div>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ marginLeft: 'auto', fontWeight: 700, opacity: 0.6 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left Column (Tools & Post), Right Column (Listings & Orders) */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div>
          {/* Pickup Verification Tool */}
          <div className="card-panel">
            <h2 className="panel-title">
              <KeyRound size={20} color="var(--primary)" />
              Verify Customer Pickup
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              When a buyer arrives, enter their short pickup code to hand over the bag:
            </p>

            <form onSubmit={handleVerifyPickup}>
              <div className="pickup-verify-box">
                <input
                  type="text"
                  required
                  placeholder="e.g. FG-8K3P2"
                  className="form-input pickup-code-input"
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={verifying || !pickupCodeInput.trim()}
              >
                {verifying ? 'Verifying...' : 'Verify & Mark as Picked Up'}
                <Check size={16} />
              </button>
            </form>
          </div>

          {/* Post Surplus Food Form */}
          <div className="card-panel">
            <h2 className="panel-title">
              <PlusCircle size={20} color="var(--primary)" />
              Post Surplus Food
            </h2>
            <form onSubmit={handleCreateListing}>
              <div className="form-group">
                <label className="form-label">Item / Surprise Bag Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Evening Artisan Pastry Box"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Describe the items, ingredients, or allergens..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Original Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    placeholder="18.00"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Surplus Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="form-input"
                    placeholder="5.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>

              {discountPercent > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <span className="discount-badge" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                    🔥 {discountPercent}% discount to buyers
                  </span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity Available</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pickup Time Window</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Today 8:00 PM - 9:30 PM"
                    value={pickupBy}
                    onChange={(e) => setPickupBy(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                disabled={creating}
              >
                {creating ? 'Publishing...' : 'Publish Surplus Deal'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Manage Listings & Customer Orders */}
        <div>
          {/* Active / Past Listings */}
          <div className="card-panel">
            <h2 className="panel-title">
              <Layers size={20} color="var(--primary)" />
              Your Listings ({listings.length})
            </h2>

            {listings.length === 0 ? (
              <div className="empty-state" style={{ padding: 36 }}>
                <div className="empty-icon">🥖</div>
                <h3 className="empty-title">No listings posted yet</h3>
                <p className="empty-desc">
                  Use the form on the left to post today's surplus food bags before closing time.
                </p>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Price</th>
                      <th>Qty Left</th>
                      <th>Pickup Window</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.item_name}</strong>
                        </td>
                        <td>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-subtle)', fontSize: '0.8rem', marginRight: 4 }}>
                            ${item.original_price.toFixed(2)}
                          </span>
                          <strong style={{ color: 'var(--primary)' }}>
                            ${item.price.toFixed(2)}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: item.quantity === 0 ? 'var(--accent-red)' : 'var(--text-main)' }}>
                            {item.quantity}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {item.pickup_by}
                        </td>
                        <td>
                          <span className={`status-badge ${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleToggleStatus(item.id, item.status)}
                              title={item.status === 'available' ? 'Mark Closed' : 'Mark Available'}
                            >
                              {item.status === 'available' ? 'Close' : 'Reopen'}
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', color: '#dc2626' }}
                              onClick={() => handleDeleteListing(item.id, item.item_name)}
                              title="Delete listing"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Customer Orders / Pickups Feed */}
          <div className="card-panel">
            <h2 className="panel-title">
              <PackageCheck size={20} color="var(--primary)" />
              Customer Orders & Pickups ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div className="empty-state" style={{ padding: 36 }}>
                <div className="empty-icon">📦</div>
                <h3 className="empty-title">No orders yet</h3>
                <p className="empty-desc">
                  When food lovers reserve your surplus items, their orders and pickup codes will appear here in real time.
                </p>
              </div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Buyer</th>
                      <th>Item</th>
                      <th>Pickup Code</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id}>
                        <td>
                          <strong>{ord.buyer_name || 'Customer'}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ord.buyer_email}
                          </div>
                        </td>
                        <td>
                          <div>{ord.item_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Qty: {ord.quantity}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 800,
                              background: '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: 4,
                              color: 'var(--primary)',
                            }}
                          >
                            {ord.pickup_code}
                          </span>
                        </td>
                        <td>
                          <strong>${ord.total_price.toFixed(2)}</strong>
                        </td>
                        <td>
                          <span className={`order-status-pill ${ord.status}`}>
                            {ord.status === 'reserved' ? '⏳ Reserved' : '✅ Picked Up'}
                          </span>
                        </td>
                        <td>
                          {ord.status === 'reserved' ? (
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.785rem' }}
                              onClick={() => handleMarkOrderPickedUp(ord.id, ord.pickup_code)}
                            >
                              <Check size={13} /> Confirm Pickup
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                              Complete
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
