/**
 * Transaction History Component
 * Shows all transaction receipts in a compact list
 */

import { useState } from 'react';
import { GlassPanel } from './GlassPanel';
import { TransactionReceipt } from './TransactionReceipt';

export function TransactionHistory({ transactions = [] }) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  if (transactions.length === 0) {
    return null;
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment': return '💳';
      case 'generation': return '⚙️';
      case 'audit': return '🔍';
      case 'deployment': return '🚀';
      case 'transfer': return '💸';
      default: return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return { color: '#86efac', icon: '✅' };
      case 'pending': return { color: '#fbbf24', icon: '⏳' };
      case 'failed': return { color: '#fca5a5', icon: '❌' };
      default: return { color: '#a3a3a3', icon: '○' };
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <>
      <GlassPanel variant="surface" hover={false} style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📜</span>
            <div>
              <div style={{ color: '#f5f5f5', fontWeight: '600' }}>
                Transaction History
              </div>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {transactions.slice().reverse().map((tx, index) => {
            const status = getStatusColor(tx.status || 'success');
            
            return (
              <div
                key={tx.id || index}
                onClick={() => setSelectedReceipt(tx)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{ 
                    fontSize: '1.5rem',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.2)'
                  }}>
                    {getTypeIcon(tx.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: '#f5f5f5', 
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      textTransform: 'capitalize'
                    }}>
                      {tx.type}
                    </div>
                    <div style={{ 
                      color: '#a3a3a3', 
                      fontSize: '0.8rem',
                      marginTop: '0.1rem'
                    }}>
                      {tx.description || formatTime(tx.timestamp)}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {tx.amount && (
                    <div style={{ 
                      textAlign: 'right',
                      marginRight: '0.5rem'
                    }}>
                      <div style={{ 
                        color: '#fbbf24', 
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        {tx.amount}
                      </div>
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    background: `${status.color}20`,
                    border: `1px solid ${status.color}30`
                  }}>
                    <span style={{ fontSize: '0.85rem' }}>{status.icon}</span>
                    <span style={{ 
                      color: status.color,
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {tx.status || 'Success'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {selectedReceipt && (
        <TransactionReceipt 
          receipt={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)} 
        />
      )}
    </>
  );
}


