/**
 * ChainGPT API Test Suite
 * Simple tests to verify API key and SDK functionality
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.CHAINGPT_API_KEY;

console.log('🧪 ChainGPT API Test Suite');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: Verify API key exists
console.log('Test 1: API Key Configuration');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!API_KEY) {
  console.log('❌ FAIL: No API key found in .env');
  console.log('   Expected: CHAINGPT_API_KEY=your-key-here\n');
  process.exit(1);
}

console.log('✅ PASS: API key found');
console.log(`   Format: ${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}`);
console.log(`   Length: ${API_KEY.length} characters`);
console.log(`   Type: ${API_KEY.includes('-') ? 'UUID format' : 'Other format'}\n`);

// Test 2: Test REST API directly (without SDK)
console.log('Test 2: Direct REST API Call (Raw HTTP)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Testing: POST https://api.chaingpt.org/chat/stream');
console.log('Payload: Simple test question\n');

const testPayload = {
  model: 'general_assistant',
  question: 'Say hello',
  chatHistory: 'off'
};

console.log('Request Details:');
console.log('  Authorization: Bearer', `${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}`);
console.log('  Body:', JSON.stringify(testPayload));
console.log('');

try {
  const response = await fetch('https://api.chaingpt.org/chat/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testPayload)
  });

  console.log(`Status Code: ${response.status} ${response.statusText}`);
  console.log(`Content-Type: ${response.headers.get('content-type')}`);
  console.log('Response Headers:');
  for (const [key, value] of response.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  console.log('');
  
  if (response.status === 200) {
    console.log('✅ PASS: API key is valid and working!\n');
    
    // Try to read a bit of the response
    const text = await response.text();
    console.log('Response preview (first 200 chars):');
    console.log('─'.repeat(60));
    console.log(text.substring(0, 200));
    console.log('─'.repeat(60));
    console.log('');
  } else {
    console.log('❌ FAIL: API returned error\n');
    
    const errorText = await response.text();
    console.log('Full Error Response:');
    console.log('─'.repeat(60));
    console.log('Raw:', errorText);
    try {
      const errorJson = JSON.parse(errorText);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(errorJson, null, 2));
      
      // Check for specific error fields
      if (errorJson.statusCode) console.log('\nHTTP Status from Body:', errorJson.statusCode);
      if (errorJson.message) console.log('Error Message:', errorJson.message);
      if (errorJson.error) console.log('Error Type:', errorJson.error);
      if (errorJson.details) console.log('Error Details:', errorJson.details);
    } catch (e) {
      console.log('\n(Response is not JSON)');
    }
    console.log('─'.repeat(60));
    console.log('');
    
    // Decode the error
    if (response.status === 401) {
      console.log('🔍 Diagnosis: Invalid API Key');
      console.log('   - Key format is wrong');
      console.log('   - Key doesn\'t exist in ChainGPT system');
      console.log('   - Key was revoked/deleted\n');
    } else if (response.status === 402 || response.status === 403) {
      console.log('🔍 Diagnosis: Insufficient Credits');
      console.log('   - API key is VALID but has no credits');
      console.log('   - Free tier not activated on this key');
      console.log('   - Need to activate in ChainGPT dashboard\n');
    } else if (response.status === 429) {
      console.log('🔍 Diagnosis: Rate Limit Exceeded');
      console.log('   - Too many requests');
      console.log('   - Wait a moment and try again\n');
    }
  }
} catch (error) {
  console.log('❌ FAIL: Network or fetch error');
  console.log(`   Error: ${error.message}\n`);
}

// Test 3: Test with ChainGPT SDK
console.log('Test 3: ChainGPT SDK (GeneralChat)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  console.log('Importing @chaingpt/generalchat...');
  const { GeneralChat } = await import('@chaingpt/generalchat');
  console.log('✅ SDK imported successfully\n');

  console.log('Initializing GeneralChat with API key...');
  const chat = new GeneralChat({ apiKey: API_KEY });
  console.log('✅ SDK initialized\n');

  console.log('Testing createChatBlob (non-streaming)...');
  try {
    const result = await chat.createChatBlob({
      question: 'Say hello in one word',
      chatHistory: 'off'
    });

    console.log('✅ PASS: SDK chat request successful!\n');
    console.log('Response:');
    console.log('─'.repeat(60));
    console.log('Bot response:', result.data?.bot || result.data || 'No response data');
    console.log('─'.repeat(60));
    console.log('');
  } catch (sdkError) {
    console.log('❌ FAIL: SDK request failed');
    console.log(`   Error: ${sdkError.message}\n`);
    
    // Full error details
    console.log('Full SDK Error Details:');
    console.log('─'.repeat(60));
    console.log('Error Type:', sdkError.constructor.name);
    console.log('Error Message:', sdkError.message);
    
    // Try to get response details
    if (sdkError.response) {
      console.log('\nAPI Response Details:');
      console.log('  Status:', sdkError.response.status);
      console.log('  Status Text:', sdkError.response.statusText);
      console.log('  Headers:', sdkError.response.headers);
      console.log('  Data:', JSON.stringify(sdkError.response.data, null, 2));
    }
    
    // Try to get request details
    if (sdkError.config) {
      console.log('\nRequest Details:');
      console.log('  URL:', sdkError.config.url);
      console.log('  Method:', sdkError.config.method);
      console.log('  Headers:', sdkError.config.headers);
    }
    
    // Stack trace
    if (sdkError.stack) {
      console.log('\nStack Trace:');
      console.log(sdkError.stack);
    }
    console.log('─'.repeat(60));
    console.log('');
  }
} catch (error) {
  console.log('❌ FAIL: SDK initialization error');
  console.log(`   Error: ${error.message}\n`);
  
  console.log('Full Initialization Error:');
  console.log('─'.repeat(60));
  console.log('Error Type:', error.constructor.name);
  console.log('Error Message:', error.message);
  console.log('Stack Trace:');
  console.log(error.stack);
  console.log('─'.repeat(60));
  console.log('');
}

// Test 4: Test streaming endpoint
console.log('Test 4: Streaming API Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

try {
  const response = await fetch('https://api.chaingpt.org/chat/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'general_assistant',
      question: 'Count to 3',
      chatHistory: 'off'
    })
  });

  if (response.status === 200 && response.body) {
    console.log('✅ PASS: Streaming connection established\n');
    console.log('Reading stream (first 5 chunks)...');
    console.log('─'.repeat(60));
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunkCount = 0;
    
    while (chunkCount < 5) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      console.log(`Chunk ${++chunkCount}:`, chunk.substring(0, 100));
    }
    
    reader.cancel();
    console.log('─'.repeat(60));
    console.log('✅ Streaming works!\n');
  } else {
    console.log(`❌ Status: ${response.status}`);
    const errorText = await response.text();
    console.log('Error:', errorText.substring(0, 200));
    console.log('');
  }
} catch (error) {
  console.log('❌ FAIL: Streaming test error');
  console.log(`   Error: ${error.message}\n`);
  
  console.log('Full Streaming Error:');
  console.log('─'.repeat(60));
  console.log('Error Type:', error.constructor.name);
  console.log('Error Message:', error.message);
  console.log('Stack Trace:');
  console.log(error.stack);
  console.log('─'.repeat(60));
  console.log('');
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test Summary');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Next Steps:\n');
console.log('If Status 200 ✅:');
console.log('  → API key works! Problem is in your app code.\n');
console.log('If Status 401 ❌:');
console.log('  → Invalid API key. Generate new one in dashboard.\n');
console.log('If Status 402/403 ❌:');
console.log('  → Valid key but no credits. Check dashboard:');
console.log('     1. Look for "Activate Free Tier" or "Enable API"');
console.log('     2. Check API key status (Active vs Pending)');
console.log('     3. Try creating fresh API key');
console.log('     4. Contact support if nothing works\n');
console.log('If Network Error ❌:');
console.log('  → Check internet connection\n');

console.log('🔗 ChainGPT Dashboard: https://app.chaingpt.org/');
console.log('📧 Support: support@chaingpt.org\n');

