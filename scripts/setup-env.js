/**
 * Environment Setup Helper
 * Creates .env file with user's credentials
 */

import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const envPath = join(rootDir, '.env');

// Check if .env already exists
if (existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   Delete it first if you want to recreate it.\n');
  process.exit(0);
}

// Create .env content
const envContent = `# ChainGPT Configuration
# Get your API key from: https://app.chaingpt.org/
CHAINGPT_API_KEY=52f8886f-8640-4e53-8865-cf3a04d13f5e

# BNB Chain Testnet Configuration
BNB_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BNB_CHAIN_ID=97

# Q402 Facilitator (Payment Gateway)
# The wallet that will sponsor gas fees
FACILITATOR_PRIVATE_KEY=0x124b7b6e11fedf9561bcd558d5ed35c9d3c6eec7249ef86648c77f988c4f3814
FACILITATOR_WALLET_ADDRESS=0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9

# AWE Network / ERC-8004 (BNB Attestation Service)
# Official BAS Identity Registry on BSC Testnet
ERC8004_REGISTRY_ADDRESS=0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD
# Your Agent's metadata hash (Upload to IPFS first)
AGENT_IPFS_HASH=QmPENDING

# Server Configuration
PORT=3000
NODE_ENV=development

# Feature Flags
ENABLE_PAYMENTS=false
ENABLE_AUDIT_LOOP=true
AUDIT_SCORE_THRESHOLD=80
`;

// Write .env file
try {
  writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ .env file created successfully!\n');
  console.log('📝 Configuration:');
  console.log('   - ChainGPT API Key: ✓');
  console.log('   - Facilitator Wallet: 0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9');
  console.log('   - Network: BSC Testnet (Chain ID: 97)\n');
  console.log('🚀 Next steps:');
  console.log('   1. Run validation: npm run validate');
  console.log('   2. Start server: npm run dev\n');
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  process.exit(1);
}

