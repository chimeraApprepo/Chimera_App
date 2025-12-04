/**
 * Quick API Test - Just hit the API once to see status
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.CHAINGPT_API_KEY;

console.log('🔍 Quick API Test\n');
console.log(`Using API Key: ${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}\n`);
console.log('Testing ChainGPT API...\n');

const requestBody = {
  model: 'general_assistant',
  question: 'Say "API works!" if you can read this',
  chatHistory: 'off'
};

console.log('📤 REQUEST DETAILS:');
console.log('─'.repeat(60));
console.log('URL:', 'https://api.chaingpt.org/chat/stream');
console.log('Method:', 'POST');
console.log('Headers:', {
  'Authorization': `Bearer ${API_KEY.substring(0, 8)}...${API_KEY.slice(-4)}`,
  'Content-Type': 'application/json'
});
console.log('Body:', JSON.stringify(requestBody, null, 2));
console.log('─'.repeat(60));
console.log('');

try {
  const response = await fetch('https://api.chaingpt.org/chat/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  console.log('📥 RESPONSE DETAILS:');
  console.log('─'.repeat(60));
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Headers:');
  for (const [key, value] of response.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  console.log('─'.repeat(60));
  console.log('');

  if (response.status === 200) {
    console.log('🎉 SUCCESS! Credits are working!\n');
    
    // Read first chunk
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const { value } = await reader.read();
    const text = decoder.decode(value);
    
    console.log('Response preview:');
    console.log('─'.repeat(60));
    console.log(text.substring(0, 200));
    console.log('─'.repeat(60));
    console.log('\n✅ ChainGPT API is now fully functional!\n');
    
    reader.cancel();
  } else {
    const errorText = await response.text();
    console.log('❌ Still not working\n');
    
    console.log('📛 ERROR RESPONSE:');
    console.log('─'.repeat(60));
    console.log('Raw Response:', errorText);
    try {
      const errorJson = JSON.parse(errorText);
      console.log('\nParsed Error:');
      console.log(JSON.stringify(errorJson, null, 2));
    } catch (e) {
      console.log('(Could not parse as JSON)');
    }
    console.log('─'.repeat(60));
    console.log('');
    
    console.log('📋 Possible reasons:');
    console.log('1. Credits are on your account but not linked to this API key');
    console.log('2. Need to create NEW API key after purchasing credits');
    console.log('3. Credits need a few minutes to propagate');
    console.log('4. Purchased Web App credits instead of API credits\n');
    console.log('💡 Try: Generate a fresh API key in the dashboard NOW\n');
  }
} catch (error) {
  console.log('❌ Request failed\n');
  
  console.log('🔥 EXCEPTION DETAILS:');
  console.log('─'.repeat(60));
  console.log('Error Type:', error.constructor.name);
  console.log('Error Message:', error.message);
  console.log('Error Stack:');
  console.log(error.stack);
  console.log('─'.repeat(60));
  console.log('');
}

