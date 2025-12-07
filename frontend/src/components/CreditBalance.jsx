/**
 * CreditBalance Component
 * Displays user's CHIM credit balance and purchase options
 * Uses proper USDC payment flow - no demo/free options
 */

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getCreditBalance, getCreditPricing, requestCreditsPurchase } from '../services/api';

// CHIM token icon
const ChimIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" className="stroke-amber-400" />
    <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" className="stroke-amber-400" />
  </svg>
);

// Service icons
const serviceIcons = {
  generate: '⚙️',
  audit: '🔍',
  analyze: '📊',
  swap: '🔄',
  transfer: '💸',
  chat: '💬'
};

export default function CreditBalance({ compact = false, onPurchase, onNavigateToCredits }) {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch balance and pricing on mount
  useEffect(() => {
    if (isConnected && address) {
      fetchData();
      
      // Listen for balance refresh events from other components
      const handleBalanceRefresh = () => {
        console.log('[CreditBalance] Received balance refresh event');
        fetchData();
      };
      window.addEventListener('chim-balance-changed', handleBalanceRefresh);
      
      return () => {
        window.removeEventListener('chim-balance-changed', handleBalanceRefresh);
      };
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [balanceData, pricingData] = await Promise.all([
        getCreditBalance(address),
        getCreditPricing()
      ]);
      
      setBalance(balanceData);
      setPricing(pricingData.pricing);
      setPackages(pricingData.packages || []);
    } catch (err) {
      console.error('Failed to fetch credit data:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToCredits = () => {
    if (onNavigateToCredits) {
      onNavigateToCredits();
    } else {
      window.location.hash = '#credits';
    }
  };

  // Compact display for header
  if (compact) {
    if (!isConnected) return null;
    
    return (
      <button
        onClick={handleNavigateToCredits}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 
                   border border-amber-500/30 rounded-lg hover:border-amber-400/50 transition-all"
      >
        <ChimIcon />
        <span className="font-mono text-amber-400">
          {loading ? '...' : balance?.formatted || '0'}
        </span>
        <span className="text-amber-400/60 text-sm">CHIM</span>
      </button>
    );
  }

  // Full display
  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-xl border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChimIcon />
            <h3 className="font-semibold text-amber-400">CHIM Credits</h3>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="text-amber-400/60 hover:text-amber-400 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-slate-400 mb-2">Connect your wallet to view credits</p>
            <p className="text-xs text-slate-500">CHIM credits are used for AI services</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={fetchData}
              className="text-sm text-amber-400 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Balance Display */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-amber-400 font-mono">
                {balance?.formatted || '0'}
              </div>
              <div className="text-amber-400/60 text-sm">CHIM Credits</div>
            </div>

            {/* Service Pricing */}
            {pricing && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Service Costs</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(pricing).map(([service, info]) => (
                    <div
                      key={service}
                      className="flex items-center justify-between px-2 py-1.5 bg-slate-800/50 rounded"
                    >
                      <span className="flex items-center gap-1 text-sm">
                        <span>{serviceIcons[service] || '•'}</span>
                        <span className="capitalize text-slate-300">{service}</span>
                      </span>
                      <span className="text-amber-400 font-mono text-sm">{info.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buy Credits Button */}
            <button
              onClick={handleNavigateToCredits}
              className="w-full py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 
                         text-black font-semibold rounded-lg hover:from-amber-400 hover:to-orange-400 
                         transition-all"
            >
              Buy Credits with USDC
            </button>
            
            <p className="text-center text-xs text-slate-500 mt-2">
              1 USDC = 10 CHIM
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * CreditCostBadge - Shows the cost of an action in CHIM
 */
export function CreditCostBadge({ service, className = '' }) {
  const costs = {
    generate: '10',
    audit: '5',
    analyze: '3',
    swap: '2',
    transfer: '1',
    chat: '0.1'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 
                      text-amber-400 text-xs rounded-full ${className}`}>
      <ChimIcon />
      <span>{costs[service] || '?'} CHIM</span>
    </span>
  );
}

/**
 * CreditGate - Wrapper component that checks credits before rendering children
 */
export function CreditGate({ service, children, onInsufficientCredits }) {
  const { address, isConnected } = useAccount();
  const [hasCredits, setHasCredits] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      checkUserCredits();
    } else {
      setChecking(false);
    }
  }, [address, isConnected]);

  const checkUserCredits = async () => {
    try {
      const result = await getCreditBalance(address);
      const balance = parseFloat(result.formatted || '0');
      
      const costs = {
        generate: 10,
        audit: 5,
        analyze: 3,
        swap: 2,
        transfer: 1,
        chat: 0.1
      };
      
      setHasCredits(balance >= (costs[service] || 0));
    } catch (err) {
      console.error('Credit check failed:', err);
      setHasCredits(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-center p-4 bg-slate-800/50 rounded-lg">
        <p className="text-slate-400">Connect your wallet to continue</p>
      </div>
    );
  }

  if (!hasCredits) {
    return (
      <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400 mb-2">Insufficient CHIM credits</p>
        <p className="text-sm text-slate-400 mb-3">
          This action requires <CreditCostBadge service={service} />
        </p>
        <button
          onClick={onInsufficientCredits}
          className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400"
        >
          Buy Credits with USDC
        </button>
      </div>
    );
  }

  return children;
}
