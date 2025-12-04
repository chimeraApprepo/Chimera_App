/**
 * Transfer Interface Component
 * Send tokens to any address (gasless!)
 * Integrated with x402 micropayments
 */

import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';

const TOKENS = [
  { symbol: 'tBNB', name: 'Test BNB', address: null },
  { symbol: 'BUSD', name: 'Binance USD', address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee' },
  { symbol: 'USDT', name: 'Tether', address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' },
];

export function TransferInterface() {
  const { address: userAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [token, setToken] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);

  const handlePreview = async () => {
    if (!recipient || !amount) return;

    setPreviewLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/transfer/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, to: recipient, amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Preview failed');
      }

      setPreview(data.preview);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Step 1: Request payment before transfer
  const handleRequestTransfer = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!preview) {
      setError('Please preview the transaction first');
      return;
    }

    setError(null);

    try {
      // Request payment from backend
      const response = await fetch('http://localhost:3000/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'contract_deploy', // Using deploy pricing for transfers
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

  // Step 2: After payment, sign and execute transfer
  const handlePaymentComplete = async (paymentId, signature) => {
    setShowPayment(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Sign the transfer intent
      const domain = {
        name: 'Chimera',
        version: '1',
        chainId: 97,
        verifyingContract: '0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9'
      };

      const types = {
        Intent: [
          { name: 'type', type: 'string' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'dataHash', type: 'bytes32' }
        ]
      };

      const nonce = BigInt(Date.now());
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
      
      const dataString = JSON.stringify({ token, to: recipient, amount });
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const message = {
        type: 'transfer',
        nonce,
        deadline,
        dataHash
      };

      const intentSignature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'Intent',
        message
      });

      console.log('Transfer intent signed');

      // Execute transfer
      const response = await fetch('http://localhost:3000/api/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `x402 paymentId=${paymentId}`
        },
        body: JSON.stringify({ 
          token, 
          to: recipient, 
          amount,
          signature: intentSignature
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Transfer failed');
      }

      setSuccess({
        txHash: responseData.txHash,
        bscScanUrl: responseData.bscScanUrl
      });
      
      // Reset form
      setRecipient('');
      setAmount('');
      setPreview(null);
    } catch (err) {
      if (!err.message?.includes('User rejected')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <span className="text-3xl">💸</span>
        Send Tokens
      </h2>
      <p className="text-gray-400 mb-6">
        Transfer tokens to any address (Gasless!)
      </p>

      {/* Transfer Card */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#252542' }}>
        {/* Token Selection */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Token</label>
          <div className="grid grid-cols-3 gap-2">
            {TOKENS.map((t) => (
              <button
                key={t.symbol}
                onClick={() => setToken(t.address)}
                className={`p-3 rounded-xl text-center transition-all ${
                  token === t.address 
                    ? 'bg-amber-400 text-neutral-800' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-bold">{t.symbol}</div>
                <div className="text-xs opacity-70">{t.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recipient */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              setPreview(null);
            }}
            placeholder="0x..."
            className="w-full px-4 py-3 rounded-xl text-white"
            style={{ 
              backgroundColor: '#1a1a2e',
              border: isValidAddress(recipient) || !recipient 
                ? '2px solid transparent' 
                : '2px solid rgba(239, 68, 68, 0.5)'
            }}
          />
          {recipient && !isValidAddress(recipient) && (
            <div className="text-red-400 text-xs mt-1">Invalid address format</div>
          )}
        </div>

        {/* Amount */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setPreview(null);
            }}
            placeholder="0.0"
            className="w-full px-4 py-3 rounded-xl text-white text-xl font-mono"
            style={{ backgroundColor: '#1a1a2e' }}
          />
        </div>

        {/* Preview Button */}
        {!preview && (
          <button
            onClick={handlePreview}
            disabled={previewLoading || !recipient || !amount || !isValidAddress(recipient)}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {previewLoading ? 'Loading...' : '👁️ Preview Transaction'}
          </button>
        )}

        {/* Preview Details */}
        {preview && (
          <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: '#1a1a2e' }}>
            <div className="text-gray-400 text-sm mb-3">Transaction Preview</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Token</span>
                <span className="text-white font-medium">{preview.token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-amber-400 font-mono">{preview.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">To</span>
                <span className="text-white font-mono text-xs">
                  {preview.to.slice(0, 8)}...{preview.to.slice(-6)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                <span className="text-gray-400">Gas Cost</span>
                <span className="text-green-400 font-medium">
                  {preview.sponsored ? '$0.00 (Sponsored)' : `~${preview.estimatedGas} tBNB`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Button */}
        <CartoonButton
          label={loading ? 'Sending...' : !isConnected ? 'Connect Wallet' : '💸 Sign & Send'}
          color="bg-green-400"
          onClick={handleRequestTransfer}
          disabled={loading || !preview || !isConnected}
        />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayment}
        paymentRequest={paymentRequest}
        onPaymentComplete={handlePaymentComplete}
        onSkip={(paymentId) => handlePaymentComplete(paymentId, null)}
        onCancel={() => setShowPayment(false)}
        demoMode={true}
      />

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="text-red-400 font-semibold">Error</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div className="text-green-400 font-semibold mb-2">✅ Transfer Sent!</div>
          <a 
            href={success.bscScanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 text-sm"
          >
            View on BSCScan →
          </a>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-4 rounded-xl text-sm text-gray-400" style={{ backgroundColor: '#252542' }}>
        <div className="font-medium text-gray-300 mb-2">ℹ️ Gasless Transfers</div>
        <ul className="space-y-1">
          <li>• Gas fees are sponsored by Chimera's facilitator</li>
          <li>• You sign an EIP-712 message to authorize</li>
          <li>• The facilitator executes the transfer for you</li>
          <li>• Your tokens never leave your control until confirmed</li>
        </ul>
      </div>
    </div>
  );
}

