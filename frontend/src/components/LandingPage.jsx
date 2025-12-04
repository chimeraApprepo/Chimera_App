/**
 * Landing Page Component
 * Beautiful homepage with wave animation and navigation
 */

import { Waves } from './Waves';
import { CartoonButton } from './CartoonButton';

export function LandingPage({ onNavigate }) {
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
      title: 'Generate & Deploy',
      description: 'Create smart contracts with AI and deploy instantly',
      action: () => onNavigate('generate'),
      color: 'bg-green-400'
    },
    {
      icon: '🛡️',
      title: 'Security Audit',
      description: 'AI-powered smart contract vulnerability detection',
      action: () => onNavigate('audit'),
      color: 'bg-amber-400'
    },
    {
      icon: '🔍',
      title: 'Contract Analyzer',
      description: 'Analyze any deployed contract on BSC',
      action: () => onNavigate('ingest'),
      color: 'bg-cyan-400'
    },
    {
      icon: '🔄',
      title: 'Token Swap',
      description: 'Swap tokens via PancakeSwap (gasless!)',
      action: () => onNavigate('swap'),
      color: 'bg-purple-400'
    },
    {
      icon: '💸',
      title: 'Send Tokens',
      description: 'Transfer tokens to any address (gasless!)',
      action: () => onNavigate('transfer'),
      color: 'bg-pink-400'
    }
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Wave Background */}
      <Waves strokeColor="#4a5568" backgroundColor="#0a0a0a" />

      {/* Content Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
        color: 'white',
        textAlign: 'center'
      }}>
        {/* Logo/Title */}
        <div style={{
          marginBottom: '3rem',
          animation: 'fadeInDown 1s ease-out'
        }}>
          <div style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: '300',
            marginBottom: '0.5rem',
            color: '#d4d4d4',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: 0.7
          }}>
            Welcome to
          </div>
          <h1 style={{
            fontSize: 'clamp(3rem, 12vw, 8rem)',
            fontWeight: '900',
            marginBottom: '1rem',
            color: '#f5f5f5',
            letterSpacing: '-0.02em',
            textShadow: '0 0 40px rgba(245, 245, 245, 0.3)',
            fontFamily: "'Inter', sans-serif"
          }}>
            CHIMERA
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 3vw, 1.8rem)',
            color: '#e5e5e5',
            maxWidth: '800px',
            margin: '0 auto',
            fontWeight: '400',
            letterSpacing: '0.05em'
          }}>
            Deploy Smart Contracts with AI in Seconds
          </p>
          <p style={{
            fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
            color: '#a3a3a3',
            marginTop: '1rem',
            letterSpacing: '0.1em'
          }}>
            ChainGPT • Q402 • AWE Network
          </p>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1400px',
          width: '100%',
          padding: '0 1rem',
          marginBottom: '3rem'
        }}>
          {features.map((feature, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(250, 250, 250, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(212, 212, 212, 0.1)',
                borderRadius: '24px',
                padding: '2.5rem 2rem',
                textAlign: 'center',
                animation: `fadeInUp 0.8s ease-out ${idx * 0.2}s backwards`,
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.background = 'rgba(250, 250, 250, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(212, 212, 212, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(250, 250, 250, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(212, 212, 212, 0.1)';
              }}
            >
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem',
                filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'
              }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '0.75rem',
                color: '#f5f5f5'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '1rem',
                color: '#d4d4d4',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                {feature.description}
              </p>
              <CartoonButton
                label="Launch →"
                color={feature.color}
                onClick={feature.action}
                size="sm"
              />
            </div>
          ))}
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex',
          gap: '3rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          color: '#d4d4d4'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#86efac' }}>
              10s
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              DEPLOY TIME
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#93c5fd' }}>
              $0
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              GAS FEES
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fbbf24' }}>
              100%
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              AUDITED
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#c084fc' }}>
              ERC-8004
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, letterSpacing: '0.1em' }}>
              IDENTITY
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
