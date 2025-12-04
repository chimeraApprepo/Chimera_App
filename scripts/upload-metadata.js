/**
 * Upload Agent Metadata to IPFS
 * Creates ERC-8004 compatible metadata and uploads to IPFS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read knowledge base
const knowledgeBasePath = path.join(__dirname, '..', 'knowledge_base_chain.txt');
const knowledgeBase = fs.readFileSync(knowledgeBasePath, 'utf8');

// Create ERC-8004 compatible metadata
const metadata = {
  name: "The Sovereign Architect",
  description: "AI Agent for autonomous DeFi strategy deployment on BNB Smart Chain",
  version: "0.1.0",
  
  // Agent capabilities
  capabilities: [
    "Smart Contract Generation",
    "Security Auditing",
    "Gasless Transaction Execution",
    "DeFi Strategy Research",
    "Real-time Blockchain Context"
  ],
  
  // Technical specifications
  specifications: {
    aiProvider: "ChainGPT",
    paymentProtocol: "Q402 (EIP-7702)",
    identityStandard: "ERC-8004",
    supportedChains: ["BNB Smart Chain Testnet", "BNB Smart Chain Mainnet"],
    streamingSupport: true,
    auditLoop: true
  },
  
  // Agent personality/behavior
  behavior: {
    tone: "Professional",
    focus: "Security-first development",
    expertise: ["Solidity", "DeFi", "Smart Contract Security"],
    auditThreshold: 80
  },
  
  // Knowledge base
  knowledgeBase: knowledgeBase,
  
  // Contact/links
  links: {
    github: "https://github.com/your-repo/sovereign-architect",
    documentation: "https://docs.sovereign-architect.ai"
  },
  
  // Metadata standard
  standard: "ERC-8004",
  createdAt: new Date().toISOString()
};

console.log('📦 Agent Metadata Created:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Name: ${metadata.name}`);
console.log(`Version: ${metadata.version}`);
console.log(`Capabilities: ${metadata.capabilities.length}`);
console.log(`Knowledge Base Size: ${knowledgeBase.length} characters`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Save metadata to file
const metadataPath = path.join(__dirname, '..', 'agent-metadata.json');
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
console.log(`✅ Metadata saved to: ${metadataPath}\n`);

console.log('📤 IPFS Upload Instructions:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Option 1: Pinata (https://pinata.cloud)');
console.log('  1. Create free account');
console.log('  2. Upload agent-metadata.json');
console.log('  3. Copy IPFS CID (e.g., QmXxx...)');
console.log('  4. Add to .env: AGENT_IPFS_HASH=QmXxx...\n');

console.log('Option 2: Web3.Storage (https://web3.storage)');
console.log('  1. Create free account');
console.log('  2. Upload agent-metadata.json');
console.log('  3. Copy IPFS CID');
console.log('  4. Add to .env: AGENT_IPFS_HASH=QmXxx...\n');

console.log('Option 3: IPFS Desktop');
console.log('  1. Install IPFS Desktop');
console.log('  2. Add agent-metadata.json');
console.log('  3. Copy CID from file info');
console.log('  4. Add to .env: AGENT_IPFS_HASH=QmXxx...\n');

console.log('After uploading, run: node scripts/deploy-identity.js');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

