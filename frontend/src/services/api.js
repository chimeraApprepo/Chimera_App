/**
 * API Client Service
 * Handles all backend API communication
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get agent information
 */
export async function getAgentInfo() {
  const response = await fetch(`${API_URL}/agent`);
  if (!response.ok) throw new Error('Failed to fetch agent info');
  return response.json();
}

/**
 * Get blockchain status
 */
export async function getBlockchainStatus() {
  const response = await fetch(`${API_URL}/api/blockchain`);
  if (!response.ok) throw new Error('Failed to fetch blockchain status');
  return response.json();
}

/**
 * Get wallet balance
 * @param {string} address - Wallet address
 */
export async function getBalance(address) {
  const response = await fetch(`${API_URL}/api/balance/${address}`);
  if (!response.ok) throw new Error('Failed to fetch balance');
  return response.json();
}

/**
 * Send chat message (non-streaming)
 * @param {string} message - User message
 * @param {Array} history - Chat history
 */
export async function sendChatMessage(message, history = []) {
  const response = await fetch(`${API_URL}/api/chat/blob`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });
  
  if (!response.ok) throw new Error('Failed to send message');
  return response.json();
}

/**
 * Create streaming chat connection
 * @param {string} message - User message
 * @param {Array} history - Chat history
 * @returns {EventSource} SSE connection
 */
export function createChatStream(message, history = []) {
  // Note: EventSource doesn't support POST, so we'll use fetch with streaming
  return fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, history }),
  });
}

/**
 * Generate smart contract
 * @param {string} prompt - Generation prompt
 * @param {string} paymentHeader - Optional x402 payment header
 */
export async function generateContract(prompt, paymentHeader = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (paymentHeader) {
    headers['x-payment'] = paymentHeader;
  }
  
  const response = await fetch(`${API_URL}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt }),
  });
  
  // Return the response for streaming handling
  return response;
}

/**
 * Audit smart contract
 * @param {string} code - Solidity code
 * @param {string} paymentHeader - Optional x402 payment header
 */
export async function auditContract(code, paymentHeader = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (paymentHeader) {
    headers['x-payment'] = paymentHeader;
  }
  
  const response = await fetch(`${API_URL}/api/audit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    if (response.status === 402) {
      // Payment required
      const paymentInfo = await response.json();
      throw { requiresPayment: true, paymentInfo };
    }
    throw new Error('Failed to audit contract');
  }
  
  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

