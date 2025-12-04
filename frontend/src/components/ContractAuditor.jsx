/**
 * Contract Auditor Component
 * Audit contracts by source code or address
 * Integrated with x402 micropayments
 */

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';

export function ContractAuditor() {
  const { address: userAddress, isConnected } = useAccount();
  
  const [mode, setMode] = useState('code'); // 'code' or 'address'
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  // Step 1: Request payment before audit
  const handleRequestAudit = async () => {
    if (mode === 'code' && !code) return;
    if (mode === 'address' && !address) return;
    
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }
    
    setError(null);

    try {
      // Request payment from backend
      const response = await fetch('http://localhost:3000/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'contract_audit',
          userAddress
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentRequest(data.payment);
        setShowPayment(true);
      } else {
        throw new Error(data.error || 'Failed to create payment request');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Step 2: After payment, run the audit
  const handlePaymentComplete = async (paymentId) => {
    setShowPayment(false);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = mode === 'code' 
        ? { code } 
        : { address };

      const response = await fetch('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `x402 paymentId=${paymentId}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Audit failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskBadge = (score) => {
    if (score >= 90) return { text: 'Low Risk', bg: 'bg-green-500/20', color: 'text-green-400' };
    if (score >= 70) return { text: 'Medium Risk', bg: 'bg-amber-500/20', color: 'text-amber-400' };
    return { text: 'High Risk', bg: 'bg-red-500/20', color: 'text-red-400' };
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <span className="text-3xl">🛡️</span>
        Security Auditor
      </h2>
      <p className="text-gray-400 mb-6">
        AI-powered smart contract security analysis
      </p>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('code')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'code' 
              ? 'bg-amber-400 text-neutral-800' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📝 Source Code
        </button>
        <button
          onClick={() => setMode('address')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'address' 
              ? 'bg-amber-400 text-neutral-800' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          🔗 Contract Address
        </button>
      </div>

      {/* Input */}
      {mode === 'code' ? (
        <div className="mb-6">
          <label className="block text-gray-300 mb-2 text-sm">Solidity Source Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="pragma solidity ^0.8.0;

contract MyContract {
    // Your code here...
}"
            rows={12}
            className="w-full p-4 rounded-xl text-white font-mono text-sm"
            style={{ 
              backgroundColor: '#252542',
              border: '2px solid #333'
            }}
          />
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-gray-300 mb-2 text-sm">
            Contract Address (must be verified on BSCScan)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-4 rounded-xl text-white text-lg"
            style={{ 
              backgroundColor: '#252542',
              border: '2px solid #333'
            }}
          />
        </div>
      )}

      <CartoonButton
        label={loading ? 'Auditing...' : !isConnected ? 'Connect Wallet' : '🔍 Sign & Audit'}
        color="bg-green-400"
        onClick={handleRequestAudit}
        disabled={loading || !isConnected || (mode === 'code' ? !code : !address)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        paymentRequest={paymentRequest}
        onPaymentComplete={handlePaymentComplete}
        onSkip={(paymentId) => handlePaymentComplete(paymentId)}
        onCancel={() => setShowPayment(false)}
        demoMode={true}
      />

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="text-red-400 font-semibold">Error</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Score Card */}
          <div 
            className="rounded-xl p-6"
            style={{ 
              backgroundColor: result.passed 
                ? 'rgba(34, 197, 94, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              border: `2px solid ${result.passed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Security Score</div>
                <div className={`text-lg font-medium ${getRiskBadge(result.score).color}`}>
                  {getRiskBadge(result.score).text}
                </div>
                <div className={`text-sm mt-2 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {result.passed ? '✅ Passed Threshold' : '⚠️ Below Threshold'}
                </div>
              </div>
              <div 
                className="text-6xl font-bold"
                style={{ color: getScoreColor(result.score) }}
              >
                {result.score}
                <span className="text-2xl">%</span>
              </div>
            </div>
          </div>

          {/* Issue Summary */}
          {result.summary && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#252542' }}>
              <div className="text-gray-400 text-sm mb-3">Issue Summary</div>
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <div className="text-2xl font-bold text-red-400">{result.summary.criticalIssues || 0}</div>
                  <div className="text-xs text-red-300">Critical</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <div className="text-2xl font-bold text-amber-400">{result.summary.highIssues || 0}</div>
                  <div className="text-xs text-amber-300">High</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)' }}>
                  <div className="text-2xl font-bold text-yellow-400">{result.summary.mediumIssues || 0}</div>
                  <div className="text-xs text-yellow-300">Medium</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                  <div className="text-2xl font-bold text-green-400">{result.summary.lowIssues || 0}</div>
                  <div className="text-xs text-green-300">Low</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                  <div className="text-2xl font-bold text-blue-400">{result.summary.informational || 0}</div>
                  <div className="text-xs text-blue-300">Info</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#252542' }}>
              <div className="text-gray-400 text-sm mb-3">Recommendations</div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-amber-400">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Report */}
          {result.report && (
            <details className="rounded-xl p-4" style={{ backgroundColor: '#252542' }}>
              <summary className="text-gray-400 text-sm cursor-pointer">
                View Full Report
              </summary>
              <pre className="mt-3 p-3 rounded-lg text-xs overflow-auto max-h-64 text-gray-300 whitespace-pre-wrap"
                   style={{ backgroundColor: '#1a1a2e' }}>
                {result.report}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

