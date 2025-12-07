/**
 * Transaction Receipt Component
 * Shows detailed receipt for all transactions including payments
 */

import { GlassPanel } from './GlassPanel';
import { useState } from 'react';

export function TransactionReceipt({ receipt, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', icon: '✅' };
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', icon: '⏳' };
      case 'failed': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', icon: '❌' };
      default: return { bg: 'rgba(156, 163, 175, 0.15)', color: '#a3a3a3', icon: '○' };
    }
  };

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

  const status = getStatusColor(receipt.status || 'success');

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <GlassPanel 
        variant="modal"
        hover={false}
        style={{
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: status.bg
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: '#f5f5f5', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '2rem' }}>{getTypeIcon(receipt.type)}</span>
              Transaction Receipt
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: 'none',
                color: '#a3a3a3',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            background: status.bg,
            border: `1px solid ${status.color}30`
          }}>
            <span>{status.icon}</span>
            <span style={{ 
              color: status.color, 
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {receipt.status || 'Success'}
            </span>
          </div>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Transaction Type & Description */}
          <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
            <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Transaction Type
            </div>
            <div style={{ 
              color: '#f5f5f5', 
              fontWeight: '600',
              fontSize: '1.1rem',
              textTransform: 'capitalize'
            }}>
              {receipt.type}
            </div>
            {receipt.description && (
              <div style={{ color: '#a3a3a3', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {receipt.description}
              </div>
            )}
          </GlassPanel>

          {/* Transaction Hash */}
          {receipt.txHash && (
            <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Transaction Hash
              </div>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'space-between'
              }}>
                <code style={{ 
                  color: '#fbbf24',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {receipt.txHash}
                </code>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleCopy(receipt.txHash)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: '#fbbf24',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <a
                    href={`https://testnet.bscscan.com/tx/${receipt.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '6px',
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: '#fbbf24',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    View →
                  </a>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* Addresses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {receipt.from && (
              <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
                <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  From
                </div>
                <code style={{ 
                  color: '#86efac',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}>
                  {formatAddress(receipt.from)}
                </code>
              </GlassPanel>
            )}
            {receipt.to && (
              <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
                <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  To
                </div>
                <code style={{ 
                  color: '#86efac',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}>
                  {formatAddress(receipt.to)}
                </code>
              </GlassPanel>
            )}
          </div>

          {/* Amount & Gas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {receipt.amount && (
              <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
                <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Amount
                </div>
                <div style={{ color: '#f5f5f5', fontWeight: '600', fontSize: '1.1rem' }}>
                  {receipt.amount}
                </div>
              </GlassPanel>
            )}
            {receipt.gasUsed && (
              <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
                <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Gas Used
                </div>
                <div style={{ color: '#f5f5f5', fontWeight: '600', fontSize: '1.1rem' }}>
                  {receipt.gasUsed}
                </div>
              </GlassPanel>
            )}
          </div>

          {/* Block Info */}
          {(receipt.blockNumber || receipt.blockHash) && (
            <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {receipt.blockNumber && (
                  <div>
                    <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      Block Number
                    </div>
                    <div style={{ color: '#f5f5f5', fontWeight: '600' }}>
                      {receipt.blockNumber}
                    </div>
                  </div>
                )}
                {receipt.confirmations && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      Confirmations
                    </div>
                    <div style={{ color: '#86efac', fontWeight: '600' }}>
                      {receipt.confirmations}
                    </div>
                  </div>
                )}
              </div>
            </GlassPanel>
          )}

          {/* Timestamp */}
          {receipt.timestamp && (
            <GlassPanel variant="surface" hover={false} style={{ padding: '1rem' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Timestamp
              </div>
              <div style={{ color: '#f5f5f5' }}>
                {formatTimestamp(receipt.timestamp)}
              </div>
            </GlassPanel>
          )}

          {/* Payment Details (if payment type) */}
          {receipt.type === 'payment' && receipt.paymentDetails && (
            <GlassPanel 
              variant="surface" 
              hover={false} 
              style={{ 
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)'
              }}
            >
              <div style={{ color: '#93c5fd', fontSize: '0.85rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                💳 Payment Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                {receipt.paymentDetails.token && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a3a3a3' }}>Token:</span>
                    <span style={{ color: '#f5f5f5' }}>{receipt.paymentDetails.token}</span>
                  </div>
                )}
                {receipt.paymentDetails.service && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a3a3a3' }}>Service:</span>
                    <span style={{ color: '#f5f5f5' }}>{receipt.paymentDetails.service}</span>
                  </div>
                )}
                {receipt.paymentDetails.signature && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ color: '#a3a3a3', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      Payment Signature:
                    </div>
                    <code style={{ 
                      color: '#93c5fd',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      display: 'block'
                    }}>
                      {receipt.paymentDetails.signature.slice(0, 50)}...
                    </code>
                  </div>
                )}
              </div>
            </GlassPanel>
          )}

          {/* Additional Data */}
          {receipt.data && Object.keys(receipt.data).length > 0 && (
            <details>
              <summary style={{ 
                cursor: 'pointer', 
                color: '#fbbf24',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Show Raw Data
              </summary>
              <pre style={{
                padding: '1rem',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#a3a3a3',
                fontSize: '0.8rem',
                overflow: 'auto',
                maxHeight: '200px',
                fontFamily: 'monospace'
              }}>
                {JSON.stringify(receipt.data, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid rgba(251, 191, 36, 0.5)',
              color: '#fbbf24',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Close
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}


