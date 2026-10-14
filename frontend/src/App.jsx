import React, { useState, useEffect } from 'react';
import { api } from './api';
import Navbar from './components/Navbar';
import DemoAccountsBar from './components/DemoAccountsBar';
import AuthPage from './components/AuthPage';
import BuyerPage from './components/BuyerPage';
import RestaurantDashboard from './components/RestaurantDashboard';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Check current session
  useEffect(() => {
    const token = localStorage.getItem('foodgrab_token');
    if (!token) {
      setLoadingUser(false);
      return;
    }

    api.getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        localStorage.removeItem('foodgrab_token');
        setUser(null);
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('foodgrab_token');
    setUser(null);
    setAuthView(false);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setAuthView(false);
  };

  const handleQuickLogin = async (email, password) => {
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('foodgrab_token', res.token);
      setUser(res.user);
      setAuthView(false);
    } catch (err) {
      alert('Quick login failed: ' + (err.message || 'Check backend status'));
    }
  };

  return (
    <div className="app-container">
      {/* Demo Switcher */}
      <DemoAccountsBar onQuickLogin={handleQuickLogin} />

      {/* Navigation */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthView(true)}
      />

      <main className="main-content">
        {loadingUser ? (
          <div className="empty-state" style={{ marginTop: 80 }}>
            <div className="empty-icon">⏳</div>
            <h3 className="empty-title">Loading FoodGrab...</h3>
          </div>
        ) : authView ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setAuthView(false)}
              >
                ← Back to Surplus Listings
              </button>
            </div>
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          </div>
        ) : user && user.role === 'restaurant' ? (
          <RestaurantDashboard user={user} />
        ) : (
          <BuyerPage
            user={user}
            onRequireAuth={() => setAuthView(true)}
          />
        )}
      </main>
    </div>
  );
}
