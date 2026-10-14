import React, { useState } from 'react';
import { api } from '../api';
import { ShoppingBag, Store, AlertCircle, ArrowRight, Lock, Mail, User, MapPin, Phone } from 'lucide-react';

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('buyer'); // 'buyer' | 'restaurant'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({ email, password });
        localStorage.setItem('foodgrab_token', res.token);
        onAuthSuccess(res.user);
      } else {
        const payload = {
          email,
          password,
          name,
          role,
          ...(role === 'restaurant' && {
            restaurant_name: restaurantName || name,
            address,
            phone,
            description,
          }),
        };
        const res = await api.signup(payload);
        localStorage.setItem('foodgrab_token', res.token);
        onAuthSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-header">
        <h2 className="auth-title">
          {mode === 'login' ? 'Welcome Back!' : 'Join FoodGrab'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Sign in to rescue surplus meals or manage your restaurant deals'
            : 'Start saving surplus food at discounts or stop kitchen waste today'}
        </p>
      </div>

      <div className="tabs-nav" style={{ justifyContent: 'center', marginBottom: 20 }}>
        <button
          type="button"
          className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setMode('login');
            setError('');
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => {
            setMode('signup');
            setError('');
          }}
        >
          Create Account
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label">I want to join as:</label>
            <div className="role-selector-grid">
              <button
                type="button"
                className={`role-card-btn ${role === 'buyer' ? 'selected' : ''}`}
                onClick={() => setRole('buyer')}
              >
                <div className="role-card-icon">🛒</div>
                <div className="role-card-label">Buyer</div>
                <div className="role-card-sub">Rescue food at discounts</div>
              </button>
              <button
                type="button"
                className={`role-card-btn ${role === 'restaurant' ? 'selected' : ''}`}
                onClick={() => setRole('restaurant')}
              >
                <div className="role-card-icon">👨‍🍳</div>
                <div className="role-card-label">Restaurant</div>
                <div className="role-card-sub">Sell surplus for pickup</div>
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <div className="form-group">
            <label className="form-label">Your Name</label>
            <div className="search-input-wrap">
              <User size={16} className="search-icon" />
              <input
                type="text"
                required
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        {mode === 'signup' && role === 'restaurant' && (
          <>
            <div className="form-group">
              <label className="form-label">Restaurant / Bakery Name</label>
              <div className="search-input-wrap">
                <Store size={16} className="search-icon" />
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="e.g. Sunrise Bakery & Cafe"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Address</label>
              <div className="search-input-wrap">
                <MapPin size={16} className="search-icon" />
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="e.g. 104 Market St, Downtown"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <div className="search-input-wrap">
                  <Phone size={16} className="search-icon" />
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cuisine / Food Type</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Italian, Bakery, Deli"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="search-input-wrap">
            <Mail size={16} className="search-icon" />
            <input
              type="email"
              required
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="search-input-wrap">
            <Lock size={16} className="search-icon" />
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', marginTop: 8 }}
          disabled={loading}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          <ArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
