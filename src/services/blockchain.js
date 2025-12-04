/**
 * Blockchain Service
 * Handles blockchain interactions and context gathering
 */

import { ethers } from 'ethers';

export class BlockchainService {
  constructor(rpcUrl, chainId) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.chainId = chainId;
    
    console.log(`[Blockchain] Connected to ${rpcUrl} (Chain ID: ${chainId})`);
  }

  /**
   * Get current blockchain context for AI prompts
   * @param {boolean} useCache - Whether to use cached context
   * @returns {Promise<Object>} Context data
   */
  async getContext(useCache = true) {
    // Import cache here to avoid circular dependency
    const { cache, cacheKeys } = await import('./cache.js');
    
    if (useCache) {
      const cached = cache.get(cacheKeys.blockchainContext());
      if (cached) return cached;
    }

    try {
      const [blockNumber, feeData, network] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.provider.getNetwork()
      ]);

      const gasPrice = feeData.gasPrice 
        ? ethers.formatUnits(feeData.gasPrice, 'gwei')
        : 'unknown';

      const context = {
        timestamp: Date.now(),
        blockNumber,
        gasPrice,
        chainId: Number(network.chainId),
        customContext: {
          companyName: 'The Sovereign Architect',
          companyDescription: 'AI Agent for autonomous DeFi strategy deployment',
          purpose: 'Assist users with smart contract generation, auditing, and deployment on BNB Chain',
          blockchain: ['BSC'],
          aiTone: 'PRE_SET_TONE',
          selectedTone: 'PROFESSIONAL'
        }
      };

      // Cache for 30 seconds
      if (useCache) {
        cache.set(cacheKeys.blockchainContext(), context, 30000);
      }

      return context;
    } catch (error) {
      console.error('[Blockchain] Context error:', error.message);
      
      // Return minimal context on error
      return {
        timestamp: Date.now(),
        blockNumber: 'unknown',
        gasPrice: 'unknown',
        chainId: this.chainId,
        customContext: {
          companyName: 'The Sovereign Architect',
          purpose: 'DeFi strategy deployment assistant'
        }
      };
    }
  }

  /**
   * Get wallet balance
   * @param {string} address - Wallet address
   * @returns {Promise<string>} Balance in BNB
   */
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('[Blockchain] Balance error:', error.message);
      throw error;
    }
  }

  /**
   * Get current gas price
   * @returns {Promise<string>} Gas price in Gwei
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return ethers.formatUnits(feeData.gasPrice, 'gwei');
    } catch (error) {
      console.error('[Blockchain] Gas price error:', error.message);
      throw error;
    }
  }

  /**
   * Get current block number
   * @returns {Promise<number>} Block number
   */
  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('[Blockchain] Block number error:', error.message);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   * @param {Object} transaction - Transaction object
   * @returns {Promise<string>} Estimated gas
   */
  async estimateGas(transaction) {
    try {
      const estimate = await this.provider.estimateGas(transaction);
      return estimate.toString();
    } catch (error) {
      console.error('[Blockchain] Gas estimation error:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('[Blockchain] Receipt error:', error.message);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations to wait for
   * @returns {Promise<Object>} Receipt
   */
  async waitForTransaction(txHash, confirmations = 1) {
    try {
      console.log(`[Blockchain] Waiting for ${confirmations} confirmation(s) of ${txHash}`);
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      console.log(`[Blockchain] Transaction confirmed in block ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      console.error('[Blockchain] Wait error:', error.message);
      throw error;
    }
  }
}

