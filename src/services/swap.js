/**
 * Swap Service
 * PancakeSwap integration for token swaps on BSC
 */

import { createPublicClient, http, parseAbi, formatEther, parseEther, formatUnits, parseUnits } from 'viem';
import config from '../config/index.js';

// BSC Testnet chain
const bscTestnet = {
  id: 97,
  name: 'BSC Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'tBNB',
  },
  rpcUrls: {
    default: {
      http: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    },
  },
};

// PancakeSwap V2 Router on BSC Testnet
const PANCAKE_ROUTER_ADDRESS = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
const PANCAKE_FACTORY_ADDRESS = '0x6725F303b657a9451d8BA641348b6761A6CC7a17';
const WBNB_ADDRESS = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';

// Common test tokens on BSC Testnet
const TEST_TOKENS = {
  WBNB: {
    address: WBNB_ADDRESS,
    symbol: 'WBNB',
    decimals: 18,
    name: 'Wrapped BNB'
  },
  BUSD: {
    address: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
    symbol: 'BUSD',
    decimals: 18,
    name: 'Binance USD (Testnet)'
  },
  USDT: {
    address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    symbol: 'USDT',
    decimals: 18,
    name: 'Tether (Testnet)'
  },
  DAI: {
    address: '0x8a9424745056Eb399FD19a0EC26A14316684e274',
    symbol: 'DAI',
    decimals: 18,
    name: 'DAI Stablecoin (Testnet)'
  }
};

// PancakeSwap Router ABI (simplified)
const ROUTER_ABI = parseAbi([
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function WETH() view returns (address)',
]);

// ERC20 ABI for token interactions
const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]);

export class SwapService {
  constructor() {
    const rpcUrl = config.blockchain?.rpcUrl || 'https://data-seed-prebsc-1-s1.binance.org:8545';
    
    this.publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http(rpcUrl),
    });

    this.routerAddress = PANCAKE_ROUTER_ADDRESS;
    this.factoryAddress = PANCAKE_FACTORY_ADDRESS;
    this.wbnbAddress = WBNB_ADDRESS;
    
    console.log('[Swap] Service initialized:', {
      router: this.routerAddress,
      factory: this.factoryAddress
    });
  }

  /**
   * Get supported tokens
   * @returns {Object} Token list
   */
  getSupportedTokens() {
    return {
      ...TEST_TOKENS,
      native: {
        symbol: 'tBNB',
        name: 'Test BNB',
        decimals: 18,
        address: null // Native token
      }
    };
  }

  /**
   * Get token info from contract
   * @param {string} address - Token address
   * @returns {Promise<Object>} Token info
   */
  async getTokenInfo(address) {
    try {
      const [symbol, name, decimals] = await Promise.all([
        this.publicClient.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
        this.publicClient.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'name',
        }),
        this.publicClient.readContract({
          address,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
      ]);

      return { address, symbol, name, decimals: Number(decimals) };
    } catch (error) {
      console.error('[Swap] Error fetching token info:', error.message);
      throw new Error(`Failed to fetch token info: ${error.message}`);
    }
  }

  /**
   * Get token balance for an address
   * @param {string} tokenAddress - Token address
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<Object>} Balance info
   */
  async getTokenBalance(tokenAddress, walletAddress) {
    try {
      if (!tokenAddress || tokenAddress === 'native') {
        // Native BNB balance
        const balance = await this.publicClient.getBalance({ address: walletAddress });
        return {
          raw: balance.toString(),
          formatted: formatEther(balance),
          symbol: 'tBNB',
          decimals: 18
        };
      }

      const [balance, decimals, symbol] = await Promise.all([
        this.publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress],
        }),
        this.publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }),
        this.publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }),
      ]);

      return {
        raw: balance.toString(),
        formatted: formatUnits(balance, Number(decimals)),
        symbol,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('[Swap] Error fetching balance:', error.message);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Get swap quote (expected output amount)
   * @param {string} tokenIn - Input token address (or 'native' for BNB)
   * @param {string} tokenOut - Output token address (or 'native' for BNB)
   * @param {string} amountIn - Input amount (in token units)
   * @returns {Promise<Object>} Quote with expected output
   */
  async getQuote(tokenIn, tokenOut, amountIn) {
    try {
      // Build path
      const path = this.buildPath(tokenIn, tokenOut);
      
      // Get decimals for input token
      let decimalsIn = 18;
      if (tokenIn && tokenIn !== 'native') {
        decimalsIn = await this.publicClient.readContract({
          address: tokenIn,
          abi: ERC20_ABI,
          functionName: 'decimals',
        });
      }

      // Parse amount with correct decimals
      const amountInWei = parseUnits(amountIn, Number(decimalsIn));

      // Get quote from router
      const amounts = await this.publicClient.readContract({
        address: this.routerAddress,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountInWei, path],
      });

      // Get decimals for output token
      let decimalsOut = 18;
      if (tokenOut && tokenOut !== 'native') {
        decimalsOut = await this.publicClient.readContract({
          address: tokenOut,
          abi: ERC20_ABI,
          functionName: 'decimals',
        });
      }

      const amountOut = amounts[amounts.length - 1];
      const amountOutFormatted = formatUnits(amountOut, Number(decimalsOut));

      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(amountIn, amountOutFormatted);

      return {
        tokenIn,
        tokenOut,
        amountIn,
        amountInWei: amountInWei.toString(),
        amountOut: amountOutFormatted,
        amountOutWei: amountOut.toString(),
        path: path.map(p => p.toLowerCase()),
        priceImpact,
        route: this.formatRoute(path),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Swap] Quote error:', error.message);
      throw new Error(`Failed to get quote: ${error.message}`);
    }
  }

  /**
   * Build swap path between two tokens
   * @param {string} tokenIn - Input token
   * @param {string} tokenOut - Output token
   * @returns {Array} Path array
   */
  buildPath(tokenIn, tokenOut) {
    const inAddr = (!tokenIn || tokenIn === 'native') ? this.wbnbAddress : tokenIn;
    const outAddr = (!tokenOut || tokenOut === 'native') ? this.wbnbAddress : tokenOut;

    // If one is WBNB, direct path
    if (inAddr.toLowerCase() === this.wbnbAddress.toLowerCase() || 
        outAddr.toLowerCase() === this.wbnbAddress.toLowerCase()) {
      return [inAddr, outAddr];
    }

    // Otherwise route through WBNB
    return [inAddr, this.wbnbAddress, outAddr];
  }

  /**
   * Format route for display
   * @param {Array} path - Path addresses
   * @returns {string} Formatted route
   */
  formatRoute(path) {
    const symbols = path.map(addr => {
      const addrLower = addr.toLowerCase();
      if (addrLower === this.wbnbAddress.toLowerCase()) return 'WBNB';
      
      for (const [symbol, token] of Object.entries(TEST_TOKENS)) {
        if (token.address.toLowerCase() === addrLower) return symbol;
      }
      return addr.slice(0, 6) + '...';
    });

    return symbols.join(' → ');
  }

  /**
   * Calculate price impact
   * @param {string} amountIn - Input amount
   * @param {string} amountOut - Output amount
   * @returns {string} Price impact percentage
   */
  calculatePriceImpact(amountIn, amountOut) {
    // Simplified calculation - in production use pool reserves
    const impact = Math.abs((parseFloat(amountIn) - parseFloat(amountOut)) / parseFloat(amountIn) * 100);
    return impact.toFixed(2);
  }

  /**
   * Build swap transaction for facilitator
   * @param {Object} params - Swap parameters
   * @returns {Object} Transaction data for facilitator
   */
  async buildSwapTransaction(params) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      recipient,
      slippageTolerance = 0.5 // 0.5%
    } = params;

    // Get quote first
    const quote = await this.getQuote(tokenIn, tokenOut, amountIn);

    // Calculate minimum output with slippage
    const slippageMultiplier = 1 - (slippageTolerance / 100);
    const minOut = minAmountOut || 
      (parseFloat(quote.amountOut) * slippageMultiplier).toString();

    // Determine swap type
    const isNativeIn = !tokenIn || tokenIn === 'native';
    const isNativeOut = !tokenOut || tokenOut === 'native';

    let functionName;
    let args;
    let value;

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

    if (isNativeIn) {
      // BNB → Token
      functionName = 'swapExactETHForTokens';
      args = [
        parseUnits(minOut, 18), // amountOutMin
        quote.path,
        recipient,
        deadline
      ];
      value = quote.amountInWei;
    } else if (isNativeOut) {
      // Token → BNB
      functionName = 'swapExactTokensForETH';
      args = [
        quote.amountInWei,
        parseUnits(minOut, 18),
        quote.path,
        recipient,
        deadline
      ];
      value = '0';
    } else {
      // Token → Token
      functionName = 'swapExactTokensForTokens';
      args = [
        quote.amountInWei,
        parseUnits(minOut, 18),
        quote.path,
        recipient,
        deadline
      ];
      value = '0';
    }

    return {
      type: 'swap',
      router: this.routerAddress,
      functionName,
      args,
      value,
      quote,
      minAmountOut: minOut,
      slippageTolerance,
      deadline,
      needsApproval: !isNativeIn,
      approvalToken: isNativeIn ? null : tokenIn,
      approvalAmount: quote.amountInWei
    };
  }

  /**
   * Execute swap via facilitator
   * @param {Object} swapTx - Swap transaction from buildSwapTransaction
   * @param {Object} facilitator - Facilitator service
   * @returns {Promise<Object>} Swap result
   */
  async executeSwap(swapTx, facilitator) {
    console.log('[Swap] Executing swap:', {
      function: swapTx.functionName,
      value: swapTx.value
    });

    try {
      // Note: In production, this would use the facilitator to execute
      // For now, return the prepared transaction
      return {
        success: true,
        prepared: true,
        transaction: swapTx,
        message: 'Swap transaction prepared. Execute via facilitator.'
      };
    } catch (error) {
      console.error('[Swap] Execution error:', error.message);
      throw new Error(`Swap execution failed: ${error.message}`);
    }
  }
}

// Create singleton instance
export const swapService = new SwapService();

