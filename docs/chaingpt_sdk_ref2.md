# ChainGPT Smart Contract Tools: Generator & Auditor SDK Reference

This document provides a comprehensive reference for integrating ChainGPT's **Smart Contract Generator** and **Smart Contract Auditor** via Node.js SDKs and REST API.

## Table of Contents
1. [Authentication & Credits](#1-authentication--credits)
2. [Smart Contract Generator SDK](#2-smart-contract-generator-sdk)
3. [Smart Contract Auditor SDK](#3-smart-contract-auditor-sdk)
4. [REST API Reference (Both Tools)](#4-rest-api-reference)
5. [Chat History & Session Management](#5-chat-history--session-management)
6. [Error Handling](#6-error-handling)

---

## 1. Authentication & Credits

**Prerequisites:**
* **API Key:** Obtain from [ChainGPT AI Hub](https://app.chaingpt.org/).
* **Credits:** Required for all calls.
* **Rate Limit:** 200 requests per minute per API Key.

**Cost Model:**
* **Base Request:** 1 Credit.
* **With History (`chatHistory: "on"`):** 1 Credit + 1 Credit (Total: 2).
* **History Retrieval:** 0 Credits.

---

## 2. Smart Contract Generator SDK

**Package:** `@chaingpt/smartcontractgenerator`
**Purpose:** Generate Solidity code from natural language prompts.

### Installation
```bash
npm install @chaingpt/smartcontractgenerator
# or
yarn add @chaingpt/smartcontractgenerator
InitializationTypeScriptimport { SmartContractGenerator } from "@chaingpt/smartcontractgenerator";

const generator = new SmartContractGenerator({
  apiKey: process.env.CHAINGPT_API_KEY // Always use env vars
});
MethodscreateSmartContractStream(options)Generates code with real-time streaming (Recommended for UI feedback).TypeScriptasync function generateStream() {
  try {
    const stream = await generator.createSmartContractStream({
      question: "Write an ERC-20 token contract named 'TestToken' with minting.",
      chatHistory: "off" // Set to "on" for context retention
    });

    stream.on('data', (chunk) => {
      process.stdout.write(chunk.toString()); // Real-time output
    });

    stream.on('end', () => {
      console.log("\nGeneration complete.");
    });
  } catch (error) {
    console.error(error);
  }
}
createSmartContractBlob(options)Waits for generation to finish and returns the full response object.TypeScriptasync function generateBlob() {
  const response = await generator.createSmartContractBlob({
    question: "Create a simple voting smart contract.",
    chatHistory: "off"
  });
  
  // Access the generated code via .data.bot
  console.log(response.data.bot);
}
3. Smart Contract Auditor SDKPackage: @chaingpt/smartcontractauditorPurpose: Analyze Solidity code for vulnerabilities and optimizations.InstallationBashnpm install @chaingpt/smartcontractauditor
# or
yarn add @chaingpt/smartcontractauditor
InitializationTypeScriptimport { SmartContractAuditor } from "@chaingpt/smartcontractauditor";

const auditor = new SmartContractAuditor({
  apiKey: process.env.CHAINGPT_API_KEY
});
MethodsauditSmartContractStream(options)Streams the audit report analysis.TypeScriptconst solidityCode = `
pragma solidity ^0.8.0;
contract Vulnerable {
    mapping(address => uint) public balances;
    function withdraw(uint _amount) public {
        (bool sent, ) = msg.sender.call{value: _amount}("");
        require(sent, "Failed to send Ether");
        balances[msg.sender] -= _amount; // Reentrancy risk here
    }
}`;

async function auditStream() {
  const stream = await auditor.auditSmartContractStream({
    question: `Audit the following contract:\n${solidityCode}`,
    chatHistory: "on"
  });

  stream.on('data', (chunk) => {
    console.log(chunk.toString());
  });
}
auditSmartContractBlob(options)Returns the full audit report as a single object.TypeScriptasync function auditBlob() {
  const response = await auditor.auditSmartContractBlob({
    question: `Audit this contract:\n${solidityCode}`,
    chatHistory: "off"
  });

  console.log(response.data.bot);
}
4. REST API ReferenceIf not using the SDKs, use the HTTP endpoint directly. Both tools share the same endpoint but use different model parameters.Endpoint: POST https://api.chaingpt.org/chat/streamHeaders:Authorization: Bearer <YOUR_API_KEY>Content-Type: application/jsonRequest Body SchemaParameterTypeDescriptionmodelstringRequired. Use "smart_contract_generator" OR "smart_contract_auditor".questionstringRequired. The prompt (Generator) or "Audit this: [Code]" (Auditor).chatHistorystringOptional. "on" or "off" (Default: "off").sdkUniqueIdstringOptional. Unique user/session ID for history segregation.cURL Example (Generator)Bashcurl -X POST "[https://api.chaingpt.org/chat/stream](https://api.chaingpt.org/chat/stream)" \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "smart_contract_generator",
    "question": "Create a staking contract.",
    "chatHistory": "off"
  }'
5. Chat History & Session ManagementTo maintain context (e.g., "Now add a reset function to that contract"), use chatHistory: "on".SDK UsageWhen history is enabled, it is highly recommended to use sdkUniqueId to separate user sessions.TypeScriptconst userSessionId = "user-uuid-1234";

// 1. Initial Request
await generator.createSmartContractBlob({
  question: "Create a counter contract",
  chatHistory: "on",
  sdkUniqueId: userSessionId
});

// 2. Follow-up (Context Aware)
await generator.createSmartContractBlob({
  question: "Add a reset function to it",
  chatHistory: "on",
  sdkUniqueId: userSessionId
});
Retrieving HistoryYou can fetch past interactions using getChatHistory (Available in both SDKs).TypeScriptconst history = await generator.getChatHistory({
  limit: 10,
  offset: 0,
  sortBy: "createdAt",
  sortOrder: "DESC"
});

console.log(history.data.rows); // Array of past prompts and answers
6. Error HandlingBoth SDKs provide specific error classes to handle API failures (401, 402, 429, 500).TypeScriptimport { SmartContractGenerator, Errors } from "@chaingpt/smartcontractgenerator";

try {
  await generator.createSmartContractStream({ ... });
} catch (error) {
  if (error instanceof Errors.SmartContractGeneratorError) {
    // Handle API errors (Auth, Credits, Rate Limits)
    console.error("SDK Error:", error.message);
  } else {
    // Handle network or code errors
    console.error("Unexpected Error:", error);
  }
}
Note: The Auditor SDK uses Errors.SmartContractAuditorError.