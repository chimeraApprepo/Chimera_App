/**
 * x402 Payment Service
 * HTTP 402 Payment Required protocol implementation
 * Supports optional "skip for demo" mode
 */

import { ethers } from 'ethers';
import config from '../config/index.js';

// Payment request storage (in production, use a database)
const paymentRequests = new Map();
const completedPayments = new Map();

// Pricing configuration (in tBNB or USDT)
const PRICING = {
  contract_generation: {
    amount: '0.001',
    token: 'tBNB',
    description: 'Smart Contract Generation'
  },
  contract_audit: {
    amount: '0.0005',
    token: 'tBNB', 
    description: 'Security Audit'
  },
  contract_deploy: {
    amount: '0.0002',
    token: 'tBNB',
    description: 'Contract Deployment'
  },
  chat: {
    amount: '0.0001',
    token: 'tBNB',
    description: 'AI Chat Response'
  },
  swap: {
    amount: '0.0003',
    token: 'tBNB',
    description: 'Token Swap Execution'
  }
};

export class PaymentService {
  constructor() {
    this.chainId = config.blockchain?.chainId || 97;
    this.facilitatorAddress = config.blockchain?.facilitatorAddress;
    this.demoMode = process.env.DEMO_MODE === 'true' || true; // Default to demo mode
    
    console.log('[Payment] Service initialized:', {
      chainId: this.chainId,
      demoMode: this.demoMode,
      facilitatorAddress: this.facilitatorAddress
    });
  }

  /**
   * Get pricing for an endpoint
   * @param {string} endpoint - Endpoint name
   * @returns {Object} Pricing info
   */
  getPricing(endpoint) {
    return PRICING[endpoint] || PRICING.chat;
  }

  /**
   * Create a payment request
   * @param {string} endpoint - Endpoint being accessed
   * @param {string} userAddress - User's wallet address (optional)
   * @returns {Object} Payment request with ID
   */
  createPaymentRequest(endpoint, userAddress = null) {
    const pricing = this.getPricing(endpoint);
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request = {
      id: paymentId,
      endpoint,
      amount: pricing.amount,
      token: pricing.token,
      description: pricing.description,
      recipient: this.facilitatorAddress,
      chainId: this.chainId,
      userAddress,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
      demoSkipAllowed: this.demoMode
    };

    paymentRequests.set(paymentId, request);
    
    console.log('[Payment] Created request:', paymentId);
    
    return request;
  }

  /**
   * Generate x402 response headers
   * @param {Object} paymentRequest - Payment request object
   * @returns {Object} Headers for 402 response
   */
  generate402Headers(paymentRequest) {
    return {
      'WWW-Authenticate': `x402 chain=${this.chainId} token=${paymentRequest.token} amount=${paymentRequest.amount} recipient=${paymentRequest.recipient}`,
      'X-Payment-Id': paymentRequest.id,
      'X-Payment-Amount': paymentRequest.amount,
      'X-Payment-Token': paymentRequest.token,
      'X-Payment-Recipient': paymentRequest.recipient,
      'X-Payment-ChainId': this.chainId.toString(),
      'X-Demo-Skip-Allowed': paymentRequest.demoSkipAllowed.toString()
    };
  }

  /**
   * Generate EIP-712 typed data for payment signature
   * @param {Object} paymentRequest - Payment request
   * @returns {Object} EIP-712 typed data
   */
  generateTypedData(paymentRequest) {
    const domain = {
      name: 'Chimera',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.facilitatorAddress
    };

    const types = {
      Payment: [
        { name: 'paymentId', type: 'string' },
        { name: 'amount', type: 'string' },
        { name: 'token', type: 'string' },
        { name: 'recipient', type: 'address' },
        { name: 'endpoint', type: 'string' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const message = {
      paymentId: paymentRequest.id,
      amount: paymentRequest.amount,
      token: paymentRequest.token,
      recipient: paymentRequest.recipient,
      endpoint: paymentRequest.endpoint,
      deadline: Math.floor(new Date(paymentRequest.expiresAt).getTime() / 1000)
    };

    return { domain, types, message };
  }

  /**
   * Verify a payment (signature or transaction)
   * @param {string} paymentId - Payment request ID
   * @param {Object} proof - Payment proof (signature or txHash)
   * @returns {Object} Verification result
   */
  async verifyPayment(paymentId, proof) {
    const request = paymentRequests.get(paymentId);
    
    if (!request) {
      return { valid: false, error: 'Payment request not found' };
    }

    if (new Date(request.expiresAt) < new Date()) {
      return { valid: false, error: 'Payment request expired' };
    }

    // Check if already completed
    if (completedPayments.has(paymentId)) {
      return { valid: true, alreadyCompleted: true };
    }

    // Demo skip mode
    if (proof.skipDemo && this.demoMode) {
      this.markPaymentComplete(paymentId, { method: 'demo_skip' });
      return { valid: true, method: 'demo_skip' };
    }

    // Verify signature
    if (proof.signature) {
      try {
        const typedData = this.generateTypedData(request);
        const recoveredAddress = ethers.verifyTypedData(
          typedData.domain,
          typedData.types,
          typedData.message,
          proof.signature
        );

        // Verify the signer matches expected user
        if (proof.userAddress && 
            recoveredAddress.toLowerCase() !== proof.userAddress.toLowerCase()) {
          return { valid: false, error: 'Signature does not match user address' };
        }

        this.markPaymentComplete(paymentId, { 
          method: 'signature', 
          signer: recoveredAddress 
        });
        
        return { valid: true, method: 'signature', signer: recoveredAddress };
      } catch (error) {
        return { valid: false, error: `Signature verification failed: ${error.message}` };
      }
    }

    // Verify transaction hash (on-chain payment)
    if (proof.txHash) {
      try {
        // In production, verify the transaction on-chain
        // For now, trust the tx hash and mark as pending verification
        this.markPaymentComplete(paymentId, { 
          method: 'transaction', 
          txHash: proof.txHash,
          verified: false // Would be true after blockchain verification
        });
        
        return { valid: true, method: 'transaction', txHash: proof.txHash };
      } catch (error) {
        return { valid: false, error: `Transaction verification failed: ${error.message}` };
      }
    }

    return { valid: false, error: 'No valid payment proof provided' };
  }

  /**
   * Mark a payment as complete
   * @param {string} paymentId - Payment ID
   * @param {Object} details - Completion details
   */
  markPaymentComplete(paymentId, details) {
    const request = paymentRequests.get(paymentId);
    if (request) {
      request.status = 'completed';
      request.completedAt = new Date().toISOString();
      request.completionDetails = details;
      
      completedPayments.set(paymentId, request);
      
      console.log('[Payment] Completed:', paymentId, details.method);
    }
  }

  /**
   * Get payment request status
   * @param {string} paymentId - Payment ID
   * @returns {Object|null} Payment status
   */
  getPaymentStatus(paymentId) {
    const completed = completedPayments.get(paymentId);
    if (completed) {
      return { ...completed, status: 'completed' };
    }

    const pending = paymentRequests.get(paymentId);
    if (pending) {
      const expired = new Date(pending.expiresAt) < new Date();
      return { ...pending, status: expired ? 'expired' : 'pending' };
    }

    return null;
  }

  /**
   * Check if request requires payment
   * @param {string} endpoint - Endpoint name
   * @returns {boolean} Whether payment is required
   */
  requiresPayment(endpoint) {
    // In demo mode, payment is optional
    if (this.demoMode) {
      return false;
    }
    
    return endpoint in PRICING;
  }

  /**
   * Create payment middleware for Hono
   * @param {string} endpoint - Endpoint name
   * @returns {Function} Middleware function
   */
  createPaywallMiddleware(endpoint) {
    return async (c, next) => {
      // Check for existing payment authorization
      const authHeader = c.req.header('Authorization');
      
      if (authHeader && authHeader.startsWith('x402 ')) {
        const paymentProof = this.parseAuthHeader(authHeader);
        
        if (paymentProof.paymentId) {
          const verification = await this.verifyPayment(
            paymentProof.paymentId,
            paymentProof
          );
          
          if (verification.valid) {
            // Payment verified, continue
            c.set('payment', { 
              verified: true, 
              ...verification,
              paymentId: paymentProof.paymentId 
            });
            return next();
          }
        }
      }

      // Check for demo skip header
      if (this.demoMode && c.req.header('X-Demo-Skip') === 'true') {
        const request = this.createPaymentRequest(endpoint);
        await this.verifyPayment(request.id, { skipDemo: true });
        c.set('payment', { verified: true, method: 'demo_skip' });
        return next();
      }

      // No payment - return 402 with payment request
      const paymentRequest = this.createPaymentRequest(
        endpoint,
        c.req.header('X-User-Address')
      );
      
      const headers = this.generate402Headers(paymentRequest);
      
      return c.json({
        error: 'Payment Required',
        message: `This endpoint requires payment: ${paymentRequest.description}`,
        payment: {
          id: paymentRequest.id,
          amount: paymentRequest.amount,
          token: paymentRequest.token,
          recipient: paymentRequest.recipient,
          chainId: paymentRequest.chainId,
          expiresAt: paymentRequest.expiresAt,
          demoSkipAllowed: paymentRequest.demoSkipAllowed,
          typedData: this.generateTypedData(paymentRequest)
        },
        instructions: {
          option1: 'Sign the EIP-712 typed data and include in Authorization header',
          option2: 'Send payment transaction and include txHash in Authorization header',
          option3: this.demoMode ? 'Set X-Demo-Skip: true header to skip payment (demo mode)' : null
        }
      }, 402, headers);
    };
  }

  /**
   * Parse Authorization header for x402
   * @param {string} header - Authorization header value
   * @returns {Object} Parsed payment proof
   */
  parseAuthHeader(header) {
    const result = {
      paymentId: null,
      signature: null,
      txHash: null
    };

    if (!header || !header.startsWith('x402 ')) {
      return result;
    }

    const parts = header.substring(5).split(' ');
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'paymentId') result.paymentId = value;
      if (key === 'signature') result.signature = value;
      if (key === 'txHash') result.txHash = value;
    }

    return result;
  }

  /**
   * Get all pricing information
   * @returns {Object} All pricing
   */
  getAllPricing() {
    return {
      ...PRICING,
      demoMode: this.demoMode,
      chainId: this.chainId,
      recipient: this.facilitatorAddress
    };
  }
}

// Create singleton instance
export const paymentService = new PaymentService();
