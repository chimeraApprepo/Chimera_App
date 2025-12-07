/**
 * CreditsPage Component
 * Full-panel view for CHIM credits - fills the available space
 * Colorful service icons + prominent buy buttons
 */

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { bscTestnet } from 'wagmi/chains';
import { 
  getCreditBalance, 
  getCreditPricing, 
  requestCreditsPurchase,
  completeCreditsPurchase
} from '../services/api';
import OnboardingButton from './OnboardingButton';
import { logActivity, ACTIVITY_TYPES, triggerChimBalanceRefresh } from './WalletStatus';

// CHIM icon
const ChimIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9 10l3-3 3 3M9 14l3 3 3-3" />
  </svg>
);

// Static service config with inline colors
const getServiceStyle = (service) => {
  const styles = {
    generate: { icon: '⚡', dotColor: '#10b981', textColor: '#34d399', name: 'Generate' },
    audit: { icon: '🛡️', dotColor: '#f59e0b', textColor: '#fbbf24', name: 'Audit' },
    analyze: { icon: '📈', dotColor: '#06b6d4', textColor: '#22d3ee', name: 'Analyze' },
    swap: { icon: '🔄', dotColor: '#8b5cf6', textColor: '#a78bfa', name: 'Swap' },
    transfer: { icon: '💎', dotColor: '#ec4899', textColor: '#f472b6', name: 'Transfer' },
    chat: { icon: '💬', dotColor: '#3b82f6', textColor: '#60a5fa', name: 'Chat' }
  };
  return styles[service] || { icon: '•', dotColor: '#6b7280', textColor: '#9ca3af', name: service };
};

export default function CreditsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient, isLoading: walletClientLoading } = useWalletClient();
  
  // Check if on correct network
  const isCorrectNetwork = chainId === bscTestnet.id;
  const walletReady = walletClient && isCorrectNetwork;
  const [balance, setBalance] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [address, isConnected]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pricingData = await getCreditPricing();
      setPricing(pricingData.pricing);
      setPackages(pricingData.packages || []);
      if (isConnected && address) {
        const balanceData = await getCreditBalance(address);
        setBalance(balanceData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = async (pkg) => {
    if (!isConnected) return;
    setPurchasing(true);
    setMessage(null);
    
    try {
      const result = await requestCreditsPurchase(address, pkg.id);
      if (result.requiresPayment) {
        setPaymentInfo(result);
        setSelectedPackage(pkg);
        setShowPaymentModal(true);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to initiate purchase' });
    } finally {
      setPurchasing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentInfo || !selectedPackage) {
      console.error('[Credits] Missing paymentInfo or selectedPackage');
      return;
    }
    
    // Check if on correct network first
    if (!isCorrectNetwork) {
      setMessage({ type: 'error', text: 'Please switch to BNB Testnet in MetaMask' });
      try {
        await switchChain({ chainId: bscTestnet.id });
      } catch (e) {
        console.error('Failed to switch chain:', e);
      }
      return;
    }
    
    if (!walletClient) {
      setMessage({ type: 'error', text: 'Wallet not ready. Try disconnecting and reconnecting your wallet.' });
      return;
    }
    
    setSigning(true);
    setMessage(null);
    
    try {
      console.log('[Credits] Starting payment confirmation...');
      console.log('[Credits] Payment info:', JSON.stringify(paymentInfo, null, 2));
      
      const paymentDetails = paymentInfo.accepts?.[0];
      if (!paymentDetails?.witness) {
        console.error('[Credits] Invalid payment details - no witness:', paymentDetails);
        throw new Error('Invalid payment details - missing witness data');
      }
      
      const witnessData = paymentDetails.witness;
      console.log('[Credits] Witness data received');
      
      // Validate required fields
      if (!witnessData.message?.amount || !witnessData.message?.deadline || !witnessData.message?.nonce) {
        console.error('[Credits] Missing required witness fields:', witnessData.message);
        throw new Error('Invalid witness data - missing required fields');
      }
      
      // Build the message with the actual user address as owner
      // Use strings for uint256 values - viem handles conversion
      const messageWithOwner = { 
        owner: address,
        token: witnessData.message.token,
        amount: witnessData.message.amount,  // Keep as string - viem converts
        to: witnessData.message.to,
        deadline: witnessData.message.deadline,  // Keep as string
        paymentId: witnessData.message.paymentId,
        nonce: witnessData.message.nonce  // Keep as string
      };
      
      console.log('[Credits] Prepared message:', messageWithOwner);
      console.log('[Credits] Calling signTypedData...');
      
      // Use viem's signTypedData via wallet client - this opens MetaMask
      const signature = await walletClient.signTypedData({
        domain: {
          name: witnessData.domain.name,
          version: witnessData.domain.version,
          chainId: Number(witnessData.domain.chainId),
          verifyingContract: witnessData.domain.verifyingContract
        },
        types: witnessData.types,
        primaryType: witnessData.primaryType,
        message: messageWithOwner
      });
      
      console.log('[Credits] Signature obtained:', signature);
      
      // Build payload with the exact data that was signed
      const paymentPayload = {
        witnessSignature: signature,
        paymentDetails: {
          ...paymentDetails,
          witness: { 
            ...paymentDetails.witness, 
            domain: {
              ...witnessData.domain,
              chainId: Number(witnessData.domain.chainId)
            },
            message: messageWithOwner 
          }
        }
      };
      
      // Use the new simplified API - send signedApproval in body
      const signedApproval = btoa(JSON.stringify(paymentPayload));
      console.log('[Credits] Sending signed approval to backend...');
      
      const result = await completeCreditsPurchase(address, selectedPackage.id, signedApproval);
      
      if (result.success) {
        // Log the purchase activity
        logActivity(address, ACTIVITY_TYPES.CREDITS_PURCHASE, {
          status: 'success',
          details: `Purchased ${selectedPackage.name}: ${selectedPackage.chimAmount} CHIM for $${selectedPackage.usdcPrice}`,
          chimAmount: selectedPackage.chimAmount,
          amount: `$${selectedPackage.usdcPrice} USDC`,
          txHash: result.txHash
        });
        
        setMessage({ type: 'success', text: `✓ Got ${selectedPackage.chimAmount} CHIM!` });
        setShowPaymentModal(false);
        setPaymentInfo(null);
        setSelectedPackage(null);
        await fetchData();
        
        // Trigger refresh in the top nav WalletStatus component
        triggerChimBalanceRefresh();
      }
    } catch (err) {
      console.error('[Credits] Payment error:', err);
      console.error('[Credits] Error stack:', err.stack);
      const errorMsg = err.message || String(err);
      if (errorMsg.includes('rejected') || errorMsg.includes('denied')) {
        setMessage({ type: 'error', text: 'Transaction cancelled by user' });
      } else {
        setMessage({ type: 'error', text: `Error: ${errorMsg.slice(0, 100)}` });
      }
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ 
          width: 32, height: 32, 
          border: '3px solid #fbbf24', 
          borderTopColor: 'transparent', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%',
      maxWidth: '1100px', 
      margin: '0 auto', 
      padding: '0 20px',
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Super Faucet for Judges/Demo - Only shows when wallet connected */}
      <OnboardingButton />

      {/* Header Row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ChimIcon size={36} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>Credits</h1>
        </div>
        
        {/* Balance Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(to right, rgba(245,158,11,0.15), rgba(249,115,22,0.15))',
          borderRadius: '14px',
          border: '1px solid rgba(245,158,11,0.4)',
          padding: '12px 24px'
        }}>
          {isConnected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', fontFamily: 'monospace' }}>
                {balance?.formatted || '0'}
              </span>
              <span style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: '600' }}>CHIM</span>
            </div>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '1rem' }}>Connect wallet to view balance</span>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.9rem',
          textAlign: 'center',
          background: message.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
          color: message.type === 'success' ? '#4ade80' : '#f87171'
        }}>
          {message.text}
        </div>
      )}

      {/* Main Grid - Flex grow to fill space */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1.5fr', 
        gap: '20px',
        flex: 1,
        minHeight: '350px'
      }}>
        
        {/* Service Costs - Left Column */}
        <div style={{
          background: 'rgba(51,65,85,0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(71,85,105,0.6)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            color: '#94a3b8', 
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>Service Costs</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flex: 1 }}>
            {pricing && Object.entries(pricing).map(([service, info]) => {
              const style = getServiceStyle(service);
              return (
                <div key={service} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(71,85,105,0.5)',
                  borderRadius: '10px',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: style.dotColor,
                      boxShadow: `0 0 8px ${style.dotColor}40`
                    }}></span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: style.textColor }}>
                      {style.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', fontFamily: 'monospace' }}>
                    {info.amount}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div style={{ 
            marginTop: '16px', 
            paddingTop: '16px', 
            borderTop: '1px solid rgba(71,85,105,0.6)', 
            textAlign: 'center' 
          }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>
              Exchange Rate: <span style={{ color: '#fbbf24' }}>1 USDC = 10 CHIM</span>
            </span>
          </div>
        </div>

        {/* Buy Packages - Right Column */}
        <div style={{
          background: 'rgba(51,65,85,0.5)',
          borderRadius: '16px',
          border: '1px solid rgba(71,85,105,0.6)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ 
            fontSize: '0.85rem', 
            fontWeight: '600', 
            color: '#94a3b8', 
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>Buy Credits</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', flex: 1 }}>
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleBuyCredits(pkg)}
                disabled={purchasing || !isConnected}
                style={{
                  position: 'relative',
                  padding: '24px 16px',
                  borderRadius: '14px',
                  border: pkg.popular ? '2px solid rgba(245,158,11,0.7)' : '2px solid rgba(71,85,105,0.5)',
                  background: pkg.popular 
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(249,115,22,0.25))' 
                    : 'rgba(71,85,105,0.4)',
                  cursor: purchasing || !isConnected ? 'not-allowed' : 'pointer',
                  opacity: purchasing || !isConnected ? 0.5 : 1,
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '180px'
                }}
                onMouseEnter={(e) => {
                  if (!purchasing && isConnected) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {pkg.popular && (
                  <span style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 12px',
                    background: '#f59e0b',
                    color: 'black',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    letterSpacing: '0.05em'
                  }}>POPULAR</span>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ChimIcon size={24} />
                  <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#fbbf24', fontFamily: 'monospace' }}>
                    {pkg.chimAmount}
                  </span>
                </div>
                
                <div style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: pkg.popular ? 'white' : '#e2e8f0',
                  marginBottom: '16px'
                }}>
                  {pkg.name.replace(' Pack', '')}
                </div>
                
                <div style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  background: pkg.popular ? '#f59e0b' : '#475569',
                  color: pkg.popular ? 'black' : 'white',
                  width: '100%',
                  maxWidth: '120px'
                }}>
                  ${pkg.usdcPrice}
                </div>
                
                {pkg.bonus && (
                  <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '10px', fontWeight: '500' }}>
                    {pkg.bonus}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '32px',
        fontSize: '0.8rem',
        color: '#94a3b8',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(71,85,105,0.3)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e40' }}></span>
          Gasless payments
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d440' }}></span>
          x402 Protocol
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b40' }}></span>
          Instant credits
        </span>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && paymentInfo && selectedPackage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💳</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Confirm Payment</h2>
            </div>
            
            <div style={{
              background: 'rgba(51,65,85,0.5)',
              border: '1px solid #334155',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#94a3b8', fontSize: '1rem' }}>Pay:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>${selectedPackage.usdcPrice} USDC</span>
              </div>
              <div style={{ borderTop: '1px solid #334155', margin: '12px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '1rem' }}>Get:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChimIcon size={20} />
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{selectedPackage.chimAmount} CHIM</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentInfo(null); setSelectedPackage(null); }}
                disabled={signing}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: signing ? 'not-allowed' : 'pointer',
                  opacity: signing ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={signing || !walletReady}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: (signing || !walletReady) ? '#475569' : 'linear-gradient(to right, #f59e0b, #ea580c)',
                  color: (signing || !walletReady) ? '#94a3b8' : 'black',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: (signing || !walletReady) ? 'not-allowed' : 'pointer',
                  opacity: (signing || !walletReady) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {signing ? 'Signing...' : !isCorrectNetwork ? '⚠️ Switch to BNB Testnet' : walletClientLoading ? 'Connecting...' : !walletClient ? 'Reconnect Wallet' : '✍️ Sign & Pay'}
              </button>
            </div>
            
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginTop: '16px' }}>
              No gas fees • Gasless x402 Protocol
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
