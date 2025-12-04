/**
 * Audit Loop Service
 * Self-correcting contract generation with automatic auditing
 */

import { ChainGPTService } from './chaingpt.js';
import config from '../config/index.js';

export class AuditLoopService {
  constructor(apiKey, auditScoreThreshold = 80) {
    this.chaingpt = new ChainGPTService(apiKey);
    this.threshold = auditScoreThreshold;
  }

  /**
   * Generate contract with automatic audit loop
   * @param {string} prompt - Generation prompt
   * @param {number} maxRetries - Maximum retry attempts
   * @yields {Object} Progress updates
   */
  async *generateWithAudit(prompt, maxRetries = 3) {
    let currentPrompt = prompt;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        yield {
          type: 'attempt',
          attempt,
          maxRetries,
          message: `Generation attempt ${attempt}/${maxRetries}`
        };

        // Generate contract
        yield { type: 'status', message: 'Generating contract...' };
        
        let generatedCode = '';
        for await (const chunk of this.chaingpt.generateContractStream(currentPrompt)) {
          generatedCode += chunk;
          yield { type: 'code_chunk', data: chunk };
        }

        yield {
          type: 'code_complete',
          code: generatedCode,
          message: 'Contract generated successfully'
        };

        // Audit the generated code
        yield { type: 'status', message: 'Auditing contract...' };
        
        const auditResult = await this.chaingpt.auditContract(generatedCode);

        yield {
          type: 'audit_complete',
          score: auditResult.score,
          report: auditResult.report,
          message: `Audit score: ${auditResult.score}%`
        };

        // Check if audit passed
        if (auditResult.score >= this.threshold) {
          yield {
            type: 'success',
            code: generatedCode,
            audit: auditResult,
            message: `Contract passed audit with score ${auditResult.score}%`
          };
          return;
        }

        // Audit failed - prepare for retry
        if (attempt < maxRetries) {
          yield {
            type: 'retry',
            attempt,
            score: auditResult.score,
            message: `Score ${auditResult.score}% below threshold ${this.threshold}%. Regenerating...`
          };

          // Extract issues from audit report for feedback
          const issues = this.extractIssues(auditResult.report);
          currentPrompt = this.createFeedbackPrompt(prompt, generatedCode, issues);
        } else {
          // Max retries reached
          yield {
            type: 'failed',
            code: generatedCode,
            audit: auditResult,
            message: `Could not generate safe contract after ${maxRetries} attempts. Best score: ${auditResult.score}%`
          };
        }

      } catch (error) {
        console.error('[AuditLoop] Error:', error);
        yield {
          type: 'error',
          attempt,
          message: error.message,
          error: error
        };
        
        if (attempt >= maxRetries) {
          throw error;
        }
      }
    }
  }

  /**
   * Extract security issues from audit report
   * @param {string} report - Audit report text
   * @returns {Array<string>} List of issues
   */
  extractIssues(report) {
    const issues = [];
    
    // Look for common vulnerability patterns
    const patterns = [
      /critical[:\s]+([^\n]+)/gi,
      /high severity[:\s]+([^\n]+)/gi,
      /medium severity[:\s]+([^\n]+)/gi,
      /vulnerability[:\s]+([^\n]+)/gi,
      /issue[:\s]+([^\n]+)/gi,
      /warning[:\s]+([^\n]+)/gi
    ];

    for (const pattern of patterns) {
      const matches = report.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          issues.push(match[1].trim());
        }
      }
    }

    // If no specific issues found, extract first few sentences
    if (issues.length === 0) {
      const sentences = report.split('.').slice(0, 3);
      issues.push(...sentences.filter(s => s.trim().length > 10));
    }

    return issues.slice(0, 5); // Limit to top 5 issues
  }

  /**
   * Create feedback prompt for regeneration
   * @param {string} originalPrompt - Original user prompt
   * @param {string} previousCode - Previously generated code
   * @param {Array<string>} issues - Identified issues
   * @returns {string} Enhanced prompt
   */
  createFeedbackPrompt(originalPrompt, previousCode, issues) {
    const issuesList = issues.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n');
    
    return `${originalPrompt}

IMPORTANT: The previous generation had the following security issues that MUST be fixed:
${issuesList}

Please generate a corrected version that addresses all these issues while maintaining the original requirements.
Focus on security best practices and avoid common vulnerabilities.`;
  }

  /**
   * Generate contract without audit (direct generation)
   * @param {string} prompt - Generation prompt
   * @yields {string} Code chunks
   */
  async *generateDirect(prompt) {
    for await (const chunk of this.chaingpt.generateContractStream(prompt)) {
      yield chunk;
    }
  }

  /**
   * Audit existing contract
   * @param {string} code - Contract code
   * @returns {Promise<Object>} Audit result
   */
  async auditOnly(code) {
    return await this.chaingpt.auditContract(code);
  }
}

// Create singleton instance
export const auditLoop = new AuditLoopService(
  config.chaingpt.apiKey,
  config.features.auditScoreThreshold
);

