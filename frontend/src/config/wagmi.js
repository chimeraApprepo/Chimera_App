/**
 * Wagmi Configuration
 * Web3 wallet and network setup
 */

import { http, createConfig } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Get project ID from environment (for WalletConnect)
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo';

// Configure chains
export const chains = [bscTestnet, bsc];

// Create Wagmi config
export const config = createConfig({
  chains: [bscTestnet, bsc],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
  },
});

// Network configurations
export const networkConfig = {
  [bscTestnet.id]: {
    name: 'BSC Testnet',
    chainId: 97,
    explorer: 'https://testnet.bscscan.com',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'tBNB',
      decimals: 18
    }
  },
  [bsc.id]: {
    name: 'BNB Smart Chain',
    chainId: 56,
    explorer: 'https://bscscan.com',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  }
};

// Get current network config
export function getCurrentNetworkConfig(chainId) {
  return networkConfig[chainId] || networkConfig[bscTestnet.id];
}

// Check if on testnet
export function isTestnet(chainId) {
  return chainId === bscTestnet.id;
}

