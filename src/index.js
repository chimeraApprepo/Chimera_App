/**
 * The Sovereign Architect - Main Server
 * AI Agent for autonomous DeFi strategy deployment
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { cors } from 'hono/cors';
import config from './config/index.js';
import { ChainGPTService } from './services/chaingpt.js';
import { BlockchainService } from './services/blockchain.js';
import { createX402Middleware, getPayment } from './middleware/x402.js';
import { auditLoop } from './services/auditLoop.js';
import { facilitator } from './services/facilitator.js';
import { identity } from './services/identity.js';
import { compiler } from './services/compiler.js';
import { ingestion } from './services/ingestion.js';
import { paymentService } from './services/payment.js';
import { swapService } from './services/swap.js';

// Initialize services
const chaingpt = new ChainGPTService(config.chaingpt.apiKey);
const blockchain = new BlockchainService(
  config.blockchain.rpcUrl,
  config.blockchain.chainId
);

// Create Hono app
const app = new Hono();

// Middleware
app.use('/*', cors());

// x402 Payment middleware for premium endpoints (if enabled)
const generatePaymentMiddleware = config.features.enablePayments 
  ? createX402Middleware({
      amount: config.payment.prices.generate,
      token: config.payment.token,
      recipient: config.payment.recipient,
      chainId: config.blockchain.chainId,
      verifyingContract: config.payment.verifyingContract,
      description: 'Smart Contract Generation'
    })
  : null;

const auditPaymentMiddleware = config.features.enablePayments
  ? createX402Middleware({
      amount: config.payment.prices.audit,
      token: config.payment.token,
      recipient: config.payment.recipient,
      chainId: config.blockchain.chainId,
      verifyingContract: config.payment.verifyingContract,
      description: 'Smart Contract Auditing'
    })
  : null;

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

// Agent info endpoint
app.get('/agent', async (c) => {
  try {
    const context = await blockchain.getContext();
    const identityInfo = identity.getIdentity();
    
    return c.json({
      name: identityInfo.name,
      version: identityInfo.version,
      description: 'AI Agent for autonomous DeFi strategy deployment',
      capabilities: identityInfo.capabilities,
      blockchain: {
        network: 'BNB Smart Chain Testnet',
        chainId: context.chainId,
        currentBlock: context.blockNumber,
        gasPrice: context.gasPrice
      },
      facilitator: {
        address: config.blockchain.facilitatorAddress
      },
      identity: {
        deployed: identityInfo.deployed,
        agentId: identityInfo.agentId,
        metadataURI: identityInfo.metadataURI,
        trustScore: identityInfo.trustScore,
        standard: identityInfo.standard,
        links: identityInfo.links
      }
    });
  } catch (error) {
    return c.json({
      error: 'Failed to fetch agent info',
      message: error.message
    }, 500);
  }
});

// Streaming chat endpoint
app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { message, history = [] } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    console.log('[API] Chat request:', {
      message: message.substring(0, 100),
      historyLength: history.length
    });

    // Get blockchain context
    const context = await blockchain.getContext();

    // Stream response using SSE
    return streamSSE(c, async (stream) => {
      try {
        // Send initial connection message
        await stream.writeSSE({
          data: JSON.stringify({ type: 'connected' }),
          event: 'status'
        });

        // Stream ChainGPT response
        for await (const chunk of chaingpt.createChatStream(message, context, history)) {
          await stream.writeSSE({
            data: chunk,
            event: 'message'
          });
        }

        // Send completion message
        await stream.writeSSE({
          data: JSON.stringify({ type: 'completed' }),
          event: 'status'
        });
      } catch (error) {
        console.error('[API] Stream error:', error);
        await stream.writeSSE({
          data: JSON.stringify({ 
            type: 'error', 
            message: error.message 
          }),
          event: 'error'
        });
      }
    });
  } catch (error) {
    console.error('[API] Chat error:', error);
    return c.json({
      error: 'Chat request failed',
      message: error.message
    }, 500);
  }
});

// Non-streaming chat endpoint (for testing)
app.post('/api/chat/blob', async (c) => {
  try {
    const body = await c.req.json();
    const { message } = body;

    if (!message) {
      return c.json({ error: 'Message is required' }, 400);
    }

    console.log('[API] Blob chat request:', message.substring(0, 100));

    const context = await blockchain.getContext();
    const response = await chaingpt.createChatBlob(message, context);

    return c.json({
      success: true,
      message: response.data,
      context: {
        blockNumber: context.blockNumber,
        gasPrice: context.gasPrice
      }
    });
  } catch (error) {
    console.error('[API] Blob chat error:', error);
    return c.json({
      error: 'Chat request failed',
      message: error.message
    }, 500);
  }
});

// Contract generation endpoint with audit loop (streaming)
app.post('/api/generate', generatePaymentMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, useAuditLoop = true } = body;
    
    // Log payment info if verified
    const payment = getPayment(c);
    if (payment) {
      console.log('[API] Paid request from:', payment.payer);
    }

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    console.log('[API] Generate request:', prompt.substring(0, 100), '| Audit loop:', useAuditLoop);

    return streamSSE(c, async (stream) => {
      try {
        if (useAuditLoop && config.features.enableAuditLoop) {
          // Use audit loop for self-correcting generation
          for await (const update of auditLoop.generateWithAudit(prompt)) {
            await stream.writeSSE({
              data: JSON.stringify(update),
              event: update.type
            });
          }
        } else {
          // Direct generation without audit
          await stream.writeSSE({
            data: JSON.stringify({ type: 'generating' }),
            event: 'status'
          });

          for await (const chunk of chaingpt.generateContractStream(prompt)) {
            await stream.writeSSE({
              data: chunk,
              event: 'code'
            });
          }

          await stream.writeSSE({
            data: JSON.stringify({ type: 'completed' }),
            event: 'status'
          });
        }
      } catch (error) {
        console.error('[API] Generate error:', error);
        await stream.writeSSE({
          data: JSON.stringify({ 
            type: 'error', 
            message: error.message 
          }),
          event: 'error'
        });
      }
    });
  } catch (error) {
    console.error('[API] Generate error:', error);
    return c.json({
      error: 'Generation failed',
      message: error.message
    }, 500);
  }
});

// Contract audit endpoint - accepts code OR contract address
app.post('/api/audit', auditPaymentMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { code, address, includeRecommendations = true } = body;
    
    // Log payment info if verified
    const payment = getPayment(c);
    if (payment) {
      console.log('[API] Paid request from:', payment.payer);
    }

    let sourceCode = code;
    let contractInfo = null;

    // If address provided, try to fetch source from BSCScan
    if (address && !code) {
      console.log('[API] Fetching source for address:', address);
      const contractData = await ingestion.ingestContract(address);
      
      if (contractData.sourceCode) {
        sourceCode = contractData.sourceCode;
        contractInfo = {
          address,
          name: contractData.contractName,
          verified: contractData.verified,
          network: 'BSC Testnet'
        };
      } else if (contractData.isContract) {
        return c.json({
          error: 'Contract not verified',
          message: 'Contract exists but source code is not verified on BSCScan. Please provide source code directly.',
          contractInfo: {
            address,
            bytecodeSize: contractData.bytecodeSize,
            type: contractData.contractType
          }
        }, 400);
      } else {
        return c.json({
          error: 'Not a contract',
          message: 'Address is not a smart contract (may be an EOA)'
        }, 400);
      }
    }

    if (!sourceCode) {
      return c.json({ 
        error: 'Code or address required',
        message: 'Provide either "code" (source code string) or "address" (verified contract address)'
      }, 400);
    }

    console.log('[API] Auditing contract...');

    const result = await chaingpt.auditContract(sourceCode);
    const passed = result.score >= config.features.auditScoreThreshold;

    // Parse vulnerabilities from report
    const vulnerabilities = parseVulnerabilities(result.report);

    const response = {
      success: result.success,
      score: result.score,
      passed,
      threshold: config.features.auditScoreThreshold,
      report: result.report,
      summary: {
        riskLevel: result.score >= 90 ? 'Low' : result.score >= 70 ? 'Medium' : 'High',
        criticalIssues: vulnerabilities.critical,
        highIssues: vulnerabilities.high,
        mediumIssues: vulnerabilities.medium,
        lowIssues: vulnerabilities.low,
        informational: vulnerabilities.info
      }
    };

    if (contractInfo) {
      response.contract = contractInfo;
    }

    if (includeRecommendations && vulnerabilities.total > 0) {
      response.recommendations = vulnerabilities.recommendations;
    }

    return c.json(response);
  } catch (error) {
    console.error('[API] Audit error:', error);
    return c.json({
      error: 'Audit failed',
      message: error.message
    }, 500);
  }
});

// Helper function to parse vulnerabilities from audit report
function parseVulnerabilities(report) {
  const result = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0,
    recommendations: []
  };

  if (!report) return result;

  const reportLower = report.toLowerCase();
  
  // Count by severity keywords
  const criticalMatches = (reportLower.match(/critical|severe|dangerous/g) || []).length;
  const highMatches = (reportLower.match(/high.{0,10}risk|major.{0,10}issue|reentrancy|overflow|underflow/g) || []).length;
  const mediumMatches = (reportLower.match(/medium.{0,10}risk|moderate|should.{0,10}consider/g) || []).length;
  const lowMatches = (reportLower.match(/low.{0,10}risk|minor|style|gas.{0,10}optimization/g) || []).length;
  const infoMatches = (reportLower.match(/informational|note|recommendation|consider/g) || []).length;

  result.critical = criticalMatches;
  result.high = highMatches;
  result.medium = mediumMatches;
  result.low = lowMatches;
  result.info = infoMatches;
  result.total = criticalMatches + highMatches + mediumMatches + lowMatches;

  // Extract recommendations
  const recommendationPatterns = [
    /recommendation[s]?:?\s*([^.]+\.)/gi,
    /should\s+([^.]+\.)/gi,
    /consider\s+([^.]+\.)/gi
  ];

  for (const pattern of recommendationPatterns) {
    const matches = report.match(pattern);
    if (matches) {
      result.recommendations.push(...matches.slice(0, 5));
    }
  }

  return result;
}

// Blockchain info endpoint
app.get('/api/blockchain', async (c) => {
  try {
    const context = await blockchain.getContext();
    
    return c.json({
      success: true,
      data: {
        chainId: context.chainId,
        blockNumber: context.blockNumber,
        gasPrice: context.gasPrice,
        timestamp: context.timestamp
      }
    });
  } catch (error) {
    return c.json({
      error: 'Failed to fetch blockchain info',
      message: error.message
    }, 500);
  }
});

// Wallet balance endpoint
app.get('/api/balance/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const balance = await blockchain.getBalance(address);
    
    return c.json({
      success: true,
      address,
      balance,
      unit: 'BNB'
    });
  } catch (error) {
    return c.json({
      error: 'Failed to fetch balance',
      message: error.message
    }, 500);
  }
});

// Execute user intent endpoint
app.post('/api/execute', async (c) => {
  try {
    const body = await c.req.json();
    const { intent, signature } = body;

    if (!intent || !signature) {
      return c.json({ 
        error: 'Intent and signature are required' 
      }, 400);
    }

    console.log('[API] Execute request:', intent.type);

    // Execute via facilitator
    const result = await facilitator.executeUserIntent(intent, signature);

    return c.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[API] Execute error:', error);
    return c.json({
      error: 'Execution failed',
      message: error.message
    }, 500);
  }
});

// Estimate gas for intent
app.post('/api/estimate-gas', async (c) => {
  try {
    const body = await c.req.json();
    const { intent } = body;

    if (!intent) {
      return c.json({ error: 'Intent is required' }, 400);
    }

    const estimate = await facilitator.estimateGas(intent);

    return c.json({
      success: true,
      estimatedGas: estimate,
      unit: 'BNB'
    });
  } catch (error) {
    return c.json({
      error: 'Gas estimation failed',
      message: error.message
    }, 500);
  }
});

// Facilitator info endpoint
app.get('/api/facilitator', async (c) => {
  try {
    const balance = await facilitator.getBalance();
    const policy = facilitator.getPolicy();
    
    return c.json({
      success: true,
      address: facilitator.wallet.address,
      balance,
      unit: 'BNB',
      chainId: facilitator.chainId,
      policy: {
        maxSpendPerTx: policy.maxSpendPerTx,
        maxSpendPerDay: policy.maxSpendPerDay,
        maxTxPerHour: policy.maxTxPerHour,
        minAuditScore: policy.minAuditScore
      }
    });
  } catch (error) {
    return c.json({
      error: 'Failed to fetch facilitator info',
      message: error.message
    }, 500);
  }
});

// Get user limits
app.get('/api/facilitator/limits/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    const spendLimits = await facilitator.getRemainingSpend(address);
    const txLimits = facilitator.getRemainingTx(address);
    
    return c.json({
      success: true,
      address,
      spend: spendLimits,
      transactions: txLimits
    });
  } catch (error) {
    return c.json({
      error: 'Failed to fetch user limits',
      message: error.message
    }, 500);
  }
});

// Full contract generation and deployment flow
app.post('/api/contract/create', async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, autoAudit = true, autoDeploy = false, constructorArgs = [] } = body;

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400);
    }

    console.log('[API] Contract creation request:', {
      prompt: prompt.substring(0, 100),
      autoAudit,
      autoDeploy
    });

    const result = {
      steps: [],
      success: false
    };

    // Step 1: Generate contract
    console.log('[API] Step 1: Generating contract...');
    result.steps.push({ step: 'generate', status: 'in_progress' });
    
    let contractCode = '';
    const generateResponse = await fetch('http://localhost:3000/api/chat/blob', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Generate a Solidity smart contract: ${prompt}. IMPORTANT: Do NOT use any imports or external dependencies like OpenZeppelin. Write a complete standalone contract with all code inline. Return ONLY the Solidity code, no explanations.`
      })
    });
    
    const generateData = await generateResponse.json();
    contractCode = generateData.message;
    
    // Extract code from markdown if present
    const codeMatch = contractCode.match(/```solidity\n([\s\S]*?)\n```/) || 
                      contractCode.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch) {
      contractCode = codeMatch[1];
    }
    
    result.steps[0].status = 'completed';
    result.steps[0].code = contractCode;
    result.contractCode = contractCode;

    // Step 2: Audit if requested
    if (autoAudit) {
      console.log('[API] Step 2: Auditing contract...');
      result.steps.push({ step: 'audit', status: 'in_progress' });
      
      const auditResult = await chaingpt.auditContract(contractCode);
      result.steps[1].status = 'completed';
      result.steps[1].report = auditResult.report;
      result.steps[1].score = auditResult.score;
      result.auditScore = auditResult.score;
      result.auditReport = auditResult.report;

      // If score is too low, regenerate
      if (auditResult.score < config.features.auditScoreThreshold) {
        console.log('[API] Audit score too low, regenerating...');
        result.steps.push({ step: 'regenerate', status: 'in_progress', reason: 'Low audit score' });
        
        // TODO: Implement regeneration with feedback
        result.steps[2].status = 'skipped';
        result.steps[2].message = 'Regeneration not implemented yet';
      }
    }

    // Step 3: Compile
    console.log('[API] Step 3: Compiling contract...');
    result.steps.push({ step: 'compile', status: 'in_progress' });
    
    const compiled = await compiler.compile(contractCode);
    result.steps[result.steps.length - 1].status = 'completed';
    result.steps[result.steps.length - 1].bytecode = compiled.bytecode;
    result.steps[result.steps.length - 1].abi = compiled.abi;
    result.compiled = compiled;

    // Step 4: Deploy if requested
    if (autoDeploy) {
      console.log('[API] Step 4: Deploying contract...');
      result.steps.push({ step: 'deploy', status: 'in_progress' });
      
      const deployResult = await facilitator.executeUserIntent({
        type: 'deploy_contract',
        data: {
          bytecode: compiled.bytecode,
          abi: compiled.abi,
          constructorArgs
        },
        nonce: Date.now(),
        deadline: Math.floor(Date.now() / 1000) + 3600
      }, 'auto-deploy'); // Skip signature verification for auto-deploy
      
      result.steps[result.steps.length - 1].status = 'completed';
      result.steps[result.steps.length - 1].txHash = deployResult.txHash;
      result.steps[result.steps.length - 1].contractAddress = deployResult.contractAddress;
      result.steps[result.steps.length - 1].blockNumber = deployResult.blockNumber;
      
      result.deployed = true;
      result.contractAddress = deployResult.contractAddress;
      result.txHash = deployResult.txHash;
      result.blockNumber = deployResult.blockNumber;
      result.bscScanUrl = `https://testnet.bscscan.com/tx/${deployResult.txHash}`;
    }

    result.success = true;
    return c.json(result);
    
  } catch (error) {
    console.error('[API] Contract creation error:', error);
    return c.json({
      error: 'Contract creation failed',
      message: error.message,
      stack: error.stack
    }, 500);
  }
});

// Deploy compiled contract endpoint
app.post('/api/contract/deploy', async (c) => {
  try {
    const body = await c.req.json();
    const { bytecode, abi, constructorArgs = [], signature } = body;

    if (!bytecode || !abi) {
      return c.json({ error: 'Bytecode and ABI are required' }, 400);
    }

    console.log('[API] Deploying contract...');

    // Create deployment intent
    const intent = {
      type: 'deploy_contract',
      data: {
        bytecode,
        abi,
        constructorArgs
      },
      nonce: Date.now(),
      deadline: Math.floor(Date.now() / 1000) + 3600
    };

    // Execute deployment
    const result = await facilitator.executeUserIntent(intent, signature || 'auto-deploy');

    return c.json({
      success: true,
      contractAddress: result.contractAddress,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      bscScanUrl: `https://testnet.bscscan.com/tx/${result.txHash}`,
      contractUrl: `https://testnet.bscscan.com/address/${result.contractAddress}`
    });
  } catch (error) {
    console.error('[API] Deployment error:', error);
    return c.json({
      error: 'Deployment failed',
      message: error.message
    }, 500);
  }
});

// Compile contract endpoint
app.post('/api/contract/compile', async (c) => {
  try {
    const body = await c.req.json();
    const { code, contractName } = body;

    if (!code) {
      return c.json({ error: 'Contract code is required' }, 400);
    }

    console.log('[API] Compiling contract...');

    const result = await compiler.compile(code, contractName);

    return c.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[API] Compilation error:', error);
    return c.json({
      error: 'Compilation failed',
      message: error.message
    }, 500);
  }
});

// =====================================================
// ERC-8004 Identity Endpoints (AWE Network Integration)
// =====================================================

// Get identity information
app.get('/api/identity', async (c) => {
  try {
    const identityInfo = identity.getIdentity();
    return c.json({
      success: true,
      ...identityInfo
    });
  } catch (error) {
    console.error('[API] Identity error:', error);
    return c.json({
      error: 'Failed to get identity',
      message: error.message
    }, 500);
  }
});

// Get identity registration status
app.get('/api/identity/status', async (c) => {
  try {
    const status = await identity.checkRegistration();
    const deploymentStatus = identity.getDeploymentStatus();
    
    return c.json({
      success: true,
      ...status,
      deployment: deploymentStatus
    });
  } catch (error) {
    console.error('[API] Identity status error:', error);
    return c.json({
      error: 'Failed to check identity status',
      message: error.message
    }, 500);
  }
});

// Register agent on ERC-8004 registry
app.post('/api/identity/register', async (c) => {
  try {
    const body = await c.req.json();
    const { name, description, tokenUri } = body;

    console.log('[API] Registering agent identity...');

    const result = await identity.registerAgent({
      name: name || 'Chimera',
      description: description || 'AI Agent for autonomous smart contract deployment',
      tokenUri
    });

    return c.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[API] Registration error:', error);
    return c.json({
      error: 'Agent registration failed',
      message: error.message
    }, 500);
  }
});

// Upload metadata to IPFS
app.post('/api/identity/upload-metadata', async (c) => {
  try {
    const body = await c.req.json();
    const { metadata } = body;

    console.log('[API] Uploading metadata to IPFS...');

    const ipfsHash = await identity.uploadToIPFS(metadata);

    return c.json({
      success: true,
      ipfsHash,
      ipfsUri: `ipfs://${ipfsHash}`,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
    });
  } catch (error) {
    console.error('[API] IPFS upload error:', error);
    return c.json({
      error: 'IPFS upload failed',
      message: error.message
    }, 500);
  }
});

// Get agent record from registry
app.get('/api/identity/record/:agentId', async (c) => {
  try {
    const agentId = c.req.param('agentId');
    const record = await identity.getAgentRecord(agentId);

    if (!record) {
      return c.json({
        error: 'Agent not found',
        message: `No agent with ID ${agentId} found in registry`
      }, 404);
    }

    return c.json({
      success: true,
      ...record
    });
  } catch (error) {
    console.error('[API] Record fetch error:', error);
    return c.json({
      error: 'Failed to fetch agent record',
      message: error.message
    }, 500);
  }
});

// Generate agent metadata JSON
app.get('/api/identity/metadata', (c) => {
  const metadata = identity.generateMetadata();
  return c.json(metadata);
});

// Standard .well-known endpoint for agent metadata (A2A protocol)
app.get('/.well-known/agent-metadata.json', (c) => {
  const metadata = identity.generateMetadata();
  return c.json(metadata);
});

// =====================================================
// Contract Ingestion Endpoints
// =====================================================

// Ingest/analyze existing contract
app.post('/api/contract/ingest', async (c) => {
  try {
    const body = await c.req.json();
    const { address } = body;

    if (!address) {
      return c.json({ error: 'Contract address is required' }, 400);
    }

    console.log('[API] Ingesting contract:', address);

    const result = await ingestion.ingestContract(address);

    return c.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[API] Ingestion error:', error);
    return c.json({
      error: 'Contract ingestion failed',
      message: error.message
    }, 500);
  }
});

// Get recent transactions for a contract
app.get('/api/contract/transactions/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const limit = parseInt(c.req.query('limit') || '10');

    const transactions = await ingestion.getRecentTransactions(address, limit);

    return c.json({
      success: true,
      address,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('[API] Transaction fetch error:', error);
    return c.json({
      error: 'Failed to fetch transactions',
      message: error.message
    }, 500);
  }
});

// =====================================================
// x402 Payment Endpoints
// =====================================================

// Get pricing information
app.get('/api/payments/pricing', (c) => {
  const pricing = paymentService.getAllPricing();
  return c.json({
    success: true,
    ...pricing
  });
});

// Create payment request for an endpoint
app.post('/api/payments/request', async (c) => {
  try {
    const body = await c.req.json();
    const { endpoint, userAddress } = body;

    if (!endpoint) {
      return c.json({ error: 'Endpoint is required' }, 400);
    }

    const request = paymentService.createPaymentRequest(endpoint, userAddress);
    const typedData = paymentService.generateTypedData(request);

    return c.json({
      success: true,
      payment: request,
      typedData,
      instructions: {
        step1: 'Sign the typedData with your wallet',
        step2: 'Include the signature in Authorization header: x402 paymentId=XXX signature=YYY',
        step3: 'Or skip payment in demo mode with header: X-Demo-Skip: true'
      }
    });
  } catch (error) {
    console.error('[API] Payment request error:', error);
    return c.json({
      error: 'Failed to create payment request',
      message: error.message
    }, 500);
  }
});

// Verify payment
app.post('/api/payments/verify', async (c) => {
  try {
    const body = await c.req.json();
    const { paymentId, signature, txHash, skipDemo, userAddress } = body;

    if (!paymentId) {
      return c.json({ error: 'Payment ID is required' }, 400);
    }

    const result = await paymentService.verifyPayment(paymentId, {
      signature,
      txHash,
      skipDemo,
      userAddress
    });

    if (result.valid) {
      return c.json({
        success: true,
        ...result
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
  } catch (error) {
    console.error('[API] Payment verification error:', error);
    return c.json({
      error: 'Payment verification failed',
      message: error.message
    }, 500);
  }
});

// Get payment status
app.get('/api/payments/status/:paymentId', (c) => {
  const paymentId = c.req.param('paymentId');
  const status = paymentService.getPaymentStatus(paymentId);

  if (!status) {
    return c.json({
      error: 'Payment not found',
      message: `No payment with ID ${paymentId}`
    }, 404);
  }

  return c.json({
    success: true,
    ...status
  });
});

// Skip payment (demo mode only)
app.post('/api/payments/skip', async (c) => {
  try {
    const body = await c.req.json();
    const { paymentId } = body;

    if (!paymentId) {
      return c.json({ error: 'Payment ID is required' }, 400);
    }

    const result = await paymentService.verifyPayment(paymentId, { skipDemo: true });

    if (result.valid) {
      return c.json({
        success: true,
        message: 'Payment skipped (demo mode)',
        ...result
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }
  } catch (error) {
    console.error('[API] Payment skip error:', error);
    return c.json({
      error: 'Failed to skip payment',
      message: error.message
    }, 500);
  }
});

// =====================================================
// Swap Endpoints (PancakeSwap Integration)
// =====================================================

// Get supported tokens for swapping
app.get('/api/swap/tokens', (c) => {
  const tokens = swapService.getSupportedTokens();
  return c.json({
    success: true,
    tokens,
    router: swapService.routerAddress,
    network: 'BSC Testnet'
  });
});

// Get swap quote
app.post('/api/swap/quote', async (c) => {
  try {
    const body = await c.req.json();
    const { tokenIn, tokenOut, amountIn } = body;

    if (!amountIn) {
      return c.json({ error: 'Amount is required' }, 400);
    }

    console.log('[API] Getting swap quote:', { tokenIn, tokenOut, amountIn });

    const quote = await swapService.getQuote(tokenIn, tokenOut, amountIn);

    return c.json({
      success: true,
      ...quote
    });
  } catch (error) {
    console.error('[API] Quote error:', error);
    return c.json({
      error: 'Failed to get quote',
      message: error.message
    }, 500);
  }
});

// Build swap transaction
app.post('/api/swap/build', async (c) => {
  try {
    const body = await c.req.json();
    const { tokenIn, tokenOut, amountIn, recipient, slippageTolerance } = body;

    if (!amountIn || !recipient) {
      return c.json({ error: 'Amount and recipient are required' }, 400);
    }

    console.log('[API] Building swap transaction:', { tokenIn, tokenOut, amountIn });

    const swapTx = await swapService.buildSwapTransaction({
      tokenIn,
      tokenOut,
      amountIn,
      recipient,
      slippageTolerance
    });

    return c.json({
      success: true,
      ...swapTx
    });
  } catch (error) {
    console.error('[API] Build error:', error);
    return c.json({
      error: 'Failed to build swap',
      message: error.message
    }, 500);
  }
});

// Execute swap via facilitator
app.post('/api/swap/execute', async (c) => {
  try {
    const body = await c.req.json();
    const { tokenIn, tokenOut, amountIn, recipient, slippageTolerance, signature } = body;

    if (!amountIn || !recipient) {
      return c.json({ error: 'Amount and recipient are required' }, 400);
    }

    console.log('[API] Executing swap...');

    // Build the swap transaction
    const swapTx = await swapService.buildSwapTransaction({
      tokenIn,
      tokenOut,
      amountIn,
      recipient,
      slippageTolerance
    });

    // Execute via facilitator (simplified for demo)
    const result = await swapService.executeSwap(swapTx, facilitator);

    return c.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[API] Swap execution error:', error);
    return c.json({
      error: 'Swap execution failed',
      message: error.message
    }, 500);
  }
});

// Get token balance
app.get('/api/swap/balance/:token/:address', async (c) => {
  try {
    const token = c.req.param('token');
    const address = c.req.param('address');

    const tokenAddress = token === 'native' ? null : token;
    const balance = await swapService.getTokenBalance(tokenAddress, address);

    return c.json({
      success: true,
      ...balance
    });
  } catch (error) {
    console.error('[API] Balance error:', error);
    return c.json({
      error: 'Failed to get balance',
      message: error.message
    }, 500);
  }
});

// =====================================================
// Transfer Endpoints
// =====================================================

// Transfer tokens
app.post('/api/transfer', async (c) => {
  try {
    const body = await c.req.json();
    const { token, to, amount, signature } = body;

    if (!to || !amount) {
      return c.json({ error: 'Recipient and amount are required' }, 400);
    }

    console.log('[API] Transfer request:', { token, to, amount });

    // Create transfer intent
    const intent = {
      type: 'transfer',
      data: { token, to, amount },
      nonce: Date.now(),
      deadline: Math.floor(Date.now() / 1000) + 3600
    };

    // Execute via facilitator
    const result = await facilitator.executeUserIntent(intent, signature || 'auto-transfer');

    return c.json({
      success: true,
      ...result,
      bscScanUrl: `https://testnet.bscscan.com/tx/${result.txHash}`
    });
  } catch (error) {
    console.error('[API] Transfer error:', error);
    return c.json({
      error: 'Transfer failed',
      message: error.message
    }, 500);
  }
});

// Preview transfer (estimate gas and validate)
app.post('/api/transfer/preview', async (c) => {
  try {
    const body = await c.req.json();
    const { token, to, amount } = body;

    if (!to || !amount) {
      return c.json({ error: 'Recipient and amount are required' }, 400);
    }

    // Create preview intent
    const intent = {
      type: 'transfer',
      data: { token, to, amount }
    };

    const gasEstimate = await facilitator.estimateGas(intent);

    return c.json({
      success: true,
      preview: {
        token: token || 'tBNB',
        to,
        amount,
        estimatedGas: gasEstimate,
        sponsored: true,
        yourCost: '0'
      }
    });
  } catch (error) {
    console.error('[API] Transfer preview error:', error);
    return c.json({
      error: 'Preview failed',
      message: error.message
    }, 500);
  }
});

// =====================================================
// Contract Call Endpoints
// =====================================================

// Call contract function
app.post('/api/contract/call', async (c) => {
  try {
    const body = await c.req.json();
    const { contract, abi, method, args = [], value = '0', signature } = body;

    if (!contract || !abi || !method) {
      return c.json({ error: 'Contract, ABI, and method are required' }, 400);
    }

    console.log('[API] Contract call:', { contract, method });

    // Create call intent
    const intent = {
      type: 'call_contract',
      data: { contract, abi, method, args, value },
      nonce: Date.now(),
      deadline: Math.floor(Date.now() / 1000) + 3600
    };

    // Execute via facilitator
    const result = await facilitator.executeUserIntent(intent, signature || 'auto-call');

    return c.json({
      success: true,
      ...result,
      bscScanUrl: `https://testnet.bscscan.com/tx/${result.txHash}`
    });
  } catch (error) {
    console.error('[API] Contract call error:', error);
    return c.json({
      error: 'Contract call failed',
      message: error.message
    }, 500);
  }
});

// Preview contract call
app.post('/api/contract/call/preview', async (c) => {
  try {
    const body = await c.req.json();
    const { contract, abi, method, args = [], value = '0' } = body;

    if (!contract || !method) {
      return c.json({ error: 'Contract and method are required' }, 400);
    }

    // Create preview intent
    const intent = {
      type: 'call_contract',
      data: { contract, abi, method, args, value }
    };

    const gasEstimate = await facilitator.estimateGas(intent);

    return c.json({
      success: true,
      preview: {
        contract,
        method,
        args,
        value,
        estimatedGas: gasEstimate,
        sponsored: true,
        yourCost: '0'
      }
    });
  } catch (error) {
    console.error('[API] Call preview error:', error);
    return c.json({
      error: 'Preview failed',
      message: error.message
    }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('[Server] Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message
  }, 500);
});

// Start server
const port = config.port;
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                     CHIMERA                               ║
║           AI Agent for Smart Contract Deployment          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server starting on http://localhost:${port}
🔗 Network: BNB Smart Chain Testnet (Chain ID: ${config.blockchain.chainId})
💼 Facilitator: ${config.blockchain.facilitatorAddress}
🤖 ChainGPT: Connected
⛓️  Blockchain: Connected

📡 Available Endpoints:
   GET  /health              - Health check
   GET  /agent               - Agent information
   POST /api/chat            - Streaming chat (SSE)
   POST /api/chat/blob       - Non-streaming chat
   POST /api/generate        - Generate smart contract (SSE)
   POST /api/audit           - Audit smart contract
   POST /api/contract/create - Full generation & deployment
   GET  /api/blockchain      - Blockchain status
   GET  /api/balance/:addr   - Check wallet balance
   
   📜 Identity (ERC-8004):
   GET  /api/identity              - Get identity info
   GET  /api/identity/status       - Registration status
   POST /api/identity/register     - Register agent on-chain
   POST /api/identity/upload-metadata - Upload to IPFS
   GET  /.well-known/agent-metadata.json - A2A metadata
   
   🔍 Contract Analysis:
   POST /api/contract/ingest       - Analyze existing contract
   GET  /api/contract/transactions/:addr - Recent transactions
   
   💰 x402 Payments:
   GET  /api/payments/pricing      - Get pricing info
   POST /api/payments/request      - Create payment request
   POST /api/payments/verify       - Verify payment
   POST /api/payments/skip         - Skip payment (demo)
   
   🔄 Swap (PancakeSwap):
   GET  /api/swap/tokens           - Supported tokens
   POST /api/swap/quote            - Get swap quote
   POST /api/swap/execute          - Execute swap
   
   💸 Transfer & Call:
   POST /api/transfer              - Transfer tokens
   POST /api/contract/call         - Call contract function

Ready to deploy! 🚀
`);

// Start the server
import { serve } from '@hono/node-server';

serve({
  fetch: app.fetch,
  port
});

