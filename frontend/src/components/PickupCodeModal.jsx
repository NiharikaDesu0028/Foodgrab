import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function PickupCodeModal({ order, onClose, onViewOrders }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(order.pickup_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: '#ecfdf5', color: '#059669', marginBottom: 12 }}>
          <CheckCircle2 size={40} />
        </div>

        <h3 className="modal-title" style={{ marginBottom: 4 }}>
          Surplus Food Reserved!
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Your order has been reserved. Present this code at pickup:
        </p>

        <div className="code-highlight-card">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#047857', letterSpacing: '0.05em' }}>
            Your Short Pickup Code
          </div>
          <div className="code-highlight-value">{order.pickup_code}</div>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8rem', margin: '0 auto', display: 'inline-flex' }}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check size={14} color="#059669" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Code
              </>
            )}
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: 14, borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: 20, fontSize: '0.875rem' }}>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
            {order.item_name} (Qty: {order.quantity})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', marginBottom: 4 }}>
            <MapPin size={14} color="var(--primary)" />
            <span><strong>{order.restaurant_name}</strong> - {order.restaurant_address}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--secondary)' }}>
            <Clock size={14} />
            <span>Pickup Time: <strong>{order.pickup_by}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            Continue Browsing
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={() => {
              onClose();
              if (onViewOrders) onViewOrders();
            }}
          >
            My Orders <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
