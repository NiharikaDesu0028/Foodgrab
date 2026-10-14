import React from 'react';
import { Sparkles } from 'lucide-react';

export default function DemoAccountsBar({ onQuickLogin }) {
  const accounts = [
    { label: '🥐 Bakery Partner (Sarah)', email: 'bakery@foodgrab.com', pass: 'bakery123' },
    { label: '🍝 Bistro Partner (Marco)', email: 'bistro@foodgrab.com', pass: 'bistro123' },
    { label: '🛒 Buyer (Alex)', email: 'alex@foodgrab.com', pass: 'buyer123' },
    { label: '🥗 Buyer (Emma)', email: 'emma@foodgrab.com', pass: 'buyer123' },
  ];

  return (
    <div className="demo-accounts-bar">
      <span className="demo-title">
        <Sparkles size={16} /> Quick Demo Accounts:
      </span>
      {accounts.map((acc, idx) => (
        <button
          key={idx}
          className="demo-btn"
          onClick={() => onQuickLogin(acc.email, acc.pass)}
          title={`Quick login as ${acc.email}`}
        >
          {acc.label}
        </button>
      ))}
    </div>
  );
}
