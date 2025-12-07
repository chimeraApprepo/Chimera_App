/**
 * Audit Loop Visualizer
 * Shows each iteration of the self-correcting audit loop as expandable stacked panels
 * Users can expand each iteration to see details: why score is low, what improvements were made
 */

import { useState } from 'react';
import { GlassPanel } from './GlassPanel';

// Score color based on percentage
const getScoreColor = (score) => {
  if (score >= 80) return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.5)', text: '#4ade80' };
  if (score >= 60) return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.5)', text: '#fbbf24' };
  if (score >= 40) return { bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.5)', text: '#fb923c' };
  return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#f87171' };
};

// Circular progress indicator
const CircularProgress = ({ score, size = 60 }) => {
  const colors = getScoreColor(score);
  const radius = (size / 2) - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="5"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.text}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <span style={{ fontSize: '1rem', fontWeight: '700', color: colors.text }}>
          {score}%
        </span>
      </div>
    </div>
  );
};

// Single expandable iteration panel
const IterationPanel = ({ iteration, isFinal, isExpanded, onToggle, isLatest }) => {
  const [showCode, setShowCode] = useState(false);
  const colors = getScoreColor(iteration.score);
  
  const issues = iteration.issues || [];
  const isPassing = iteration.score >= 80;

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <GlassPanel
        variant="card"
        hover={!isExpanded}
        style={{
          padding: 0,
          border: isLatest ? `2px solid ${colors.border}` : '1px solid rgba(255,255,255,0.1)',
          background: isLatest ? colors.bg : 'rgba(20, 20, 20, 0.6)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Clickable Header */}
        <div
          onClick={onToggle}
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
            transition: 'background 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Iteration badge */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isFinal ? 'linear-gradient(135deg, #4ade80, #22d3ee)' : 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1rem',
              color: isFinal ? '#000' : '#fff',
              flexShrink: 0
            }}>
              {isFinal ? '✓' : iteration.attempt}
            </div>
            
            <div>
              <h3 style={{ margin: 0, color: '#f5f5f5', fontSize: '1rem', fontWeight: '600' }}>
                {isFinal ? '✅ Final Version - Passed!' : `Iteration ${iteration.attempt}`}
              </h3>
              <p style={{ margin: 0, color: '#a3a3a3', fontSize: '0.8rem' }}>
                {isPassing ? 'Passed security threshold' : 'Below threshold → regenerating...'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Score circle */}
            <CircularProgress score={iteration.score} size={50} />
            
            {/* Expand/collapse indicator */}
            <div style={{
              color: '#a3a3a3',
              fontSize: '1.2rem',
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}>
              ▼
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            animation: 'slideDown 0.2s ease-out'
          }}>
            {/* Why score is low / Issues found */}
            {issues.length > 0 && !isPassing && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚠️ Why Score is Low:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#fca5a5', fontSize: '0.8rem' }}>
                  {issues.map((issue, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Passed message for final */}
            {isPassing && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ color: '#86efac', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ✅ Security Threshold Passed
                </div>
                <p style={{ margin: '0.5rem 0 0 0', color: '#86efac', fontSize: '0.8rem', opacity: 0.9 }}>
                  This contract meets the minimum security requirements ({iteration.score}% ≥ 80%)
                </p>
              </div>
            )}

            {/* Fixes applied (for subsequent iterations) */}
            {iteration.attempt > 1 && iteration.fixesApplied && iteration.fixesApplied.length > 0 && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem'
              }}>
                <div style={{ color: '#a5b4fc', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔧 Improvements Made:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#a5b4fc', fontSize: '0.8rem' }}>
                  {iteration.fixesApplied.map((fix, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{fix}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code preview toggle */}
            {iteration.code && (
              <div>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCode(!showCode); }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    color: '#d4d4d4',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    width: '100%',
                    marginBottom: showCode ? '0.75rem' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {showCode ? '▼ Hide Code' : '▶ View Generated Code'}
                </button>
                
                {showCode && (
                  <pre style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '1rem',
                    overflow: 'auto',
                    maxHeight: '200px',
                    fontSize: '0.75rem',
                    color: '#d4d4d4',
                    margin: 0
                  }}>
                    {iteration.code.substring(0, 1500)}
                    {iteration.code.length > 1500 && '\n\n... (truncated)'}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

// Main visualizer component
export function AuditLoopVisualizer({ iterations = [], isComplete = false, isLoading = false }) {
  // Track which iterations are expanded - default latest one to expanded
  const [expandedIndices, setExpandedIndices] = useState(new Set([0]));

  const toggleExpanded = (index) => {
    setExpandedIndices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedIndices(new Set(iterations.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedIndices(new Set());
  };

  // Show loading state when generating but no iterations yet
  if (iterations.length === 0 && isLoading) {
    return (
      <div style={{ 
        marginTop: '1.5rem',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.1))',
        border: '2px solid rgba(139,92,246,0.3)',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ 
            fontSize: '2.5rem', 
            animation: 'spin 2s linear infinite'
          }}>🔄</div>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: 0, color: '#c4b5fd', fontSize: '1.2rem', fontWeight: '700' }}>
              Self-Correcting Audit Loop
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#a5b4fc', fontSize: '0.9rem' }}>
              Starting first iteration...
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '1rem',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '10px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📝</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Generate</div>
          </div>
          <div style={{ color: '#4b5563', fontSize: '1.5rem' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🛡️</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Audit</div>
          </div>
          <div style={{ color: '#4b5563', fontSize: '1.5rem' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🔧</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Fix</div>
          </div>
          <div style={{ color: '#4b5563', fontSize: '1.5rem' }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>✅</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Pass</div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (iterations.length === 0) {
    return null;
  }

  return (
    <div style={{ 
      marginTop: '1.5rem',
      background: isComplete 
        ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(16,185,129,0.1))'
        : 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.1))',
      border: isComplete 
        ? '2px solid rgba(34,197,94,0.4)'
        : '2px solid rgba(139,92,246,0.4)',
      borderRadius: '16px',
      padding: '1.5rem'
    }}>
      {/* Progress header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            fontSize: '2rem',
            animation: isComplete ? 'none' : 'pulse 1s infinite'
          }}>
            {isComplete ? '✅' : '🔄'}
          </div>
          <div>
            <h3 style={{ margin: 0, color: isComplete ? '#4ade80' : '#c4b5fd', fontSize: '1.15rem', fontWeight: '700' }}>
              {isComplete ? '🎉 Audit Loop Complete!' : 'Self-Correcting Audit Loop'}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: isComplete ? '#86efac' : '#a5b4fc', fontSize: '0.85rem' }}>
              {isComplete 
                ? `Achieved ${iterations[iterations.length - 1]?.score}% security score in ${iterations.length} iteration${iterations.length > 1 ? 's' : ''}`
                : `Iteration ${iterations.length} in progress...`}
            </p>
          </div>
        </div>

        {/* Expand/Collapse All buttons */}
        {iterations.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={expandAll}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#a3a3a3',
                cursor: 'pointer'
              }}
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#a3a3a3',
                cursor: 'pointer'
              }}
            >
              Collapse All
            </button>
          </div>
        )}
      </div>

      {/* Stacked iteration panels - all visible, individually expandable */}
      <div>
        {iterations.map((iteration, idx) => (
          <IterationPanel
            key={idx}
            iteration={iteration}
            isFinal={isComplete && idx === iterations.length - 1}
            isExpanded={expandedIndices.has(idx)}
            onToggle={() => toggleExpanded(idx)}
            isLatest={idx === iterations.length - 1}
          />
        ))}
      </div>

      {/* Loading indicator for next iteration */}
      {isLoading && !isComplete && (
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          background: 'rgba(139,92,246,0.1)',
          borderRadius: '8px',
          border: '1px dashed rgba(139,92,246,0.3)'
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#a5b4fc',
            fontSize: '0.9rem'
          }}>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            {iterations.length > 0 ? 'Generating improved version...' : 'Starting generation...'}
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default AuditLoopVisualizer;
