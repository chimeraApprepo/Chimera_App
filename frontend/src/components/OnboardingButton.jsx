/**
 * OnboardingButton Component
 * "Super Faucet" for judges - one click to get test funds:
 * - 0.02 tBNB (for gas)
 * - 1,000 MockUSDC (for testing payments)
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { logActivity, ACTIVITY_TYPES } from './WalletStatus';

// In production (served from same origin), use empty string for relative URLs
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

export default function OnboardingButton() {
  const { address, isConnected } = useAccount();
  const [status, setStatus] = useState('idle'); // idle, loading, success, error, already_claimed
  const [message, setMessage] = useState('');
  const [txLinks, setTxLinks] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);

  // Check if user has already claimed
  useEffect(() => {
    if (isConnected && address) {
      checkClaimStatus();
    }
  }, [address, isConnected]);

  const checkClaimStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/faucet/check/${address}`);
      const data = await response.json();
      setHasClaimed(data.hasClaimed);
      if (data.hasClaimed) {
        setStatus('already_claimed');
      }
    } catch (err) {
      console.error('Failed to check claim status:', err);
    }
  };

  const handleClaim = async () => {
    if (!isConnected || !address) {
      setMessage('Please connect your wallet first');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('Sending funds to your wallet...');
    setTxLinks(null);

    try {
      const response = await fetch(`${API_URL}/api/faucet/drip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setStatus('already_claimed');
          setMessage(data.message || 'You have already claimed funds');
          setHasClaimed(true);
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to get funds');
        }
        return;
      }

      // Success! Log the activity
      logActivity(address, ACTIVITY_TYPES.FAUCET_CLAIM, {
        status: 'success',
        details: 'Received 0.02 tBNB + 1,000 MockUSDC from Super Faucet',
        txHash: data.transactions?.bnb?.hash,
        txHash2: data.transactions?.usdc?.hash,
        amount: '0.02 tBNB + 1,000 USDC'
      });
      
      setStatus('success');
      setMessage('🎉 Test funds sent successfully!');
      setTxLinks(data.transactions);
      // Note: Don't set hasClaimed here so the success UI stays visible
      // The backend tracks claims, so refresh will show "already claimed"

    } catch (err) {
      console.error('Faucet error:', err);
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  // Don't show if wallet not connected
  if (!isConnected) {
    return null;
  }

  // Already claimed - show minimal indicator
  if (status === 'already_claimed' || hasClaimed) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))',
        border: '1px solid rgba(34,197,94,0.4)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '1.25rem' }}>✅</span>
        <div>
          <div style={{ color: '#4ade80', fontWeight: '600', fontSize: '0.9rem' }}>
            Test Funds Received
          </div>
          <div style={{ color: '#86efac', fontSize: '0.75rem' }}>
            You're all set to test the platform!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
      border: '2px solid rgba(139,92,246,0.5)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ 
            fontSize: '1.5rem',
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            borderRadius: '10px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🚀
          </span>
          <div>
            <h3 style={{ 
              margin: 0, 
              color: '#e0e7ff', 
              fontSize: '1.1rem', 
              fontWeight: '700',
              letterSpacing: '0.02em'
            }}>
              Judge / Demo Mode
            </h3>
            <p style={{ margin: 0, color: '#a5b4fc', fontSize: '0.8rem' }}>
              Get test funds instantly
            </p>
          </div>
        </div>

        {/* Description */}
        <p style={{ 
          color: '#c7d2fe', 
          fontSize: '0.85rem', 
          margin: '0 0 16px 0',
          lineHeight: '1.5'
        }}>
          Click below to receive <strong style={{ color: '#fbbf24' }}>0.02 tBNB</strong> (for gas) and{' '}
          <strong style={{ color: '#4ade80' }}>1,000 MockUSDC</strong> (for testing) directly to your wallet.
        </p>

        {/* What you'll get */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'rgba(251,191,36,0.15)',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '1rem' }}>⛽</span>
            <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.85rem' }}>0.02 tBNB</span>
          </div>
          <div style={{
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '1rem' }}>💵</span>
            <span style={{ color: '#4ade80', fontWeight: '600', fontSize: '0.85rem' }}>1,000 USDC</span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleClaim}
          disabled={status === 'loading'}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: status === 'loading' 
              ? 'rgba(139,92,246,0.5)' 
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: status === 'loading' ? 'none' : '0 4px 12px rgba(99,102,241,0.4)'
          }}
          onMouseEnter={(e) => {
            if (status !== 'loading') {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = status === 'loading' ? 'none' : '0 4px 12px rgba(99,102,241,0.4)';
          }}
        >
          {status === 'loading' ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid white',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Sending Funds...
            </>
          ) : (
            <>
              🎁 Get Free Test Funds
            </>
          )}
        </button>

        {/* Success State - Full Display with Transaction Links */}
        {status === 'success' && (
          <div style={{
            marginTop: '16px',
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))',
            border: '2px solid rgba(34,197,94,0.4)',
            borderRadius: '12px',
          }}>
            {/* Success Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '16px' 
            }}>
              <span style={{ 
                fontSize: '2.5rem',
                animation: 'bounce 0.5s ease-out'
              }}>🎉</span>
              <div>
                <h4 style={{ 
                  margin: 0, 
                  color: '#4ade80', 
                  fontSize: '1.2rem', 
                  fontWeight: '700' 
                }}>
                  Test Funds Received!
                </h4>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: '#86efac', 
                  fontSize: '0.85rem' 
                }}>
                  Your wallet has been funded successfully
                </p>
              </div>
            </div>

            {/* Funds Received Summary */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                flex: 1,
                minWidth: '140px',
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⛽</div>
                <div style={{ color: '#fbbf24', fontWeight: '700', fontSize: '1.1rem' }}>0.02 tBNB</div>
                <div style={{ color: '#fcd34d', fontSize: '0.7rem' }}>For gas fees</div>
              </div>
              <div style={{
                flex: 1,
                minWidth: '140px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '10px',
            padding: '12px',
            textAlign: 'center'
          }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>💵</div>
                <div style={{ color: '#4ade80', fontWeight: '700', fontSize: '1.1rem' }}>1,000 USDC</div>
                <div style={{ color: '#86efac', fontSize: '0.7rem' }}>For testing</div>
              </div>
            </div>

            {/* Transaction Links */}
            {txLinks && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '10px',
                padding: '14px',
              }}>
                <div style={{ 
                  color: '#94a3b8', 
                  fontSize: '0.75rem', 
                  marginBottom: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  🔗 Transaction Links
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {txLinks.bnb && (
                  <a
                    href={txLinks.bnb.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(251,191,36,0.1)',
                        border: '1px solid rgba(251,191,36,0.3)',
                        borderRadius: '8px',
                        color: '#fbbf24',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(251,191,36,0.2)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(251,191,36,0.1)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <span>⛽ tBNB Transaction</span>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem',
                        opacity: 0.8
                      }}>
                        {txLinks.bnb.hash?.slice(0, 10)}...{txLinks.bnb.hash?.slice(-6)} ↗
                      </span>
                  </a>
                )}
                {txLinks.usdc && (
                  <a
                    href={txLinks.usdc.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '8px',
                        color: '#4ade80',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(34,197,94,0.2)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(34,197,94,0.1)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <span>💵 MockUSDC Transaction</span>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem',
                        opacity: 0.8
                      }}>
                        {txLinks.usdc.hash?.slice(0, 10)}...{txLinks.usdc.hash?.slice(-6)} ↗
                      </span>
                  </a>
                )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div style={{ 
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <span style={{ color: '#c7d2fe', fontSize: '0.85rem' }}>
                ✨ You're all set! Use the navigation above to explore the platform.
              </span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {/* Note */}
        <p style={{ 
          margin: '12px 0 0 0', 
          color: '#94a3b8', 
          fontSize: '0.7rem', 
          textAlign: 'center' 
        }}>
          One claim per wallet • BNB Testnet only
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

