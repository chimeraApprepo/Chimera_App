# The Sovereign Architect: 5-Day Execution Strategy

## Project Overview

This document outlines the execution strategy for building **"The Sovereign Architect" (Chimera)** for the BNB Chain Hackathon. The goal is to build an AI Agent that can research, architect, audit, and deploy DeFi strategies autonomously, using a unified stack of ChainGPT (Intelligence), Quack Q402 (Execution), and AWE Network (Identity).

- **Target Audience**: A team of 4 developers who are new to Web3 but technically proficient
- **Timeline**: 5 Days (120 Hours)

---

## 1. Team Roles & Responsibilities

### P1: The Brain (Backend & AI Lead)

- **Focus**: Intelligence, Context, & API Handling
- **Primary Tools**: ChainGPT AgenticOS, Bun, Hono, TypeScript
- **Responsibility**: You are building the nervous system. You need to fork the AgenticOS framework and strip out the social media bots to replace them with DeFi logic. Your agent needs to "know" the state of the blockchain (gas prices, block numbers) before it answers.

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

## 2. Web3 Crash Course (Read This First)

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

- **Concept**: Bun is a modern JavaScript runtime that is significantly faster than Node.js. ChainGPT's AgenticOS is built on Bun.
- **Constraint**: You cannot use `npm install`. You must use `bun install`.
- **Link**: [Bun Documentation](https://bun.sh/docs)

### 6. Viem vs. Ethers.js

- **Concept**: Viem is a lightweight, type-safe library for interacting with Ethereum-compatible chains. It is the modern standard, replacing Ethers.js.
- **Constraint**: Do not use Ethers.js unless a specific SDK forces you to.
- **Link**: [Viem Documentation](https://viem.sh)

---

## 3. The 5-Day Execution Schedule

### Day 1: Orientation & Environment Setup

**Goal**: Everyone has a running local environment and understands their tools.

#### P1 (Brain):

1. Install Bun
2. Fork the `ChainGPT-org/AgenticOS` repository
3. Run the "Hello World" example to ensure the local server starts

**Deliverable**: A running Hono server on `localhost:3000`

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

1. Create `src/modules/chainGPT.ts`
2. Implement the API wrapper for ChainGPT's "Web3 LLM"
3. Create a "Context Injection" function that adds the current date and block number to every prompt

**Deliverable**: An API endpoint `/api/chat` that accepts a prompt and returns an AI response

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

## 4. Risk Management (Plan B)

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

---

## 5. Coding Standards for the Team

- **Strict Types**: No `any` in TypeScript. Define interfaces for everything.
- **Environment Variables**: Never commit private keys. Use `.env` files.
- **Comments**: Comment the "Why", not the "How". Explain the business logic for the judges reading the code.
- **Branching**: Push to `feature/your-name` branches. Merge to `main` only after a quick peer review.