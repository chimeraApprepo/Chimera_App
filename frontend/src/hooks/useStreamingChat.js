/**
 * Streaming Chat Hook
 * Handles SSE streaming from backend chat API
 */

import { useState, useCallback } from 'react';
import { createChatStream } from '../services/api';

export function useStreamingChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    // Add user message immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsStreaming(true);
    setError(null);

    try {
      const response = await createChatStream(userMessage, messages);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Create assistant message placeholder
      let assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Read stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          
          if (line.startsWith('event:')) {
            const event = line.substring(6).trim();
            continue;
          }
          
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'error') {
                setError(parsed.message);
                break;
              }
            } catch {
              // Not JSON, treat as message content
              assistantMessage.content += data;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { ...assistantMessage };
                return newMessages;
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setError(err.message || 'Failed to stream response');
    } finally {
      setIsStreaming(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}

