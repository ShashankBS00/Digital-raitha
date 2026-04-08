import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const switchToLogin = () => setAuthMode('login');
  const switchToSignup = () => setAuthMode('signup');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #134e2a 0%, #1a6b38 50%, #0d3d1f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56,
            height: 56,
            border: '4px solid rgba(255,255,255,0.2)',
            borderTopColor: '#4ade80',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto',
          }} />
          <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.7)', fontSize: 15, fontFamily: 'Inter, sans-serif' }}>
            Loading Digital Raitha...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      overflow: 'hidden',
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/farm_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />

      {/* Gradient overlay for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(160deg, rgba(0,30,10,0.55) 0%, rgba(10,50,20,0.4) 50%, rgba(0,20,5,0.65) 100%)',
        zIndex: 1,
      }} />

      {/* Floating particles */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
            height: i % 3 === 0 ? 10 : i % 3 === 1 ? 7 : 5,
            borderRadius: '50%',
            background: 'rgba(134,239,172,0.3)',
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 4) * 20}%`,
            animation: `float${i % 3} ${3 + i * 0.5}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: 460,
        padding: '0 16px',
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {/* Logo icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            boxShadow: '0 8px 32px rgba(34,197,94,0.4)',
            marginBottom: 14,
            fontSize: 28,
          }}>
            🌿
          </div>
          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 6px',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 20px rgba(0,0,0,0.4)',
          }}>
            Digital Raitha
          </h1>
          <p style={{
            color: 'rgba(167,243,208,0.9)',
            fontSize: 14,
            margin: 0,
            fontWeight: 500,
            letterSpacing: '0.3px',
            textShadow: '0 1px 8px rgba(0,0,0,0.3)',
          }}>
            {t('tagline') || 'AI-Powered Natural Farming Assistant'}
          </p>
        </div>

        {/* Auth card — glassmorphism */}
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          overflow: 'hidden',
        }}>
          {authMode === 'login' ? (
            <Login onSwitchToSignup={switchToSignup} />
          ) : (
            <Signup onSwitchToLogin={switchToLogin} />
          )}
        </div>

        {/* Feature badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 20,
          marginTop: 24,
          flexWrap: 'wrap',
        }}>
          {[
            { icon: '🌱', label: 'Sustainable' },
            { icon: '🤖', label: 'AI Powered' },
            { icon: '🌐', label: 'Multi-lingual' },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'rgba(255,255,255,0.75)',
              fontSize: 13,
              fontWeight: 500,
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
            }}>
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          marginTop: 20,
        }}>
          {t('footer') || '© 2025 Digital Raitha. All rights reserved.'}
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes float0 { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-18px) rotate(15deg); } }
        @keyframes float1 { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-12px) rotate(-10deg); } }
        @keyframes float2 { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-22px) rotate(8deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

export default App;
