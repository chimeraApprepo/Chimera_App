/**
 * Chat Interface Component
 * Main chat UI with message history and input
 */

import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { useStreamingChat } from '../hooks/useStreamingChat';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, isStreaming, error, sendMessage, clearMessages } = useStreamingChat();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px', border: '1px solid #ccc', borderRadius: '8px' }}>
      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>The Sovereign Architect</h2>
        {messages.length > 0 && (
          <button onClick={clearMessages} style={{ fontSize: '0.85rem' }}>
            Clear Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
            <p>Welcome! Ask me anything about smart contracts, DeFi, or blockchain development.</p>
            <p style={{ fontSize: '0.9rem' }}>Try: "Generate an ERC-20 token contract"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '0.75rem',
              borderRadius: '8px',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#f0f0f0',
              color: msg.role === 'user' ? 'white' : 'black',
            }}
          >
            <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>
              {msg.role === 'user' ? 'You' : 'Agent'}
            </div>
            <div
              dangerouslySetInnerHTML={{
                __html: marked(msg.content || '...')
              }}
              style={{ fontSize: '0.95rem' }}
            />
          </div>
        ))}
        
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
            Error: {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid #ccc', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          disabled={isStreaming}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isStreaming ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isStreaming ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

