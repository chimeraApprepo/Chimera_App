# The Sovereign Architect: 5-Day Execution Strategy

## Project Overview

This document outlines the execution strategy for building **"The Sovereign Architect" (Chimera)** for the BNB Chain Hackathon. The goal is to build an AI Agent that can research, architect, audit, and deploy DeFi strategies autonomously, using a unified stack of ChainGPT (Intelligence), Quack Q402 (Execution), and AWE Network (Identity).

- **Target Audience**: A team of 4 developers who are new to Web3 but technically proficient
- **Timeline**: 5 Days (120 Hours)

---

## 1. Team Roles & Responsibilities

### P1: The Brain (Backend & AI Lead)

- **Focus**: Intelligence, Context, & API Handling
- **Primary Tools**: ChainGPT SDKs (@chaingpt/generalchat, @chaingpt/smartcontractgenerator, @chaingpt/smartcontractauditor), Node.js/Bun, Hono, TypeScript
- **Responsibility**: You are building the nervous system from scratch using ChainGPT SDKs. You will create a reactive web chat backend that responds to user requests (not a proactive social agent). Your agent needs to "know" the state of the blockchain (gas prices, block numbers) before it answers. You will implement streaming responses for real-time user feedback.

### P2: The Hands (DeFi & Contracts Lead)

- **Focus**: Execution, Cryptography, & Security
- **Primary Tools**: Quack Q402 SDK, Viem, Solidity
- **Responsibility**: You are the safety officer. You will handle the "Sign-to-Pay" mechanics where the user signs a policy, and the Agent pays the gas. You must define the cryptographic boundaries (Policies) that prevent the AI from draining user wallets.

### P3: The Face (Frontend & UX Lead)

- **Focus**: User Journey, Trust, & Visuals
- **Primary Tools**: React, Vite, Tailwind CSS, Wagmi
- **Responsibility**: You are the translator. Web3 is scary; your job is to make it look like a modern fintech app. You will build the "Transaction Preview Card" and the "402 Payment" modal that explains costs clearly to the user.

### P4: The Glue (Integration & Commerce Lead)

- **Focus**: Identity, Payments, & Narrative
- **Primary Tools**: AWE Network SDK, IPFS, Video Editing
- **Responsibility**: You are the business architect. You ensure the agent has a verifiable on-chain identity (ERC-8004) and that the system can actually accept payments (x402). You will also produce the final submission video.

---

## 2. Architecture Decision: Build from Scratch vs. Fork AgenticOS

### Why Build from Scratch?

**ChainGPT's AgenticOS** is designed for **autonomous social media agents** (Twitter bots) that operate on a proactive, cron-based schedule. It uses a **push-based** model where the agent initiates actions on its own schedule.

**Our project** requires an **interactive web chat agent** that operates on a reactive, user-initiated model. It uses a **pull-based** model where users send requests and the agent responds.

### Key Architectural Differences

| Feature | AgenticOS (Social Agent) | Our Approach (Web Chat Agent) |
|---------|--------------------------|-------------------------------|
| **Control Flow** | Proactive: Cron-triggered | Reactive: User HTTP requests |
| **State Management** | Stateless: Single timeline | Session-based: Per-user history |
| **Primary Dependency** | Twitter OAuth + API v2 | ChainGPT SDKs + Web3 |
| **Response Model** | Static: Full tweet generation | Streaming: Real-time token flow |
| **Concurrency** | Single agent identity | Multi-user concurrent sessions |
| **Deployment** | Long-running VPS/container | Serverless/edge-compatible |

### Our Technical Stack

We will build using **ChainGPT SDKs** directly:

- **@chaingpt/generalchat**: Web3 LLM with streaming support for chat responses
- **@chaingpt/smartcontractgenerator**: Natural language to Solidity code
- **@chaingpt/smartcontractauditor**: Security analysis and vulnerability detection
- **Node.js/Bun**: Runtime (Bun for performance, but Node.js compatible)
- **Hono**: Lightweight web framework for API routes
- **Next.js (optional)**: Full-stack React framework with API routes as secure proxy

### Benefits of This Approach

1. **Clean Architecture**: Purpose-built for web chat, not retrofitted from social media
2. **Streaming Support**: Token-by-token response streaming for better UX
3. **Secure API Key Management**: Backend proxy prevents client-side key exposure
4. **Standard Patterns**: Uses familiar web development patterns (Express/Next.js style)
5. **Lower Maintenance**: Direct SDK updates via npm/bun, no fork merge conflicts
6. **Multi-user Support**: Native session management for concurrent users

---

## 3. Web3 Crash Course (Read This First)

Since the team is new to Web3, strictly adhere to these definitions.

### 1. Gas & Gas Sponsorship

- **Concept**: Every operation on a blockchain costs computing power, paid in the native token (BNB). Usually, the user pays this.
- **Our Twist**: We are using "Gas Sponsorship." The User signs a permission slip (intent), and the Agent takes that slip to the blockchain and pays the fee for them.
- **Link**: [Ethereum Gas Explained](https://ethereum.org/en/developers/docs/gas/)

### 2. RPC (Remote Procedure Call)

- **Concept**: A node that connects your app to the blockchain. You send JSON requests to it (e.g., "What is the balance of X?").
- **Tool**: We will use public BNB Chain RPC endpoints.
- **Link**: [BNB Chain RPC Docs](https://docs.bnbchain.org/docs/rpc)

### 3. EIP-712 (Typed Structured Data)

- **Concept**: A standard for hashing and signing data so it is readable by the user. Instead of signing a random hex string `0x123...`, the user signs a JSON object like `{ "To": "Agent", "Amount": "5 USDC" }`.
- **Importance**: This is the core of Quack Q402. It prevents phishing by making signatures transparent.
- **Link**: [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)

### 4. x402 (Payment Required)

- **Concept**: A revival of the HTTP 402 status code. When a browser requests a premium resource, the server returns `402 Payment Required`. The browser then prompts the user to pay crypto, and once confirmed, the resource is unlocked.
- **Link**: [HTTP 402 Spec](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)

### 5. Bun vs. Node.js

- **Concept**: Bun is a modern JavaScript runtime that is significantly faster than Node.js, with faster startup times and lower memory footprint.
- **Our Choice**: We use Bun as our package manager and runtime for performance benefits, especially for streaming responses. However, our code remains Node.js compatible.
- **Usage**: Use `bun install` for dependencies and `bun run` for scripts.
- **Link**: [Bun Documentation](https://bun.sh/docs)

### 6. Viem vs. Ethers.js

- **Concept**: Viem is a lightweight, type-safe library for interacting with Ethereum-compatible chains. It is the modern standard, replacing Ethers.js.
- **Constraint**: Do not use Ethers.js unless a specific SDK forces you to.
- **Link**: [Viem Documentation](https://viem.sh)

### 7. ERC-8004 (Trustless Agent Standard)

- **Concept**: An Ethereum standard for creating verifiable on-chain agent identities. It establishes three registries: Identity (NFT passport), Reputation (feedback ledger), and Validation (proof of autonomy).
- **Our Use**: We mint an ERC-8004 NFT for our agent to prove its legitimacy and enable trust scoring.
- **Link**: [ERC-8004 Explained](https://learn.backpack.exchange/article/erc-8004-explained-ethereum-ai-agent-standard-guide-2025)

### 8. x402 Payment Protocol

- **Concept**: A "sign-to-pay" protocol that revives HTTP 402 (Payment Required) for crypto. Agents can programmatically pay for API resources by signing transactions in response to 402 challenges.
- **Our Use**: Our agent accepts x402 micropayments for its services and can also pay for premium data sources.
- **Link**: [x402 Protocol Guide](https://docs.cdp.coinbase.com/x402/docs/how-x402-works)

---

## 4. Essential Resources

### ChainGPT Documentation
- **Main Docs**: https://docs.chaingpt.org
- **SDK Reference**: https://docs.chaingpt.org/chaingpt-ai/sdk-reference
- **Web3 LLM API**: https://docs.chaingpt.org/chaingpt-ai/web3-ai-chatbot-llm-api-sdk
- **Smart Contract Generator**: https://docs.chaingpt.org/chaingpt-ai/smart-contracts-generator-api-sdk
- **Smart Contract Auditor**: https://docs.chaingpt.org/chaingpt-ai/smart-contracts-auditor-api-sdk

### Quack Q402 (Sign-to-Pay on BNB)
- **GitHub Repository**: https://github.com/quackai-labs/Q402
- **Focus**: EIP-712 signatures, policy schemas, facilitator service patterns

### AWE Network (Agent Identity & Economy)
- **Documentation**: https://docs.awenetwork.ai
- **AWEtoAgent Kit**: https://github.com/STPDevteam/AWEtoAgent-Kit
- **Focus**: ERC-8004 deployment, x402 implementation

---

## 5. The 5-Day Execution Schedule

### Day 1: Orientation & Environment Setup

**Goal**: Everyone has a running local environment and understands their tools.

#### P1 (Brain):

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Initialize a new project: `bun init` or set up a Node.js/Express backend
3. Install ChainGPT SDKs:
   ```bash
   bun add @chaingpt/generalchat @chaingpt/smartcontractgenerator @chaingpt/smartcontractauditor
   ```
4. Set up Hono framework: `bun add hono`
5. Create a basic API route that returns "Hello World"
6. Obtain ChainGPT API key from https://app.chaingpt.org and store in `.env`

**Deliverable**: A running API server on `localhost:3000` with ChainGPT SDK successfully imported

#### P2 (Hands):

1. Set up a local Hardhat or Foundry project for testing Solidity contracts
2. Write a script using viem to fetch the latest block number from BNB Testnet
3. Create a "Facilitator Wallet" and fund it with BNB Testnet tokens (via Discord Faucet)

**Deliverable**: A script that logs the current BNB block number

#### P3 (Face):

1. Initialize a Vite + React project with TypeScript
2. Install `wagmi` and `@tanstack/react-query`
3. Configure wagmi to connect to BNB Smart Chain Testnet

**Deliverable**: A web page with a "Connect Wallet" button that works

#### P4 (Glue):

1. Read the AWE Network and Quack documentation thoroughly
2. Create the `agent-metadata.json` file defining the Agent's name and description
3. Upload this JSON to IPFS (using Pinata or similar)

**Deliverable**: An IPFS Hash (CID) representing the Agent's Identity

### Day 2: Core Module Development (Isolation)

**Goal**: Each member builds their primary component in isolation.

#### P1 (Brain):

1. Create `src/services/chainGPT.ts` that wraps the ChainGPT SDKs
2. Implement the `createChatStream` function using `@chaingpt/generalchat` for streaming responses
3. Create a "Context Injection" function that:
   - Fetches current BNB gas price
   - Gets latest block number
   - Adds current timestamp
   - Prepends this context to every user prompt
4. Build `/api/chat` endpoint that:
   - Accepts `{ message: string, history?: Message[] }`
   - Returns a streaming response (Server-Sent Events)
   - Manages conversation context per session

**Deliverable**: A streaming API endpoint `/api/chat` that responds in real-time with Web3-aware answers

#### P2 (Hands):

1. Define the Quack Policy Schema in TypeScript (Zod). This defines what users are allowed to sign (e.g., "Max Spend: 0.1 BNB")
2. Write a signing script that generates a valid EIP-712 signature for a test intent

**Deliverable**: A TypeScript function `generatePolicy(intent)` that returns a valid object

#### P3 (Face):

1. Build the Chat Interface. It needs a scrollable message history and an input box
2. Implement Markdown rendering for the chat bubbles (so code blocks look good)

**Deliverable**: A UI that looks like ChatGPT but with a "DeFi" aesthetic

#### P4 (Glue):

1. Write the `authPayment` middleware function for the backend
2. **Logic**: Check request headers for `X-Payment-Proof`. If missing, return HTTP 402 with the Agent's wallet address

**Deliverable**: A middleware function that blocks requests without payment

### Day 3: The Handshake (Connectivity)

**Goal**: Connect the Frontend to the Backend, and the Backend to the APIs.

#### P1 & P4 (Brain & Glue):

1. Integrate the `authPayment` middleware into the main chat endpoint
2. Verify that the API returns 402 when accessed directly

**Milestone**: The "Payment Wall" is active

#### P2 & P3 (Hands & Face):

1. Connect the Frontend "Sign" button to P2's signing logic
2. When the user clicks "Execute", the frontend should prompt the wallet to sign the specific EIP-712 structure defined on Day 2

**Milestone**: The user can sign a "gasless" intent

### Day 4: Intelligence & Security Loops

**Goal**: Make the agent smart and safe.

#### P1 (Brain):

1. Implement the **Audit Loop**
   - **Logic**: When the LLM generates Solidity code, immediately send it to the ChainGPT "Smart Contract Auditor" API
   - If the Audit Score is < 80, feed the errors back into the LLM and regenerate

**Deliverable**: A self-correcting code generation flow

#### P2 (Hands):

1. Implement the **Facilitator Service**
   - **Logic**: Receive the signature from the frontend → Validate it → Broadcast the transaction to the blockchain using the Agent's funded wallet

**Deliverable**: A backend function that successfully executes a user's intent on-chain

#### P3 (Face):

1. Build the **Transaction Preview Card**
   - **Display**: Safety Score (from P1), Estimated Gas Cost (Paid by Agent), and Policy Limits (from P2)

**Deliverable**: A modal that explains exactly what is happening before the user signs

#### P4 (Glue):

1. Mint the ERC-8004 Identity NFT on BNB Testnet using the IPFS hash from Day 1
2. Update the README with architecture diagrams

**Deliverable**: A verifiable on-chain identity

### Day 5: Polish, Video, & Submission

**Goal**: Package the product for the judges.

#### P1 (Brain):

1. Optimize latency. Add simple caching for common questions
2. Clean up console logs

#### P2 (Hands):

1. **Critical**: Implement the "Mainnet/Testnet" toggle. This is a requirement for the bounty
2. Ensure the Facilitator wallet has enough funds for the judges to test

#### P3 (Face):

1. Visual Polish. Fix spacing, fonts, and mobile responsiveness
2. Add "Loading... Thinking... Auditing..." states to the UI so it feels alive

#### P4 (Glue):

1. **Video Production**: Record a screencast of the "Happy Path": Chat → Pay (x402) → Generate → Audit → Sign → Execute
2. Voiceover explaining the "Chimera" architecture
3. Submit to the Hackathon portal

---

## 6. Key Implementation Details

### Streaming Response Pattern

The ChainGPT General Chat SDK supports streaming, which is critical for good UX:

```typescript
import { createChatStream } from '@chaingpt/generalchat';

// Server-side API route
async function handleChat(req, res) {
  const stream = await createChatStream({
    apiKey: process.env.CHAINGPT_API_KEY,
    messages: req.body.messages,
  });
  
  res.setHeader('Content-Type', 'text/event-stream');
  
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  
  res.end();
}
```

### Context Injection Pattern

Before sending prompts to ChainGPT, inject blockchain state:

```typescript
async function injectContext(userPrompt: string) {
  const gasPrice = await getGasPrice(); // via viem
  const blockNumber = await getBlockNumber();
  
  const context = `[System Context - Current Time: ${new Date().toISOString()}, BNB Chain Block: ${blockNumber}, Gas Price: ${gasPrice} Gwei]`;
  
  return `${context}\n\nUser: ${userPrompt}`;
}
```

### x402 Middleware Pattern

Protect premium endpoints with payment requirements:

```typescript
function x402Middleware(cost: number) {
  return (req, res, next) => {
    const paymentProof = req.headers['x-payment-proof'];
    
    if (!paymentProof) {
      res.status(402).json({
        error: 'Payment Required',
        amount: cost,
        token: 'USDC',
        chain: 'bnb',
        recipient: process.env.AGENT_WALLET_ADDRESS
      });
      return;
    }
    
    // Verify signature (using AWEtoAgent Kit)
    if (verifyX402Payment(paymentProof)) {
      next();
    } else {
      res.status(403).json({ error: 'Invalid payment' });
    }
  };
}
```

---

## 7. Risk Management (Plan B)

### Risk: The AWE or Quack SDKs are broken or undocumented

**Mitigation**:
- **For AWE**: Deploy a standard ERC-721 contract and name it "AWE Identity Prototype". Use this for the demo.
- **For Quack**: If the SDK fails, manually construct the EIP-712 signature using viem (`Account > SignTypedData`). This demonstrates you understand the underlying tech better than using a wrapper.

### Risk: The LLM hallucinates bad code

**Mitigation**:
- Create "Golden Paths". Hardcode 3-4 perfect examples (e.g., "Deploy an ERC-20 Token"). If the user asks for these specific tasks, inject the pre-verified code into the context window.

### Risk: Run out of Testnet BNB

**Mitigation**:
- Set up a "Low Balance Alert" on Discord that pings the team if the Facilitator wallet drops below 0.05 BNB.

### Risk: ChainGPT SDK issues or API rate limits

**Mitigation**:
- Implement caching for repeated queries (use Redis or in-memory cache)
- Set up fallback responses for common questions
- Monitor API usage and implement client-side rate limiting
- Have backup API keys ready

---

## 8. Coding Standards for the Team

- **Strict Types**: No `any` in TypeScript. Define interfaces for everything.
- **Environment Variables**: Never commit private keys. Use `.env` files.
- **Comments**: Comment the "Why", not the "How". Explain the business logic for the judges reading the code.
- **Branching**: Push to `feature/your-name` branches. Merge to `main` only after a quick peer review.