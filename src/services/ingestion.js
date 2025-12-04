/**
 * Contract Ingestion Service
 * Analyzes existing deployed contracts on BSC
 */

import { createPublicClient, http, parseAbi, decodeFunctionData, decodeFunctionResult } from 'viem';
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

// Common contract interfaces for detection
const COMMON_INTERFACES = {
  ERC20: parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address, uint256) returns (bool)',
    'function approve(address, uint256) returns (bool)',
    'function allowance(address, address) view returns (uint256)',
  ]),
  ERC721: parseAbi([
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function tokenURI(uint256) view returns (string)',
    'function ownerOf(uint256) view returns (address)',
    'function balanceOf(address) view returns (uint256)',
    'function approve(address, uint256)',
    'function transferFrom(address, address, uint256)',
  ]),
  ERC1155: parseAbi([
    'function uri(uint256) view returns (string)',
    'function balanceOf(address, uint256) view returns (uint256)',
    'function balanceOfBatch(address[], uint256[]) view returns (uint256[])',
    'function setApprovalForAll(address, bool)',
    'function isApprovedForAll(address, address) view returns (bool)',
  ]),
};

export class IngestionService {
  constructor() {
    const rpcUrl = config.blockchain?.rpcUrl || 'https://data-seed-prebsc-1-s1.binance.org:8545';
    
    this.publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http(rpcUrl),
    });

    this.bscScanApiKey = process.env.BSCSCAN_API_KEY || '';
    console.log('[Ingestion] Service initialized');
  }

  /**
   * Ingest a contract at the given address
   * @param {string} address - Contract address
   * @returns {Promise<Object>} Contract analysis
   */
  async ingestContract(address) {
    console.log('[Ingestion] Analyzing contract:', address);

    const result = {
      address,
      network: 'BSC Testnet',
      chainId: 97,
      timestamp: new Date().toISOString(),
      exists: false,
      isContract: false,
      bytecode: null,
      bytecodeSize: 0,
      contractType: 'Unknown',
      interfaces: [],
      tokenInfo: null,
      abi: null,
      sourceCode: null,
      verified: false,
      links: {
        bscScan: `https://testnet.bscscan.com/address/${address}`,
        bscScanCode: `https://testnet.bscscan.com/address/${address}#code`,
      }
    };

    try {
      // Check if address has code
      const bytecode = await this.publicClient.getCode({ address });
      
      if (!bytecode || bytecode === '0x') {
        result.exists = true;
        result.isContract = false;
        result.message = 'Address exists but is not a contract (EOA)';
        return result;
      }

      result.exists = true;
      result.isContract = true;
      result.bytecode = bytecode;
      result.bytecodeSize = (bytecode.length - 2) / 2; // hex string to bytes

      // Try to detect contract type
      const typeDetection = await this.detectContractType(address);
      result.contractType = typeDetection.type;
      result.interfaces = typeDetection.interfaces;
      result.tokenInfo = typeDetection.tokenInfo;

      // Try to get verified source from BSCScan
      if (this.bscScanApiKey) {
        const sourceData = await this.fetchBscScanSource(address);
        if (sourceData) {
          result.abi = sourceData.abi;
          result.sourceCode = sourceData.sourceCode;
          result.verified = sourceData.verified;
          result.contractName = sourceData.contractName;
          result.compilerVersion = sourceData.compilerVersion;
        }
      }

      // Parse functions from ABI if available
      if (result.abi) {
        result.functions = this.parseFunctions(result.abi);
        result.events = this.parseEvents(result.abi);
      }

      console.log('[Ingestion] Analysis complete:', {
        address,
        type: result.contractType,
        verified: result.verified,
        bytecodeSize: result.bytecodeSize
      });

      return result;
    } catch (error) {
      console.error('[Ingestion] Error:', error.message);
      result.error = error.message;
      return result;
    }
  }

  /**
   * Detect contract type by probing standard interfaces
   * @param {string} address - Contract address
   * @returns {Promise<Object>} Type detection result
   */
  async detectContractType(address) {
    const result = {
      type: 'Unknown',
      interfaces: [],
      tokenInfo: null
    };

    // Try ERC20
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.safeCall(address, COMMON_INTERFACES.ERC20, 'name'),
        this.safeCall(address, COMMON_INTERFACES.ERC20, 'symbol'),
        this.safeCall(address, COMMON_INTERFACES.ERC20, 'decimals'),
        this.safeCall(address, COMMON_INTERFACES.ERC20, 'totalSupply'),
      ]);

      if (name !== null && symbol !== null && totalSupply !== null) {
        result.type = 'ERC20 Token';
        result.interfaces.push('ERC20');
        result.tokenInfo = {
          name,
          symbol,
          decimals: decimals !== null ? Number(decimals) : 18,
          totalSupply: totalSupply?.toString()
        };
        return result;
      }
    } catch {
      // Not ERC20
    }

    // Try ERC721
    try {
      const [name, symbol] = await Promise.all([
        this.safeCall(address, COMMON_INTERFACES.ERC721, 'name'),
        this.safeCall(address, COMMON_INTERFACES.ERC721, 'symbol'),
      ]);

      if (name !== null && symbol !== null) {
        result.type = 'ERC721 NFT';
        result.interfaces.push('ERC721');
        result.tokenInfo = { name, symbol };
        return result;
      }
    } catch {
      // Not ERC721
    }

    // Try ERC1155
    try {
      const uri = await this.safeCall(address, COMMON_INTERFACES.ERC1155, 'uri', [0n]);
      if (uri !== null) {
        result.type = 'ERC1155 Multi-Token';
        result.interfaces.push('ERC1155');
        return result;
      }
    } catch {
      // Not ERC1155
    }

    return result;
  }

  /**
   * Safe contract call that returns null on failure
   * @param {string} address - Contract address
   * @param {Array} abi - ABI array
   * @param {string} functionName - Function to call
   * @param {Array} args - Function arguments
   * @returns {Promise<any>} Result or null
   */
  async safeCall(address, abi, functionName, args = []) {
    try {
      return await this.publicClient.readContract({
        address,
        abi,
        functionName,
        args
      });
    } catch {
      return null;
    }
  }

  /**
   * Fetch contract source from BSCScan API
   * @param {string} address - Contract address
   * @returns {Promise<Object|null>} Source data
   */
  async fetchBscScanSource(address) {
    if (!this.bscScanApiKey) {
      return null;
    }

    try {
      const url = `https://api-testnet.bscscan.com/api?module=contract&action=getsourcecode&address=${address}&apikey=${this.bscScanApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result && data.result[0]) {
        const contract = data.result[0];
        
        if (contract.SourceCode && contract.SourceCode !== '') {
          return {
            verified: true,
            contractName: contract.ContractName,
            compilerVersion: contract.CompilerVersion,
            sourceCode: contract.SourceCode,
            abi: JSON.parse(contract.ABI !== 'Contract source code not verified' ? contract.ABI : '[]'),
            optimizationUsed: contract.OptimizationUsed === '1',
            runs: parseInt(contract.Runs) || 200
          };
        }
      }

      return { verified: false };
    } catch (error) {
      console.error('[Ingestion] BSCScan API error:', error.message);
      return null;
    }
  }

  /**
   * Parse functions from ABI
   * @param {Array} abi - Contract ABI
   * @returns {Array} Parsed functions
   */
  parseFunctions(abi) {
    if (!Array.isArray(abi)) return [];

    return abi
      .filter(item => item.type === 'function')
      .map(fn => ({
        name: fn.name,
        inputs: fn.inputs?.map(i => ({
          name: i.name,
          type: i.type
        })) || [],
        outputs: fn.outputs?.map(o => ({
          name: o.name,
          type: o.type
        })) || [],
        stateMutability: fn.stateMutability,
        signature: `${fn.name}(${fn.inputs?.map(i => i.type).join(',') || ''})`
      }));
  }

  /**
   * Parse events from ABI
   * @param {Array} abi - Contract ABI
   * @returns {Array} Parsed events
   */
  parseEvents(abi) {
    if (!Array.isArray(abi)) return [];

    return abi
      .filter(item => item.type === 'event')
      .map(ev => ({
        name: ev.name,
        inputs: ev.inputs?.map(i => ({
          name: i.name,
          type: i.type,
          indexed: i.indexed
        })) || [],
        signature: `${ev.name}(${ev.inputs?.map(i => i.type).join(',') || ''})`
      }));
  }

  /**
   * Get recent transactions for a contract
   * @param {string} address - Contract address
   * @param {number} limit - Max transactions to fetch
   * @returns {Promise<Array>} Recent transactions
   */
  async getRecentTransactions(address, limit = 10) {
    if (!this.bscScanApiKey) {
      return [];
    }

    try {
      const url = `https://api-testnet.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc&apikey=${this.bscScanApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return data.result.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gasUsed: tx.gasUsed,
          timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
          isError: tx.isError === '1',
          methodId: tx.methodId
        }));
      }

      return [];
    } catch (error) {
      console.error('[Ingestion] Transaction fetch error:', error.message);
      return [];
    }
  }
}

// Create singleton instance
export const ingestion = new IngestionService();

