/**
 * useSignIntent Hook
 * Handles EIP-712 typed data signing for transaction intents
 * Used for Quack Q402 gasless transaction authorization
 */

import { useState, useCallback } from 'react';
import { useSignTypedData, useAccount, useChainId } from 'wagmi';
import { keccak256, toBytes, encodePacked } from 'viem';

// Chimera domain for EIP-712 signatures
const CHIMERA_DOMAIN = {
  name: 'Chimera',
  version: '1',
};

// Intent types for EIP-712
const INTENT_TYPES = {
  Intent: [
    { name: 'type', type: 'string' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'dataHash', type: 'bytes32' },
  ],
};

// Payment types for x402 signatures
const PAYMENT_TYPES = {
  Payment: [
    { name: 'paymentId', type: 'string' },
    { name: 'amount', type: 'string' },
    { name: 'token', type: 'string' },
    { name: 'recipient', type: 'address' },
    { name: 'endpoint', type: 'string' },
    { name: 'deadline', type: 'uint256' },
  ],
};

/**
 * Hook for signing transaction intents
 * @param {string} verifyingContract - Facilitator contract address
 * @returns {Object} Signing utilities
 */
export function useSignIntent(verifyingContract) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync, isPending, error } = useSignTypedData();
  
  const [lastSignature, setLastSignature] = useState(null);
  const [signingError, setSigningError] = useState(null);

  /**
   * Create a transaction intent object
   * @param {string} type - Intent type (deploy_contract, transfer, call_contract)
   * @param {Object} data - Intent data
   * @param {number} deadlineSeconds - Deadline in seconds from now
   * @returns {Object} Intent object
   */
  const createIntent = useCallback((type, data, deadlineSeconds = 3600) => {
    const now = Math.floor(Date.now() / 1000);
    
    // Hash the data object
    const dataString = JSON.stringify(data);
    const dataHash = keccak256(toBytes(dataString));
    
    return {
      type,
      data,
      nonce: Date.now(), // Use timestamp as nonce
      deadline: now + deadlineSeconds,
      dataHash,
    };
  }, []);

  /**
   * Sign a transaction intent
   * @param {Object} intent - Intent object
   * @returns {Promise<string>} Signature
   */
  const signIntent = useCallback(async (intent) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    if (!verifyingContract) {
      throw new Error('Verifying contract address not provided');
    }

    setSigningError(null);

    try {
      const domain = {
        ...CHIMERA_DOMAIN,
        chainId,
        verifyingContract,
      };

      // Prepare message with correct types
      const message = {
        type: intent.type,
        nonce: BigInt(intent.nonce),
        deadline: BigInt(intent.deadline),
        dataHash: intent.dataHash,
      };

      const signature = await signTypedDataAsync({
        domain,
        types: INTENT_TYPES,
        primaryType: 'Intent',
        message,
      });

      setLastSignature(signature);
      
      console.log('[SignIntent] Intent signed:', {
        type: intent.type,
        signer: address,
        signature: signature.slice(0, 20) + '...'
      });

      return signature;
    } catch (err) {
      console.error('[SignIntent] Signing error:', err);
      setSigningError(err.message || 'Failed to sign intent');
      throw err;
    }
  }, [isConnected, chainId, verifyingContract, signTypedDataAsync, address]);

  /**
   * Sign a payment request (x402)
   * @param {Object} paymentRequest - Payment request from backend
   * @returns {Promise<string>} Signature
   */
  const signPayment = useCallback(async (paymentRequest) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    setSigningError(null);

    try {
      const domain = {
        ...CHIMERA_DOMAIN,
        chainId: paymentRequest.chainId || chainId,
        verifyingContract: paymentRequest.recipient,
      };

      const message = {
        paymentId: paymentRequest.id,
        amount: paymentRequest.amount,
        token: paymentRequest.token,
        recipient: paymentRequest.recipient,
        endpoint: paymentRequest.endpoint,
        deadline: BigInt(Math.floor(new Date(paymentRequest.expiresAt).getTime() / 1000)),
      };

      const signature = await signTypedDataAsync({
        domain,
        types: PAYMENT_TYPES,
        primaryType: 'Payment',
        message,
      });

      setLastSignature(signature);

      console.log('[SignIntent] Payment signed:', {
        paymentId: paymentRequest.id,
        signer: address,
        signature: signature.slice(0, 20) + '...'
      });

      return signature;
    } catch (err) {
      console.error('[SignIntent] Payment signing error:', err);
      setSigningError(err.message || 'Failed to sign payment');
      throw err;
    }
  }, [isConnected, chainId, signTypedDataAsync, address]);

  /**
   * Sign and execute an intent
   * @param {string} type - Intent type
   * @param {Object} data - Intent data
   * @param {string} executeUrl - Backend URL to execute
   * @returns {Promise<Object>} Execution result
   */
  const signAndExecute = useCallback(async (type, data, executeUrl = '/api/execute') => {
    const intent = createIntent(type, data);
    const signature = await signIntent(intent);

    // Send to backend for execution
    const response = await fetch(executeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent, signature }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Execution failed');
    }

    return response.json();
  }, [createIntent, signIntent]);

  return {
    // State
    isConnected,
    address,
    chainId,
    isLoading: isPending,
    error: signingError || error?.message,
    lastSignature,
    
    // Actions
    createIntent,
    signIntent,
    signPayment,
    signAndExecute,
    
    // Clear error
    clearError: () => setSigningError(null),
  };
}

/**
 * Hook for x402 payment flow
 * @returns {Object} Payment flow utilities
 */
export function usePaymentFlow() {
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, requesting, signing, verifying, complete, error
  const [paymentError, setPaymentError] = useState(null);

  const { signPayment, isLoading, address } = useSignIntent();

  /**
   * Request payment for an endpoint
   * @param {string} endpoint - Endpoint name
   * @returns {Promise<Object>} Payment request
   */
  const requestPayment = useCallback(async (endpoint) => {
    setPaymentStatus('requesting');
    setPaymentError(null);

    try {
      const response = await fetch('/api/payments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, userAddress: address }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment request');
      }

      const data = await response.json();
      setPaymentRequest(data.payment);
      setPaymentStatus('pending');
      
      return data.payment;
    } catch (err) {
      setPaymentError(err.message);
      setPaymentStatus('error');
      throw err;
    }
  }, [address]);

  /**
   * Complete payment with signature
   * @returns {Promise<Object>} Verification result
   */
  const completePayment = useCallback(async () => {
    if (!paymentRequest) {
      throw new Error('No payment request');
    }

    setPaymentStatus('signing');
    setPaymentError(null);

    try {
      // Sign the payment
      const signature = await signPayment(paymentRequest);
      
      setPaymentStatus('verifying');

      // Verify with backend
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentRequest.id,
          signature,
          userAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      setPaymentStatus('complete');
      
      return result;
    } catch (err) {
      setPaymentError(err.message);
      setPaymentStatus('error');
      throw err;
    }
  }, [paymentRequest, signPayment, address]);

  /**
   * Skip payment (demo mode)
   * @returns {Promise<Object>} Skip result
   */
  const skipPayment = useCallback(async () => {
    if (!paymentRequest) {
      throw new Error('No payment request');
    }

    setPaymentStatus('verifying');

    try {
      const response = await fetch('/api/payments/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentRequest.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to skip payment');
      }

      const result = await response.json();
      setPaymentStatus('complete');
      
      return result;
    } catch (err) {
      setPaymentError(err.message);
      setPaymentStatus('error');
      throw err;
    }
  }, [paymentRequest]);

  /**
   * Reset payment flow
   */
  const resetPayment = useCallback(() => {
    setPaymentRequest(null);
    setPaymentStatus('idle');
    setPaymentError(null);
  }, []);

  return {
    paymentRequest,
    paymentStatus,
    paymentError,
    isLoading: isLoading || paymentStatus === 'requesting' || paymentStatus === 'verifying',
    
    requestPayment,
    completePayment,
    skipPayment,
    resetPayment,
  };
}

export default useSignIntent;

