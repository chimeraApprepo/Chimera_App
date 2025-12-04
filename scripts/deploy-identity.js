/**
 * Deploy ERC-8004 Agent Identity
 * Registers agent on BNB Attestation Service
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ERC-8004 BAS Registry ABI (simplified)
const BAS_ABI = [
  'function register(string memory metadataURI) external returns (uint256)',
  'function getAgentInfo(uint256 agentId) external view returns (address owner, string memory metadataURI, uint256 timestamp)',
  'function totalAgents() external view returns (uint256)'
];

async function deployIdentity() {
  console.log('🆔 Deploying ERC-8004 Agent Identity');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check for IPFS hash
  const ipfsHash = process.env.AGENT_IPFS_HASH;
  if (!ipfsHash || ipfsHash === 'QmPENDING') {
    console.error('❌ Error: AGENT_IPFS_HASH not set in .env');
    console.log('\nPlease run: node scripts/upload-metadata.js');
    console.log('Then upload the metadata to IPFS and update .env\n');
    process.exit(1);
  }

  // Setup provider and wallet
  const rpcUrl = process.env.BNB_RPC_URL;
  const privateKey = process.env.FACILITATOR_PRIVATE_KEY;
  const registryAddress = process.env.ERC8004_REGISTRY_ADDRESS;

  if (!rpcUrl || !privateKey || !registryAddress) {
    console.error('❌ Error: Missing required environment variables');
    console.log('Required: BNB_RPC_URL, FACILITATOR_PRIVATE_KEY, ERC8004_REGISTRY_ADDRESS\n');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log(`Wallet: ${wallet.address}`);
  console.log(`Registry: ${registryAddress}`);
  console.log(`IPFS Hash: ${ipfsHash}\n`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const bnb = ethers.formatEther(balance);
  console.log(`Balance: ${bnb} BNB`);
  
  if (parseFloat(bnb) < 0.01) {
    console.error('❌ Error: Insufficient balance for deployment');
    console.log('Need at least 0.01 BNB for gas fees\n');
    process.exit(1);
  }

  try {
    // Connect to registry
    const registry = new ethers.Contract(registryAddress, BAS_ABI, wallet);
    
    // Create metadata URI
    const metadataURI = `ipfs://${ipfsHash}`;
    
    console.log('\n📝 Registering agent...');
    console.log(`Metadata URI: ${metadataURI}\n`);

    // Register agent
    const tx = await registry.register(metadataURI);
    console.log(`Transaction sent: ${tx.hash}`);
    console.log('Waiting for confirmation...\n');

    const receipt = await tx.wait();
    console.log('✅ Agent registered successfully!\n');
    
    console.log('Transaction Details:');
    console.log(`  Block: ${receipt.blockNumber}`);
    console.log(`  Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`  Transaction: ${receipt.hash}\n`);

    // Try to get agent ID from events (if available)
    // In a real implementation, parse the event logs to get the agent ID
    console.log('📋 Next Steps:');
    console.log('1. Add AGENT_ID to .env (check transaction logs for the ID)');
    console.log(`2. Verify on BscScan: https://testnet.bscscan.com/tx/${receipt.hash}`);
    console.log('3. View metadata: https://ipfs.io/ipfs/' + ipfsHash);
    console.log('\n✨ Identity deployment complete!');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\nNeed more BNB for gas. Get testnet BNB from faucets.');
    } else if (error.message.includes('execution reverted')) {
      console.log('\nContract execution reverted. Check if:');
      console.log('- Registry address is correct');
      console.log('- You have permission to register');
      console.log('- Agent is not already registered');
    }
    
    process.exit(1);
  }
}

// Run deployment
deployIdentity().catch(console.error);

