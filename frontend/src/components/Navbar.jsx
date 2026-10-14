import React from 'react';
import { ShoppingBag, UtensilsCrossed, LogOut, User, Store } from 'lucide-react';

export default function Navbar({ user, onLogout, onOpenAuth }) {
  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="brand-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-icon-wrap">
            <UtensilsCrossed size={22} />
          </div>
          <div>
            Food<span className="brand-highlight">Grab</span>
          </div>
        </div>

        <div className="nav-actions">
          {user ? (
            <>
              <span className={`role-badge ${user.role}`}>
                {user.role === 'restaurant' ? (
                  <>
                    <Store size={13} /> Restaurant
                  </>
                ) : (
                  <>
                    <ShoppingBag size={13} /> Buyer
                  </>
                )}
              </span>

              <div className="user-profile-badge">
                <User size={16} className="text-muted" />
                <span className="user-name-text">
                  {user.role === 'restaurant' && user.restaurant
                    ? user.restaurant.name
                    : user.name}
                </span>
              </div>

              <button className="btn-logout" onClick={onLogout} title="Sign Out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={onOpenAuth}>
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
