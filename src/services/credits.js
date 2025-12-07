/**
 * CHIM Credits Service
 * Manages the Chimera Credit (CHIM) token economy
 * 
 * Production Flow:
 * 1. User pays USDC via x402 payment
 * 2. Backend (facilitator) receives payment confirmation
 * 3. Facilitator calls distributeCredits() to mint CHIM to user's wallet
 * 4. User's on-chain CHIM balance increases
 * 5. When using services, facilitator burns CHIM from user (requires approval)
 */

import { ethers } from 'ethers';
import config from '../config/index.js';

// CHIM Token ABI (minimal interface for our needs)
const CHIM_ABI = [
  // ERC20 Standard
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  
  // ERC20Permit
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
  
  // ChimeraCredit specific
  'function distributeCredits(address to, uint256 amount)',
  'function spendCreditsWithPermit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s, string service)',
  'function spendCredits(address from, uint256 amount, string service)',
  'function hasEnoughCredits(address user, uint256 servicePrice) view returns (bool)',
  'function getServicePrice(string service) view returns (uint256)',
  'function calculateChimForUsdc(uint256 usdcAmount) view returns (uint256)',
  'function batchDistribute(address[] recipients, uint256[] amounts)',
  
  // Constants
  'function PRICE_GENERATE() view returns (uint256)',
  'function PRICE_AUDIT() view returns (uint256)',
  'function PRICE_ANALYZE() view returns (uint256)',
  'function PRICE_SWAP() view returns (uint256)',
  'function PRICE_TRANSFER() view returns (uint256)',
  'function EXCHANGE_RATE() view returns (uint256)',
  
  // Events
  'event CreditsPurchased(address indexed buyer, uint256 usdcAmount, uint256 chimAmount)',
  'event CreditsSpent(address indexed user, uint256 amount, string service)',
  'event CreditsDistributed(address indexed to, uint256 amount, string reason)'
];

// Service pricing in CHIM tokens (matching contract constants)
// Note: wei values are stored as BigInt internally
const CHIM_PRICING_INTERNAL = {
  generate: {
    amount: '10',
    display: '10 CHIM',
    description: 'Smart Contract Generation',
    wei: ethers.parseEther('10')
  },
  audit: {
    amount: '5',
    display: '5 CHIM',
    description: 'Security Audit',
    wei: ethers.parseEther('5')
  },
  analyze: {
    amount: '3',
    display: '3 CHIM',
    description: 'Contract Analysis',
    wei: ethers.parseEther('3')
  },
  swap: {
    amount: '2',
    display: '2 CHIM',
    description: 'Token Swap Execution',
    wei: ethers.parseEther('2')
  },
  transfer: {
    amount: '1',
    display: '1 CHIM',
    description: 'Gas-Sponsored Transfer',
    wei: ethers.parseEther('1')
  },
  chat: {
    amount: '0.1',
    display: '0.1 CHIM',
    description: 'AI Chat Response',
    wei: ethers.parseEther('0.1')
  }
};

// Export pricing with wei as strings for JSON serialization
export const CHIM_PRICING = Object.fromEntries(
  Object.entries(CHIM_PRICING_INTERNAL).map(([key, value]) => [
    key,
    { ...value, wei: value.wei.toString() }
  ])
);

// Helper to get wei as BigInt for internal use
export function getServiceWei(service) {
  return CHIM_PRICING_INTERNAL[service]?.wei || ethers.parseEther('1');
}

// Exchange rate: 1 USDC = 10 CHIM
export const USDC_TO_CHIM_RATE = 10;

class CreditsService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.chainId = config.blockchain?.chainId || 97;
    this.contractAddress = config.chim?.contractAddress || null;
    
    // Demo mode is ONLY enabled if explicitly set via CHIM_DEMO_MODE=true
    // Default is production mode (on-chain)
    this.demoMode = process.env.CHIM_DEMO_MODE === 'true';
    
    // In-memory tracking for demo mode only
    this.demoBalances = new Map();
    
    // Track spent credits for credit_tracking mode (when user hasn't approved facilitator)
    // Maps userAddress.toLowerCase() -> BigInt of spent amount in wei
    this.spentCredits = new Map();
    
    this.init();
  }
  
  async init() {
    try {
      // Setup provider
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
      
      // Setup wallet if private key available
      if (config.blockchain.facilitatorPrivateKey) {
        this.wallet = new ethers.Wallet(
          config.blockchain.facilitatorPrivateKey,
          this.provider
        );
        console.log('[Credits] Facilitator wallet:', this.wallet.address);
      }
      
      // Setup contract if deployed and NOT in demo mode
      if (this.contractAddress && this.wallet && !this.demoMode) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          CHIM_ABI,
          this.wallet
        );
        console.log('[Credits] PRODUCTION MODE - Connected to CHIM contract:', this.contractAddress);
        
        // Verify we're the owner
        try {
          const testBalance = await this.contract.balanceOf(this.wallet.address);
          console.log('[Credits] Facilitator CHIM balance:', ethers.formatEther(testBalance));
        } catch (e) {
          console.warn('[Credits] Could not verify contract connection:', e.message);
        }
      } else if (this.demoMode) {
        console.log('[Credits] DEMO MODE - Using in-memory tracking');
      } else {
        console.log('[Credits] WARNING: No contract address or wallet configured');
      }
      
      console.log('[Credits] Service initialized:', {
        chainId: this.chainId,
        demoMode: this.demoMode,
        contractAddress: this.contractAddress || 'not deployed',
        facilitator: this.wallet?.address || 'not configured'
      });
    } catch (error) {
      console.error('[Credits] Initialization error:', error);
    }
  }
  
  /**
   * Get user's CHIM balance
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Balance info
   */
  async getBalance(userAddress) {
    if (!userAddress) {
      throw new Error('User address required');
    }
    
    if (this.demoMode) {
      const balance = this.demoBalances.get(userAddress.toLowerCase()) || BigInt(0);
      return {
        balance: balance.toString(),
        formatted: ethers.formatEther(balance.toString()),
        symbol: 'CHIM',
        demoMode: true
      };
    }
    
    try {
      const onChainBalance = await this.contract.balanceOf(userAddress);
      
      // Subtract any tracked spending (for credit_tracking mode when user hasn't approved)
      const spentAmount = this.spentCredits.get(userAddress.toLowerCase()) || BigInt(0);
      const effectiveBalance = onChainBalance > spentAmount ? onChainBalance - spentAmount : BigInt(0);
      
      return {
        balance: effectiveBalance.toString(),
        formatted: ethers.formatEther(effectiveBalance),
        onChainBalance: ethers.formatEther(onChainBalance),
        spentTracked: ethers.formatEther(spentAmount),
        symbol: 'CHIM',
        demoMode: false,
        contractAddress: this.contractAddress
      };
    } catch (error) {
      console.error('[Credits] Balance check error:', error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
  
  /**
   * Check user's allowance for the facilitator
   * @param {string} userAddress - User's wallet address
   * @returns {Object} Allowance info
   */
  async getAllowance(userAddress) {
    if (!userAddress || this.demoMode) {
      return { allowance: '0', formatted: '0', needsApproval: true };
    }
    
    try {
      const allowance = await this.contract.allowance(userAddress, this.wallet.address);
      return {
        allowance: allowance.toString(),
        formatted: ethers.formatEther(allowance),
        facilitator: this.wallet.address,
        needsApproval: allowance === BigInt(0)
      };
    } catch (error) {
      console.error('[Credits] Allowance check error:', error);
      return { allowance: '0', formatted: '0', needsApproval: true };
    }
  }
  
  /**
   * Check if user has enough credits for a service
   * @param {string} userAddress - User's wallet address
   * @param {string} service - Service name
   * @returns {Object} Credit check result
   */
  async checkCredits(userAddress, service) {
    const pricing = CHIM_PRICING[service];
    if (!pricing) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    const balance = await this.getBalance(userAddress);
    const balanceWei = BigInt(balance.balance);
    const requiredWei = getServiceWei(service);
    const hasEnough = balanceWei >= requiredWei;
    
    // Check allowance too (for production mode)
    let allowanceInfo = { needsApproval: false };
    if (!this.demoMode) {
      allowanceInfo = await this.getAllowance(userAddress);
    }
    
    return {
      hasEnough,
      balance: balance.formatted,
      required: pricing.amount,
      service,
      description: pricing.description,
      shortfall: hasEnough ? '0' : ethers.formatEther(requiredWei - balanceWei),
      needsApproval: allowanceInfo.needsApproval && !this.demoMode,
      facilitator: this.wallet?.address
    };
  }
  
  /**
   * Calculate CHIM amount for USDC payment
   * @param {string} usdcAmount - USDC amount (in normal units, e.g., "5" for 5 USDC)
   * @returns {Object} Conversion details
   */
  calculateCreditsForUsdc(usdcAmount) {
    const usdcValue = parseFloat(usdcAmount);
    const chimAmount = usdcValue * USDC_TO_CHIM_RATE;
    
    return {
      usdcAmount: usdcValue.toString(),
      chimAmount: chimAmount.toString(),
      chimWei: ethers.parseEther(chimAmount.toString()).toString(),
      rate: `1 USDC = ${USDC_TO_CHIM_RATE} CHIM`
    };
  }
  
  /**
   * Distribute credits to user after USDC payment (x402)
   * This is called by the backend after receiving USDC payment
   * The facilitator (contract owner) mints new CHIM to the user's wallet
   * 
   * @param {string} userAddress - Recipient address
   * @param {string} chimAmount - Amount of CHIM to distribute
   * @param {string} usdcPaid - USDC amount paid (for logging)
   * @returns {Object} Distribution result
   */
  async distributeCredits(userAddress, chimAmount, usdcPaid = '0') {
    if (!userAddress) {
      throw new Error('User address required');
    }
    
    // Convert to string if it's a number
    const amountStr = String(chimAmount);
    const amountWei = ethers.parseEther(amountStr);
    
    if (this.demoMode) {
      // Demo mode: track in memory
      const currentBalance = this.demoBalances.get(userAddress.toLowerCase()) || BigInt(0);
      const newBalance = currentBalance + amountWei;
      this.demoBalances.set(userAddress.toLowerCase(), newBalance);
      
      console.log('[Credits] Demo distribution:', {
        to: userAddress,
        amount: chimAmount,
        newBalance: ethers.formatEther(newBalance)
      });
      
      return {
        success: true,
        demoMode: true,
        to: userAddress,
        amount: chimAmount,
        usdcPaid,
        newBalance: ethers.formatEther(newBalance)
      };
    }
    
    // PRODUCTION MODE: Actually mint tokens on-chain
    try {
      console.log('[Credits] Minting CHIM on-chain:', {
        to: userAddress,
        amount: amountStr,
        amountWei: amountWei.toString()
      });
      
      // Call contract to mint tokens to user's wallet
      const tx = await this.contract.distributeCredits(userAddress, amountWei);
      console.log('[Credits] Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('[Credits] Transaction confirmed in block:', receipt.blockNumber);
      
      // Get new balance
      const newBalance = await this.contract.balanceOf(userAddress);
      
      console.log('[Credits] CHIM minted successfully:', {
        to: userAddress,
        amount: amountStr,
        newBalance: ethers.formatEther(newBalance),
        txHash: receipt.hash
      });
      
      return {
        success: true,
        demoMode: false,
        to: userAddress,
        amount: chimAmount,
        usdcPaid,
        newBalance: ethers.formatEther(newBalance),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl: `https://testnet.bscscan.com/tx/${receipt.hash}`
      };
    } catch (error) {
      console.error('[Credits] Distribution error:', error);
      throw new Error(`Failed to mint CHIM: ${error.message}`);
    }
  }
  
  /**
   * Spend credits for a service using permit (gasless for user)
   * User signs a permit, facilitator submits the transaction
   * 
   * @param {string} userAddress - User's address
   * @param {string} service - Service name
   * @param {Object} permitSignature - Permit signature { deadline, v, r, s }
   * @returns {Object} Spend result
   */
  async spendCreditsWithPermit(userAddress, service, permitSignature) {
    if (!userAddress) {
      throw new Error('User address required');
    }
    
    const pricing = CHIM_PRICING[service];
    if (!pricing) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    // Check balance first
    const creditCheck = await this.checkCredits(userAddress, service);
    if (!creditCheck.hasEnough) {
      return {
        success: false,
        error: 'Insufficient credits',
        balance: creditCheck.balance,
        required: creditCheck.required,
        shortfall: creditCheck.shortfall
      };
    }
    
    const serviceWei = getServiceWei(service);
    
    if (this.demoMode) {
      return this._demoPspend(userAddress, service, pricing, serviceWei);
    }
    
    try {
      const { deadline, v, r, s } = permitSignature;
      
      console.log('[Credits] Spending with permit:', {
        user: userAddress,
        service,
        amount: pricing.amount
      });
      
      const tx = await this.contract.spendCreditsWithPermit(
        userAddress,
        this.wallet.address,
        serviceWei,
        deadline,
        v,
        r,
        s,
        service
      );
      
      const receipt = await tx.wait();
      const newBalance = await this.contract.balanceOf(userAddress);
      
      return {
        success: true,
        demoMode: false,
        user: userAddress,
        service,
        amount: pricing.amount,
        newBalance: ethers.formatEther(newBalance),
        txHash: receipt.hash,
        method: 'permit'
      };
    } catch (error) {
      console.error('[Credits] Permit spend error:', error);
      throw new Error(`Failed to spend credits: ${error.message}`);
    }
  }
  
  /**
   * Spend credits for a service (requires prior approval)
   * User must have approved facilitator to spend their CHIM
   * 
   * @param {string} userAddress - User's address
   * @param {string} service - Service name
   * @param {Object} permitSignature - Optional permit signature for gasless spending
   * @returns {Object} Spend result
   */
  async spendCredits(userAddress, service, permitSignature = null) {
    if (!userAddress) {
      throw new Error('User address required');
    }
    
    const pricing = CHIM_PRICING[service];
    if (!pricing) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    // Check balance first
    const creditCheck = await this.checkCredits(userAddress, service);
    if (!creditCheck.hasEnough) {
      return {
        success: false,
        error: 'Insufficient credits',
        balance: creditCheck.balance,
        required: creditCheck.required,
        shortfall: creditCheck.shortfall,
        buyCreditsUrl: '/api/credits/buy'
      };
    }
    
    const serviceWei = getServiceWei(service);
    
    if (this.demoMode) {
      return this._demoSpend(userAddress, service, pricing, serviceWei);
    }
    
    // If permit signature provided, use gasless flow
    if (permitSignature) {
      return this.spendCreditsWithPermit(userAddress, service, permitSignature);
    }
    
    // Check if user has approved facilitator
    const allowance = await this.contract.allowance(userAddress, this.wallet.address);
    if (allowance < serviceWei) {
      // User needs to approve first
      // For now, we'll transfer FROM facilitator's own balance as a credit system
      // This is a workaround for the hackathon - user pays USDC, gets credited in our system
      console.log('[Credits] User has not approved facilitator, using facilitator transfer method');
      
      // Instead of burning, we track usage and transfer from facilitator reserves
      return this._facilitatorCreditSpend(userAddress, service, pricing, serviceWei);
    }
    
    try {
      console.log('[Credits] Spending via approval:', {
        user: userAddress,
        service,
        amount: pricing.amount
      });
      
      // Direct spend (burns tokens)
      const tx = await this.contract.spendCredits(userAddress, serviceWei, service);
      const receipt = await tx.wait();
      
      const newBalance = await this.contract.balanceOf(userAddress);
      
      return {
        success: true,
        demoMode: false,
        user: userAddress,
        service,
        amount: pricing.amount,
        newBalance: ethers.formatEther(newBalance),
        txHash: receipt.hash,
        method: 'approval'
      };
    } catch (error) {
      console.error('[Credits] Spend error:', error);
      throw new Error(`Failed to spend credits: ${error.message}`);
    }
  }
  
  /**
   * Demo mode spending (in-memory)
   */
  _demoSpend(userAddress, service, pricing, serviceWei) {
    const currentBalance = this.demoBalances.get(userAddress.toLowerCase()) || BigInt(0);
    const newBalance = currentBalance - serviceWei;
    this.demoBalances.set(userAddress.toLowerCase(), newBalance);
    
    console.log('[Credits] Demo spend:', {
      user: userAddress,
      service,
      amount: pricing.amount,
      newBalance: ethers.formatEther(newBalance)
    });
    
    return {
      success: true,
      demoMode: true,
      user: userAddress,
      service,
      amount: pricing.amount,
      newBalance: ethers.formatEther(newBalance)
    };
  }
  
  /**
   * Facilitator credit system - for users who haven't approved
   * Instead of burning from user, we track credits and deduct from their reported balance
   * This works because we minted tokens to them, so we know they have them
   */
  async _facilitatorCreditSpend(userAddress, service, pricing, serviceWei) {
    try {
      const normalizedAddress = userAddress.toLowerCase();
      
      // Check user's actual on-chain balance
      const userBalance = await this.contract.balanceOf(userAddress);
      
      // Get current tracked spending
      const currentSpent = this.spentCredits.get(normalizedAddress) || BigInt(0);
      const effectiveBalance = userBalance > currentSpent ? userBalance - currentSpent : BigInt(0);
      
      if (effectiveBalance < serviceWei) {
        return {
          success: false,
          error: 'Insufficient credits',
          balance: ethers.formatEther(effectiveBalance),
          required: pricing.amount,
          shortfall: ethers.formatEther(serviceWei - effectiveBalance)
        };
      }
      
      // Track the spending - this deducts from their reported balance
      const newSpent = currentSpent + serviceWei;
      this.spentCredits.set(normalizedAddress, newSpent);
      
      const newEffectiveBalance = userBalance - newSpent;
      
      console.log('[Credits] Credit-based spend (tracked):', {
        user: userAddress,
        service,
        amount: pricing.amount,
        previousBalance: ethers.formatEther(effectiveBalance),
        newBalance: ethers.formatEther(newEffectiveBalance),
        totalSpent: ethers.formatEther(newSpent)
      });
      
      return {
        success: true,
        demoMode: false,
        user: userAddress,
        service,
        amount: pricing.amount,
        newBalance: ethers.formatEther(newEffectiveBalance),
        method: 'credit_tracking',
        note: 'Credits tracked - approve facilitator for on-chain burning'
      };
    } catch (error) {
      console.error('[Credits] Facilitator spend error:', error);
      throw new Error(`Failed to process credit spend: ${error.message}`);
    }
  }
  
  /**
   * Generate EIP-712 typed data for permit signature
   * @param {string} userAddress - Token owner
   * @param {string} service - Service being paid for
   * @param {number} deadline - Signature deadline (Unix timestamp)
   * @returns {Object} Typed data for signing
   */
  async generatePermitTypedData(userAddress, service, deadline = null) {
    const pricing = CHIM_PRICING[service];
    if (!pricing) {
      throw new Error(`Unknown service: ${service}`);
    }
    
    const deadlineTimestamp = deadline || Math.floor(Date.now() / 1000) + 3600; // 1 hour
    
    let nonce = 0;
    if (!this.demoMode && this.contract) {
      nonce = await this.contract.nonces(userAddress);
    }
    
    const spenderAddress = this.wallet?.address || config.blockchain.facilitatorAddress;
    
    // EIP-2612 Permit typed data
    const domain = {
      name: 'Chimera Agent Credit',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.contractAddress || '0x0000000000000000000000000000000000000000'
    };
    
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };
    
    const message = {
      owner: userAddress,
      spender: spenderAddress,
      value: CHIM_PRICING_INTERNAL[service].wei.toString(),
      nonce: nonce.toString(),
      deadline: deadlineTimestamp.toString()
    };
    
    return {
      domain,
      types,
      primaryType: 'Permit',
      message,
      service,
      pricing: {
        amount: pricing.amount,
        description: pricing.description
      }
    };
  }
  
  /**
   * Get all service pricing
   * @returns {Object} All pricing info
   */
  getAllPricing() {
    return {
      pricing: CHIM_PRICING,
      exchangeRate: {
        rate: USDC_TO_CHIM_RATE,
        description: `1 USDC = ${USDC_TO_CHIM_RATE} CHIM`
      },
      token: {
        symbol: 'CHIM',
        name: 'Chimera Agent Credit',
        decimals: 18,
        address: this.contractAddress || 'not deployed'
      },
      demoMode: this.demoMode
    };
  }
  
  /**
   * Get credit packages available for purchase
   * @returns {Array} Available packages
   */
  getCreditPackages() {
    return [
      {
        id: 'starter',
        name: 'Starter Pack',
        usdcPrice: '5',
        chimAmount: '50',
        description: 'Perfect for trying out the platform',
        services: '~5 contract generations or ~10 audits'
      },
      {
        id: 'builder',
        name: 'Builder Pack',
        usdcPrice: '20',
        chimAmount: '200',
        description: 'For active developers',
        services: '~20 contract generations or ~40 audits',
        popular: true
      },
      {
        id: 'pro',
        name: 'Pro Pack',
        usdcPrice: '50',
        chimAmount: '550',
        description: 'Best value for power users',
        services: '~55 contract generations or ~110 audits',
        bonus: '+10% bonus included'
      }
    ];
  }
  
  /**
   * Award bonus credits (for promotions, referrals, etc.)
   * @param {string} userAddress - User address
   * @param {string} amount - CHIM amount
   * @param {string} reason - Reason for bonus
   */
  async awardBonus(userAddress, amount, reason = 'bonus') {
    return this.distributeCredits(userAddress, amount, '0');
  }
  
  /**
   * Get service status
   */
  getStatus() {
    return {
      demoMode: this.demoMode,
      contractAddress: this.contractAddress,
      facilitator: this.wallet?.address,
      chainId: this.chainId,
      isConnected: !!this.contract
    };
  }
}

// Create singleton instance
export const creditsService = new CreditsService();
