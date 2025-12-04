/**
 * Test ChainGPT Blob (Non-Streaming) Endpoint
 * Some users report this works when streaming doesn't
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const API_KEY = process.env.CHAINGPT_API_KEY;

console.log('🧪 Testing ChainGPT Blob Endpoint\n');

// Try the blob endpoint specifically
const endpoints = [
  {
    name: 'Stream Endpoint',
    url: 'https://api.chaingpt.org/chat/stream'
  },
  {
    name: 'Chat Endpoint (alternative)',
    url: 'https://api.chaingpt.org/api/v1/chat'
  },
  {
    name: 'General Chat',
    url: 'https://api.chaingpt.org/general-chat'
  }
];

for (const endpoint of endpoints) {
  console.log(`Testing: ${endpoint.name}`);
  console.log(`URL: ${endpoint.url}`);
  
  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'general_assistant',
        question: 'hello',
        chatHistory: 'off'
      })
    });

    console.log(`  Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const text = await response.text();
      console.log(`  ✅ SUCCESS!`);
      console.log(`  Response: ${text.substring(0, 100)}...\n`);
    } else {
      const error = await response.text();
      console.log(`  ❌ Failed: ${error.substring(0, 100)}\n`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
}

