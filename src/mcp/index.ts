#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadLanguageSpec } from '../shared/spec-loader';

async function main() {
  const spec = loadLanguageSpec();

  // Create MCP server using the official SDK
  const server = new McpServer({
    name: spec.metadata.name,
    version: spec.metadata.version,
  });

  // Register tools for language operations

  // Tool: Get language keywords and operations
  server.registerTool(
    'get-keywords',
    {
      title: 'Get Language Keywords',
      description: 'Get all language operations and keywords',
      inputSchema: {},
      outputSchema: {
        operations: z.record(z.array(z.any())),
        string_operations: z.array(z.any()),
        boolean_operations: z.array(z.any()),
        control_operations: z.array(z.any()),
      },
    },
    async () => {
      const output = {
        operations: spec.syntax.operations,
        string_operations: spec.syntax.operations.string,
        boolean_operations: spec.syntax.operations.boolean,
        control_operations: spec.syntax.operations.control,
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  // Tool: Check syntax of Franka code
  server.registerTool(
    'check-syntax',
    {
      title: 'Check Syntax',
      description: 'Validate Franka code (YAML format)',
      inputSchema: {
        code: z.string().describe('The Franka code to validate'),
      },
      outputSchema: {
        valid: z.boolean(),
        message: z.string(),
        warnings: z.array(z.string()),
        errors: z.array(z.string()),
      },
    },
    async ({ code: _code }) => {
      // Placeholder for syntax checking
      // In a real implementation, this would parse and validate the code
      const output = {
        valid: true,
        message: 'Syntax checking not yet fully implemented',
        warnings: [] as string[],
        errors: [] as string[],
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    }
  );

  // Register resources for language specification

  // Resource: Complete language syntax
  server.registerResource(
    'syntax',
    'franka://spec/syntax',
    {
      title: 'Language Syntax',
      description: 'Complete Franka language syntax specification',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec.syntax, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Resource: Language examples
  server.registerResource(
    'examples',
    'franka://spec/examples',
    {
      title: 'Language Examples',
      description: 'Franka code examples demonstrating language features',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec.examples, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Resource: Language metadata
  server.registerResource(
    'metadata',
    'franka://spec/metadata',
    {
      title: 'Language Metadata',
      description: 'Franka language metadata and version information',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec.metadata, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Resource: Complete language specification
  server.registerResource(
    'spec',
    'franka://spec/complete',
    {
      title: 'Complete Language Specification',
      description: 'Full Franka language specification',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(spec, null, 2),
          mimeType: 'application/json',
        },
      ],
    })
  );

  // Connect to stdio transport for MCP communication
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('Franka MCP Server started');
  console.error(`Version: ${spec.metadata.version}`);
  console.error('Transport: stdio');
  console.error('');
  console.error('Available tools:');
  console.error('  - get-keywords: Get language operations and keywords');
  console.error('  - check-syntax: Validate Franka code');
  console.error('');
  console.error('Available resources:');
  console.error('  - franka://spec/syntax: Language syntax specification');
  console.error('  - franka://spec/examples: Code examples');
  console.error('  - franka://spec/metadata: Language metadata');
  console.error('  - franka://spec/complete: Complete specification');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
