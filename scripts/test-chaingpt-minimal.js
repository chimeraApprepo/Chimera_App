/**
 * Minimal ChainGPT API Test
 * Follows documentation EXACTLY with simplest possible request
 */

import { GeneralChat } from '@chaingpt/generalchat';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.CHAINGPT_API_KEY;

console.log('🧪 MINIMAL ChainGPT Test (Following Docs EXACTLY)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`API Key: ${API_KEY?.substring(0, 8)}...${API_KEY?.slice(-4)}\n`);

// Test 1: SDK Blob (Simplest possible - exactly from docs)
console.log('Test 1: SDK Blob Method (Exact Documentation Example)');
console.log('─'.repeat(60));

try {
  console.log('Initializing GeneralChat...');
  const generalchat = new GeneralChat({
    apiKey: API_KEY,
  });
  console.log('✅ SDK initialized\n');

  console.log('Making request with minimal parameters:');
  console.log('  question: "Say hello"');
  console.log('  chatHistory: "off"');
  console.log('  (NO custom context, NO other params)\n');

  const response = await generalchat.createChatBlob({
    question: 'Say hello',
    chatHistory: "off"
  });

  console.log('🎉 SUCCESS! API is working!\n');
  console.log('Response Object:');
  console.log(JSON.stringify(response, null, 2));
  console.log('\nBot Answer:', response.data.bot);
  console.log('\n✅ ChainGPT API fully functional!\n');

} catch (error) {
  console.log('❌ FAILED\n');
  console.log('Error Details:');
  console.log('─'.repeat(60));
  console.log('Type:', error.constructor.name);
  console.log('Message:', error.message);
  
  if (error.response) {
    console.log('\nHTTP Response:');
    console.log('  Status:', error.response.status, error.response.statusText);
    console.log('  Data:', JSON.stringify(error.response.data, null, 2));
  }
  
  if (error.config) {
    console.log('\nRequest Config:');
    console.log('  URL:', error.config.url);
    console.log('  Method:', error.config.method);
  }
  
  console.log('\nStack:');
  console.log(error.stack);
  console.log('─'.repeat(60));
  console.log('');
}

// Test 2: Direct REST API (exactly from docs)
console.log('\nTest 2: Direct REST API (Exact cURL Example)');
console.log('─'.repeat(60));

try {
  console.log('Making raw fetch request...');
  console.log('  URL: https://api.chaingpt.org/chat/stream');
  console.log('  Headers: Authorization Bearer [key]');
  console.log('  Body: minimal JSON\n');

  const response = await fetch('https://api.chaingpt.org/chat/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "general_assistant",
      question: "Explain the concept of AI",
      chatHistory: "off"
    })
  });

  console.log('Response Status:', response.status, response.statusText);

  if (response.status === 200) {
    const data = await response.json();
    console.log('🎉 SUCCESS! Direct API works!\n');
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\n✅ Credits are working!\n');
  } else {
    const errorText = await response.text();
    console.log('❌ Error Response:', errorText);
    
    console.log('\n📋 Diagnosis:');
    if (response.status === 401) {
      console.log('  → Invalid API key');
    } else if (response.status === 400 || response.status === 402 || response.status === 403) {
      console.log('  → API key is VALID but has no credits');
      console.log('  → This API key: ' + API_KEY.substring(0, 8) + '...' + API_KEY.slice(-4));
      console.log('  → Solution: Generate NEW API key after purchasing credits');
      console.log('  → Credits are on your ACCOUNT but not linked to this KEY');
    }
    console.log('');
  }
} catch (error) {
  console.log('❌ Request failed');
  console.log('Error:', error.message);
  console.log(error.stack);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n💡 IMPORTANT:');
console.log('If both tests fail with "Insufficient credits":');
console.log('  1. You purchased 499 credits ✅');
console.log('  2. Credits are on your ACCOUNT ✅');
console.log('  3. But this API key was created BEFORE purchase ❌');
console.log('  4. Generate NEW API key NOW (after purchase) ✅');
console.log('  5. New keys automatically link to your credits ✅');
console.log('\n🔗 Dashboard: https://app.chaingpt.org/\n');

