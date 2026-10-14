import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search, MapPin, Clock, Tag, ShoppingBag, CheckCircle, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import ReserveModal from './ReserveModal';
import PickupCodeModal from './PickupCodeModal';

export default function BuyerPage({ user, onRequireAuth }) {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'orders'
  const [listings, setListings] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [selectedListing, setSelectedListing] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getListings(searchQuery);
      setListings(data.listings || []);
    } catch (err) {
      setError('Could not load surplus listings. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    if (!user) return;
    try {
      const data = await api.getMyOrders();
      setMyOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchQuery]);

  useEffect(() => {
    if (user && activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [user, activeTab]);

  const handleOpenReserve = (listing) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setSelectedListing(listing);
  };

  const handleConfirmReservation = async (listingId, quantity) => {
    try {
      setReserving(true);
      const res = await api.reserveOrder(listingId, quantity);
      // Close reservation modal and open confirmation with pickup code
      setSelectedListing(null);
      setConfirmedOrder(res.order);
      // Refresh listings and orders
      fetchListings();
      fetchMyOrders();
    } catch (err) {
      alert(err.message || 'Failed to reserve order.');
    } finally {
      setReserving(false);
    }
  };

  const activeReservationsCount = myOrders.filter((o) => o.status === 'reserved').length;

  return (
    <div>
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-tag">
          <Sparkles size={14} /> Stop Food Waste • Big Savings
        </div>
        <h1 className="hero-title">Rescue Surplus Food at 50-70% Off</h1>
        <p className="hero-subtitle">
          Restaurants, cafes, and bakeries prepare fresh food every day. When items are left over at closing time, they sell them on FoodGrab at huge discounts for scheduled pickup.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <ShoppingBag size={18} />
          <span>Browse Available Surplus</span>
          <span className="tab-counter">{listings.length}</span>
        </button>

        {user && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <CheckCircle size={18} />
            <span>My Orders & Pickup Codes</span>
            {activeReservationsCount > 0 && (
              <span className="tab-counter" style={{ background: '#f59e0b', color: '#fff' }}>
                {activeReservationsCount} active
              </span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchListings} style={{ marginLeft: 'auto', textDecoration: 'underline' }}>
            Retry
          </button>
        </div>
      )}

      {/* Tab: Browse Listings */}
      {activeTab === 'browse' && (
        <>
          <div className="filter-bar">
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search food, pasta, pastries, or restaurant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchListings}
              title="Refresh listings"
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3 className="empty-title">Loading surplus deals...</h3>
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3 className="empty-title">No surplus listings found</h3>
              <p className="empty-desc">
                {searchQuery
                  ? `No deals matched "${searchQuery}". Try a different keyword.`
                  : 'Check back later or switch to a restaurant account to post new surplus food!'}
              </p>
            </div>
          ) : (
            <div className="listings-grid">
              {listings.map((item) => {
                const discountPercent = Math.round(
                  ((item.original_price - item.price) / item.original_price) * 100
                );
                const isLowStock = item.quantity <= 2;

                return (
                  <div key={item.id} className="listing-card">
                    <div className="card-header-bar">
                      <div className="restaurant-info">
                        <span className="restaurant-name">
                          {item.restaurant?.name || 'Local Restaurant'}
                        </span>
                        <span className="restaurant-address">
                          <MapPin size={13} />
                          {item.restaurant?.address || 'Pickup location'}
                        </span>
                      </div>
                      {discountPercent > 0 && (
                        <span className="discount-badge">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <div className="card-body">
                      <h3 className="item-name">{item.item_name}</h3>
                      {item.description && (
                        <p className="item-desc">{item.description}</p>
                      )}

                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="meta-pill">
                          <Clock size={15} color="var(--secondary)" />
                          <span>Pickup: <strong>{item.pickup_by}</strong></span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className={`stock-tag ${isLowStock ? 'low-stock' : 'in-stock'}`}>
                            {isLowStock ? `Only ${item.quantity} left!` : `${item.quantity} available`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="price-container">
                        <span className="original-price">${item.original_price.toFixed(2)}</span>
                        <span className="sale-price">${item.price.toFixed(2)}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleOpenReserve(item)}
                      >
                        Reserve Deal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab: My Orders */}
      {activeTab === 'orders' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Your Surplus Reservations</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Show your unique pickup code at the restaurant counter to receive your food bag.
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={fetchMyOrders}>
              <RefreshCw size={16} /> Refresh Orders
            </button>
          </div>

          {myOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛍️</div>
              <h3 className="empty-title">You have no reservations yet</h3>
              <p className="empty-desc">
                Browse available surplus food and hit "Reserve Deal" to save delicious food from going to waste.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setActiveTab('browse')}
              >
                Browse Available Deals
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {myOrders.map((ord) => (
                <div key={ord.id} className="order-card">
                  <div className="order-main-info">
                    <span className="order-item-title">
                      {ord.item_name} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>(Qty: {ord.quantity})</span>
                    </span>
                    <span className="order-restaurant-info">
                      <MapPin size={15} color="var(--primary)" />
                      <strong>{ord.restaurant_name}</strong> • {ord.restaurant_address}
                    </span>
                    <span className="order-pickup-time">
                      <Clock size={15} />
                      Pickup window: <strong>{ord.pickup_by}</strong>
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                      Reserved on: {new Date(ord.created_at).toLocaleString()} • Total Paid: <strong>${ord.total_price.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="order-pickup-box">
                    <span className="pickup-label">Pickup Code</span>
                    <span className="pickup-code-display">{ord.pickup_code}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Show to restaurant staff
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`order-status-pill ${ord.status}`}>
                      {ord.status === 'reserved' ? '⏳ Ready for Pickup' : '✅ Picked Up'}
                    </span>
                    {ord.picked_up_at && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        Picked up {new Date(ord.picked_up_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reservation Quantity Modal */}
      {selectedListing && (
        <ReserveModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onConfirm={handleConfirmReservation}
          reserving={reserving}
        />
      )}

      {/* Confirmed Order / Pickup Code Screen */}
      {confirmedOrder && (
        <PickupCodeModal
          order={confirmedOrder}
          onClose={() => setConfirmedOrder(null)}
          onViewOrders={() => {
            setConfirmedOrder(null);
            setActiveTab('orders');
          }}
        />
      )}
    </div>
  );
}
