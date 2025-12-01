# The Sovereign Architect: Plain English Overview

## 1. What is it?

Imagine if ChatGPT could do more than just write text. Imagine if it could actually build a financial app for you, check it for safety, and launch it onto the blockchain, all while you just watch.

That is what we are building. We call it **"The Sovereign Architect"** (or **Chimera**).

It is an AI agent that lives on the blockchain. You tell it what you want (e.g., "Make a savings account for my friends"), and it writes the code, audits it for bugs, and deploys it online for you.

---

## 2. Why do we need it?

Right now, doing anything in crypto is really hard and dangerous:

### The Problems

**Coding is hard**: If you make one typo in your code, you can lose all your money.

**Fees are annoying**: You constantly have to worry about "Gas" (transaction fees) and having the right tokens.

**Trust issues**: How do you know an AI agent isn't trying to scam you?

Our project fixes these three problems.

---

## 3. How does it work?

We are combining three specific technologies to make an autonomous agent. Think of it like a human body:

### The Brain: ChainGPT

**What it does**: This is the intelligence layer. It's an AI that has been trained specifically on blockchain and smart contract code.

**The task**: When you ask for something, ChainGPT figures out how to build it. It writes the code and then checks its own work to make sure there are no bugs.

### The Hands: Quack Q402

**What it does**: This handles the execution layer.

**The task**: Usually, you have to pay "gas fees" to do anything on the blockchain. With Quack, you just sign a digital "permission slip" that says "I approve this." The agent then takes that slip and pays the fees for you. You don't spend your own crypto for the transaction fee.

### The ID Card: AWE Network

**What it does**: This provides verifiable identity and monetization.

**The task**: Anyone can make an agent. AWE gives our agent a verifiable on-chain identity (like a blue checkmark) that lives on the blockchain. It proves the agent has a legitimate identity and enables it to accept payments for its services.

---

## 4. The User Flow

Here is exactly what the user will see, step-by-step:

### Step 1: The Chat
You type: "Create a token called 'PizzaCoin' with a supply of 1 million."

### Step 2: The Paywall
The agent responds: "Sure! That will cost $5. Please pay here." (This proves the agent can monetize its services)

### Step 3: The Thinking
You see the agent working: "Writing code... Checking for vulnerabilities... Optimizing..."

### Step 4: The Preview
The agent shows you a simple card:

- **Action**: Deploy PizzaCoin
- **Safety Score**: 100% Safe
- **Gas Cost**: $0 (Gas is sponsored by the agent)
- **Policy**: Max spend limit enforced

### Step 5: The Sign
You click "Execute." A wallet prompt appears asking you to sign. You sign it (without paying fees).

### Step 6: Done
The agent launches your token and provides the contract address.

---

## 5. Why this approach wins

Most other teams will build an agent that just "chats." Our agent executes real actions.

### Key Differentiators

**We handle Safety**: ChainGPT audits all generated code before execution.

**We handle Fees**: Quack Q402 enables gas-sponsored transactions.

**We handle Trust**: AWE Network provides verifiable on-chain identity.

**We handle Monetization**: x402 micropayments enable the agent to earn revenue.

It's a complete product, not just a prototype.

---

## Technical Architecture

### Why Not Fork AgenticOS?

**ChainGPT's AgenticOS** is a specialized framework for autonomous social media agents (Twitter bots). It's designed for a fundamentally different use case:

| AgenticOS (Twitter Bot) | Our Agent (Web Chat) |
|-------------------------|----------------------|
| **Proactive**: Wakes up on schedule (cron) | **Reactive**: Responds to user requests |
| **Single User**: One agent identity | **Multi-user**: Concurrent sessions |
| **Twitter-coupled**: OAuth, rate limits, tweet formatting | **Web3-native**: Wallet auth, blockchain interactions |
| **Static Output**: Full tweets | **Streaming**: Real-time token delivery |
| **Long-running**: VPS/container deployment | **Serverless**: Edge-compatible |

Forking AgenticOS would require removing its core features (scheduler, Twitter OAuth, single-user state) and inverting its control flow. This is an **architectural anti-pattern**—like trying to turn a cruise ship into a speedboat.

### Architecture Decision: Build from Scratch

Instead, we are **building from first principles** using ChainGPT SDKs. This gives us:

- **Reactive Architecture**: User-initiated requests (pull-based), not autonomous scheduling (push-based)
- **Streaming Support**: Real-time token-by-token responses for better UX
- **Clean Codebase**: Purpose-built for web chat, not retrofitted from social media bots
- **Standard Patterns**: Familiar web development patterns (Next.js/Express style)

### Frontend Layer
- **Framework**: React + Vite + TypeScript
- **Wallet Integration**: Wagmi for BNB Chain connections
- **UI/UX**: Modern fintech-style interface with Tailwind CSS
- **Real-time**: Server-Sent Events (SSE) for streaming AI responses
- **Components**:
  - Chat interface with markdown rendering
  - Transaction preview cards with safety scores
  - x402 payment modals
  - Policy configuration UI

### Intelligence Layer (ChainGPT SDKs)

We use ChainGPT's SDK ecosystem directly:

#### 1. General Chat SDK (`@chaingpt/generalchat`)
- **Purpose**: Web3-aware conversational AI
- **Key Feature**: Token streaming via `createChatStream`
- **Context**: Injected with real-time blockchain state (gas prices, block numbers)

#### 2. Smart Contract Generator SDK (`@chaingpt/smartcontractgenerator`)
- **Purpose**: Natural language → Solidity code
- **Output**: Compilable smart contracts with syntax highlighting
- **Integration**: Returns code blobs that frontend renders in editor

#### 3. Smart Contract Auditor SDK (`@chaingpt/smartcontractauditor`)
- **Purpose**: Security vulnerability detection
- **Output**: Structured JSON reports (High/Medium/Low severity)
- **Flow**: Auto-audit generated code before deployment

### Backend Layer

- **Runtime**: Bun (for performance) with Node.js compatibility
- **Framework**: Hono (lightweight web framework)
- **API Structure**:
  - `/api/chat` - Streaming chat endpoint
  - `/api/generate` - Contract generation
  - `/api/audit` - Security analysis
  - `/api/execute` - Transaction facilitation

- **Security**:
  - API keys stored in environment variables (never client-side)
  - Backend acts as secure proxy to ChainGPT
  - Rate limiting per user session
  - x402 payment middleware

### Economic Layer (AWE Network)

- **ERC-8004 Identity**: Verifiable on-chain agent NFT
- **x402 Protocol**: Sign-to-pay for agent services
  - Programmatic payment challenges (HTTP 402)
  - EIP-712 typed signature verification
  - Automatic payment settlement via facilitator
- **AWEtoAgent Kit**: Middleware for payment flow integration

### Blockchain Layer

- **Network**: BNB Smart Chain (testnet and mainnet toggle)
- **Library**: Viem (type-safe blockchain interactions)
- **Components**:
  - Smart contract deployment
  - Transaction broadcasting
  - Gas price monitoring
  - Facilitator service for gas sponsorship

### Execution Flow (Sign-to-Pay)

1. **User Intent**: User requests contract deployment
2. **AI Generation**: ChainGPT generates and audits Solidity code
3. **Policy Creation**: Backend creates EIP-712 policy with spend caps
4. **User Signs**: Wallet prompts for signature (no gas required)
5. **Facilitator Executes**: Backend validates signature and broadcasts transaction
6. **Confirmation**: User receives contract address

### Security Architecture

- **EIP-712 Structured Signing**: Human-readable transaction data
- **Policy Enforcement**:
  - Maximum spend limits per transaction
  - Allow/deny lists for contract interactions
  - Time-based restrictions
- **Audit Loop**: Self-correcting code generation (score threshold: 80%)
- **Transaction Preview**: Full transparency before signing
- **Risk Warnings**: Clear communication of potential issues

---

## Implementation Guide

### Quick Start Setup

```bash
# Initialize project
bun init

# Install ChainGPT SDKs
bun add @chaingpt/generalchat @chaingpt/smartcontractgenerator @chaingpt/smartcontractauditor

# Install web framework
bun add hono

# Install blockchain libraries
bun add viem wagmi

# Install AWE Network Kit
git clone https://github.com/STPDevteam/AWEtoAgent-Kit lib/awe
```

### Environment Configuration

```bash
# .env file
CHAINGPT_API_KEY=your_api_key_here
BNB_RPC_URL=https://bsc-testnet.public.blastapi.io
AGENT_PRIVATE_KEY=your_agent_wallet_key
AGENT_WALLET_ADDRESS=0x...
ERC8004_NFT_ID=123
```

### Core Implementation Patterns

#### 1. Streaming Chat Response

```typescript
import { createChatStream } from '@chaingpt/generalchat';

async function handleChat(req, res) {
  // Inject blockchain context
  const context = await getBlockchainContext();
  const messages = [
    { role: 'system', content: context },
    ...req.body.messages
  ];
  
  // Stream response
  const stream = await createChatStream({
    apiKey: process.env.CHAINGPT_API_KEY,
    messages
  });
  
  res.setHeader('Content-Type', 'text/event-stream');
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
}
```

#### 2. Contract Generation with Auto-Audit

```typescript
import { generateContract } from '@chaingpt/smartcontractgenerator';
import { auditContract } from '@chaingpt/smartcontractauditor';

async function generateSafeContract(prompt: string) {
  let code = await generateContract({ prompt });
  let audit = await auditContract({ code });
  
  // Self-correcting loop
  while (audit.score < 80 && retries < 3) {
    code = await generateContract({ 
      prompt: `${prompt}\n\nFix these issues: ${audit.issues}` 
    });
    audit = await auditContract({ code });
  }
  
  return { code, audit };
}
```

#### 3. x402 Payment Middleware

```typescript
function requirePayment(amount: number, token: string) {
  return async (req, res, next) => {
    const proof = req.headers['x-payment-proof'];
    
    if (!proof) {
      return res.status(402).json({
        error: 'Payment Required',
        amount,
        token,
        chain: 'bnb',
        recipient: process.env.AGENT_WALLET_ADDRESS
      });
    }
    
    // Verify signature using AWEtoAgent Kit
    const valid = await verifyX402Signature(proof);
    if (valid) next();
    else res.status(403).json({ error: 'Invalid payment' });
  };
}
```

---

## Target Bounties

This project is designed to qualify for both major bounties:

1. **AWE Network 800402 Initiative** ($10,000)
   - ERC-8004 agent identity
   - x402 micropayments
   - Service token monetization

2. **Quack × ChainGPT Super Web3 Agent** ($20,000)
   - ChainGPT LLM + Auditor integration
   - Quack Q402 sign-to-pay
   - Policy-protected execution
   - Complete security features

---

## Success Metrics

To demonstrate a winning submission, we need:

1. Working end-to-end demo
2. Real x402 payment flow
3. Live smart contract generation and audit
4. Gas-sponsored transaction execution
5. Verifiable on-chain agent identity
6. Professional demo video (2-3 minutes)
7. Clean, documented GitHub repository
8. Testnet and mainnet toggle

