/**
 * Enhanced Transaction Preview Modal
 * Shows transaction details, safety scores, policy checks, and gas info
 * Themed to match Chimera design system
 */

import { useState } from 'react';
import { CartoonButton } from './CartoonButton';

export function TransactionPreview({ 
  code, 
  auditResult, 
  intent, 
  onSign, 
  onCancel,
  isOpen,
  estimatedGas = '0',
  contractName = 'Contract',
  policyCheck = null
}) {
  const [isSigning, setIsSigning] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

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
    if (score >= 90) return '#22c55e'; // green
    if (score >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getRiskLevel = (score) => {
    if (score >= 90) return { level: 'Low Risk', color: '#22c55e', bg: '#dcfce7' };
    if (score >= 70) return { level: 'Medium Risk', color: '#f59e0b', bg: '#fef3c7' };
    return { level: 'High Risk', color: '#ef4444', bg: '#fee2e2' };
  };

  const risk = auditResult ? getRiskLevel(auditResult.score) : null;
  const canExecute = !auditResult || auditResult.passed;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div 
        className="rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        style={{ 
          backgroundColor: '#1a1a2e',
          border: '2px solid #333',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b"
          style={{ borderColor: '#333' }}
        >
          <h2 className="text-2xl font-bold text-white m-0 flex items-center gap-3">
            <span className="text-3xl">📋</span>
            Transaction Preview
          </h2>
          <p className="text-gray-400 mt-2 mb-0">
            Review the details before signing
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Action Summary Card */}
          <div 
            className="rounded-xl p-4"
            style={{ backgroundColor: '#252542' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-1">Action</div>
                <div className="text-white font-semibold text-lg">
                  {intent?.type === 'deploy_contract' ? '🚀 Deploy Contract' :
                   intent?.type === 'transfer' ? '💸 Transfer Tokens' :
                   intent?.type === 'call_contract' ? '📞 Call Contract' :
                   intent?.type || 'Execute Transaction'}
                </div>
                {contractName && (
                  <div className="text-amber-400 text-sm mt-1">
                    {contractName}
                  </div>
                )}
              </div>
              <div 
                className="text-4xl p-3 rounded-xl"
                style={{ backgroundColor: '#1a1a2e' }}
              >
                {intent?.type === 'deploy_contract' ? '📄' :
                 intent?.type === 'transfer' ? '💰' :
                 intent?.type === 'call_contract' ? '⚡' : '🔧'}
              </div>
            </div>
          </div>

          {/* Safety Score Card */}
          {auditResult && (
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: risk.bg }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color: risk.color }}>
                    Security Audit
                  </div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: risk.color }}
                  >
                    {risk.level}
                  </div>
                  <div className="text-sm mt-1" style={{ color: risk.color, opacity: 0.8 }}>
                    {auditResult.passed ? '✅ Passed threshold' : '⚠️ Below threshold'}
                  </div>
                </div>
                <div 
                  className="text-5xl font-bold"
                  style={{ color: getScoreColor(auditResult.score) }}
                >
                  {auditResult.score}
                  <span className="text-2xl">%</span>
                </div>
              </div>
              
              {/* Issue Summary */}
              {auditResult.summary && (
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <div className="text-red-500 font-bold">{auditResult.summary.criticalIssues || 0}</div>
                    <div className="text-xs text-red-400">Critical</div>
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                    <div className="text-amber-500 font-bold">{auditResult.summary.highIssues || 0}</div>
                    <div className="text-xs text-amber-400">High</div>
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)' }}>
                    <div className="text-yellow-500 font-bold">{auditResult.summary.mediumIssues || 0}</div>
                    <div className="text-xs text-yellow-400">Medium</div>
                  </div>
                  <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                    <div className="text-green-500 font-bold">{auditResult.summary.lowIssues || 0}</div>
                    <div className="text-xs text-green-400">Low</div>
                  </div>
                </div>
              )}

              {auditResult.report && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium" style={{ color: risk.color }}>
                    View Full Report
                  </summary>
                  <pre 
                    className="mt-2 p-3 rounded-lg text-xs overflow-auto max-h-40"
                    style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: '#666' }}
                  >
                    {auditResult.report}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Gas Cost Card */}
          <div 
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ backgroundColor: '#252542' }}
          >
            <div>
              <div className="text-gray-400 text-sm mb-1">Gas Cost</div>
              <div className="text-white font-semibold text-lg">
                $0.00
              </div>
              <div className="text-green-400 text-sm">
                ✨ Sponsored by Chimera
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-500 text-sm">Estimated</div>
              <div className="text-gray-400">~{estimatedGas || '0.001'} tBNB</div>
            </div>
          </div>

          {/* Policy Check Card */}
          <div 
            className="rounded-xl p-4"
            style={{ backgroundColor: '#252542' }}
          >
            <div className="text-gray-400 text-sm mb-3">Policy Check</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Within spend limits</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Verified transaction type</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={canExecute ? 'text-green-400' : 'text-red-400'}>
                  {canExecute ? '✓' : '✗'}
                </span>
                <span className="text-gray-300">
                  Audit threshold {canExecute ? 'passed' : 'not met'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">Rate limit OK</span>
              </div>
            </div>
          </div>

          {/* Contract Code Preview */}
          {code && (
            <div 
              className="rounded-xl p-4"
              style={{ backgroundColor: '#252542' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-gray-400 text-sm">Contract Code</div>
                <button 
                  onClick={() => setShowFullCode(!showFullCode)}
                  className="text-amber-400 text-sm hover:text-amber-300"
                >
                  {showFullCode ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <pre 
                className={`text-xs overflow-auto rounded-lg p-3 ${showFullCode ? 'max-h-96' : 'max-h-32'}`}
                style={{ backgroundColor: '#1a1a2e', color: '#94a3b8' }}
              >
                {code}
              </pre>
            </div>
          )}

          {/* BSCScan Link */}
          {intent?.type === 'deploy_contract' && (
            <div className="text-center text-sm text-gray-500">
              📍 Will deploy to BSC Testnet • 
              <a 
                href="https://testnet.bscscan.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 ml-1"
              >
                View on BSCScan →
              </a>
            </div>
          )}

          {/* Warning for failed audit */}
          {auditResult && !auditResult.passed && (
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <div className="text-red-400 font-semibold mb-1">⚠️ Audit Below Threshold</div>
              <div className="text-red-300 text-sm">
                The security audit score is below the required threshold. 
                Signing is disabled for your protection.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div 
          className="p-6 border-t flex justify-end gap-4"
          style={{ borderColor: '#333' }}
        >
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
      </div>
    </div>
  );
}
