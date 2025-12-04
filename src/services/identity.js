/**
 * Identity Service
 * Manages ERC-8004 agent identity on BSC Testnet
 * Adapted from AWEtoAgent-Kit patterns for BSC
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import config from '../config/index.js';

// BSC Testnet chain definition
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
  blockExplorers: {
    default: {
      name: 'BscScan Testnet',
      url: 'https://testnet.bscscan.com',
    },
  },
};

// ERC-8004 Identity Registry ABI (simplified for our needs)
const IDENTITY_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'register',
    inputs: [{ name: 'tokenUri', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'tokenURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true }
    ]
  }
];

// BAS Core (Identity Registry) on BSC Testnet
const BSC_TESTNET_IDENTITY_REGISTRY = '0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD';

export class IdentityService {
  constructor() {
    this.agentId = process.env.AGENT_ID || null;
    this.ipfsHash = process.env.AGENT_IPFS_HASH || null;
    this.registryAddress = BSC_TESTNET_IDENTITY_REGISTRY;
    this.chainId = 97;
    this.isInitialized = false;
    
    // Initialize viem clients
    this.initializeClients();
  }

  /**
   * Initialize viem clients for blockchain interaction
   */
  initializeClients() {
    try {
      const rpcUrl = process.env.BNB_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
      
      // Public client for reading
      this.publicClient = createPublicClient({
        chain: bscTestnet,
        transport: http(rpcUrl),
      });

      // Wallet client for writing (if private key available)
      const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
      if (privateKey) {
        const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
        this.walletClient = createWalletClient({
          account,
          chain: bscTestnet,
          transport: http(rpcUrl),
        });
        this.agentAddress = account.address;
      }

      this.isInitialized = true;
      console.log('[Identity] Service initialized:', {
        registryAddress: this.registryAddress,
        chainId: this.chainId,
        hasWallet: !!this.walletClient,
        agentAddress: this.agentAddress || 'N/A'
      });
    } catch (error) {
      console.error('[Identity] Initialization error:', error.message);
      this.isInitialized = false;
    }
  }

  /**
   * Register agent on ERC-8004 registry
   * @param {Object} options - Registration options
   * @returns {Promise<Object>} Registration result
   */
  async registerAgent(options = {}) {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Set FACILITATOR_PRIVATE_KEY in .env');
    }

    const {
      name = 'Chimera',
      description = 'AI Agent for autonomous smart contract deployment',
      tokenUri = null,
    } = options;

    try {
      console.log('[Identity] Registering agent...');

      // If no tokenURI provided, create a metadata URI placeholder
      const uri = tokenUri || await this.buildMetadataUri(name, description);
      
      console.log('[Identity] Using tokenURI:', uri);

      // Call register function
      const hash = await this.walletClient.writeContract({
        address: this.registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'register',
        args: [uri],
      });

      console.log('[Identity] Transaction sent:', hash);

      // Wait for confirmation and extract agentId
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
      
      let agentId = null;
      
      // Parse Registered event to get agentId
      // Event signature: Registered(uint256 indexed agentId, string tokenURI, address indexed owner)
      const REGISTERED_EVENT_SIGNATURE = '0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a';
      
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === this.registryAddress.toLowerCase() &&
            log.topics[0] === REGISTERED_EVENT_SIGNATURE &&
            log.topics.length >= 2) {
          agentId = BigInt(log.topics[1]).toString();
          break;
        }
      }

      console.log('[Identity] Registration confirmed:', {
        hash: receipt.transactionHash,
        blockNumber: Number(receipt.blockNumber),
        agentId
      });

      // Store the agent ID
      if (agentId) {
        this.agentId = agentId;
      }

      return {
        success: true,
        transactionHash: hash,
        blockNumber: Number(receipt.blockNumber),
        agentId,
        tokenUri: uri,
        owner: this.agentAddress,
        bscScanUrl: `https://testnet.bscscan.com/tx/${hash}`,
        nftUrl: agentId ? `https://testnet.bscscan.com/token/${this.registryAddress}?a=${agentId}` : null
      };
    } catch (error) {
      console.error('[Identity] Registration error:', error.message);
      throw new Error(`Agent registration failed: ${error.message}`);
    }
  }

  /**
   * Build metadata URI for agent
   * @param {string} name - Agent name
   * @param {string} description - Agent description
   * @returns {string} Metadata URI
   */
  async buildMetadataUri(name, description) {
    // If IPFS hash is configured, use it
    if (this.ipfsHash && this.ipfsHash !== 'QmPENDING') {
      return `ipfs://${this.ipfsHash}`;
    }

    // Otherwise use a hosted metadata endpoint
    const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/.well-known/agent-metadata.json`;
  }

  /**
   * Generate ERC-8004 compliant metadata JSON
   * @returns {Object} Agent metadata
   */
  generateMetadata() {
    const baseUrl = process.env.AGENT_BASE_URL || 'http://localhost:3000';
    
    return {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: 'Chimera',
      description: 'AI Agent for autonomous smart contract deployment on BNB Chain. Powered by ChainGPT for code generation and auditing, with gasless transactions via Q402.',
      image: `${baseUrl}/logo.png`,
      external_url: baseUrl,
      endpoints: [
        {
          name: 'A2A',
          endpoint: `${baseUrl}/api/chat`,
          version: '1.0.0'
        },
        {
          name: 'Contract Generation',
          endpoint: `${baseUrl}/api/contract/create`,
          version: '1.0.0'
        },
        {
          name: 'Smart Contract Audit',
          endpoint: `${baseUrl}/api/audit`,
          version: '1.0.0'
        }
      ],
      supportedTrust: ['reputation', 'validation'],
      capabilities: [
        'smart-contract-generation',
        'security-auditing',
        'gasless-transactions',
        'defi-strategy-research'
      ],
      networks: ['bsc-testnet'],
      chainId: 97
    };
  }

  /**
   * Get agent identity from registry
   * @param {string|number} agentId - Agent ID to lookup
   * @returns {Promise<Object|null>} Identity record
   */
  async getAgentRecord(agentId = null) {
    const id = agentId || this.agentId;
    
    if (!id) {
      return null;
    }

    try {
      const tokenId = BigInt(id);
      
      // Get owner
      let owner;
      try {
        owner = await this.publicClient.readContract({
          address: this.registryAddress,
          abi: IDENTITY_REGISTRY_ABI,
          functionName: 'ownerOf',
          args: [tokenId],
        });
      } catch {
        return null; // Token doesn't exist
      }

      // Get token URI
      const tokenUri = await this.publicClient.readContract({
        address: this.registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      });

      return {
        agentId: id,
        owner,
        tokenUri,
        registryAddress: this.registryAddress,
        chainId: this.chainId,
        bscScanUrl: `https://testnet.bscscan.com/token/${this.registryAddress}?a=${id}`
      };
    } catch (error) {
      console.error('[Identity] Error fetching agent record:', error.message);
      return null;
    }
  }

  /**
   * Check if current wallet has a registered agent
   * @returns {Promise<Object|null>} Registration info
   */
  async checkRegistration() {
    if (!this.agentAddress) {
      return { registered: false, reason: 'No wallet configured' };
    }

    try {
      const balance = await this.publicClient.readContract({
        address: this.registryAddress,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'balanceOf',
        args: [this.agentAddress],
      });

      return {
        registered: balance > 0n,
        agentId: this.agentId,
        tokenCount: Number(balance),
        address: this.agentAddress
      };
    } catch (error) {
      console.error('[Identity] Error checking registration:', error.message);
      return { registered: false, error: error.message };
    }
  }

  /**
   * Upload metadata to IPFS via Pinata
   * @param {Object} metadata - Metadata to upload
   * @returns {Promise<string>} IPFS hash
   */
  async uploadToIPFS(metadata = null) {
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('Pinata API keys not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY in .env');
    }

    const data = metadata || this.generateMetadata();

    try {
      console.log('[Identity] Uploading metadata to IPFS...');

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: 'chimera-agent-metadata.json'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Pinata error: ${response.statusText}`);
      }

      const result = await response.json();
      const ipfsHash = result.IpfsHash;

      console.log('[Identity] Metadata uploaded:', {
        ipfsHash,
        ipfsUrl: `ipfs://${ipfsHash}`,
        gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      });

      // Store the hash
      this.ipfsHash = ipfsHash;

      return ipfsHash;
    } catch (error) {
      console.error('[Identity] IPFS upload error:', error.message);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Get full identity information
   * @returns {Object} Complete identity info
   */
  getIdentity() {
    const record = this.agentId ? {
      agentId: this.agentId,
      owner: this.agentAddress,
      registryAddress: this.registryAddress
    } : null;

    return {
      name: 'Chimera',
      version: '1.0.0',
      standard: 'ERC-8004',
      chainId: this.chainId,
      network: 'BNB Smart Chain Testnet',
      
      // Registration status
      deployed: !!this.agentId,
      agentId: this.agentId,
      agentAddress: this.agentAddress,
      registryAddress: this.registryAddress,
      
      // Metadata
      metadataURI: this.ipfsHash ? `ipfs://${this.ipfsHash}` : null,
      
      // Capabilities
      capabilities: [
        'Smart Contract Generation',
        'Security Auditing', 
        'Gasless Transaction Execution',
        'DeFi Strategy Research'
      ],
      
      // Trust info
      trustScore: this.calculateTrustScore(),
      trustModels: ['feedback', 'inference-validation'],
      
      // Links
      links: {
        metadata: this.ipfsHash ? `https://gateway.pinata.cloud/ipfs/${this.ipfsHash}` : null,
        registry: `https://testnet.bscscan.com/address/${this.registryAddress}`,
        agent: this.agentId ? `https://testnet.bscscan.com/token/${this.registryAddress}?a=${this.agentId}` : null,
        owner: this.agentAddress ? `https://testnet.bscscan.com/address/${this.agentAddress}` : null
      },

      // Record from chain (if available)
      record
    };
  }

  /**
   * Calculate trust score based on various factors
   * @returns {number} Trust score (0-100)
   */
  calculateTrustScore() {
    let score = 0;

    // Base score for having identity deployed
    if (this.agentId) score += 30;

    // Score for metadata availability
    if (this.ipfsHash) score += 20;

    // Score for verified capabilities
    score += 25; // ChainGPT integration

    // Score for security features
    score += 15; // Audit loop, policy enforcement

    // Score for documentation
    score += 10; // Knowledge base, standards compliance

    return Math.min(score, 100);
  }

  /**
   * Check if identity is deployed
   * @returns {boolean} Deployed status
   */
  isDeployed() {
    return !!this.agentId;
  }

  /**
   * Get metadata URI
   * @returns {string|null} IPFS URI
   */
  getMetadataURI() {
    return this.ipfsHash ? `ipfs://${this.ipfsHash}` : null;
  }

  /**
   * Get deployment status and instructions
   * @returns {Object} Deployment info
   */
  getDeploymentStatus() {
    return {
      status: this.isDeployed() ? 'deployed' : 'pending',
      chainId: this.chainId,
      network: 'BNB Smart Chain Testnet',
      registryAddress: this.registryAddress,
      agentId: this.agentId,
      ipfsHash: this.ipfsHash,
      steps: [
        {
          step: 1,
          title: 'Initialize Service',
          description: 'Service automatically initializes with wallet',
          completed: this.isInitialized
        },
        {
          step: 2,
          title: 'Upload Metadata to IPFS',
          description: 'Upload agent-metadata.json to Pinata',
          completed: this.ipfsHash && this.ipfsHash !== 'QmPENDING',
          action: 'POST /api/identity/upload-metadata'
        },
        {
          step: 3,
          title: 'Register on ERC-8004 Registry',
          description: 'Mint agent identity NFT on BSC Testnet',
          completed: !!this.agentId,
          action: 'POST /api/identity/register'
        },
        {
          step: 4,
          title: 'Verify Registration',
          description: 'Confirm agent ID is stored',
          completed: !!this.agentId,
          action: 'GET /api/identity/status'
        }
      ]
    };
  }
}

// Create singleton instance
export const identity = new IdentityService();
