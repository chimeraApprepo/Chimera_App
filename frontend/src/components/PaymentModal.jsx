/**
 * Payment Modal
 * x402 payment flow for premium features
 * Themed for Chimera with skip option for demo
 */

import { useState } from 'react';
import { useSignTypedData, useAccount } from 'wagmi';
import { CartoonButton } from './CartoonButton';

// Generate EIP-712 typed data for payment
// Note: verifyingContract is omitted since we use off-chain signature verification
function generateTypedData(paymentRequest) {
  const domain = {
    name: 'Chimera',
    version: '1',
    chainId: paymentRequest.chainId || 97
    // verifyingContract intentionally omitted - not required for off-chain verification
  };

  const types = {
    Payment: [
      { name: 'paymentId', type: 'string' },
      { name: 'amount', type: 'string' },
      { name: 'token', type: 'string' },
      { name: 'recipient', type: 'address' },
      { name: 'endpoint', type: 'string' },
      { name: 'deadline', type: 'uint256' }
    ]
  };

  const deadline = Math.floor(new Date(paymentRequest.expiresAt).getTime() / 1000);

  const message = {
    paymentId: paymentRequest.id,
    amount: paymentRequest.amount,
    token: paymentRequest.token,
    recipient: paymentRequest.recipient,
    endpoint: paymentRequest.endpoint,
    deadline: BigInt(deadline)
  };

  return { domain, types, message };
}

export function PaymentModal({ 
  paymentRequest, 
  onPaymentComplete, 
  onSkip,
  onCancel,
  isOpen,
  demoMode = true
}) {
  const [isPaying, setIsPaying] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const { signTypedDataAsync } = useSignTypedData();
  const { address } = useAccount();

  if (!isOpen || !paymentRequest) return null;

  const handlePay = async () => {
    setIsPaying(true);
    try {
      // Generate typed data from payment request
      const typedData = generateTypedData(paymentRequest);
      
      console.log('Signing payment with typed data:', typedData);
      
      // Sign EIP-712 payment
      const signature = await signTypedDataAsync({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: 'Payment',
        message: typedData.message
      });

      console.log('Payment signed:', signature.slice(0, 20) + '...');

      // Verify payment with backend
      const response = await fetch('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentRequest.id,
          signature,
          userAddress: address
        })
      });

      const result = await response.json();

      if (result.success) {
        onPaymentComplete(paymentRequest.id, signature);
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      // Don't alert if user rejected the signature
      if (!error.message?.includes('User rejected') && !error.message?.includes('user rejected')) {
        alert('Payment failed: ' + error.message);
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      const response = await fetch('http://localhost:3000/api/payments/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentRequest.id })
      });

      const result = await response.json();

      if (result.success) {
        onSkip?.(paymentRequest.id);
        onPaymentComplete?.(paymentRequest.id, null);
      } else {
        throw new Error(result.error || 'Skip failed');
      }
    } catch (error) {
      console.error('Skip error:', error);
      alert('Failed to skip: ' + error.message);
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <div 
        className="rounded-3xl max-w-md w-full overflow-hidden"
        style={{ 
          backgroundColor: '#1a1a2e',
          border: '2px solid #333',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header */}
        <div 
          className="p-6 text-center"
          style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 179, 8, 0.1) 100%)',
            borderBottom: '1px solid #333'
          }}
        >
          <div className="text-4xl mb-3">💰</div>
          <h2 className="text-xl font-bold text-white m-0">Payment Required</h2>
          <p className="text-gray-400 text-sm mt-2 mb-0">
            {paymentRequest.description || 'Premium Feature'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Amount Display */}
          <div 
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: '#252542' }}
          >
            <div className="text-gray-400 text-sm mb-1">Amount</div>
            <div className="text-3xl font-bold text-amber-400">
              {paymentRequest.amount} {paymentRequest.token}
            </div>
            <div className="text-gray-500 text-xs mt-2">
              ~${(parseFloat(paymentRequest.amount || 0) * 300).toFixed(2)} USD
            </div>
          </div>

          {/* Payment Details */}
          <div 
            className="rounded-xl p-4 text-sm"
            style={{ backgroundColor: '#252542' }}
          >
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white">BSC Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient</span>
                <span className="text-white font-mono text-xs">
                  {paymentRequest.recipient?.slice(0, 8)}...{paymentRequest.recipient?.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expires</span>
                <span className="text-amber-400">
                  {paymentRequest.expiresAt ? new Date(paymentRequest.expiresAt).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div 
            className="rounded-xl p-4 text-sm"
            style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
          >
            <div className="text-green-400 font-medium mb-1">🔒 Secure Payment</div>
            <div className="text-green-300 text-xs">
              You'll sign an EIP-712 message to authorize. No tokens are transferred until service is delivered.
            </div>
          </div>

          {/* Demo Mode Banner */}
          {demoMode && paymentRequest.demoSkipAllowed && (
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.3)' }}
            >
              <div className="text-purple-400 font-medium text-sm">✨ Demo Mode Active</div>
              <div className="text-purple-300 text-xs mt-1">
                You can skip payment for testing purposes
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div 
          className="p-6 flex flex-col gap-3"
          style={{ borderTop: '1px solid #333' }}
        >
          <CartoonButton
            label={isPaying ? 'Signing...' : '✍️ Sign & Pay'}
            color="bg-amber-400"
            onClick={handlePay}
            disabled={isPaying || isSkipping}
          />
          
          {demoMode && paymentRequest.demoSkipAllowed && (
            <CartoonButton
              label={isSkipping ? 'Skipping...' : '⏭️ Skip (Demo)'}
              color="bg-purple-400"
              onClick={handleSkip}
              disabled={isPaying || isSkipping}
            />
          )}
          
          <button
            onClick={onCancel}
            disabled={isPaying || isSkipping}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
