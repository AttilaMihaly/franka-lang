#!/usr/bin/env node

import { Command } from 'commander';
import { loadLanguageSpec } from '../shared/spec-loader';

interface McpRequest {
  method: string;
  params?: unknown;
  id?: string | number;
}

interface McpResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
  id?: string | number;
}

class FrankaMcpServer {
  private spec = loadLanguageSpec();

  handleRequest(request: McpRequest): McpResponse {
    const { method, params, id } = request;

    try {
      let result;

      switch (method) {
        case 'initialize':
          result = this.handleInitialize();
          break;

        case 'getCapabilities':
          result = this.handleGetCapabilities();
          break;

        case 'getKeywords':
          result = this.handleGetKeywords();
          break;

        case 'getSyntax':
          result = this.handleGetSyntax();
          break;

        case 'getExamples':
          result = this.handleGetExamples();
          break;

        case 'checkSyntax':
          result = this.handleCheckSyntax(params as { code: string });
          break;

        default:
          throw new Error(`Unknown method: ${method}`);
      }

      return { result, id };
    } catch (error) {
      return {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
        id,
      };
    }
  }

  private handleInitialize() {
    return {
      name: this.spec.metadata.name,
      version: this.spec.metadata.version,
      description: this.spec.metadata.description,
      capabilities: this.spec.tooling.mcp.capabilities,
    };
  }

  private handleGetCapabilities() {
    return {
      capabilities: this.spec.tooling.mcp.capabilities,
      description: this.spec.tooling.mcp.description,
    };
  }

  private handleGetKeywords() {
    return {
      operations: this.spec.syntax.operations,
      string_operations: this.spec.syntax.operations.string,
      boolean_operations: this.spec.syntax.operations.boolean,
      control_operations: this.spec.syntax.operations.control,
    };
  }

  private handleGetSyntax() {
    return {
      syntax: this.spec.syntax,
    };
  }

  private handleGetExamples() {
    return {
      examples: this.spec.examples,
    };
  }

  private handleCheckSyntax(_params: { code: string }) {
    // Placeholder for syntax checking
    // In a real implementation, this would parse and validate the code
    return {
      valid: true,
      message: 'Syntax checking not yet fully implemented',
      warnings: [],
      errors: [],
    };
  }

  start(port = 3001) {
    console.log(`Franka MCP Server v${this.spec.metadata.version}`);
    console.log(`Starting MCP server on port ${port}...`);
    console.log('');
    console.log('Supported methods:');
    console.log('  - initialize: Get server information');
    console.log('  - getCapabilities: Get server capabilities');
    console.log('  - getKeywords: Get language operations');
    console.log('  - getSyntax: Get complete syntax specification');
    console.log('  - getExamples: Get code examples');
    console.log('  - checkSyntax: Validate Franka code (YAML format)');
    console.log('');
    console.log('Note: Franka programs use YAML-based syntax.');
    console.log('Note: Full MCP protocol implementation is a placeholder.');
    console.log('This provides the basic structure for future implementation.');

    // In a real MCP server, we would set up a proper JSON-RPC server
    // For now, this is a demonstration of the structure
  }
}

function main() {
  const spec = loadLanguageSpec();

  const program = new Command();

  program
    .name('franka-mcp')
    .description('Franka MCP Server')
    .version(spec.metadata.version)
    .option('-p, --port <number>', 'Port to run the server on', '3001')
    .action((options) => {
      const server = new FrankaMcpServer();
      const port = parseInt(options.port, 10);
      server.start(port);
    });

  program.parse(process.argv);
}

main();
