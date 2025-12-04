AWE Network Documentation (PRIORITY 2)
A. ERC-8004 Identity Registration
Status: ✅ Basic Structure Available in AWEtoAgent-Kit/packages/identity/

❓ Deployment Flow & Details:

Gas Costs (BNB Testnet):

Deploying new Registry: ~0.02 - 0.05 BNB (depending on constructor complexity).

Minting Identity (Register Agent): ~0.0005 - 0.002 BNB.

Note: BNB Testnet gas is negligible, but keep at least 0.1 tBNB in your deployer wallet to avoid "out of gas" errors during contract creation.

Contract Addresses (BNB Attestation Service - BAS):

Use these official BAS contracts as your ERC-8004 primitives on BNB Chain.

BSC Testnet (Chain ID: 97):

BAS Core (Identity): 0x6c2270298b1e6046898a322acB3Cbad6F99f7CBD

Schema Registry: 0x08C8b8417313fF130526862f90cd822B55002D72

BSC Mainnet (Chain ID: 56):

BAS Core (Identity): 0x247Fe62d887bc9410c3848DF2f322e52DA9a51bC

Schema Registry: 0x5e905F77f59491F03eBB78c204986aaDEB0C6bDa

Required Metadata Format (JSON):

This JSON must be uploaded to IPFS. The tokenURI of your agent's NFT will point to this hash.

JSON

{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Agent Name",
  "description": "Agent description...",
  "image": "ipfs://<IMAGE_HASH>",
  "external_url": "https://your-agent-site.com",
  "endpoints": [
    {
      "name": "A2A",
      "endpoint": "https://your-agent-api.com/v1/chat",
      "version": "1.0.0"
    }
  ],
  "supportedTrust": ["reputation", "validation"]
}
IPFS Integration Details:

Upload: You do not need a specialized AWE gateway. Use standard IPFS pinning services (Pinata, Web3.storage, or local Kubo node).

URI Format: Must be stored on-chain as ipfs://<CID> (not https://ipfs.io/...).

B. x402 Market Integration
Status: ❓ Missing specific API docs for x402.world.fun. Note: "x402" generally refers to the HTTP 402 Payment Protocol (championed by Coinbase). The following standardizes that flow for your agent.

How to Register an Agent:

There is no central "registration" for x402 itself. Your agent becomes an "x402 Server" by returning 402 Payment Required headers on its API endpoints.

Discovery: You register your agent's URL (the one returning 402s) inside your ERC-8004 Metadata (under endpoints). This is how the market finds you.

Payment Acceptance Flow (The "Handshake"):

Client Request: Client POSTs to https://your-agent.com/ask.

Server Response: Returns HTTP 402 status code.

Header: WWW-Authenticate: x402 chain=97 token=<USDT_ADDR> amount=1.0

Client Action: Signs a payment transaction (EIP-712 or raw tx).

Client Retry: Re-sends request with header: Authorization: x402 <SIGNED_TX_DATA>.

Server Action: Submits tx to chain (Facilitator) -> Verifies success -> Returns Answer (HTTP 200).

Token Creation/Issuance:

Standard: Use standard USDT (Testnet) for payments to ensure compatibility.

Custom Service Token: If issuing your own AGENT token:

Deploy standard ERC-20 on BSC Testnet.

Configure your agent's 402 response to demand this token address.

Service Token Economics:

Model: Pay-Per-Request (Microtransactions).

Rate: Set your endpoint price (e.g., 0.1 AGENT per prompt) in your agent's config, not on-chain.