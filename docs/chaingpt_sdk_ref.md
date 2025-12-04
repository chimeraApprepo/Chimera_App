# ChainGPT Developer Documentation & SDK Reference

This document contains the comprehensive reference for integrating ChainGPT's AI infrastructure, including the JavaScript SDK (`@chaingpt/generalchat`), REST API, and Solidity LLM.

## Table of Contents
1. [Overview](#1-overview-and-core-products)
2. [QuickStart (Tech-Team Verified)](#2-quickstart-tech-team-verified)
3. [JavaScript/TypeScript SDK Reference](#3-javascripttypescript-sdk-reference)
4. [REST API Reference](#4-rest-api-reference)
5. [Advanced Configuration (Context & Tone)](#5-advanced-configuration-context--tone)
6. [Solidity LLM (Python/HuggingFace)](#6-solidity-llm-pythonhuggingface)
7. [Pricing & Limits](#7-pricing--limits)

---

## 1. Overview and Core Products

ChainGPT provides AI infrastructure specialized for Web3.
* **Web3 AI Chatbot:** Domain-specific LLM for crypto/blockchain.
* **Smart Contract Generator/Auditor:** Automated Solidity generation and vulnerability scanning.
* **AI NFT Generator:** Text-to-image models (VeloGen, NebulaForge).
* **Solidity LLM:** Open-source 2B parameter model for code generation.



[Image of ChainGPT API integration architecture diagram]


---

## 2. QuickStart (Tech-Team Verified)

**Prerequisite:** Obtain an API Key from the ChainGPT AI Hub.

### Installation
```bash
npm install @chaingpt/generalchat
# or
yarn add @chaingpt/generalchat
SDK: Basic Usage (Node.js)
JavaScript

import { GeneralChat } from "@chaingpt/generalchat";

// Initialize
const chat = new GeneralChat({ 
  apiKey: process.env.CHAINGPT_API_KEY 
});

// 1. Stream Response (Recommended)
const stream = await chat.createChatStream({
  question: "Summarise the last BTC block.",
  chatHistory: "off"
});
for await (const chunk of stream) {
  process.stdout.write(chunk);
}

// 2. Blob Response (Single JSON)
const res = await chat.createChatBlob({
  question: "What is ChainGPT?",
  chatHistory: "off"
});
console.log(res.data.bot);
REST API: Basic Usage (cURL)
Endpoint: POST https://api.chaingpt.org/chat/stream (Note: Single endpoint for both streaming and blob responses)

Bash

# Streaming Request
curl -N -X POST [https://api.chaingpt.org/chat/stream](https://api.chaingpt.org/chat/stream) \
  -H "Authorization: Bearer $CHAINGPT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "model":"general_assistant",
        "question":"Give me the latest ETH stats.",
        "chatHistory":"off"
      }'
3. JavaScript/TypeScript SDK Reference
Package: @chaingpt/generalchat

Initialization
TypeScript

const generalchat = new GeneralChat({
  apiKey: string; // Required
});
Methods
createChatStream(options)
Returns a Node.js ReadableStream (or async iterator).

options: Request configuration object (see Configuration Options below).

Usage: Real-time text generation (typing effect).

createChatBlob(options)
Returns a Promise that resolves to the full JSON response.

options: Request configuration object.

Usage: Non-interactive responses or batch processing.

getChatHistory(options)
Retrieves past conversations.

TypeScript

const history = await generalchat.getChatHistory({
  limit: 10,
  offset: 0,
  sortBy: "createdAt",
  sortOrder: "ASC",
  sdkUniqueId: "optional-user-uuid" 
});
Error Handling
The SDK throws GeneralChatError for API issues.

TypeScript

import { GeneralChat, Errors } from '@chaingpt/generalchat';

try {
  // ... api call
} catch (error) {
  if (error instanceof Errors.GeneralChatError) {
    console.error("SDK Error:", error.message);
  }
}
4. REST API Reference
Base URL: https://api.chaingpt.org Endpoint: POST /chat/stream

Headers
Authorization: Bearer <YOUR_API_KEY>

Content-Type: application/json

Request Body Schema
JSON

{
  "model": "general_assistant",    // Required
  "question": "User query here",   // Required
  "chatHistory": "off",            // "on" or "off" (Default: "off")
  "sdkUniqueId": "user-123",       // Optional: Unique user ID for history context
  "useCustomContext": false,       // Optional: Enable context injection
  "contextInjection": { ... }      // Optional: Custom data object
}
Response Formats
Buffered (Default): Returns full JSON.

JSON

{
  "status": true,
  "data": { "bot": "Response text..." }
}
Streaming: Returns chunked text data directly (no JSON wrapper).

5. Advanced Configuration (Context & Tone)
To customize the bot's persona or knowledge base per request, use contextInjection.

Enabling Context
Set useCustomContext: true in your request options.

contextInjection Object Structure
This object overrides the default settings from the AI Hub.

TypeScript

const contextInjection = {
  // --- Identity ---
  companyName: "My Project Name",
  companyDescription: "A decentralized exchange for...",
  companyWebsiteUrl: "[https://example.com](https://example.com)",
  whitePaperUrl: "[https://example.com/docs](https://example.com/docs)",
  purpose: "Support assistant for My Project",
  
  // --- Token Info (If Applicable) ---
  cryptoToken: true,
  tokenInformation: {
    tokenName: "Example Token",
    tokenSymbol: "$EXT",
    tokenAddress: "0x123...",
    tokenSourceCode: "[https://github.com/](https://github.com/)...",
    tokenAuditUrl: "https://...",
    blockchain: ["ETHEREUM", "BSC", "POLYGON"] // See Enum below
  },

  // --- Socials ---
  socialMediaUrls: [
    { name: "Twitter", url: "[https://twitter.com/](https://twitter.com/)..." }
  ],

  // --- Tone & Personality ---
  // Option A: Preset Tone
  aiTone: "PRE_SET_TONE",
  selectedTone: "FRIENDLY", // See Enum below

  // Option B: Custom Tone
  // aiTone: "CUSTOM_TONE",
  // customTone: "Speak like a pirate."
};
Enums
Supported Blockchains: ETHEREUM, BSC, ARBITRUM, BASE, BLAST, AVALANCHE, POLYGON, SCROLL, OPTIMISM, LINEA, ZKSYNC, POLYGON_ZKEVM, GNOSIS, FANTOM, MOONRIVER, MOONBEAM, BOBA, METIS, LISK, AURORA, SEI, IMMUTABLE_ZK, GRAVITY, TAIKO, CRONOS, FRAXTAL, ABSTRACT, CELO, WORLD_CHAIN, MANTLE, BERACHAIN.

Preset Tones: PROFESSIONAL, FRIENDLY, INFORMATIVE, FORMAL, CONVERSATIONAL, AUTHORITATIVE, PLAYFUL, INSPIRATIONAL, CONCISE, EMPATHETIC, ACADEMIC, NEUTRAL, SARCASTIC_MEME_STYLE.

6. Solidity LLM (Python/HuggingFace)
Model: Chain-GPT/Solidity-LLM Type: 2 Billion Parameter Causal LM License: MIT

Installation (Python)
Bash

pip install transformers==4.51.3 torch==2.7.0 accelerate==1.6.0
Usage Example
Python

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_path = "Chain-GPT/Solidity-LLM"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path, torch_dtype=torch.bfloat16, device_map="cuda")

prompt = "Write a Solidity function to transfer tokens."
inputs = tokenizer(prompt, return_tensors="pt").to("cuda")

outputs = model.generate(**inputs, max_new_tokens=1400)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
7. Pricing & Limits
Cost Per Request: 0.5 Credits.

History Cost: Enabling chatHistory: "on" adds +0.5 Credits (Total 1.0 Credit).

Rate Limit: 200 requests per minute per API key.

Error Codes:

401: Invalid Key.

402 / 403: Insufficient Credits.

429: Rate Limit Exceeded.