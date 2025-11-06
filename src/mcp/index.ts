#!/usr/bin/env node

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
      keywords: this.spec.syntax.keywords,
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
    console.log('  - getKeywords: Get language keywords');
    console.log('  - getSyntax: Get complete syntax specification');
    console.log('  - getExamples: Get code examples');
    console.log('  - checkSyntax: Validate Franka code');
    console.log('');
    console.log('Note: Full MCP protocol implementation is a placeholder.');
    console.log('This provides the basic structure for future implementation.');

    // In a real MCP server, we would set up a proper JSON-RPC server
    // For now, this is a demonstration of the structure
  }
}

function main() {
  const server = new FrankaMcpServer();

  const args = process.argv.slice(2);
  const portArg = args.find((arg) => arg.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3001;

  server.start(port);
}

main();
