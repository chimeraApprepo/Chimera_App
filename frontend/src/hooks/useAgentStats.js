/**
 * useAgentStats Hook
 * Fetches on-chain stats for the agent from multiple chains:
 * - ERC-8004 Identity: Base Sepolia (registration)
 * - Operations: BSC Testnet (contract deployments, audits, swaps)
 */

import { useState, useEffect, useCallback } from 'react';

// Agent configuration
const AGENT_CONFIG = {
  agentId: '1581',
  // ERC-8004 Identity Registry on Base Sepolia
  identityRegistry: '0x8004AA63c570c570eBF15376c0dB199918BFe9Fb',
  // Facilitator wallet (same address, different chains)
  facilitatorAddress: '0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9',
};

// API endpoints for different chains
const CHAIN_APIS = {
  baseSepolia: 'https://api-sepolia.basescan.org/api',
  bscTestnet: 'https://api-testnet.bscscan.com/api'
};

// Free tier - no API key needed for basic queries, but rate limited

/**
 * Format time ago string
 */
function formatTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp * 1000; // timestamp is in seconds
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
}

/**
 * Format value in USD
 */
function formatValue(valueWei) {
  // Convert from wei to ETH (or token units)
  const valueEth = parseFloat(valueWei) / 1e18;
  
  // Estimate USD value (for demo, using approximate ETH price)
  // In production, fetch real price from an oracle
  const ethPrice = 2500; // Approximate ETH price
  const valueUsd = valueEth * ethPrice;
  
  if (valueUsd >= 1000000) {
    return `$${(valueUsd / 1000000).toFixed(1)}M`;
  } else if (valueUsd >= 1000) {
    return `$${(valueUsd / 1000).toFixed(1)}K`;
  } else {
    return `$${valueUsd.toFixed(0)}`;
  }
}

export function useAgentStats() {
  const [stats, setStats] = useState({
    totalAudits: null,      // Total operations on BSC Testnet
    contractsDeployed: null, // Contracts created by the agent
    valueSecured: null,
    lastActive: null,
    loading: true,
    error: null
  });

  const fetchStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // Fetch OPERATIONAL activity from BSC Testnet (where contracts are deployed)
      // This is where the real work happens!
      const bscTxUrl = `${CHAIN_APIS.bscTestnet}?module=account&action=txlist&address=${AGENT_CONFIG.facilitatorAddress}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100`;
      
      // Also fetch internal transactions (contract creations show here)
      const bscInternalUrl = `${CHAIN_APIS.bscTestnet}?module=account&action=txlistinternal&address=${AGENT_CONFIG.facilitatorAddress}&startblock=0&endblock=99999999&sort=desc&page=1&offset=100`;

      // Fetch both in parallel
      const [bscTxResponse, bscInternalResponse] = await Promise.all([
        fetch(bscTxUrl),
        fetch(bscInternalUrl)
      ]);

      const bscTxData = await bscTxResponse.json();
      const bscInternalData = await bscInternalResponse.json();

      // Process BSC Testnet transactions (operational activity)
      let totalOperations = 0;
      let totalValue = BigInt(0);
      let lastTimestamp = 0;
      let contractsDeployed = 0;

      if (bscTxData.status === '1' && Array.isArray(bscTxData.result)) {
        const successfulTxs = bscTxData.result.filter(tx => tx.isError === '0');
        totalOperations = successfulTxs.length;
        
        // Count contract creations
        contractsDeployed = successfulTxs.filter(tx => 
          tx.to === '' || tx.to === null || tx.contractAddress
        ).length;
        
        // Sum up value and get latest timestamp
        successfulTxs.forEach(tx => {
          if (tx.value && tx.value !== '0') {
            totalValue += BigInt(tx.value);
          }
        });

        if (bscTxData.result.length > 0) {
          lastTimestamp = Math.max(lastTimestamp, parseInt(bscTxData.result[0].timeStamp) || 0);
        }
      }

      // Add internal transactions
      if (bscInternalData.status === '1' && Array.isArray(bscInternalData.result)) {
        bscInternalData.result.forEach(tx => {
          if (tx.value && tx.value !== '0') {
            totalValue += BigInt(tx.value);
          }
        });
        
        if (bscInternalData.result.length > 0) {
          lastTimestamp = Math.max(lastTimestamp, parseInt(bscInternalData.result[0].timeStamp) || 0);
        }
      }

      // Format the stats
      const valueStr = totalValue > 0 ? formatValue(totalValue.toString()) : '$0';
      const lastActiveStr = lastTimestamp > 0 
        ? formatTimeAgo(lastTimestamp) 
        : 'No activity yet';

      setStats({
        totalAudits: totalOperations,
        contractsDeployed,
        valueSecured: valueStr,
        lastActive: lastActiveStr,
        loading: false,
        error: null
      });

    } catch (err) {
      console.error('[useAgentStats] Error fetching stats:', err);
      
      // On error, show error state - no fake/simulated data
      setStats({
        totalAudits: 0,
        contractsDeployed: 0,
        valueSecured: '$0',
        lastActive: 'Unable to fetch',
        loading: false,
        error: err.message
      });
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchStats();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    ...stats,
    refetch: fetchStats
  };
}

export default useAgentStats;

