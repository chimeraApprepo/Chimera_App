/**
 * NetworkToggle Component
 * Testnet/Mainnet toggle switch
 * Required for Bounty #2: "Testnet/mainnet toggle" configuration
 */

import { useAccount, useSwitchChain } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';

export function NetworkToggle({ compact = false }) {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  
  const isTestnet = chain?.id === bscTestnet.id;
  const isMainnet = chain?.id === bsc.id;
  
  const handleSwitch = () => {
    if (!isConnected) return;
    
    const targetChain = isTestnet ? bsc : bscTestnet;
    switchChain({ chainId: targetChain.id });
  };

  if (!isConnected) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: compact ? '0.5rem 0.75rem' : '0.5rem 1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        fontSize: compact ? '0.75rem' : '0.85rem',
        color: '#737373',
      }}>
        <span style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          background: '#737373' 
        }} />
        Not connected
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {/* Toggle Container */}
      <div
        onClick={handleSwitch}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: isPending ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
        }}
        title={isPending ? 'Switching network...' : `Click to switch to ${isTestnet ? 'Mainnet' : 'Testnet'}`}
      >
        {/* Testnet Button */}
        <div
          style={{
            padding: compact ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            borderRadius: '8px',
            fontSize: compact ? '0.7rem' : '0.8rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            background: isTestnet 
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)'
              : 'transparent',
            color: isTestnet ? '#fbbf24' : '#737373',
            border: isTestnet ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid transparent',
          }}
        >
          🧪 Testnet
        </div>
        
        {/* Mainnet Button */}
        <div
          style={{
            padding: compact ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
            borderRadius: '8px',
            fontSize: compact ? '0.7rem' : '0.8rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            background: isMainnet 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.3) 100%)'
              : 'transparent',
            color: isMainnet ? '#4ade80' : '#737373',
            border: isMainnet ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid transparent',
          }}
        >
          🔒 Mainnet
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div style={{
          fontSize: '0.8rem',
          color: '#fbbf24',
          animation: 'pulse 1s infinite'
        }}>
          ⏳
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default NetworkToggle;


