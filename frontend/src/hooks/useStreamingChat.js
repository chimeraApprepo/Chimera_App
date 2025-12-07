/**
 * Streaming Chat Hook
 * Handles SSE streaming from backend chat API
 */

import { useState, useCallback } from 'react';
import { createChatStream } from '../services/api';

/**
 * Intelligently join streaming chunks with proper spacing
 * LLM streams often return word tokens without spaces between them
 */
function joinChunkWithSpacing(currentContent, newChunk) {
  // If the content is empty, just return the new chunk
  if (!currentContent) {
    return newChunk;
  }
  
  // If the new chunk is empty, return current content
  if (!newChunk) {
    return currentContent;
  }
  
  const lastChar = currentContent.slice(-1);
  const firstChar = newChunk.charAt(0);
  
  // Characters that should NOT have a space before them
  const noSpaceBefore = /^[.,!?;:)\]}"'%\-\n\r]/;
  
  // Characters that should NOT have a space after them
  const noSpaceAfter = /[(\[{"'\-\n\r]$/;
  
  // If the last char is already a space or newline, don't add another
  if (/\s$/.test(lastChar)) {
    return currentContent + newChunk;
  }
  
  // If the first char of the new chunk is punctuation or special, don't add space
  if (noSpaceBefore.test(firstChar)) {
    return currentContent + newChunk;
  }
  
  // If the last char is an opening bracket/quote, don't add space
  if (noSpaceAfter.test(lastChar)) {
    return currentContent + newChunk;
  }
  
  // If the first character of new chunk is a space, don't add another
  if (/^\s/.test(firstChar)) {
    return currentContent + newChunk;
  }
  
  // If both are alphanumeric or the chunk looks like a word, add a space
  const isLastCharAlphanumeric = /[a-zA-Z0-9]$/.test(lastChar);
  const isFirstCharAlphanumeric = /^[a-zA-Z0-9]/.test(firstChar);
  
  if (isLastCharAlphanumeric && isFirstCharAlphanumeric) {
    return currentContent + ' ' + newChunk;
  }
  
  // Default: concatenate directly
  return currentContent + newChunk;
}

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
              // Use intelligent spacing to join chunks properly
              assistantMessage.content = joinChunkWithSpacing(assistantMessage.content, data);
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

