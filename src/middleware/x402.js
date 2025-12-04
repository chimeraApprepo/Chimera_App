/**
 * x402 Payment Middleware for Hono
 * Implements HTTP 402 Payment Required protocol
 */

import { PaymentService } from '../services/payment.js';

const X_PAYMENT_HEADER = 'x-payment';
const X_PAYMENT_RESPONSE_HEADER = 'x-payment-response';

/**
 * Create x402 payment middleware
 * @param {Object} config - Middleware configuration
 * @param {string} config.amount - Payment amount in smallest unit
 * @param {string} config.token - Token contract address
 * @param {string} config.recipient - Payment recipient address
 * @param {number} config.chainId - Chain ID for EIP-712 domain
 * @param {string} config.verifyingContract - Verifying contract address
 * @param {string} config.description - Endpoint description
 * @returns {Function} Hono middleware function
 */
export function createX402Middleware(config) {
  const paymentService = new PaymentService();

  return async (c, next) => {
    try {
      // Check for payment header
      const paymentHeader = c.req.header(X_PAYMENT_HEADER);

      if (!paymentHeader) {
        // No payment - return 402 challenge
        const challenge = paymentService.createPaymentChallenge(
          config.amount,
          config.token,
          config.recipient,
          config.chainId,
          config.verifyingContract
        );

        return c.json({
          ...challenge,
          description: config.description,
          requiredAmount: config.amount,
          requiredToken: config.token
        }, 402);
      }

      // Decode and verify payment
      let paymentData;
      try {
        paymentData = paymentService.decodePaymentHeader(paymentHeader);
      } catch (error) {
        return c.json({
          error: 'Invalid payment header format',
          message: error.message
        }, 400);
      }

      // Verify signature
      const verification = await paymentService.verifyPaymentSignature(
        paymentData.paymentDetails || paymentData,
        paymentData.signature
      );

      if (!verification.valid) {
        return c.json({
          error: 'Payment verification failed',
          reason: verification.error
        }, 402);
      }

      // Validate payment amount and token
      if (verification.amount !== config.amount) {
        return c.json({
          error: 'Invalid payment amount',
          expected: config.amount,
          received: verification.amount
        }, 402);
      }

      if (verification.token.toLowerCase() !== config.token.toLowerCase()) {
        return c.json({
          error: 'Invalid payment token',
          expected: config.token,
          received: verification.token
        }, 402);
      }

      // Payment verified - attach to context
      c.set('payment', {
        verified: true,
        payer: verification.payer,
        amount: verification.amount,
        token: verification.token
      });

      console.log('[x402] Payment verified:', {
        payer: verification.payer,
        amount: verification.amount
      });

      // Continue to handler
      await next();

      // Add payment response header if settlement happened
      // (In this simplified version, we're not actually settling)
      // c.header(X_PAYMENT_RESPONSE_HEADER, 
      //   paymentService.encodePaymentResponse({
      //     status: 'verified',
      //     timestamp: Date.now()
      //   })
      // );

    } catch (error) {
      console.error('[x402] Middleware error:', error);
      return c.json({
        error: 'Payment processing error',
        message: error.message
      }, 500);
    }
  };
}

/**
 * Helper to get payment info from context
 * @param {Context} c - Hono context
 * @returns {Object|null} Payment info or null
 */
export function getPayment(c) {
  return c.get('payment') || null;
}

