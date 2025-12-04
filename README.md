# The Sovereign Architect

AI Agent for autonomous DeFi strategy deployment using ChainGPT, Q402, and AWE Network.

## 🎯 Phase 1 Status: COMPLETE ✅

### Completed Components

- ✅ **Project Structure** - Clean, modular architecture
- ✅ **ChainGPT Integration** - Streaming chat, contract generation, auditing
- ✅ **Hono Backend** - SSE streaming endpoints
- ✅ **Blockchain Service** - Context injection (gas prices, block numbers)
- ✅ **Configuration Management** - Environment validation
- ✅ **Validation Suite** - Automated testing

### Test Results

```
✅ Configuration Loading
✅ Blockchain Connection  
✅ Gas Price Fetching
✅ Facilitator Balance (0.3 tBNB)
✅ Blockchain Context Generation
✅ ChainGPT Service Initialization
⚠️  ChainGPT API Query (needs credits)
✅ Context Injection
```

**7/8 tests passing** - Only waiting for ChainGPT hackathon credits allocation.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.9.0
- ChainGPT API key (from https://app.chaingpt.org/)
- Funded BSC testnet wallet (at least 0.05 tBNB)

### Installation

```bash
# Install dependencies
npm install

# Validate setup
npm run validate

# Start development server
npm run dev
```

### Environment Setup

Your `.env` file is already configured with:
- ✅ ChainGPT API Key
- ✅ BSC Testnet RPC
- ✅ Facilitator Wallet (0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9)
- ✅ 0.3 tBNB balance

## 📡 API Endpoints

### Health & Info
- `GET /health` - Health check
- `GET /agent` - Agent information with blockchain status

### Chat & Generation
- `POST /api/chat` - Streaming chat (Server-Sent Events)
- `POST /api/chat/blob` - Non-streaming chat
- `POST /api/generate` - Generate smart contract (SSE)
- `POST /api/audit` - Audit smart contract

### Blockchain
- `GET /api/blockchain` - Current blockchain status
- `GET /api/balance/:address` - Check wallet balance

## 🧪 Testing

### Validate Setup
```bash
npm run validate
```

### Check Balance
```bash
npm run check-balance
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:3000/api/chat/blob \
  -H "Content-Type: application/json" \
  -d '{"message": "What is BNB Chain?"}'
```

### Test Streaming Chat
```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain gas fees"}'
```

## 📁 Project Structure

```
src/
├── config/
│   └── index.js          # Environment configuration
├── services/
│   ├── chaingpt.js       # ChainGPT SDK wrapper
│   └── blockchain.js     # Blockchain interactions
└── index.js              # Main Hono application

scripts/
├── validate-setup.js     # Validation suite
└── setup-env.js          # Environment helper

docs/                     # Documentation
q402-snapshot/            # Q402 protocol implementation
AWEtoAgent-Kit/           # AWE Network SDK
```

## 🔧 Configuration

### ChainGPT API
- **Key**: Configured ✅
- **Credits**: Waiting for hackathon allocation
- **Rate Limit**: 200 requests/minute

### Blockchain
- **Network**: BSC Testnet (Chain ID: 97)
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545
- **Facilitator**: 0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9
- **Balance**: 0.3 tBNB ✅

### Features
- **Payments**: Disabled (Phase 2)
- **Audit Loop**: Enabled
- **Audit Threshold**: 80%

## 🎯 Next Steps (Phase 2)

1. **Get ChainGPT Credits** - Contact hackathon organizers
2. **Test All APIs** - Chat, Generator, Auditor
3. **Integrate Q402** - Payment verification
4. **Build Frontend** - React + Vite + Wagmi
5. **Deploy AWE Identity** - ERC-8004 NFT

## 📝 Notes

### ChainGPT Credits
Your API key is configured but needs hackathon credits. Once allocated:
1. Run `npm run validate` to confirm
2. Test streaming: `npm run dev`
3. Access http://localhost:3000/agent

### Wallet Security
- Private key is in `.env` (gitignored)
- Only use for testnet
- Never commit `.env` to git

## 🐛 Troubleshooting

### "Insufficient credits" error
- Wait for ChainGPT hackathon credits allocation
- Check balance at https://app.chaingpt.org/

### "Cannot connect to blockchain"
- Verify RPC URL is accessible
- Check internet connection
- Try backup RPC: https://bsc-testnet.publicnode.com

### "Facilitator balance too low"
- Current balance: 0.3 tBNB (sufficient)
- Minimum needed: 0.05 tBNB
- Faucet: https://www.bnbchain.org/en/testnet-faucet

## 📚 Documentation

- [Plan](./plan.md) - Full 5-day execution strategy
- [Overview](./overview.md) - Project architecture
- [Bounties](./bounties.md) - Hackathon requirements
- [ChainGPT Docs](./docs/chaingpt_sdk_ref2.md) - SDK reference
- [BSC Testnet](./docs/BSCTest.md) - Network configuration

## 🏆 Hackathon Bounties

### Target Bounties
1. **Quack × ChainGPT Super Web3 Agent** ($20,000)
   - ✅ ChainGPT APIs (Chat, Generator, Auditor)
   - 🔄 Q402 sign-to-pay (Phase 2)
   - ✅ Security features
   - ✅ Testnet/Mainnet ready

2. **AWE Network 800402 Initiative** ($10,000)
   - 🔄 ERC-8004 identity (Phase 2)
   - 🔄 x402 micropayments (Phase 2)
   - ✅ Service architecture

## 📞 Support

- ChainGPT Discord: https://discord.gg/chaingpt
- BNB Chain Discord: https://discord.gg/bnbchain
- AWE Network Docs: https://docs.awenetwork.ai

---

**Built with ❤️ for the BNB Chain Hackathon**

