/**
 * WalletStatus Component
 * Shows wallet connection status in the top right corner
 * - When disconnected: Shows connect button matching card style
 * - When connected: Shows wallet address + CHIM balance with dropdown menu
 */

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { getCreditBalance } from '../services/api';
import { 
  getWalletActivity, 
  logActivity, 
  ACTIVITY_TYPES, 
  ACTIVITY_CONFIG, 
  formatTimestamp,
  getExplorerUrl 
} from '../store/walletActivity';

// CHIM Token Icon
const ChimIcon = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" fill="none" width={size} height={size} stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" className="stroke-amber-400" style={{ stroke: '#fbbf24' }} />
    <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" style={{ stroke: '#fbbf24' }} />
  </svg>
);

// Logs Modal Component
function LogsModal({ address, onClose }) {
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    if (address) {
      setActivities(getWalletActivity(address));
    }
  }, [address]);

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        zIndex: 1001,
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <div>
              <h2 style={{ margin: 0, color: 'white', fontSize: '1.1rem', fontWeight: '600' }}>
                Activity Log
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                {address?.slice(0, 8)}...{address?.slice(-6)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}
          >
            ✕ Close
          </button>
        </div>
        
        {/* Activity List */}
        <div style={{
          padding: '12px',
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 80px)'
        }}>
          {activities.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#64748b'
            }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '12px' }}>📭</span>
              <p style={{ margin: 0 }}>No activity recorded yet</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#475569' }}>
                Actions like claiming test funds, deploying contracts, and swaps will appear here
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.map((activity) => {
                const config = ACTIVITY_CONFIG[activity.type] || { 
                  label: activity.type, 
                  icon: '•', 
                  color: '#94a3b8' 
                };
                
                return (
                  <div
                    key={activity.id}
                    style={{
                      background: 'rgba(51,65,85,0.3)',
                      border: '1px solid rgba(71,85,105,0.3)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Activity Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: activity.details || activity.txHash || activity.contractAddress ? '8px' : 0
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ 
                          fontSize: '1.1rem',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${config.color}20`,
                          borderRadius: '8px'
                        }}>
                          {config.icon}
                        </span>
                        <div>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                            {config.label}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            {formatTimestamp(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status badge if present */}
                      {activity.status && (
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          background: activity.status === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                          color: activity.status === 'success' ? '#4ade80' : '#f87171'
                        }}>
                          {activity.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    {/* Activity Details */}
                    {activity.details && (
                      <div style={{ 
                        color: '#94a3b8', 
                        fontSize: '0.8rem',
                        marginBottom: '8px',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '6px'
                      }}>
                        {activity.details}
                      </div>
                    )}
                    
                    {/* Links */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {activity.txHash && (
                        <a
                          href={getExplorerUrl(activity.txHash, 'tx')}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: 'rgba(59,130,246,0.15)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '6px',
                            color: '#60a5fa',
                            fontSize: '0.7rem',
                            textDecoration: 'none',
                            fontFamily: 'monospace'
                          }}
                        >
                          📝 Tx: {activity.txHash.slice(0, 8)}...
                        </a>
                      )}
                      
                      {activity.txHash2 && (
                        <a
                          href={getExplorerUrl(activity.txHash2, 'tx')}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: 'rgba(34,197,94,0.15)',
                            border: '1px solid rgba(34,197,94,0.3)',
                            borderRadius: '6px',
                            color: '#4ade80',
                            fontSize: '0.7rem',
                            textDecoration: 'none',
                            fontFamily: 'monospace'
                          }}
                        >
                          💵 USDC Tx: {activity.txHash2.slice(0, 8)}...
                        </a>
                      )}
                      
                      {activity.contractAddress && (
                        <a
                          href={getExplorerUrl(activity.contractAddress, 'address')}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            background: 'rgba(16,185,129,0.15)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: '6px',
                            color: '#34d399',
                            fontSize: '0.7rem',
                            textDecoration: 'none',
                            fontFamily: 'monospace'
                          }}
                        >
                          📄 Contract: {activity.contractAddress.slice(0, 8)}...
                        </a>
                      )}
                    </div>
                    
                    {/* Amount info if present */}
                    {(activity.amount || activity.chimAmount) && (
                      <div style={{ 
                        marginTop: '8px', 
                        display: 'flex', 
                        gap: '12px',
                        fontSize: '0.8rem'
                      }}>
                        {activity.amount && (
                          <span style={{ color: '#fbbf24' }}>
                            Amount: <strong>{activity.amount}</strong>
                          </span>
                        )}
                        {activity.chimAmount && (
                          <span style={{ color: '#fbbf24' }}>
                            CHIM: <strong>{activity.chimAmount}</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function WalletStatus({ onNavigate, style = {} }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [chimBalance, setChimBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Log wallet connection
  useEffect(() => {
    if (isConnected && address) {
      // Log connection (check if recent to avoid duplicate logs)
      const activities = getWalletActivity(address);
      const recentConnect = activities.find(a => 
        a.type === ACTIVITY_TYPES.WALLET_CONNECT && 
        Date.now() - new Date(a.timestamp).getTime() < 60000
      );
      if (!recentConnect) {
        logActivity(address, ACTIVITY_TYPES.WALLET_CONNECT, {
          status: 'success',
          details: 'Wallet connected to Chimera'
        });
      }
      fetchChimBalance();
      const interval = setInterval(fetchChimBalance, 30000);
      
      // Listen for balance refresh events from other components
      const handleBalanceRefresh = () => {
        console.log('[WalletStatus] Received balance refresh event');
        fetchChimBalance();
      };
      window.addEventListener('chim-balance-changed', handleBalanceRefresh);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('chim-balance-changed', handleBalanceRefresh);
      };
    } else {
      setChimBalance(null);
    }
  }, [address, isConnected]);

  const fetchChimBalance = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const data = await getCreditBalance(address);
      setChimBalance(data.formatted || '0');
    } catch (err) {
      console.error('Failed to fetch CHIM balance:', err);
      setChimBalance('0');
    } finally {
      setLoading(false);
    }
  };

  const handleChimClick = () => {
    if (onNavigate) {
      onNavigate('credits');
    }
  };

  const handleDisconnect = () => {
    if (address) {
      logActivity(address, ACTIVITY_TYPES.WALLET_DISCONNECT, {
        details: 'Wallet disconnected'
      });
    }
    disconnect();
    setShowWalletMenu(false);
  };

  const handleOpenLogs = () => {
    setShowLogs(true);
    setShowWalletMenu(false);
  };

  const cardStyle = {
    background: 'rgba(250, 250, 250, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(212, 212, 212, 0.1)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    ...style
  };

  const hoverStyle = {
    background: 'rgba(250, 250, 250, 0.1)',
    borderColor: 'rgba(212, 212, 212, 0.3)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
  };

  // Connected state - show address and CHIM balance with dropdown
  if (isConnected && address) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', ...style }}>
          {/* CHIM Balance - Clickable to go to credits page */}
          <div
            onClick={handleChimClick}
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(251, 191, 36, 0.1)',
              borderColor: 'rgba(251, 191, 36, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Click to manage credits"
          >
            <ChimIcon size={18} />
            <span style={{ 
              fontFamily: 'monospace', 
              fontWeight: '600', 
              color: '#fbbf24',
              fontSize: '0.9rem'
            }}>
              {loading ? '...' : chimBalance || '0'}
            </span>
            <span style={{ color: 'rgba(251, 191, 36, 0.7)', fontSize: '0.75rem' }}>
              CHIM
            </span>
          </div>

          {/* Wallet Address with Dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              style={{
                ...cardStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, hoverStyle);
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = cardStyle.background;
                e.currentTarget.style.borderColor = 'rgba(212, 212, 212, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 8px #4ade80'
              }} />
              <span style={{ 
                fontFamily: 'monospace', 
                color: '#d4d4d4',
                fontSize: '0.85rem'
              }}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#94a3b8" 
                strokeWidth="2"
                style={{
                  transform: showWalletMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </div>

            {/* Wallet Dropdown Menu */}
            {showWalletMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.5rem',
                  background: 'rgba(15, 23, 42, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  borderRadius: '12px',
                  padding: '6px',
                  minWidth: '160px',
                  zIndex: 1000,
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
                }}
              >
                {/* Logs Option */}
                <div
                  onClick={handleOpenLogs}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#f1f5f9',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>📋</span>
                  Activity Logs
                </div>

                {/* Divider */}
                <div style={{ 
                  height: '1px', 
                  background: 'rgba(71, 85, 105, 0.5)', 
                  margin: '4px 8px' 
                }} />

                {/* Disconnect Option */}
                <div
                  onClick={handleDisconnect}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#f87171',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>🔌</span>
                  Disconnect
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close wallet menu */}
        {showWalletMenu && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={() => setShowWalletMenu(false)}
          />
        )}

        {/* Logs Modal */}
        {showLogs && (
          <LogsModal address={address} onClose={() => setShowLogs(false)} />
        )}
      </>
    );
  }

  // Disconnected state - show connect button
  return (
    <div style={{ position: 'relative', ...style }}>
      <div
        onClick={() => setShowConnectors(!showConnectors)}
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, hoverStyle);
          e.currentTarget.style.transform = 'scale(1.02)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = cardStyle.background;
          e.currentTarget.style.borderColor = 'rgba(212, 212, 212, 0.1)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/>
          <path d="M16 11h-4a2 2 0 0 0-2 2v2h8v-2a2 2 0 0 0-2-2z"/>
          <circle cx="14" cy="7" r="2"/>
        </svg>
        <span style={{ color: '#d4d4d4', fontWeight: '500', fontSize: '0.9rem' }}>
          Connect Wallet
        </span>
      </div>

      {/* Connector dropdown */}
      {showConnectors && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '12px',
            padding: '0.5rem',
            minWidth: '180px',
            zIndex: 1000,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {connectors.map((connector) => (
            <div
              key={connector.id}
              onClick={() => {
                connect({ connector });
                setShowConnectors(false);
              }}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#f5f5f5',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {connector.name}
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {showConnectors && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999
          }}
          onClick={() => setShowConnectors(false)}
        />
      )}
    </div>
  );
}

export default WalletStatus;

// Export activity logging for use in other components
export { logActivity, ACTIVITY_TYPES };

/**
 * Trigger a CHIM balance refresh in the WalletStatus component
 * Call this after any operation that changes the user's CHIM balance
 */
export function triggerChimBalanceRefresh() {
  console.log('[WalletStatus] Dispatching balance refresh event');
  window.dispatchEvent(new CustomEvent('chim-balance-changed'));
}
