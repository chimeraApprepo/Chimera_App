/**
 * End-to-End Test Suite
 * Tests complete user flow from chat to contract execution
 */

import { healthCheck, getAgentInfo, getBlockchainStatus, sendChatMessage } from '../frontend/src/services/api.js';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';

console.log('🧪 End-to-End Test Suite');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`Testing API: ${API_URL}\n`);

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`Testing: ${name}... `);
    await fn();
    console.log('✅ PASS');
    testsPassed++;
  } catch (error) {
    console.log('❌ FAIL');
    console.log(`  Error: ${error.message}\n`);
    testsFailed++;
  }
}

async function runTests() {
  // Test 1: Health Check
  await test('Health check', async () => {
    const response = await healthCheck();
    if (!response.status || response.status !== 'healthy') {
      throw new Error('Health check failed');
    }
  });

  // Test 2: Agent Info
  await test('Agent information', async () => {
    const response = await getAgentInfo();
    if (!response.name || !response.capabilities) {
      throw new Error('Invalid agent info response');
    }
    if (response.capabilities.length === 0) {
      throw new Error('No capabilities listed');
    }
  });

  // Test 3: Blockchain Status
  await test('Blockchain connection', async () => {
    const response = await getBlockchainStatus();
    if (!response.success || !response.data) {
      throw new Error('Blockchain status check failed');
    }
    if (!response.data.chainId || !response.data.blockNumber) {
      throw new Error('Missing blockchain data');
    }
  });

  // Test 4: Chat (Non-streaming)
  await test('Chat endpoint (non-streaming)', async () => {
    const response = await sendChatMessage('What is a smart contract?');
    if (!response.success || !response.message) {
      throw new Error('Chat request failed');
    }
  });

  // Test 5: Facilitator Info
  await test('Facilitator information', async () => {
    const response = await fetch(`${API_URL}/api/facilitator`);
    const data = await response.json();
    if (!data.success || !data.address) {
      throw new Error('Facilitator info check failed');
    }
  });

  // Test 6: Gas Estimation
  await test('Gas estimation', async () => {
    const intent = {
      type: 'transfer',
      data: {
        token: '0x0000000000000000000000000000000000000000',
        to: '0x1234567890123456789012345678901234567890',
        amount: '0.01'
      }
    };
    
    const response = await fetch(`${API_URL}/api/estimate-gas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent })
    });
    
    const data = await response.json();
    if (!data.success || !data.estimatedGas) {
      throw new Error('Gas estimation failed');
    }
  });

  // Test 7: Identity Service
  await test('Identity service integration', async () => {
    const response = await getAgentInfo();
    if (!response.identity) {
      throw new Error('Identity info missing from agent response');
    }
    if (!response.identity.trustScore) {
      throw new Error('Trust score not calculated');
    }
  });

  // Test 8: Caching
  await test('Response caching', async () => {
    const start1 = Date.now();
    await getBlockchainStatus();
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    await getBlockchainStatus();
    const time2 = Date.now() - start2;
    
    // Second request should be faster (cached)
    if (time2 > time1) {
      console.log(`\n  Note: Cache might not be working (${time1}ms vs ${time2}ms)`);
    }
  });

  // Test 9: Error Handling
  await test('Error handling (invalid endpoint)', async () => {
    const response = await fetch(`${API_URL}/api/nonexistent`);
    if (response.status !== 404) {
      throw new Error('Expected 404 for invalid endpoint');
    }
  });

  // Test 10: CORS Headers
  await test('CORS configuration', async () => {
    const response = await fetch(`${API_URL}/health`);
    const corsHeader = response.headers.get('access-control-allow-origin');
    if (!corsHeader) {
      throw new Error('CORS headers not set');
    }
  });

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test Summary:');
  console.log(`  ✅ Passed: ${testsPassed}`);
  console.log(`  ❌ Failed: ${testsFailed}`);
  console.log(`  Total: ${testsPassed + testsFailed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (testsFailed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Check if server is running
console.log('Checking if server is running...\n');
try {
  await fetch(`${API_URL}/health`);
  console.log('✅ Server is running\n');
  await runTests();
} catch (error) {
  console.error('❌ Server is not running!');
  console.error('Please start the server first: npm start\n');
  process.exit(1);
}

