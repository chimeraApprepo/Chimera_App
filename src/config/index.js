/**
 * Configuration Management
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

dotenv.config({ path: join(rootDir, '.env') });

/**
 * Validate required environment variables
 * @param {Array<string>} required - Required variable names
 * @throws {Error} If any required variables are missing
 */
function validateEnv(required) {
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Validate critical variables
validateEnv([
  'CHAINGPT_API_KEY',
  'BNB_RPC_URL',
  'BNB_CHAIN_ID',
  'FACILITATOR_WALLET_ADDRESS'
]);

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // ChainGPT
  chaingpt: {
    apiKey: process.env.CHAINGPT_API_KEY
  },
  
  // Blockchain
  blockchain: {
    rpcUrl: process.env.BNB_RPC_URL,
    chainId: parseInt(process.env.BNB_CHAIN_ID),
    facilitatorAddress: process.env.FACILITATOR_WALLET_ADDRESS,
    facilitatorPrivateKey: process.env.FACILITATOR_PRIVATE_KEY
  },
  
  // AWE Network / ERC-8004
  awe: {
    registryAddress: process.env.ERC8004_REGISTRY_ADDRESS,
    ipfsHash: process.env.AGENT_IPFS_HASH
  },
  
  // Features
  features: {
    enablePayments: process.env.ENABLE_PAYMENTS === 'true',
    enableAuditLoop: process.env.ENABLE_AUDIT_LOOP !== 'false', // Default true
    auditScoreThreshold: parseInt(process.env.AUDIT_SCORE_THRESHOLD || '80')
  },
  
  // Payment Configuration (x402)
  payment: {
    // Test USDT on BSC Testnet
    token: process.env.PAYMENT_TOKEN || '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    // Pricing in smallest unit (6 decimals for USDT)
    prices: {
      generate: process.env.PRICE_GENERATE || '1000', // 0.001 USDT
      audit: process.env.PRICE_AUDIT || '1000' // 0.001 USDT
    },
    recipient: process.env.FACILITATOR_WALLET_ADDRESS,
    verifyingContract: process.env.FACILITATOR_WALLET_ADDRESS // Use facilitator as verifying contract
  }
};

// Log configuration (without sensitive data)
console.log('[Config] Loaded configuration:', {
  port: config.port,
  environment: config.nodeEnv,
  chainId: config.blockchain.chainId,
  facilitatorAddress: config.blockchain.facilitatorAddress,
  features: config.features
});

export default config;

