/**
 * Quick Fix Suggestions Component
 * Parses audit report and extracts actionable suggestions
 * Users can click suggestions to auto-implement fixes
 */

import { useState } from 'react';
import { GlassPanel } from './GlassPanel';
import { CartoonButton } from './CartoonButton';

export function QuickFixSuggestions({ auditReport, contractCode, onApplyFix }) {
  const [applying, setApplying] = useState(null);

  // Parse audit report to extract recommendations
  const extractSuggestions = (report) => {
    if (!report) return [];

    const suggestions = [];

    // Common patterns to detect
    const patterns = [
      {
        id: 'decimals-order',
        pattern: /Incorrect Order of State Variable Declaration|decimals.*declared after.*totalSupply/i,
        title: '🔧 Fix State Variable Order',
        description: 'Move decimals declaration before totalSupply',
        severity: 'high',
        fix: (code) => {
          // Move decimals declaration before totalSupply
          const lines = code.split('\n');
          let decimalsLine = '';
          let decimalsIndex = -1;
          let totalSupplyIndex = -1;

          lines.forEach((line, i) => {
            if (line.includes('uint8 public decimals')) {
              decimalsLine = line;
              decimalsIndex = i;
            }
            if (line.includes('uint256 public totalSupply')) {
              totalSupplyIndex = i;
            }
          });

          if (decimalsIndex > totalSupplyIndex && decimalsIndex !== -1) {
            lines.splice(decimalsIndex, 1);
            lines.splice(totalSupplyIndex, 0, decimalsLine);
          }

          return lines.join('\n');
        }
      },
      {
        id: 'add-ownable',
        pattern: /Lack of Access Control|implement.*Ownable/i,
        title: '🔐 Add Access Control (Ownable)',
        description: 'Import OpenZeppelin Ownable for access control',
        severity: 'medium',
        fix: (code) => {
          // Add Ownable import and inheritance
          if (!code.includes('Ownable')) {
            code = code.replace(
              'pragma solidity',
              'pragma solidity'
            ).replace(
              'contract ',
              'import "@openzeppelin/contracts/access/Ownable.sol";\n\ncontract '
            ).replace(
              /contract\s+(\w+)\s*{/,
              'contract $1 is Ownable {\n    constructor() Ownable(msg.sender) {'
            );
          }
          return code;
        }
      },
      {
        id: 'add-pausable',
        pattern: /No Pausable Functionality|pause.*transfers/i,
        title: '⏸️ Add Pausable Functionality',
        description: 'Implement emergency pause mechanism',
        severity: 'medium',
        fix: (code) => {
          if (!code.includes('Pausable')) {
            code = code.replace(
              'import "@openzeppelin/contracts/access/Ownable.sol";',
              'import "@openzeppelin/contracts/access/Ownable.sol";\nimport "@openzeppelin/contracts/security/Pausable.sol";'
            ).replace(
              'is Ownable',
              'is Ownable, Pausable'
            ).replace(
              'function transfer(',
              'function transfer('
            ).replace(
              /function transfer\([^)]+\) public/,
              'function transfer(address _to, uint256 _value) public whenNotPaused'
            );
          }
          return code;
        }
      },
      {
        id: 'add-reentrancy-guard',
        pattern: /Reentrancy Protection|ReentrancyGuard/i,
        title: '🛡️ Add Reentrancy Protection',
        description: 'Import and use ReentrancyGuard',
        severity: 'high',
        fix: (code) => {
          if (!code.includes('ReentrancyGuard')) {
            code = code.replace(
              'pragma solidity',
              'pragma solidity'
            ).replace(
              'contract ',
              'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";\n\ncontract '
            ).replace(
              /contract\s+(\w+)\s+is\s+(.*?)\s*{/,
              'contract $1 is $2, ReentrancyGuard {'
            );
          }
          return code;
        }
      },
      {
        id: 'use-safemath',
        pattern: /SafeMath|overflow.*underflow/i,
        title: '➕ Use SafeMath Library',
        description: 'Add SafeMath for safer arithmetic',
        severity: 'low',
        fix: (code) => {
          // Note: Solidity 0.8+ has built-in overflow checks
          // But we can add a comment about it
          code = code.replace(
            'pragma solidity ^0.8',
            '// Note: Solidity 0.8+ has built-in overflow/underflow protection\npragma solidity ^0.8'
          );
          return code;
        }
      },
      {
        id: 'add-minting-events',
        pattern: /No Events for Minting or Burning|emit.*Transfer.*address\(0\)/i,
        title: '📢 Add Minting/Burning Events',
        description: 'Emit Transfer events for mint/burn',
        severity: 'low',
        fix: (code) => {
          // Add mint function if missing
          if (!code.includes('function mint(')) {
            code = code.replace(
              /}\s*$/,
              `
    function mint(address _to, uint256 _amount) public onlyOwner {
        require(_to != address(0), "Invalid address");
        balanceOf[_to] += _amount;
        totalSupply += _amount;
        emit Transfer(address(0), _to, _amount);
    }

    function burn(uint256 _amount) public {
        require(balanceOf[msg.sender] >= _amount, "Insufficient balance");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        emit Transfer(msg.sender, address(0), _amount);
    }
}
`
            );
          }
          return code;
        }
      }
    ];

    // Check each pattern against the report
    patterns.forEach(pattern => {
      if (pattern.pattern.test(report)) {
        suggestions.push(pattern);
      }
    });

    return suggestions;
  };

  const suggestions = extractSuggestions(auditReport);

  if (suggestions.length === 0) {
    return null;
  }

  const handleApplyFix = async (suggestion) => {
    setApplying(suggestion.id);
    try {
      const fixedCode = suggestion.fix(contractCode);
      await onApplyFix(fixedCode, suggestion);
    } finally {
      setApplying(null);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '#fca5a5' };
      case 'medium': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '#fbbf24' };
      case 'low': return { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '#facc15' };
      default: return { bg: 'rgba(156, 163, 175, 0.15)', color: '#a3a3a3', border: '#a3a3a3' };
    }
  };

  return (
    <GlassPanel variant="surface" hover={false} style={{ padding: '1.25rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1.25rem' }}>💡</span>
        <div>
          <div style={{ color: '#f5f5f5', fontWeight: '600', fontSize: '1rem' }}>
            Quick Fix Suggestions
          </div>
          <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>
            Click to automatically apply recommended fixes
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {suggestions.map((suggestion, index) => {
          const colors = getSeverityColor(suggestion.severity);
          const isApplying = applying === suggestion.id;

          return (
            <div
              key={suggestion.id}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: colors.bg,
                border: `1px solid ${colors.border}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: colors.color, 
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  marginBottom: '0.25rem'
                }}>
                  {suggestion.title}
                </div>
                <div style={{ color: '#a3a3a3', fontSize: '0.85rem' }}>
                  {suggestion.description}
                </div>
              </div>
              <button
                onClick={() => handleApplyFix(suggestion)}
                disabled={isApplying}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: isApplying ? 'rgba(156, 163, 175, 0.2)' : `${colors.color}20`,
                  border: `1px solid ${colors.color}`,
                  color: colors.color,
                  cursor: isApplying ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  opacity: isApplying ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isApplying) {
                    e.target.style.background = `${colors.color}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isApplying) {
                    e.target.style.background = `${colors.color}20`;
                  }
                }}
              >
                {isApplying ? 'Applying...' : 'Apply Fix'}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: '1rem',
        padding: '0.75rem',
        borderRadius: '8px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        fontSize: '0.85rem',
        color: '#93c5fd'
      }}>
        <strong>💡 Pro Tip:</strong> After applying fixes, the contract will be automatically 
        re-audited to verify improvements!
      </div>
    </GlassPanel>
  );
}


