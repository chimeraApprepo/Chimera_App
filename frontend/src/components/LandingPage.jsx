/**
 * Landing Page Component
 * Beautiful homepage with wave animation and navigation
 */

import { Waves } from './Waves';
import AgentIdentityBadge from './AgentIdentityBadge';
import { WalletStatus } from './WalletStatus';

export function LandingPage({ onNavigate }) {
  // Agent wallet addresses
  const AGENT_WALLET = '0x3710FEbef97cC9705b273C93f2BEB9aDf091Ffc9';
  const IDENTITY_URL = 'https://sepolia.basescan.org/token/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb?a=1581';
  const BSC_TRANSACTIONS_URL = `https://testnet.bscscan.com/address/${AGENT_WALLET}`;
  
  const features = [
    {
      icon: '💬',
      title: 'AI Chat',
      description: 'Chat with our Web3-aware AI agent',
      action: () => onNavigate('chat'),
      color: 'bg-blue-400'
    },
    {
      icon: '🏗️',
      title: 'Generate',
      description: 'Create & deploy smart contracts with AI',
      action: () => onNavigate('generate'),
      color: 'bg-green-400'
    },
    {
      icon: '🛡️',
      title: 'Audit',
      description: 'AI-powered vulnerability detection',
      action: () => onNavigate('audit'),
      color: 'bg-amber-400'
    },
    {
      icon: '🔍',
      title: 'Analyze',
      description: 'Analyze any deployed contract',
      action: () => onNavigate('ingest'),
      color: 'bg-cyan-400'
    },
    {
      icon: '🔄',
      title: 'Swap',
      description: 'Swap tokens via PancakeSwap',
      action: () => onNavigate('swap'),
      color: 'bg-purple-400'
    },
    {
      icon: '💸',
      title: 'Transfer',
      description: 'Send tokens to any address',
      action: () => onNavigate('transfer'),
      color: 'bg-pink-400'
    }
  ];

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: '100vh',
      overflowX: 'hidden',
      overflowY: 'auto'
    }}>
      {/* Wave Background - Fixed */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Waves strokeColor="#4a5568" backgroundColor="#0a0a0a" />
      </div>

      {/* Top Right Wallet Status - Fixed Position */}
      <div style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 100,
        animation: 'fadeInDown 0.8s ease-out'
      }}>
        <WalletStatus onNavigate={onNavigate} />
      </div>

      {/* Content Overlay - Scrollable */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        padding: '2rem 1rem',
        paddingTop: '4rem', // Extra padding for wallet status
        color: 'white',
        textAlign: 'center'
      }}>
        {/* Logo/Title - Compact */}
        <div style={{
          marginBottom: '1.5rem',
          animation: 'fadeInDown 1s ease-out'
        }}>
          <div style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
            fontWeight: '300',
            marginBottom: '0.25rem',
            color: '#a3a3a3',
            letterSpacing: '0.3em',
            textTransform: 'uppercase'
          }}>
            Welcome to
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '900',
            marginBottom: '0.5rem',
            color: '#f5f5f5',
            letterSpacing: '-0.02em',
            textShadow: '0 0 40px rgba(245, 245, 245, 0.3)',
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1
          }}>
            CHIMERA
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.3rem)',
            color: '#d4d4d4',
            maxWidth: '600px',
            margin: '0 auto',
            fontWeight: '400'
          }}>
            Deploy Smart Contracts with AI in Seconds
          </p>
          <p style={{
            fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
            color: '#737373',
            marginTop: '0.5rem',
            letterSpacing: '0.1em'
          }}>
            ChainGPT • Q402 • AWE Network
          </p>
          
          {/* Agent Identity Badge - ERC-8004 Verified */}
          <div style={{ 
            marginTop: '1rem', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeInUp 1.2s ease-out'
          }}>
            <AgentIdentityBadge 
              agentId="1581"
              explorerUrl="https://sepolia.basescan.org/token/0x8004AA63c570c570eBF15376c0dB199918BFe9Fb?a=1581"
              showNetwork={true}
            />
            
            {/* View Agent Transactions on BSC Testnet */}
            <a 
              href={BSC_TRANSACTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(251, 191, 36, 0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: '12px',
                fontSize: '0.75rem',
                color: '#fbbf24',
                letterSpacing: '0.02em',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>🔗</span>
              <span>View Agent Transactions on BSC Testnet</span>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Feature Cards - 6 in a row on large screens */}
        <div 
          className="feature-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '0.75rem',
            maxWidth: '1200px',
            width: '100%',
            padding: '0 0.5rem',
            marginBottom: '1.5rem'
          }}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              role="button"
              tabIndex={0}
              onClick={feature.action}
              onKeyDown={(e) => e.key === 'Enter' && feature.action()}
              style={{
                background: 'rgba(250, 250, 250, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212, 212, 212, 0.1)',
                borderRadius: '16px',
                padding: '1.25rem 0.75rem',
                textAlign: 'center',
                animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s backwards`,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                minWidth: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.background = 'rgba(250, 250, 250, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(212, 212, 212, 0.3)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.background = 'rgba(250, 250, 250, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(212, 212, 212, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                marginBottom: '0.5rem',
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))'
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                fontWeight: '700',
                marginBottom: '0.35rem',
                color: '#f5f5f5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: 'clamp(0.65rem, 1vw, 0.8rem)',
                color: '#a3a3a3',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Bar - Compact */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          color: '#d4d4d4',
          padding: '0 1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#86efac' }}>
              10s
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              DEPLOY TIME
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#93c5fd' }}>
              $0
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              GAS FEES
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fbbf24' }}>
              100%
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              AUDITED
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#c084fc' }}>
              ERC-8004
            </div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              IDENTITY
            </div>
          </div>
        </div>
      </div>

      {/* Animations & Responsive Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive: 3 columns on medium screens */
        @media (max-width: 1100px) {
          .feature-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 0.5rem !important;
          }
        }

        /* Responsive: 2 columns on small screens */
        @media (max-width: 700px) {
          .feature-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem !important;
          }
        }

        /* Responsive: single column on very small screens */
        @media (max-width: 400px) {
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
