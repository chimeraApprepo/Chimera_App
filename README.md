# 🦁 CHIMERA

Contract Address : 
https://chimera.onl
https://x.com/chimeradotonl

### The Autonomous AI Agent for Smart Contract Development

> **An AI-powered platform that generates, audits, and deploys smart contracts with gas-sponsored execution and verifiable on-chain identity.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Railway-blueviolet)](https://)
[![ChainGPT](https://img.shields.io/badge/AI-ChainGPT-00D395)](https://chaingpt.org)
[![x402](https://img.shields.io/badge/Payments-x402_Protocol-6366f1)](https://github.com/quackai-labs/Q402)

---

## 🎯 Quick Start for Judges

### Step 1: Access the Platform

1. **Visit the live demo**: 
2. **Enter the authorization code** when prompted (provided separately)

### Step 2: Get Test Funds (One Click!)

Once connected, you'll see a **"Judge / Demo Mode"** card:
- No faucet hunting required!

### Step 3: Explore Features

| Feature | What to Test | Expected Result |
|---------|--------------|-----------------|

| **🏗️ Generate** | "Create a simple ERC-20 token" | Code generation → Audit loop → Deploy |
| **🛡️ Audit** | Paste any Solidity code | Security score + vulnerability report |
| **🔍 Analyze** | Enter any contract address | Source code + transaction analysis |

| **💸 Transfer** | Send tokens to any address | Gas-sponsored transfer |

---

## 🏆 Bounty Compliance

### Bounty #1: AWE Network 800402 Initiative ($10,000)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| ERC-8004 Agent Identity | ✅ | Registered on Base Sepolia ([View](https://sepolia.basescan.org)) |
| x402 Micropayments | ✅ | HTTP 402 payment challenges + EIP-712 signatures |
| Service Token | ✅ | CHIM (Chimera Credit) token for service payments |
| AWEtoAgent Kit | ✅ | Full integration for identity + payments |
| Working Demo | ✅ | Live on Railway with complete payment flow |

**Key Contract Addresses:**
- **Agent Identity (ERC-8004)**: `0x8004AA63c570c570eBF15376c0dB199918BFe9Fb` (Base Sepolia)
- **Agent ID**: `1581`

---

### Bounty #2: Quack × ChainGPT Super Web3 Agent ($20,000)

#### ✅ Required ChainGPT APIs (Minimum 2)

| API | Status | Usage |
|-----|--------|-------|
| **Web3 LLM** | ✅ | Blockchain-aware chat responses |
| **Smart Contract Generator** | ✅ | Natural language → Solidity code |
| **Smart Contract Auditor** | ✅ | AI-powered vulnerability detection |

#### ✅ Required Quack Q402 Implementation

| Feature | Status | Details |
|---------|--------|---------|
| Real Sign-to-Pay | ✅ | EIP-712 typed data signatures |
| Payment Verification | ✅ | Server-side signature validation |


#### ✅ Must-Have Features

**Core Functionality:**
- ✅ **Chat UI** - Modern streaming interface with markdown support
- ✅ **Research + Explain** - ChainGPT-powered blockchain education
- ✅ **Contract Generation** - Natural language to Solidity
- ✅ **AI Audit** - Self-correcting audit loop (≥80% threshold)
- ✅ **Multiple Actions**: Transfer, Swap, Deploy, Contract Call

**Security Features:**
- ✅ **Spend Caps** - Policy-enforced transaction limits
- ✅ **Allow/Deny Lists** - Configurable contract restrictions
- ✅ **Transaction Preview** - Full transparency before signing
- ✅ **Risk Warnings** - Clear vulnerability communication
- ✅ **Transaction Log** - Complete activity history in wallet

**Configuration:**
- ✅ **Testnet/Mainnet Toggle** - Environment-based switching

---

## 🛠️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CHIMERA PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React +   │  │    Hono     │  │    │  │
│  │    Vite     │──│   Backend   │──│      Testnet        │  │
│  │  Frontend   │  │   (Node)    │  │    (Chain ID: 97)   │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────┘  │
│         │                │                    │              │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────────▼───────────┐  │
│  │   Wagmi +   │  │  ChainGPT   │  │    Facilitator      │  │
│  │  MetaMask   │  │    APIs     │  │  (Gas Sponsorship)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                    │              │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌─────────▼───────────┐  │
│  │    x402     │  │   Audit     │  │   ERC-8004 Agent    │  │
│  │  Payments   │  │    Loop     │  │     Identity        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React + Vite | Modern SPA with hot reload |
| **Wallet** | Wagmi + viem | Type-safe Web3 interactions |
| **Backend** | Hono + Node.js | Lightweight, edge-compatible API |
| **AI** | ChainGPT SDK | Web3-native language model |
| **Blockchain** | Ethers.js | Contract deployment & transactions |
| **Identity** | AWE Network | ERC-8004 agent NFT |
| **Payments** | Q402 Protocol | x402 micropayments |
| **Hosting** | Railway | Containerized deployment |

---

## 💰 CHIM Token Economy

Chimera uses **CHIM (Chimera Credit)** as its native service token:

| Service | Cost (CHIM) | Description |
|---------|-------------|-------------|
| Generate Contract | 10 | AI code generation + audit loop |
| Security Audit | 5 | Vulnerability analysis |
| Contract Analysis | 3 | Deployed contract inspection |
| Token Swap | 2 | PancakeSwap execution |
| Gas-Free Transfer | 1 | Sponsored token transfer |
| AI Chat | 0.1 | Per message |

**How to Get CHIM:**
1. Use the "Judge Faucet" for free test funds
2. Buy with USDC via x402 payment flow
3. Receive bonus credits for first-time users

---

## 🔐 Security Features

### Audit Loop (Self-Correcting AI)

```
User Prompt → Generate Code → Audit Code → Score ≥ 80%? 
                    ↑                           │
                    └── Regenerate with fixes ←─┘ (if score < 80%)
```

The audit loop ensures all generated contracts meet security standards:
- **Max 3 iterations** to prevent infinite loops
- **Detailed feedback** on each iteration
- **Visual progress** in the UI

### Transaction Safety

- **Preview all transactions** before signing
- **Spend limits enforced** per transaction and daily
- **Clear risk indicators** for high-value operations
- **One-click cancellation** at any step

### Authorization Gate

- **Access code required** to enter the platform
- **Session-based** (clears on browser close)
- **Server-side validation** (code never exposed to client)

---

## 📡 API Endpoints

### Public Endpoints

```bash
GET  /health                    # Health check
GET  /agent                     # Agent info + blockchain status
GET  /.well-known/agent-metadata.json  # A2A protocol metadata
```

### Chat & AI

```bash
POST /api/chat                  # Streaming chat (SSE)
POST /api/chat/blob             # Non-streaming chat
POST /api/generate              # Contract generation (SSE)
POST /api/audit                 # Security audit
```

### Blockchain Operations

```bash
POST /api/contract/create       # Full generate → audit → deploy
POST /api/contract/compile      # Compile Solidity
POST /api/contract/deploy       # Deploy bytecode
POST /api/contract/ingest       # Analyze deployed contract
POST /api/transfer              # Transfer tokens
POST /api/swap/execute          # Execute swap
```

### CHIM Credits

```bash
GET  /api/credits/pricing       # Service pricing
GET  /api/credits/balance/:addr # User balance
POST /api/credits/buy           # Buy with x402 payment
POST /api/credits/spend         # Spend for service
```

### Judge/Demo

```bash
GET  /api/faucet/status         # Faucet balance
POST /api/faucet/drip           # Get test funds
```

---

## 🚀 Local Development

### Prerequisites

- Node.js >= 20.9.0
- MetaMask wallet


### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/chimera.git
cd chimera

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Create environment file
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```bash
# Required
CHAINGPT_API_KEY=your_chaingpt_api_key

FACILITATOR_WALLET_ADDRESS=0x...
FACILITATOR_PRIVATE_KEY=0x...

# Optional
AUTH_ACCESS_CODE=your_secret_code
CHIM_DEMO_MODE=true
NODE_ENV=development
```

### Run Locally

```bash
# Start backend (port 3000)
npm run dev

# In another terminal, start frontend
cd frontend && npm run dev
```

### Build for Production

```bash
# Build frontend
cd frontend && npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
├── src/
│   ├── index.js              # Main Hono server
│   ├── config/               # Environment configuration
│   ├── services/
│   │   ├── chaingpt.js       # ChainGPT SDK integration
│   │   ├── blockchain.js     # Web3 interactions
│   │   ├── facilitator.js    # Gas sponsorship
│   │   ├── credits.js        # CHIM token management
│   │   ├── auditLoop.js      # Self-correcting audit
│   │   └── ...
│   ├── middleware/
│   │   └── q402.js           # x402 payment middleware
│   └── routes/
│       └── faucet.js         # Judge faucet endpoints
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client
│   │   └── config/           # Wagmi configuration
│   └── ...
│
├── q402-snapshot/            # Q402 protocol implementation
├── AWEtoAgent-Kit/           # AWE Network SDK (reference)
├── contracts/                # Solidity contracts (CHIM token)
└── Dockerfile                # Railway deployment
```

---

## 🎬 Demo Walkthrough

### 1. Authentication
- Visit the platform URL
- Enter the provided authorization code

### 2. Get Test Funds
- Click "🎁 Get Free Test Funds"

- Check wallet to confirm

### 3. Generate a Contract
- Navigate to "Generate"
- Enter: "Create a simple ERC-20 token called TestCoin with 1 million supply"
- Watch the audit loop in real-time
- Preview the generated code
- Click "Deploy" (gas-free!)

### 4. Audit a Contract
- Navigate to "Audit"
- Paste any Solidity code OR enter a contract address
- Receive security score + detailed report

### 5. Use AI Chat
- Navigate to "Chat"
- Ask blockchain questions
- Get real-time streaming responses

---

## 🏅 What Makes Chimera Special

1. **Complete Integration** - ChainGPT + Q402 + AWE in one platform
2. **Self-Correcting AI** - Audit loop ensures code quality
3. **Gas-Free for Users** - Facilitator sponsors all transactions
4. **Production Ready** - Deployed on Railway, not just localhost
5. **Judge-Friendly** - One-click faucet, no setup required
6. **Beautiful UX** - Modern fintech-style interface
7. **Full Transparency** - Transaction previews, risk warnings, activity logs

---

## 📞 Support & Links

- **ChainGPT Docs**: https://docs.chaingpt.org
- **Q402 Protocol**: https://github.com/quackai-labs/Q402
- **AWE Network**: https://docs.awenetwork.ai

---

## 📜 License



---

<p align="center">
  <img src="https://img.shields.io/badge/Made_for-BNB_Chain_Hackathon-F0B90B?style=for-the-badge" />
</p>
