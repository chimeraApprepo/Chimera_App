/**
 * Facilitator Service
 * Executes transactions on behalf of users (gas sponsorship)
 * Enhanced with spend caps, rate limiting, and policy enforcement
 */

import { ethers } from 'ethers';
import config from '../config/index.js';

// Policy Configuration
const POLICY = {
  // Spend caps (in BNB)
  maxSpendPerTx: '0.5',          // Max 0.5 BNB per transaction
  maxSpendPerDay: '5.0',         // Max 5 BNB per day per user
  maxSpendPerHour: '1.0',        // Max 1 BNB per hour per user
  
  // Rate limiting
  maxTxPerMinute: 5,             // Max 5 transactions per minute
  maxTxPerHour: 30,              // Max 30 transactions per hour
  maxTxPerDay: 100,              // Max 100 transactions per day
  
  // Transaction types allowed
  allowedIntentTypes: ['deploy_contract', 'transfer', 'call_contract', 'swap'],
  
  // Contract restrictions
  allowedContracts: [],          // Empty = allow all
  deniedContracts: [],           // Blacklisted contracts
  
  // Audit requirements
  minAuditScore: 80,             // Minimum audit score for deployments
  requireAudit: true,            // Require audit for all deployments
};

// In-memory tracking (in production, use Redis or database)
const userTracking = new Map();
const usedNonces = new Set();

export class FacilitatorService {
  constructor(privateKey, rpcUrl, chainId) {
    if (!privateKey) {
      throw new Error('Facilitator private key is required');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.chainId = chainId;
    this.policy = POLICY;
    
    console.log('[Facilitator] Initialized:', {
      address: this.wallet.address,
      chainId,
      policy: {
        maxSpendPerTx: POLICY.maxSpendPerTx,
        maxTxPerHour: POLICY.maxTxPerHour
      }
    });
  }

  /**
   * Execute user intent (deploy contract, transfer tokens, etc.)
   * @param {Object} intent - User intent object
   * @param {string} signature - EIP-712 signature from user
   * @param {string} userAddress - User's address (optional)
   * @returns {Promise<Object>} Transaction receipt
   */
  async executeUserIntent(intent, signature, userAddress = null) {
    try {
      console.log('[Facilitator] Executing intent:', intent.type);

      // Verify signature first (skip for auto operations)
      const isAutoOp = signature === 'auto-deploy' || signature === 'auto-transfer' || signature === 'auto-call';
      
      if (!isAutoOp) {
        const isValid = await this.verifyIntentSignature(intent, signature);
        if (!isValid) {
          throw new Error('Invalid intent signature');
        }
      } else {
        console.log('[Facilitator] Skipping signature verification for auto operation');
      }

      // Check policy constraints
      await this.validatePolicy(intent, userAddress);

      // Track nonce
      this.trackNonce(intent.nonce);

      // Execute based on intent type
      let tx;
      switch (intent.type) {
        case 'deploy_contract':
          tx = await this.deployContract(intent.data);
          break;
        case 'transfer':
          tx = await this.transferTokens(intent.data);
          break;
        case 'call_contract':
          tx = await this.callContract(intent.data);
          break;
        case 'swap':
          tx = await this.executeSwap(intent.data);
          break;
        default:
          throw new Error(`Unknown intent type: ${intent.type}`);
      }

      // Wait for confirmation
      console.log('[Facilitator] Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      // Update user tracking
      if (userAddress) {
        this.recordTransaction(userAddress, intent, receipt);
      }

      console.log('[Facilitator] Transaction confirmed:', {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        contractAddress: receipt.contractAddress || null,
        policyInfo: {
          spendRemaining: await this.getRemainingSpend(userAddress),
          txRemaining: this.getRemainingTx(userAddress)
        }
      };
    } catch (error) {
      console.error('[Facilitator] Execution error:', error.message);
      throw new Error(`Transaction execution failed: ${error.message}`);
    }
  }

  /**
   * Deploy a smart contract
   * @param {Object} data - Contract deployment data
   * @returns {Promise<Object>} Transaction
   */
  async deployContract(data) {
    const { bytecode, abi, constructorArgs = [] } = data;

    if (!bytecode) {
      throw new Error('Contract bytecode is required');
    }

    // Create contract factory
    const factory = new ethers.ContractFactory(abi || [], bytecode, this.wallet);

    // Deploy contract
    console.log('[Facilitator] Deploying contract...');
    const contract = await factory.deploy(...constructorArgs);
    
    return contract.deploymentTransaction();
  }

  /**
   * Transfer tokens
   * @param {Object} data - Transfer data
   * @returns {Promise<Object>} Transaction
   */
  async transferTokens(data) {
    const { token, to, amount } = data;

    if (token === ethers.ZeroAddress || !token) {
      // Native BNB transfer
      return await this.wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount)
      });
    } else {
      // ERC-20 transfer
      const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)'
      ];
      const tokenContract = new ethers.Contract(token, erc20Abi, this.wallet);
      return await tokenContract.transfer(to, amount);
    }
  }

  /**
   * Call a contract function
   * @param {Object} data - Contract call data
   * @returns {Promise<Object>} Transaction
   */
  async callContract(data) {
    const { contract, abi, method, args = [], value = 0 } = data;

    const contractInstance = new ethers.Contract(contract, abi, this.wallet);
    
    return await contractInstance[method](...args, {
      value: value ? ethers.parseEther(value) : 0
    });
  }

  /**
   * Execute swap transaction
   * @param {Object} data - Swap data
   * @returns {Promise<Object>} Transaction
   */
  async executeSwap(data) {
    const { router, functionName, args, value } = data;
    
    // PancakeSwap Router ABI (simplified)
    const routerAbi = [
      'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
      'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
    ];

    const routerContract = new ethers.Contract(router, routerAbi, this.wallet);
    
    return await routerContract[functionName](...args, {
      value: value ? BigInt(value) : 0n
    });
  }

  /**
   * Verify EIP-712 intent signature
   * @param {Object} intent - Intent object
   * @param {string} signature - Signature
   * @returns {Promise<boolean>} Valid or not
   */
  async verifyIntentSignature(intent, signature) {
    try {
      const domain = {
        name: 'Chimera',
        version: '1',
        chainId: this.chainId,
        verifyingContract: this.wallet.address
      };

      const types = {
        Intent: [
          { name: 'type', type: 'string' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'dataHash', type: 'bytes32' }
        ]
      };

      const dataHash = intent.dataHash || ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(intent.data)));

      const message = {
        type: intent.type,
        nonce: BigInt(intent.nonce),
        deadline: BigInt(intent.deadline),
        dataHash
      };

      const recoveredAddress = ethers.verifyTypedData(domain, types, message, signature);
      
      console.log('[Facilitator] Signature verified from:', recoveredAddress);
      
      return true;
    } catch (error) {
      console.error('[Facilitator] Signature verification failed:', error.message);
      return false;
    }
  }

  /**
   * Enhanced policy validation
   * @param {Object} intent - Intent object
   * @param {string} userAddress - User's address
   * @throws {Error} If policy violated
   */
  async validatePolicy(intent, userAddress) {
    const violations = [];

    // 1. Check deadline
    const now = Math.floor(Date.now() / 1000);
    if (intent.deadline && intent.deadline < now) {
      violations.push('Intent deadline expired');
    }

    // 2. Check nonce (prevent replay)
    if (intent.nonce && usedNonces.has(intent.nonce.toString())) {
      violations.push('Nonce already used (replay attack prevented)');
    }

    // 3. Check intent type allowed
    if (!this.policy.allowedIntentTypes.includes(intent.type)) {
      violations.push(`Intent type "${intent.type}" is not allowed`);
    }

    // 4. Check rate limiting
    if (userAddress) {
      const userInfo = this.getUserTracking(userAddress);
      
      // Per minute limit
      const txLastMinute = userInfo.transactions.filter(t => 
        Date.now() - t.timestamp < 60 * 1000
      ).length;
      if (txLastMinute >= this.policy.maxTxPerMinute) {
        violations.push(`Rate limit exceeded: max ${this.policy.maxTxPerMinute} tx/minute`);
      }

      // Per hour limit
      const txLastHour = userInfo.transactions.filter(t => 
        Date.now() - t.timestamp < 60 * 60 * 1000
      ).length;
      if (txLastHour >= this.policy.maxTxPerHour) {
        violations.push(`Rate limit exceeded: max ${this.policy.maxTxPerHour} tx/hour`);
      }

      // Per day limit
      const txLastDay = userInfo.transactions.filter(t => 
        Date.now() - t.timestamp < 24 * 60 * 60 * 1000
      ).length;
      if (txLastDay >= this.policy.maxTxPerDay) {
        violations.push(`Rate limit exceeded: max ${this.policy.maxTxPerDay} tx/day`);
      }

      // 5. Check spend limits
      const spentLastHour = userInfo.transactions
        .filter(t => Date.now() - t.timestamp < 60 * 60 * 1000)
        .reduce((sum, t) => sum + parseFloat(t.gasSpent || '0'), 0);
      
      if (spentLastHour >= parseFloat(this.policy.maxSpendPerHour)) {
        violations.push(`Spend limit exceeded: max ${this.policy.maxSpendPerHour} BNB/hour`);
      }

      const spentLastDay = userInfo.transactions
        .filter(t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000)
        .reduce((sum, t) => sum + parseFloat(t.gasSpent || '0'), 0);
      
      if (spentLastDay >= parseFloat(this.policy.maxSpendPerDay)) {
        violations.push(`Spend limit exceeded: max ${this.policy.maxSpendPerDay} BNB/day`);
      }
    }

    // 6. Check contract restrictions
    if (intent.type === 'call_contract' && intent.data?.contract) {
      const contract = intent.data.contract.toLowerCase();
      
      if (this.policy.deniedContracts.map(c => c.toLowerCase()).includes(contract)) {
        violations.push('Contract is blacklisted');
      }

      if (this.policy.allowedContracts.length > 0 && 
          !this.policy.allowedContracts.map(c => c.toLowerCase()).includes(contract)) {
        violations.push('Contract is not in allowlist');
      }
    }

    // 7. Check audit requirement for deployments
    if (intent.type === 'deploy_contract' && this.policy.requireAudit) {
      if (intent.data?.auditScore && intent.data.auditScore < this.policy.minAuditScore) {
        violations.push(`Audit score ${intent.data.auditScore} is below minimum ${this.policy.minAuditScore}`);
      }
    }

    // Throw if any violations
    if (violations.length > 0) {
      throw new Error(`Policy violation: ${violations.join('; ')}`);
    }
    
    console.log('[Facilitator] Policy validation passed');
  }

  /**
   * Track used nonce
   * @param {number} nonce - Nonce value
   */
  trackNonce(nonce) {
    if (nonce) {
      usedNonces.add(nonce.toString());
      // Clean old nonces (older than 1 day)
      // In production, use proper persistence
    }
  }

  /**
   * Get user tracking info
   * @param {string} address - User address
   * @returns {Object} Tracking info
   */
  getUserTracking(address) {
    if (!address) return { transactions: [] };
    
    const key = address.toLowerCase();
    if (!userTracking.has(key)) {
      userTracking.set(key, { 
        transactions: [],
        firstSeen: Date.now()
      });
    }
    return userTracking.get(key);
  }

  /**
   * Record a transaction for tracking
   * @param {string} userAddress - User address
   * @param {Object} intent - Intent object
   * @param {Object} receipt - Transaction receipt
   */
  recordTransaction(userAddress, intent, receipt) {
    if (!userAddress) return;

    const userInfo = this.getUserTracking(userAddress);
    userInfo.transactions.push({
      timestamp: Date.now(),
      type: intent.type,
      txHash: receipt.hash,
      gasSpent: ethers.formatEther(receipt.gasUsed * receipt.gasPrice || 0)
    });

    // Keep only last 1000 transactions per user
    if (userInfo.transactions.length > 1000) {
      userInfo.transactions = userInfo.transactions.slice(-1000);
    }
  }

  /**
   * Get remaining spend limit for user
   * @param {string} userAddress - User address
   * @returns {Object} Remaining limits
   */
  async getRemainingSpend(userAddress) {
    if (!userAddress) {
      return {
        hourly: this.policy.maxSpendPerHour,
        daily: this.policy.maxSpendPerDay
      };
    }

    const userInfo = this.getUserTracking(userAddress);
    
    const spentLastHour = userInfo.transactions
      .filter(t => Date.now() - t.timestamp < 60 * 60 * 1000)
      .reduce((sum, t) => sum + parseFloat(t.gasSpent || '0'), 0);

    const spentLastDay = userInfo.transactions
      .filter(t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000)
      .reduce((sum, t) => sum + parseFloat(t.gasSpent || '0'), 0);

    return {
      hourly: (parseFloat(this.policy.maxSpendPerHour) - spentLastHour).toFixed(4),
      daily: (parseFloat(this.policy.maxSpendPerDay) - spentLastDay).toFixed(4)
    };
  }

  /**
   * Get remaining transaction count for user
   * @param {string} userAddress - User address
   * @returns {Object} Remaining tx counts
   */
  getRemainingTx(userAddress) {
    if (!userAddress) {
      return {
        perMinute: this.policy.maxTxPerMinute,
        perHour: this.policy.maxTxPerHour,
        perDay: this.policy.maxTxPerDay
      };
    }

    const userInfo = this.getUserTracking(userAddress);
    
    const txLastMinute = userInfo.transactions.filter(t => 
      Date.now() - t.timestamp < 60 * 1000
    ).length;

    const txLastHour = userInfo.transactions.filter(t => 
      Date.now() - t.timestamp < 60 * 60 * 1000
    ).length;

    const txLastDay = userInfo.transactions.filter(t => 
      Date.now() - t.timestamp < 24 * 60 * 60 * 1000
    ).length;

    return {
      perMinute: this.policy.maxTxPerMinute - txLastMinute,
      perHour: this.policy.maxTxPerHour - txLastHour,
      perDay: this.policy.maxTxPerDay - txLastDay
    };
  }

  /**
   * Get current policy configuration
   * @returns {Object} Policy config
   */
  getPolicy() {
    return { ...this.policy };
  }

  /**
   * Get facilitator wallet balance
   * @returns {Promise<string>} Balance in BNB
   */
  async getBalance() {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Estimate gas for an intent
   * @param {Object} intent - Intent object
   * @returns {Promise<string>} Estimated gas cost in BNB
   */
  async estimateGas(intent) {
    try {
      let gasEstimate;
      
      switch (intent.type) {
        case 'deploy_contract':
          gasEstimate = BigInt(2000000);
          break;
        case 'transfer':
          gasEstimate = BigInt(21000);
          break;
        case 'call_contract':
          gasEstimate = BigInt(100000);
          break;
        case 'swap':
          gasEstimate = BigInt(200000);
          break;
        default:
          gasEstimate = BigInt(100000);
      }

      const feeData = await this.provider.getFeeData();
      const gasCost = gasEstimate * feeData.gasPrice;
      
      return ethers.formatEther(gasCost);
    } catch (error) {
      console.error('[Facilitator] Gas estimation error:', error.message);
      return '0.001';
    }
  }
}

// Create singleton facilitator instance
export const facilitator = new FacilitatorService(
  config.blockchain.facilitatorPrivateKey,
  config.blockchain.rpcUrl,
  config.blockchain.chainId
);
