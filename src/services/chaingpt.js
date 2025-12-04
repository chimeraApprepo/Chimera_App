/**
 * ChainGPT Service
 * Handles all interactions with ChainGPT APIs (Chat, Generator, Auditor)
 */

import { GeneralChat } from '@chaingpt/generalchat';

export class ChainGPTService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('ChainGPT API key is required');
    }
    
    this.chat = new GeneralChat({ apiKey });
    this.apiKey = apiKey;
  }

  /**
   * Create a streaming chat response with context injection
   * @param {string} question - User's question
   * @param {Object} context - Blockchain context (gas prices, block numbers, etc.)
   * @param {Array} chatHistory - Previous conversation history
   * @returns {AsyncIterator} Stream of response chunks
   */
  async *createChatStream(question, context = {}, chatHistory = []) {
    try {
      // Inject blockchain context into the prompt
      const contextualizedQuestion = this.injectContext(question, context);
      
      console.log('[ChainGPT] Streaming chat request:', {
        question: question.substring(0, 100),
        hasContext: Object.keys(context).length > 0,
        historyLength: chatHistory.length
      });

      const stream = await this.chat.createChatStream({
        question: contextualizedQuestion,
        chatHistory: chatHistory.length > 0 ? 'on' : 'off',
        useCustomContext: Object.keys(context).length > 0,
        contextInjection: context.customContext || {}
      });

      // Stream chunks to the client
      for await (const chunk of stream) {
        yield chunk.toString();
      }
      
      console.log('[ChainGPT] Stream completed');
    } catch (error) {
      console.error('[ChainGPT] Stream error:', error.message);
      throw new Error(`ChainGPT streaming failed: ${error.message}`);
    }
  }

  /**
   * Get a complete chat response (non-streaming)
   * @param {string} question - User's question
   * @param {Object} context - Blockchain context
   * @returns {Promise<Object>} Complete response
   */
  async createChatBlob(question, context = {}) {
    try {
      const contextualizedQuestion = this.injectContext(question, context);
      
      console.log('[ChainGPT] Blob chat request:', question.substring(0, 100));

      const response = await this.chat.createChatBlob({
        question: contextualizedQuestion,
        chatHistory: 'off',
        useCustomContext: Object.keys(context).length > 0,
        contextInjection: context.customContext || {}
      });

      return {
        success: true,
        data: response.data.bot,
        raw: response
      };
    } catch (error) {
      console.error('[ChainGPT] Blob error:', error.message);
      throw new Error(`ChainGPT request failed: ${error.message}`);
    }
  }

  /**
   * Generate a smart contract from natural language
   * @param {string} prompt - Contract description
   * @returns {AsyncIterator} Stream of generated code
   */
  async *generateContractStream(prompt) {
    try {
      console.log('[ChainGPT] Generating contract:', prompt.substring(0, 100));
      
      // Note: Using REST API directly since SDK might not be available
      const response = await fetch('https://api.chaingpt.org/chat/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'smart_contract_generator',
          question: prompt,
          chatHistory: 'off'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
      
      console.log('[ChainGPT] Contract generation completed');
    } catch (error) {
      console.error('[ChainGPT] Generation error:', error.message);
      throw new Error(`Contract generation failed: ${error.message}`);
    }
  }

  /**
   * Audit a smart contract for vulnerabilities
   * @param {string} code - Solidity code to audit
   * @returns {Promise<Object>} Audit report
   */
  async auditContract(code) {
    try {
      console.log('[ChainGPT] Auditing contract...');
      
      const response = await fetch('https://api.chaingpt.org/chat/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'smart_contract_auditor',
          question: `Audit the following Solidity contract:\n\n${code}`,
          chatHistory: 'off'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Collect full response
      let auditReport = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        auditReport += decoder.decode(value, { stream: true });
      }

      console.log('[ChainGPT] Audit completed');
      
      return {
        success: true,
        report: auditReport,
        score: this.extractAuditScore(auditReport)
      };
    } catch (error) {
      console.error('[ChainGPT] Audit error:', error.message);
      throw new Error(`Contract audit failed: ${error.message}`);
    }
  }

  /**
   * Inject blockchain context into user prompts
   * @param {string} question - Original question
   * @param {Object} context - Context data
   * @returns {string} Contextualized question
   */
  injectContext(question, context) {
    if (!context || Object.keys(context).length === 0) {
      return question;
    }

    const contextParts = [];
    
    if (context.timestamp) {
      contextParts.push(`Current Time: ${new Date(context.timestamp).toISOString()}`);
    }
    
    if (context.blockNumber) {
      contextParts.push(`BNB Chain Block: ${context.blockNumber}`);
    }
    
    if (context.gasPrice) {
      contextParts.push(`Gas Price: ${context.gasPrice} Gwei`);
    }

    if (contextParts.length === 0) {
      return question;
    }

    return `[System Context - ${contextParts.join(', ')}]\n\nUser: ${question}`;
  }

  /**
   * Extract audit score from audit report
   * @param {string} report - Audit report text
   * @returns {number} Score (0-100)
   */
  extractAuditScore(report) {
    // Try to extract a numerical score from the report
    const scoreMatch = report.match(/score[:\s]+(\d+)/i);
    if (scoreMatch) {
      return parseInt(scoreMatch[1]);
    }
    
    // Fallback: count severity keywords
    const critical = (report.match(/critical/gi) || []).length;
    const high = (report.match(/high severity/gi) || []).length;
    const medium = (report.match(/medium severity/gi) || []).length;
    
    // Simple scoring: deduct points for issues
    let score = 100;
    score -= critical * 30;
    score -= high * 15;
    score -= medium * 5;
    
    return Math.max(0, Math.min(100, score));
  }
}

