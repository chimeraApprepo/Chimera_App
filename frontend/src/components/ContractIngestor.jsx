/**
 * Contract Ingestor Component
 * Analyzes existing deployed contracts
 */

import { useState } from 'react';
import { CartoonButton } from './CartoonButton';

export function ContractIngestor() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/contract/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <span className="text-3xl">🔍</span>
        Contract Analyzer
      </h2>
      <p className="text-gray-400 mb-6">
        Analyze any deployed contract on BSC Testnet
      </p>

      {/* Input */}
      <div className="mb-6">
        <label className="block text-gray-300 mb-2 text-sm">Contract Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="w-full p-4 rounded-xl text-white text-lg"
          style={{ 
            backgroundColor: '#252542',
            border: '2px solid #333'
          }}
        />
      </div>

      <CartoonButton
        label={loading ? 'Analyzing...' : '🔍 Analyze Contract'}
        color="bg-cyan-400"
        onClick={handleAnalyze}
        disabled={loading || !address}
      />

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div className="text-red-400 font-semibold">Error</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Basic Info Card */}
          <div className="rounded-xl p-4" style={{ backgroundColor: '#252542' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-gray-400 text-sm">Contract Type</div>
                <div className="text-xl font-bold text-white">
                  {result.contractType || 'Unknown'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">Bytecode Size</div>
                <div className="text-amber-400 font-mono">{result.bytecodeSize} bytes</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {result.isContract ? (
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                  ✓ Smart Contract
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
                  EOA (Not Contract)
                </span>
              )}
              {result.verified && (
                <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                  ✓ Verified on BSCScan
                </span>
              )}
              {result.interfaces?.map(iface => (
                <span key={iface} className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                  {iface}
                </span>
              ))}
            </div>
          </div>

          {/* Token Info */}
          {result.tokenInfo && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#252542' }}>
              <div className="text-gray-400 text-sm mb-2">Token Info</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="text-white font-semibold">{result.tokenInfo.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Symbol</div>
                  <div className="text-amber-400 font-semibold">{result.tokenInfo.symbol}</div>
                </div>
                {result.tokenInfo.totalSupply && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">Total Supply</div>
                    <div className="text-white font-mono text-sm">{result.tokenInfo.totalSupply}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Functions */}
          {result.functions && result.functions.length > 0 && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#252542' }}>
              <div className="text-gray-400 text-sm mb-3">Functions ({result.functions.length})</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.functions.map((fn, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      fn.stateMutability === 'view' || fn.stateMutability === 'pure' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {fn.stateMutability}
                    </span>
                    <code className="text-gray-300 font-mono text-xs">{fn.signature}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Code */}
          {result.sourceCode && (
            <details className="rounded-xl p-4" style={{ backgroundColor: '#252542' }}>
              <summary className="text-gray-400 text-sm cursor-pointer">
                View Source Code
              </summary>
              <pre className="mt-3 p-3 rounded-lg text-xs overflow-auto max-h-64 text-gray-300"
                   style={{ backgroundColor: '#1a1a2e' }}>
                {result.sourceCode}
              </pre>
            </details>
          )}

          {/* Links */}
          <div className="flex gap-4">
            <a 
              href={result.links?.bscScan}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 text-sm"
            >
              View on BSCScan →
            </a>
            {result.verified && (
              <a 
                href={result.links?.bscScanCode}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 text-sm"
              >
                View Code →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

