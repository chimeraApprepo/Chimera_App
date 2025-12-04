/**
 * Wallet Connection Component
 * Handles wallet connection and network display
 */

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { bsc, bscTestnet } from 'wagmi/chains';

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const isTestnet = chain?.id === bscTestnet.id;

  if (isConnected) {
    return (
      <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Connected Wallet</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            {balance && (
              <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Network: <strong>{chain?.name}</strong>
              {isTestnet && <span style={{ color: 'orange', marginLeft: '0.5rem' }}>(Testnet)</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {chain?.id !== bscTestnet.id && (
                <button onClick={() => switchChain({ chainId: bscTestnet.id })}>
                  Switch to Testnet
                </button>
              )}
              {chain?.id !== bsc.id && (
                <button onClick={() => switchChain({ chainId: bsc.id })}>
                  Switch to Mainnet
                </button>
              )}
              <button onClick={() => disconnect()}>Disconnect</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '1rem' }}>
      <h3>Connect Wallet</h3>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {connector.name}
          </button>
        ))}
      </div>
    </div>
  );
}

