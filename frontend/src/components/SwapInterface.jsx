/**
 * Swap Interface Component
 * PancakeSwap integration for token swaps
 * Integrated with x402 micropayments
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';

const DEFAULT_TOKENS = {
  native: { symbol: 'tBNB', name: 'Test BNB', decimals: 18, address: null },
  WBNB: { symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18, address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd' },
  BUSD: { symbol: 'BUSD', name: 'Binance USD', decimals: 18, address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee' },
  USDT: { symbol: 'USDT', name: 'Tether', decimals: 18, address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd' },
};

export function SwapInterface() {
  const { address: userAddress, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  
  const [tokenIn, setTokenIn] = useState('native');
  const [tokenOut, setTokenOut] = useState('BUSD');
  const [amountIn, setAmountIn] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [slippage, setSlippage] = useState(0.5);
  
  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Fetch quote when inputs change
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const tokenInAddr = tokenIn === 'native' ? null : DEFAULT_TOKENS[tokenIn]?.address;
        const tokenOutAddr = tokenOut === 'native' ? null : DEFAULT_TOKENS[tokenOut]?.address;

        const response = await fetch('http://localhost:3000/api/swap/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenIn: tokenInAddr,
            tokenOut: tokenOutAddr,
            amountIn
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          setQuote(data);
          setError(null);
        } else {
          setQuote(null);
          // Don't show error for quotes, just clear
        }
      } catch (err) {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [tokenIn, tokenOut, amountIn]);

  // Step 1: Request payment before swap
  const handleRequestSwap = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!quote) {
      setError('No quote available');
      return;
    }

    setError(null);

    try {
      // Request payment from backend
      const response = await fetch('http://localhost:3000/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'swap',
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

  // Step 2: After payment, sign and execute swap
  const handlePaymentComplete = async (paymentId, signature) => {
    setShowPayment(false);
    setPaymentComplete(true);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Sign the swap intent
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
      
      const dataString = JSON.stringify({ tokenIn, tokenOut, amountIn });
      const encoder = new TextEncoder();
      const data = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const message = {
        type: 'swap',
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

      console.log('Swap intent signed');

      // Execute swap
      const tokenInAddr = tokenIn === 'native' ? null : DEFAULT_TOKENS[tokenIn]?.address;
      const tokenOutAddr = tokenOut === 'native' ? null : DEFAULT_TOKENS[tokenOut]?.address;

      const response = await fetch('http://localhost:3000/api/swap/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `x402 paymentId=${paymentId}`
        },
        body: JSON.stringify({
          tokenIn: tokenInAddr,
          tokenOut: tokenOutAddr,
          amountIn,
          recipient: userAddress,
          slippageTolerance: slippage,
          signature: intentSignature
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Swap failed');
      }

      setSuccess({
        message: 'Swap transaction prepared!',
        ...responseData
      });
    } catch (err) {
      if (!err.message?.includes('User rejected')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setPaymentComplete(false);
    }
  };

  const switchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setQuote(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <span className="text-3xl">🔄</span>
        Token Swap
      </h2>
      <p className="text-gray-400 mb-6">
        Swap tokens via PancakeSwap (Gasless!)
      </p>

      {/* Swap Card */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#252542' }}>
        {/* From Token */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm mb-2">From</label>
          <div className="flex gap-3">
            <select
              value={tokenIn}
              onChange={(e) => setTokenIn(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-700 text-white font-medium"
              style={{ minWidth: '140px' }}
            >
              {Object.entries(DEFAULT_TOKENS).map(([key, token]) => (
                <option key={key} value={key}>{token.symbol}</option>
              ))}
            </select>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 px-4 py-3 rounded-xl text-white text-xl font-mono text-right"
              style={{ backgroundColor: '#1a1a2e' }}
            />
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={switchTokens}
            className="p-2 rounded-full bg-amber-400 hover:bg-amber-300 transition-colors"
          >
            <span className="text-2xl">⇅</span>
          </button>
        </div>

        {/* To Token */}
        <div className="mt-4">
          <label className="block text-gray-400 text-sm mb-2">To</label>
          <div className="flex gap-3">
            <select
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-700 text-white font-medium"
              style={{ minWidth: '140px' }}
            >
              {Object.entries(DEFAULT_TOKENS).map(([key, token]) => (
                <option key={key} value={key}>{token.symbol}</option>
              ))}
            </select>
            <div 
              className="flex-1 px-4 py-3 rounded-xl text-white text-xl font-mono text-right flex items-center justify-end"
              style={{ backgroundColor: '#1a1a2e' }}
            >
              {quoteLoading ? (
                <span className="text-gray-500">Loading...</span>
              ) : quote ? (
                <span className="text-green-400">{parseFloat(quote.amountOut).toFixed(6)}</span>
              ) : (
                <span className="text-gray-500">0.0</span>
              )}
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="mt-4 p-3 rounded-lg space-y-2 text-sm" style={{ backgroundColor: '#1a1a2e' }}>
            <div className="flex justify-between text-gray-400">
              <span>Route</span>
              <span className="text-amber-400">{quote.route}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Price Impact</span>
              <span className={parseFloat(quote.priceImpact) > 3 ? 'text-red-400' : 'text-green-400'}>
                {quote.priceImpact}%
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Gas Cost</span>
              <span className="text-green-400">$0.00 (Sponsored)</span>
            </div>
          </div>
        )}

        {/* Slippage */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-gray-400 text-sm">Slippage:</span>
          {[0.1, 0.5, 1.0].map((s) => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              className={`px-3 py-1 rounded-lg text-sm ${
                slippage === s ? 'bg-amber-400 text-neutral-800' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {s}%
            </button>
          ))}
        </div>

        {/* Swap Button */}
        <div className="mt-6">
          <CartoonButton
            label={loading ? 'Swapping...' : !isConnected ? 'Connect Wallet' : '🔄 Sign & Swap'}
            color="bg-amber-400"
            onClick={handleRequestSwap}
            disabled={loading || !quote || !isConnected}
          />
        </div>
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
          <div className="text-green-400 font-semibold">✅ {success.message}</div>
          <div className="text-green-300 text-sm mt-1">
            Transaction is ready for signing via facilitator
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-4 rounded-xl text-sm text-gray-400" style={{ backgroundColor: '#252542' }}>
        <div className="font-medium text-gray-300 mb-2">ℹ️ How it works</div>
        <ul className="space-y-1">
          <li>• Swaps are executed through PancakeSwap V2</li>
          <li>• Gas fees are sponsored by Chimera</li>
          <li>• You only sign an EIP-712 authorization</li>
          <li>• The facilitator executes the swap on your behalf</li>
        </ul>
      </div>
    </div>
  );
}

