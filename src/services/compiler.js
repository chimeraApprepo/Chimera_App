/**
 * Solidity Compiler Service
 * Compiles Solidity code to bytecode for deployment
 */

import solc from 'solc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CompilerService {
  /**
   * Find imports callback for OpenZeppelin contracts
   */
  findImports(importPath) {
    try {
      // Try to resolve OpenZeppelin contracts
      if (importPath.startsWith('@openzeppelin/')) {
        const contractPath = path.join(
          __dirname,
          '../../node_modules',
          importPath
        );
        
        if (fs.existsSync(contractPath)) {
          const contents = fs.readFileSync(contractPath, 'utf8');
          return { contents };
        }
      }
      
      return { error: 'File not found' };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Compile Solidity source code
   * @param {string} source - Solidity source code
   * @param {string} contractName - Name of the contract to compile
   * @returns {Promise<Object>} Compiled contract with bytecode and ABI
   */
  async compile(source, contractName = null) {
    try {
      console.log('[Compiler] Compiling Solidity code...');
      
      // Auto-detect contract name if not provided
      if (!contractName) {
        const match = source.match(/contract\s+(\w+)/);
        if (match) {
          contractName = match[1];
        } else {
          throw new Error('Could not detect contract name');
        }
      }

      // Prepare compiler input
      const input = {
        language: 'Solidity',
        sources: {
          'contract.sol': {
            content: source
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };

      // Compile with import callback
      const output = JSON.parse(
        solc.compile(JSON.stringify(input), {
          import: this.findImports.bind(this)
        })
      );

      // Check for errors
      if (output.errors) {
        const errors = output.errors.filter(err => err.severity === 'error');
        if (errors.length > 0) {
          console.error('[Compiler] Compilation errors:', errors);
          throw new Error(`Compilation failed: ${errors[0].message}`);
        }
        
        // Log warnings
        const warnings = output.errors.filter(err => err.severity === 'warning');
        if (warnings.length > 0) {
          console.warn('[Compiler] Warnings:', warnings.map(w => w.message));
        }
      }

      // Extract compiled contract
      const contract = output.contracts['contract.sol'][contractName];
      
      if (!contract) {
        throw new Error(`Contract ${contractName} not found in compilation output`);
      }

      const bytecode = contract.evm.bytecode.object;
      const abi = contract.abi;

      if (!bytecode || bytecode === '0x') {
        throw new Error('Compilation produced empty bytecode');
      }

      console.log('[Compiler] Compilation successful:', {
        contractName,
        bytecodeLength: bytecode.length,
        abiLength: abi.length
      });

      return {
        success: true,
        contractName,
        bytecode: '0x' + bytecode,
        abi,
        deployedBytecode: '0x' + contract.evm.deployedBytecode.object
      };
    } catch (error) {
      console.error('[Compiler] Compilation error:', error.message);
      throw new Error(`Compilation failed: ${error.message}`);
    }
  }

  /**
   * Extract constructor parameters from ABI
   * @param {Array} abi - Contract ABI
   * @returns {Array} Constructor parameters
   */
  getConstructorParams(abi) {
    const constructor = abi.find(item => item.type === 'constructor');
    return constructor ? constructor.inputs : [];
  }

  /**
   * Validate Solidity source code
   * @param {string} source - Solidity source code
   * @returns {Object} Validation result
   */
  validate(source) {
    const issues = [];

    // Check for SPDX license
    if (!source.includes('SPDX-License-Identifier')) {
      issues.push({
        severity: 'warning',
        message: 'Missing SPDX license identifier'
      });
    }

    // Check for pragma
    if (!source.includes('pragma solidity')) {
      issues.push({
        severity: 'error',
        message: 'Missing pragma solidity statement'
      });
    }

    // Check for contract definition
    if (!source.includes('contract ')) {
      issues.push({
        severity: 'error',
        message: 'No contract definition found'
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
}

// Export singleton instance
export const compiler = new CompilerService();

