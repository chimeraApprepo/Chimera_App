/**
 * Contract Generator Component
 * Full flow: Payment → Generate → Audit → Preview → Sign → Deploy
 * Properly integrated with x402 micropayments
 * Glass morphism design
 */

import { useState, useEffect } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { CartoonButton } from './CartoonButton';
import { PaymentModal } from './PaymentModal';
import { TransactionPreview } from './TransactionPreview';
import { GlassPanel, glassInputStyle } from './GlassPanel';
import { useAgentBrain } from '../hooks/useAgentBrain';
import { AuditLoopVisualizer } from './AuditLoopVisualizer';
import { getCreditBalance, checkCredits } from '../services/api';
import { logActivity, ACTIVITY_TYPES } from './WalletStatus';

// In production (served from same origin), use empty string for relative URLs
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

// CHIM cost for contract generation
const GENERATE_COST = 10;

// Flow steps
const STEPS = {
  INPUT: 'input',
  PAYMENT: 'payment',
  GENERATING: 'generating',
  PREVIEW: 'preview',
  SIGNING: 'signing',
  DEPLOYING: 'deploying',
  SUCCESS: 'success',
  ERROR: 'error'
};

export function ContractGenerator() {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const brain = useAgentBrain();
  
  // Flow state
  const [step, setStep] = useState(STEPS.INPUT);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState(null);
  
  // Payment state
  const [paymentRequired, setPaymentRequired] = useState(null);
  
  // Generation state
  const [generationResult, setGenerationResult] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  
  // Audit loop iterations state
  const [auditIterations, setAuditIterations] = useState([]);
  const [auditLoopComplete, setAuditLoopComplete] = useState(false);
  
  // CHIM balance state
  const [chimBalance, setChimBalance] = useState(null);
  const [hasEnoughChim, setHasEnoughChim] = useState(false);
  const [showConfirmCost, setShowConfirmCost] = useState(false);
  
  // Deployment state
  const [deployResult, setDeployResult] = useState(null);
  
  const [showCode, setShowCode] = useState(false);

  // Fetch CHIM balance when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchChimBalance();
    } else {
      setChimBalance(null);
      setHasEnoughChim(false);
    }
  }, [address, isConnected]);

  const fetchChimBalance = async () => {
    try {
      const data = await getCreditBalance(address);
      const balance = parseFloat(data.formatted || '0');
      setChimBalance(balance);
      setHasEnoughChim(balance >= GENERATE_COST);
    } catch (err) {
      console.error('Failed to fetch CHIM balance:', err);
      setChimBalance(0);
      setHasEnoughChim(false);
    }
  };

  // Step 1: Show cost confirmation before generation
  const handleStartGeneration = async () => {
    if (!prompt.trim()) {
      setError('Please enter a contract description');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    // Show cost confirmation dialog
    setShowConfirmCost(true);
  };

  // Step 1b: Actually start generation after cost confirmation
  const handleConfirmGeneration = async () => {
    setShowConfirmCost(false);
    setError(null);

    // Check if user has enough CHIM
    if (!hasEnoughChim) {
      setError(`Insufficient CHIM credits. You have ${chimBalance} CHIM but need ${GENERATE_COST} CHIM.`);
      setPaymentRequired({
        pricing: { amount: `${GENERATE_COST} CHIM`, service: 'generate' },
        balance: chimBalance?.toString() || '0'
      });
      setStep(STEPS.PAYMENT);
      return;
    }

    // Proceed directly to generation
    handlePaymentComplete({ method: 'chim_payment' });
  };

  // Cancel cost confirmation
  const handleCancelCostConfirm = () => {
    setShowConfirmCost(false);
  };

  // Step 2: After payment is complete, generate contract with Audit Loop visualization
  const handlePaymentComplete = async (paymentData) => {
    setStep(STEPS.GENERATING);
    setAuditIterations([]);
    setAuditLoopComplete(false);
    
    try {
      // Use SSE streaming endpoint for real-time audit loop visualization
      // CHIM credits are checked and spent server-side based on userAddress
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          useAuditLoop: true,
          userAddress: address // Server will check and spend CHIM credits
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentCode = '';
      let currentIteration = { attempt: 1, code: '', score: 0, issues: [], fixesApplied: [] };
      let iterations = [];
      let finalResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Handle different event types from audit loop
              switch (data.type) {
                case 'attempt':
                  // New iteration starting
                  if (currentIteration.code) {
                    iterations.push({ ...currentIteration });
                    setAuditIterations([...iterations]);
                  }
                  currentIteration = {
                    attempt: data.attempt,
                    code: '',
                    score: 0,
                    issues: [],
                    fixesApplied: data.attempt > 1 ? ['Addressing issues from previous iteration'] : []
                  };
                  currentCode = '';
                  break;

                case 'code_chunk':
                  currentCode += data.data || '';
                  break;

                case 'code_complete':
                  currentIteration.code = data.code || currentCode;
                  break;

                case 'audit_complete':
                  currentIteration.score = data.score || 0;
                  // Extract issues from report
                  if (data.report && data.score < 80) {
                    currentIteration.issues = extractIssuesFromReport(data.report);
                  }
                  iterations.push({ ...currentIteration });
                  setAuditIterations([...iterations]);
                  break;

                case 'retry':
                  // Preparing for next iteration
                  break;

                case 'success':
                  setAuditLoopComplete(true);
                  finalResult = {
                    contractCode: data.code,
                    auditScore: data.audit?.score || 100,
                    auditReport: data.audit?.report || 'Passed',
                    compiled: null // Will compile separately
                  };
                  break;

                case 'failed':
                  // Max retries reached but still show result
                  setAuditLoopComplete(true);
                  finalResult = {
                    contractCode: data.code,
                    auditScore: data.audit?.score || 0,
                    auditReport: data.audit?.report || 'Failed',
                    compiled: null
                  };
                  break;

                case 'error':
                  throw new Error(data.message || 'Generation failed');
              }
            } catch (e) {
              if (e.message !== 'Generation failed') {
                console.warn('SSE parse error:', e);
              } else {
                throw e;
              }
            }
          }
        }
      }

      // If we got a result, compile it
      if (finalResult) {
        // Try to compile the contract
        try {
          const compileResponse = await fetch(`${API_URL}/api/contract/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: finalResult.contractCode })
          });
          if (compileResponse.ok) {
            const compileData = await compileResponse.json();
            if (compileData.success) {
              finalResult.compiled = compileData;
            }
          }
        } catch (compileErr) {
          console.warn('Compile error:', compileErr);
        }

        setGenerationResult(finalResult);
        setAuditResult({
          score: finalResult.auditScore,
          passed: finalResult.auditScore >= 80,
          report: finalResult.auditReport,
          summary: { criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0, informational: 0 }
        });
        setStep(STEPS.PREVIEW);
      } else {
        throw new Error('No result received from generation');
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message);
      setStep(STEPS.ERROR);
    }
  };

  // Helper to extract issues from audit report
  const extractIssuesFromReport = (report) => {
    const issues = [];
    const patterns = [
      /critical[:\s]+([^\n]+)/gi,
      /high[:\s]+([^\n]+)/gi,
      /vulnerability[:\s]+([^\n]+)/gi,
      /issue[:\s]+([^\n]+)/gi
    ];
    for (const pattern of patterns) {
      const matches = report.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length < 100) {
          issues.push(match[1].trim());
        }
      }
    }
    return issues.slice(0, 5);
  };

  // Step 3: Sign and deploy with Brain visualization
  const handleSignAndDeploy = async () => {
    console.log('[Deploy] Starting sign and deploy...');
    console.log('[Deploy] Generation result:', generationResult);
    
    if (!generationResult?.compiled) {
      console.error('[Deploy] No compiled contract found');
      setError('No compiled contract to deploy. The contract may have failed to compile.');
      setStep(STEPS.ERROR);
      return;
    }

    console.log('[Deploy] Compiled contract found:', generationResult.compiled.contractName);
    setStep(STEPS.SIGNING);

    try {
      // Use the global brain for deployment visualization
      const deployData = await brain.runDeploy(async () => {
        // Create EIP-712 typed data for the deployment intent
        const domain = {
          name: 'Chimera',
          version: '1',
          chainId: 97
        };

        const types = {
          Intent: [
            { name: 'type', type: 'string' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'dataHash', type: 'bytes32' }
          ]
        };

        const nonce = BigInt(Date.now());
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
        
        // Create a simple hash of the intent data
        const dataString = JSON.stringify({
          bytecode: generationResult.compiled.bytecode,
          abi: generationResult.compiled.abi
        });
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const dataHash = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const message = {
          type: 'deploy_contract',
          nonce,
          deadline,
          dataHash
        };

        // Sign the typed data
        const signature = await signTypedDataAsync({
          domain,
          types,
          primaryType: 'Intent',
          message
        });

        console.log('Intent signed:', signature.slice(0, 20) + '...');
        setStep(STEPS.DEPLOYING);

        // Deploy with signature
        const deployResponse = await fetch(`${API_URL}/api/contract/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bytecode: generationResult.compiled.bytecode,
            abi: generationResult.compiled.abi,
            constructorArgs: [],
            signature
          })
        });

        const responseData = await deployResponse.json();

        if (!responseData.success) {
          throw new Error(responseData.message || 'Deployment failed');
        }
        
        return responseData;
      });

      // Log the deployment activity
      if (deployData?.contractAddress && address) {
        logActivity(address, ACTIVITY_TYPES.CONTRACT_DEPLOY, {
          status: 'success',
          details: `Deployed ${generationResult?.compiled?.contractName || 'contract'}: ${prompt.slice(0, 50)}...`,
          contractAddress: deployData.contractAddress,
          txHash: deployData.txHash,
          chimAmount: GENERATE_COST.toString()
        });
      }
      
      setDeployResult(deployData);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      console.error('Deploy error:', err);
      if (err.message?.includes('User rejected')) {
        // User cancelled signing
        setStep(STEPS.PREVIEW);
      } else {
        setError(err.message);
        setStep(STEPS.ERROR);
      }
    }
  };

  // Reset flow
  const handleReset = () => {
    setStep(STEPS.INPUT);
    setPrompt('');
    setError(null);
    setPaymentRequired(null);
    setGenerationResult(null);
    setAuditResult(null);
    setAuditIterations([]);
    setAuditLoopComplete(false);
    setDeployResult(null);
    setShowCode(false);
    setShowConfirmCost(false);
    // Refresh balance after generation
    fetchChimBalance();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '900',
          color: '#f5f5f5',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
          textShadow: '0 0 30px rgba(255,255,255,0.1)'
        }}>
          Smart Contract Generator
        </h2>
        <p style={{ color: '#a3a3a3', fontSize: '1.1rem' }}>
          Describe your smart contract in plain English
        </p>
        
        {/* Connection Status */}
        {!isConnected && (
          <GlassPanel 
            variant="surface"
            hover={false}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              display: 'inline-block',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <span style={{ color: '#fbbf24' }}>
              ⚠️ Connect your wallet to generate and deploy contracts
            </span>
          </GlassPanel>
        )}
      </div>

      {/* Step 1: Input Form */}
      {step === STEPS.INPUT && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create an ERC20 token called MyToken with symbol MTK and 1000000 total supply"
              rows={4}
              style={{
                ...glassInputStyle,
                resize: 'vertical',
                fontFamily: 'inherit',
                minHeight: '120px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
            
            {/* CHIM Cost & Balance Indicator */}
            {isConnected && (
              <div style={{ 
                marginTop: '1rem', 
                display: 'flex', 
                justifyContent: 'center',
                gap: '1.5rem',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🪙</span>
                  <span style={{ color: '#fbbf24', fontWeight: '600' }}>Cost: {GENERATE_COST} CHIM</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: hasEnoughChim ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${hasEnoughChim ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  borderRadius: '8px'
                }}>
                  <span style={{ 
                    color: hasEnoughChim ? '#4ade80' : '#f87171',
                    fontWeight: '600'
                  }}>
                    Your Balance: {chimBalance !== null ? chimBalance.toFixed(1) : '...'} CHIM
                  </span>
                  {hasEnoughChim ? (
                    <span style={{ color: '#4ade80' }}>✓</span>
                  ) : (
                    <span style={{ color: '#f87171' }}>✗</span>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
              <CartoonButton
                label={`🚀 Generate Contract (${GENERATE_COST} CHIM)`}
                color={isConnected && hasEnoughChim ? 'bg-green-400' : isConnected ? 'bg-amber-400' : 'bg-gray-400'}
                disabled={!prompt.trim() || !isConnected}
                onClick={handleStartGeneration}
              />
            </div>
            
            {/* Not enough CHIM warning */}
            {isConnected && !hasEnoughChim && chimBalance !== null && (
              <div style={{ 
                marginTop: '0.75rem', 
                textAlign: 'center',
                color: '#fbbf24',
                fontSize: '0.9rem'
              }}>
                ⚠️ You need {GENERATE_COST - chimBalance} more CHIM to generate a contract
              </div>
            )}
          </div>

          {/* Cost Confirmation Modal */}
          {showConfirmCost && (
            <div style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)'
            }}>
              <GlassPanel
                variant="modal"
                hover={false}
                style={{
                  maxWidth: '400px',
                  width: '90%',
                  padding: '2rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪙</div>
                <h3 style={{ color: '#f5f5f5', marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                  Confirm CHIM Payment
                </h3>
                <p style={{ color: '#a3a3a3', marginBottom: '1.5rem' }}>
                  This will deduct credits from your balance
                </p>
                
                <div style={{
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    color: '#fbbf24',
                    marginBottom: '0.25rem'
                  }}>
                    {GENERATE_COST} CHIM
                  </div>
                  <div style={{ color: '#a3a3a3', fontSize: '0.9rem' }}>
                    for Smart Contract Generation
                  </div>
                  
                  <div style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ color: '#a3a3a3' }}>Current Balance:</span>
                    <span style={{ color: '#4ade80', fontWeight: '600' }}>{chimBalance?.toFixed(1)} CHIM</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                    marginTop: '0.5rem'
                  }}>
                    <span style={{ color: '#a3a3a3' }}>After Generation:</span>
                    <span style={{ color: '#fbbf24', fontWeight: '600' }}>{(chimBalance - GENERATE_COST).toFixed(1)} CHIM</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <CartoonButton
                    label="✓ Confirm & Generate"
                    color="bg-green-400"
                    onClick={handleConfirmGeneration}
                  />
                  <CartoonButton
                    label="Cancel"
                    color="bg-gray-500"
                    onClick={handleCancelCostConfirm}
                  />
                </div>
              </GlassPanel>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <GlassPanel 
              variant="surface" 
              hover={false}
              style={{
                padding: '1.5rem',
                marginBottom: '1rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span style={{ color: '#fca5a5' }}>
                <strong>Error:</strong> {error}
              </span>
            </GlassPanel>
          )}

          {/* Example Prompts */}
          <ExamplePrompts onSelect={setPrompt} />
        </>
      )}

      {/* Step 2: Insufficient Credits Modal */}
      <PaymentModal
        isOpen={step === STEPS.PAYMENT}
        paymentRequired={paymentRequired}
        onPaymentComplete={handlePaymentComplete}
        onCancel={() => setStep(STEPS.INPUT)}
      />

      {/* Step 3: Generating with Audit Loop Visualization */}
      {step === STEPS.GENERATING && (
        <div>
          <GeneratingState />
          <AuditLoopVisualizer 
            iterations={auditIterations}
            isComplete={auditLoopComplete}
          />
        </div>
      )}

      {/* Step 4: Preview & Sign */}
      <TransactionPreview
        isOpen={step === STEPS.PREVIEW}
        code={generationResult?.contractCode}
        auditResult={auditResult}
        intent={{ type: 'deploy_contract', data: generationResult?.compiled }}
        contractName={generationResult?.compiled?.contractName || 'Generated Contract'}
        estimatedGas="0.002"
        onSign={handleSignAndDeploy}
        onCancel={() => setStep(STEPS.INPUT)}
      />

      {/* Step 5: Signing/Deploying */}
      {(step === STEPS.SIGNING || step === STEPS.DEPLOYING) && (
        <GlassPanel 
          variant="card"
          hover={false}
          style={{ padding: '3rem', textAlign: 'center' }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>
            {step === STEPS.SIGNING ? '✍️' : '🚀'}
          </div>
          <h3 style={{ color: '#c4b5fd', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {step === STEPS.SIGNING ? 'Waiting for Signature...' : 'Deploying to BSC Testnet...'}
          </h3>
          <p style={{ color: '#a3a3a3' }}>
            {step === STEPS.SIGNING 
              ? 'Please sign the transaction in your wallet' 
              : 'This may take a few seconds'}
          </p>
        </GlassPanel>
      )}

      {/* Step 6: Success */}
      {step === STEPS.SUCCESS && deployResult && (
        <SuccessState 
          result={deployResult}
          contractCode={generationResult?.contractCode}
          showCode={showCode}
          setShowCode={setShowCode}
          onReset={handleReset}
        />
      )}

      {/* Error State */}
      {step === STEPS.ERROR && (
        <GlassPanel 
          variant="card"
          hover={false}
          style={{ 
            padding: '2rem', 
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h3 style={{ color: '#fca5a5', marginBottom: '1rem' }}>Something went wrong</h3>
          <p style={{ color: '#fca5a5', marginBottom: '1.5rem' }}>{error}</p>
          <CartoonButton
            label="Try Again"
            color="bg-red-400"
            onClick={handleReset}
          />
        </GlassPanel>
      )}

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

// Sub-components

function GeneratingState() {
  return (
    <GlassPanel 
      variant="card"
      hover={false}
      style={{ padding: '2rem', textAlign: 'center' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '2.5rem', animation: 'pulse 2s infinite' }}>🤖</div>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ color: '#86efac', fontSize: '1.3rem', margin: 0 }}>
            AI is generating your contract
          </h3>
          <p style={{ color: '#a3a3a3', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Self-correcting audit loop in progress...
          </p>
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '2rem',
        padding: '1rem',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '12px',
        marginTop: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', animation: 'pulse 1s infinite' }}>⚙️</div>
          <div style={{ color: '#a3a3a3', fontSize: '0.75rem' }}>Generate</div>
        </div>
        <div style={{ color: '#525252', display: 'flex', alignItems: 'center' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🔍</div>
          <div style={{ color: '#a3a3a3', fontSize: '0.75rem' }}>Audit</div>
        </div>
        <div style={{ color: '#525252', display: 'flex', alignItems: 'center' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🔄</div>
          <div style={{ color: '#a3a3a3', fontSize: '0.75rem' }}>Improve</div>
        </div>
        <div style={{ color: '#525252', display: 'flex', alignItems: 'center' }}>→</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
          <div style={{ color: '#a3a3a3', fontSize: '0.75rem' }}>Pass</div>
        </div>
      </div>
    </GlassPanel>
  );
}

function SuccessState({ result, contractCode, showCode, setShowCode, onReset }) {
  return (
    <GlassPanel 
      variant="card"
      hover={false}
      style={{ padding: '2.5rem' }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem', textAlign: 'center', animation: 'bounce 1s ease-in-out 2' }}>
        🎉
      </div>
      <h3 style={{ color: '#86efac', margin: 0, fontSize: '2rem', fontWeight: '700', textAlign: 'center' }}>
        Contract Deployed Successfully!
      </h3>
      
      <GlassPanel 
        variant="surface"
        hover={false}
        style={{ padding: '2rem', marginTop: '1.5rem' }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <strong style={{ color: '#f5f5f5', fontSize: '1.1rem' }}>Contract Address:</strong>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.95rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            marginTop: '0.5rem',
            wordBreak: 'break-all',
            color: '#86efac',
            border: '1px solid rgba(134, 239, 172, 0.2)'
          }}>
            {result.contractAddress}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <strong style={{ color: '#f5f5f5', fontSize: '1.1rem' }}>Transaction Hash:</strong>
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.95rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            marginTop: '0.5rem',
            wordBreak: 'break-all',
            color: '#93c5fd',
            border: '1px solid rgba(147, 197, 253, 0.2)'
          }}>
            {result.txHash}
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={result.bscScanUrl} target="_blank" rel="noopener noreferrer">
            <CartoonButton label="View on BscScan →" color="bg-blue-400" />
          </a>
          <a href={`https://testnet.bscscan.com/address/${result.contractAddress}`} target="_blank" rel="noopener noreferrer">
            <CartoonButton label="View Contract →" color="bg-purple-400" />
          </a>
        </div>
      </GlassPanel>

      {contractCode && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <CartoonButton
              label={showCode ? '▼ Hide Code' : '▶ Show Code'}
              color="bg-gray-500"
              onClick={() => setShowCode(!showCode)}
            />
          </div>
          {showCode && (
            <pre style={{
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '16px',
              overflow: 'auto',
              fontSize: '0.85rem',
              lineHeight: '1.5',
              color: '#d4d4d4',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              maxHeight: '400px'
            }}>
              {contractCode}
            </pre>
          )}
        </div>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <CartoonButton
          label="🔄 Create Another Contract"
          color="bg-green-400"
          onClick={onReset}
        />
      </div>
    </GlassPanel>
  );
}

function ExamplePrompts({ onSelect }) {
  const examples = [
    { icon: '📦', text: 'Simple storage contract', prompt: 'Create a simple storage contract that stores and retrieves a uint256 value' },
    { icon: '🪙', text: 'ERC20 token', prompt: 'Create an ERC20 token called MyToken with symbol MTK and 1000000 total supply' },
    { icon: '🗳️', text: 'Voting contract', prompt: 'Create a voting contract where users can propose and vote on proposals' },
  ];

  return (
    <GlassPanel 
      variant="card"
      hover={false}
      style={{ marginTop: '2rem', padding: '2rem' }}
    >
      <h4 style={{ marginTop: 0, color: '#93c5fd', fontSize: '1.3rem', marginBottom: '1.5rem', fontWeight: '700' }}>
        💡 Example Prompts:
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onSelect(ex.prompt)}
            style={{
              padding: '1.25rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '1rem',
              color: '#e5e5e5',
              fontWeight: '500',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 2.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'rgba(147, 197, 253, 0.5)';
              e.target.style.transform = 'translateX(10px)';
              e.target.style.background = 'rgba(147, 197, 253, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateX(0)';
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            {ex.icon} {ex.text}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}
