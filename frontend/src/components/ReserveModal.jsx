import React, { useState } from 'react';
import { X, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReserveModal({ listing, onClose, onConfirm, reserving }) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  if (!listing) return null;

  const totalPrice = (listing.price * quantity).toFixed(2);
  const savings = ((listing.original_price - listing.price) * quantity).toFixed(2);

  const handleReserve = () => {
    if (quantity > listing.quantity) {
      setError(`Only ${listing.quantity} available.`);
      return;
    }
    onConfirm(listing.id, quantity);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Reserve Surplus Food</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 4 }}>
            {listing.item_name}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} color="var(--primary)" />
              <strong>{listing.restaurant?.name}</strong> • {listing.restaurant?.address}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={15} color="var(--secondary)" />
              Pickup by: <strong>{listing.pickup_by}</strong>
            </span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="form-label" style={{ margin: 0 }}>
              Quantity ({listing.quantity} available):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '1.1rem' }}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || reserving}
              >
                -
              </button>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: 24, textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '1.1rem' }}
                onClick={() => setQuantity((q) => Math.min(listing.quantity, q + 1))}
                disabled={quantity >= listing.quantity || reserving}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Price: </span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                ${totalPrice}
              </span>
            </div>
            <span className="discount-badge">
              You save ${savings}!
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={reserving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleReserve}
            disabled={reserving}
          >
            {reserving ? 'Reserving...' : 'Confirm Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}
