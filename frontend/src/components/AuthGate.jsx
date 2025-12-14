/**
 * AuthGate Component
 * Full-screen authorization wall that blocks all access until valid code is entered
 * Code is verified against AUTH_ACCESS_CODE environment variable on the backend
 */

import { useState, useEffect } from 'react';

// In production (served from same origin), use empty string for relative URLs
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

// Session storage key for auth state
const AUTH_KEY = 'chimera_auth_verified';

export function AuthGate({ children }) {
  const [authRequired, setAuthRequired] = useState(null); // null = loading
  const [isVerified, setIsVerified] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if auth is required and if user is already verified
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if already verified in this session
      const sessionVerified = sessionStorage.getItem(AUTH_KEY);
      
      // Fetch auth status from backend
      const response = await fetch(`${API_URL}/api/auth/status`);
      const data = await response.json();
      
      setAuthRequired(data.authRequired);
      
      // If auth not required, or user already verified this session
      if (!data.authRequired || sessionVerified === 'true') {
        setIsVerified(true);
      }
    } catch (err) {
      console.error('Failed to check auth status:', err);
      // If we can't reach the server, assume no auth required
      setAuthRequired(false);
      setIsVerified(true);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Please enter an authorization code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store verification in session storage (clears when browser closes)
        sessionStorage.setItem(AUTH_KEY, 'true');
        setIsVerified(true);
      } else {
        setError(data.error || 'Invalid code');
        // Shake animation trigger
        const input = document.getElementById('auth-code-input');
        input?.classList.add('shake');
        setTimeout(() => input?.classList.remove('shake'), 500);
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Still checking auth status
  if (checking) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        zIndex: 99999
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(139,92,246,0.3)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ color: '#a5b4fc', fontSize: '1rem' }}>Initializing...</span>
        </div>
      </div>
    );
  }

  // Auth not required or already verified
  if (!authRequired || isVerified) {
    return children;
  }

  // Show authorization gate
  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        .auth-input:focus {
          outline: none;
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.3);
        }
      `}</style>
      
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        zIndex: 99999,
        padding: '20px'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulse 5s ease-in-out infinite 1s'
        }} />

        {/* Auth Card */}
        <div style={{
          background: 'rgba(30,30,50,0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(139,92,246,0.3)',
          padding: '48px 40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 50px rgba(139,92,246,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glow effect */}
          <div style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Logo/Icon */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '16px',
              animation: 'float 3s ease-in-out infinite'
            }}>
              🔐
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              CHIMERA
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              color: '#94a3b8',
              fontSize: '0.9rem'
            }}>
              Autonomous AI by Chimera.onl (@chimeradotonl)
            </p>
          </div>

          {/* Security Message */}
          <div style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{
              margin: 0,
              color: '#c7d2fe',
              fontSize: '0.85rem',
              lineHeight: '1.5'
            }}>
              🛡️ This application requires authorization.
              <br />
              Please enter your access code to continue.
            </p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#a5b4fc',
                fontSize: '0.85rem',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Authorization Code
              </label>
              <input
                id="auth-code-input"
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="Enter your access code"
                className="auth-input"
                autoFocus
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '1.1rem',
                  background: 'rgba(15,15,30,0.8)',
                  border: error ? '2px solid #ef4444' : '2px solid rgba(139,92,246,0.3)',
                  borderRadius: '12px',
                  color: '#e0e7ff',
                  transition: 'all 0.2s',
                  letterSpacing: '0.1em',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>⚠️</span>
                <span style={{ color: '#fca5a5', fontSize: '0.9rem' }}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: '1rem',
                fontWeight: '700',
                background: loading 
                  ? 'rgba(139,92,246,0.5)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(99,102,241,0.4)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 15px rgba(99,102,241,0.4)';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Verifying...
                </>
              ) : (
                <>
                  🚀 Enter Platform
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            marginTop: '24px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.75rem'
          }}>
            Contact the administrator if you need access
          </p>
        </div>
      </div>
    </>
  );
}

export default AuthGate;

