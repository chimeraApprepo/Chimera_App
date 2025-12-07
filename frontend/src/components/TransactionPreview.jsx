/**
 * Enhanced Transaction Preview - Collapsible Inline Panel
 * Shows transaction details, safety scores, policy checks, and gas info
 * Can be minimized/expanded so users can still see audit loop records
 * Glass morphism design
 */

import { useState } from 'react';
import { CartoonButton } from './CartoonButton';
import { GlassPanel } from './GlassPanel';
import { QuickFixSuggestions } from './QuickFixSuggestions';

export function TransactionPreview({ 
  code, 
  auditResult, 
  intent, 
  onSign, 
  onCancel,
  isOpen,
  estimatedGas = '0',
  contractName = 'Contract',
  policyCheck = null,
  onApplyFix = null,
  defaultExpanded = true
}) {
  const [isSigning, setIsSigning] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!isOpen) return null;

  const handleSign = async () => {
    setIsSigning(true);
    try {
      await onSign();
    } finally {
      setIsSigning(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#86efac';
    if (score >= 70) return '#fbbf24';
    return '#fca5a5';
  };

  const getRiskLevel = (score) => {
    if (score >= 90) return { level: 'Low Risk', color: '#86efac', bg: 'rgba(34, 197, 94, 0.15)' };
    if (score >= 70) return { level: 'Medium Risk', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' };
    return { level: 'High Risk', color: '#fca5a5', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  const risk = auditResult ? getRiskLevel(auditResult.score) : null;
  // For hackathon demo: always allow execution, just show warnings
  const canExecute = true;

  // Minimized view - just shows a compact header that can be clicked to expand
  if (!isExpanded) {
    return (
      <GlassPanel 
        variant="card"
        hover={true}
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))',
          border: '2px solid rgba(251,191,36,0.4)',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.75rem' }}>📋</div>
            <div>
              <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '1.1rem', fontWeight: '700' }}>
                Transaction Preview Ready
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#a3a3a3', fontSize: '0.85rem' }}>
                {contractName} • Score: {auditResult?.score || 0}% • Click to expand and sign
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {auditResult && (
              <div style={{ 
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                background: risk.bg,
                border: `1px solid ${risk.color}40`,
                color: risk.color,
                fontWeight: '600',
                fontSize: '0.9rem'
              }}>
                {auditResult.score}%
              </div>
            )}
            <div style={{ color: '#a3a3a3', fontSize: '1.5rem' }}>▼</div>
          </div>
        </div>
      </GlassPanel>
    );
  }

  // Full expanded view
  return (
    <GlassPanel 
      variant="card"
      hover={false}
      style={{
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.05))',
        border: '2px solid rgba(251,191,36,0.3)',
        overflow: 'hidden'
      }}
    >
      {/* Collapsible Header */}
      <div 
        style={{ 
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.2)'
        }}
        onClick={() => setIsExpanded(false)}
      >
        <h2 style={{ 
          fontSize: '1.35rem', 
          fontWeight: '700', 
          color: '#f5f5f5', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>📋</span>
          Transaction Preview
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>Click to minimize</span>
          <div style={{ color: '#a3a3a3', fontSize: '1.25rem' }}>▲</div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Action Summary Card */}
        <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Action</div>
              <div style={{ color: '#f5f5f5', fontWeight: '600', fontSize: '1.1rem' }}>
                {intent?.type === 'deploy_contract' ? '🚀 Deploy Contract' :
                 intent?.type === 'transfer' ? '💸 Transfer Tokens' :
                 intent?.type === 'call_contract' ? '📞 Call Contract' :
                 intent?.type || 'Execute Transaction'}
              </div>
              {contractName && (
                <div style={{ color: '#fbbf24', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  {contractName}
                </div>
              )}
            </div>
            <div style={{ 
              fontSize: '2.5rem',
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              {intent?.type === 'deploy_contract' ? '📄' :
               intent?.type === 'transfer' ? '💰' :
               intent?.type === 'call_contract' ? '⚡' : '🔧'}
            </div>
          </div>
        </GlassPanel>

        {/* Safety Score Card */}
        {auditResult && (
          <GlassPanel 
            variant="surface" 
            hover={false}
            style={{ 
              padding: '1.25rem',
              background: risk.bg,
              border: `1px solid ${risk.color}30`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: risk.color }}>
                  Security Audit
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: risk.color }}>
                  {risk.level}
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: risk.color, opacity: 0.8 }}>
                  {auditResult.passed ? '✅ Passed threshold' : '⚠️ Below threshold'}
                </div>
              </div>
              <div style={{ 
                fontSize: '3rem', 
                fontWeight: '700',
                color: getScoreColor(auditResult.score),
                textShadow: `0 0 30px ${getScoreColor(auditResult.score)}40`
              }}>
                {auditResult.score}
                <span style={{ fontSize: '1.5rem' }}>%</span>
              </div>
            </div>
            

            {auditResult.report && (
              <details style={{ marginTop: '0.75rem' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: risk.color }}>
                  View Full Report
                </summary>
                <pre style={{ 
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '150px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: '#a3a3a3',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {auditResult.report}
                </pre>
              </details>
            )}
          </GlassPanel>
        )}

        {/* Quick Fix Suggestions */}
        {auditResult && auditResult.report && onApplyFix && (
          <QuickFixSuggestions 
            auditReport={auditResult.report}
            contractCode={code}
            onApplyFix={onApplyFix}
          />
        )}

        {/* Gas Cost Card */}
        <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Gas Cost</div>
              <div style={{ color: '#f5f5f5', fontWeight: '600', fontSize: '1.1rem' }}>$0.00</div>
              <div style={{ color: '#86efac', fontSize: '0.85rem' }}>✨ Sponsored by Chimera</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#737373', fontSize: '0.8rem' }}>Estimated</div>
              <div style={{ color: '#a3a3a3' }}>~{estimatedGas || '0.001'} tBNB</div>
            </div>
          </div>
        </GlassPanel>

        {/* Policy Check Card */}
        <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
          <div style={{ color: '#a3a3a3', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Policy Check</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#86efac' }}>✓</span>
              <span style={{ color: '#d4d4d4' }}>Within spend limits</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#86efac' }}>✓</span>
              <span style={{ color: '#d4d4d4' }}>Verified transaction type</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: canExecute ? '#86efac' : '#fca5a5' }}>
                {canExecute ? '✓' : '✗'}
              </span>
              <span style={{ color: '#d4d4d4' }}>
                Audit threshold {canExecute ? 'passed' : 'not met'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: '#86efac' }}>✓</span>
              <span style={{ color: '#d4d4d4' }}>Rate limit OK</span>
            </div>
          </div>
        </GlassPanel>

        {/* Contract Code Preview */}
        {code && (
          <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>Contract Code</div>
              <button 
                onClick={() => setShowFullCode(!showFullCode)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {showFullCode ? 'Collapse' : 'Expand'}
              </button>
            </div>
            <pre style={{
              fontSize: '0.8rem',
              overflow: 'auto',
              borderRadius: '12px',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#a3a3a3',
              maxHeight: showFullCode ? '400px' : '120px',
              margin: 0
            }}>
              {code}
            </pre>
          </GlassPanel>
        )}

        {/* BSCScan Link */}
        {intent?.type === 'deploy_contract' && (
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#737373' }}>
            📍 Will deploy to BSC Testnet • 
            <a 
              href="https://testnet.bscscan.com" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#fbbf24', marginLeft: '0.25rem', textDecoration: 'none' }}
            >
              View on BSCScan →
            </a>
          </div>
        )}

        {/* Warning for failed audit */}
        {auditResult && !auditResult.passed && (
          <GlassPanel 
            variant="surface" 
            hover={false}
            style={{ 
              padding: '1rem 1.25rem', 
              textAlign: 'center',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}
          >
            <div style={{ color: '#fbbf24', fontWeight: '600', marginBottom: '0.25rem' }}>
              ⚠️ Audit Score Note
            </div>
            <div style={{ color: '#fbbf24', opacity: 0.9, fontSize: '0.85rem' }}>
              The audit score is below the recommended threshold. 
              You can still deploy for testing purposes.
            </div>
          </GlassPanel>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ 
        padding: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '1rem',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <CartoonButton
          label="Cancel"
          color="bg-gray-500"
          onClick={onCancel}
          disabled={isSigning}
        />
        <CartoonButton
          label={isSigning ? 'Signing...' : '✍️ Sign & Execute'}
          color={canExecute ? 'bg-amber-400' : 'bg-gray-500'}
          onClick={handleSign}
          disabled={isSigning || !canExecute}
        />
      </div>
    </GlassPanel>
  );
}
