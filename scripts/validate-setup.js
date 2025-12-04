/**
 * Setup Validation Script
 * Tests all Phase 1 components
 */

import { config } from '../src/config/index.js';
import { ChainGPTService } from '../src/services/chaingpt.js';
import { BlockchainService } from '../src/services/blockchain.js';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║         PHASE 1 SETUP VALIDATION                          ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`Testing ${name}... `);
    await fn();
    console.log('✅ PASS');
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    failed++;
  }
}

async function main() {
  // Test 1: Configuration
  await test('Configuration Loading', async () => {
    if (!config.chaingpt.apiKey) throw new Error('ChainGPT API key missing');
    if (!config.blockchain.rpcUrl) throw new Error('RPC URL missing');
    if (!config.blockchain.facilitatorAddress) throw new Error('Facilitator address missing');
  });

  // Test 2: Blockchain Connection
  const blockchain = new BlockchainService(
    config.blockchain.rpcUrl,
    config.blockchain.chainId
  );

  await test('Blockchain Connection', async () => {
    const blockNumber = await blockchain.getBlockNumber();
    if (!blockNumber || blockNumber < 1) {
      throw new Error('Invalid block number');
    }
  });

  await test('Gas Price Fetching', async () => {
    const gasPrice = await blockchain.getGasPrice();
    if (!gasPrice || gasPrice === 'unknown') {
      throw new Error('Could not fetch gas price');
    }
  });

  await test('Facilitator Balance Check', async () => {
    const balance = await blockchain.getBalance(config.blockchain.facilitatorAddress);
    const bnb = parseFloat(balance);
    if (bnb < 0.05) {
      throw new Error(`Insufficient balance: ${bnb} BNB (need at least 0.05)`);
    }
    console.log(`      Balance: ${bnb} tBNB`);
  });

  await test('Blockchain Context Generation', async () => {
    const context = await blockchain.getContext();
    if (!context.blockNumber || !context.gasPrice) {
      throw new Error('Incomplete context');
    }
  });

  // Test 3: ChainGPT Service
  const chaingpt = new ChainGPTService(config.chaingpt.apiKey);

  await test('ChainGPT Service Initialization', async () => {
    if (!chaingpt.chat) throw new Error('Chat service not initialized');
  });

  await test('ChainGPT Simple Query', async () => {
    const response = await chaingpt.createChatBlob('What is BNB Chain?');
    if (!response.success || !response.data) {
      throw new Error('Invalid response');
    }
    console.log(`      Response length: ${response.data.length} chars`);
  });

  await test('ChainGPT Context Injection', async () => {
    const context = await blockchain.getContext();
    const question = 'What is the current gas price?';
    const injected = chaingpt.injectContext(question, context);
    
    if (!injected.includes('Gas Price')) {
      throw new Error('Context not injected');
    }
  });

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                  VALIDATION SUMMARY                        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Phase 1 setup is complete.');
    console.log('🚀 You can now start the server with: npm run dev\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Validation failed:', error.message);
  process.exit(1);
});

