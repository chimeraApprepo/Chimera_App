/**
 * Backend Integration Tests
 * Tests backend services without requiring frontend
 */

console.log('🧪 Backend Integration Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const API_URL = 'http://localhost:3000';
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    process.stdout.write(`${name}... `);
    await fn();
    console.log('✅');
    passed++;
  } catch (error) {
    console.log('❌');
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  // Test Health
  await test('Health endpoint', async () => {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    if (!data.status) throw new Error('No status');
  });

  // Test Agent Info
  await test('Agent info endpoint', async () => {
    const res = await fetch(`${API_URL}/agent`);
    const data = await res.json();
    if (!data.name) throw new Error('No name');
    if (!data.identity) throw new Error('No identity');
  });

  // Test Blockchain
  await test('Blockchain endpoint', async () => {
    const res = await fetch(`${API_URL}/api/blockchain`);
    const data = await res.json();
    if (!data.success) throw new Error('Not successful');
  });

  // Test Facilitator
  await test('Facilitator endpoint', async () => {
    const res = await fetch(`${API_URL}/api/facilitator`);
    const data = await res.json();
    if (!data.address) throw new Error('No address');
  });

  // Test Chat (blob)
  await test('Chat blob endpoint', async () => {
    const res = await fetch(`${API_URL}/api/chat/blob`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    const data = await res.json();
    if (!data.success) throw new Error('Not successful');
  });

  // Test 402 Payment (should return 402 when payments enabled)
  await test('Payment middleware (when disabled)', async () => {
    const res = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'test' })
    });
    // Should work without payment when ENABLE_PAYMENTS=false
    if (res.status === 402) {
      console.log('\n  Note: Payments are enabled, 402 returned as expected');
    }
  });

  // Test Gas Estimation
  await test('Gas estimation endpoint', async () => {
    const res = await fetch(`${API_URL}/api/estimate-gas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: { type: 'transfer', data: {} }
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error('Not successful');
  });

  // Test Balance
  await test('Balance endpoint', async () => {
    const testAddr = '0x0000000000000000000000000000000000000000';
    const res = await fetch(`${API_URL}/api/balance/${testAddr}`);
    const data = await res.json();
    if (!data.success) throw new Error('Not successful');
  });

  // Test 404
  await test('404 handler', async () => {
    const res = await fetch(`${API_URL}/nonexistent`);
    if (res.status !== 404) throw new Error('Expected 404');
  });

  // Test CORS
  await test('CORS headers', async () => {
    const res = await fetch(`${API_URL}/health`);
    const cors = res.headers.get('access-control-allow-origin');
    if (!cors) throw new Error('No CORS header');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed === 0) {
    console.log('🎉 All backend tests passed!\n');
  } else {
    console.log('⚠️  Some tests failed\n');
  }
}

// Check server
try {
  await fetch(`${API_URL}/health`);
  console.log('✅ Server is running\n');
  await runTests();
} catch (error) {
  console.error('❌ Server not running. Start with: npm start\n');
  process.exit(1);
}

