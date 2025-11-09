#!/usr/bin/env node

import { Command } from 'commander';
import express, { Request, Response } from 'express';
import { loadLanguageSpec } from '../shared/spec-loader';

const app = express();
const spec = loadLanguageSpec();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/spec', (_req: Request, res: Response) => {
  res.json(spec);
});

app.get('/api/spec/metadata', (_req: Request, res: Response) => {
  res.json(spec.metadata);
});

app.get('/api/spec/syntax', (_req: Request, res: Response) => {
  res.json(spec.syntax);
});

app.get('/api/spec/examples', (_req: Request, res: Response) => {
  res.json(spec.examples);
});

app.get('/api/keywords', (_req: Request, res: Response) => {
  // Return operations instead of keywords for YAML-based syntax
  res.json({
    string_operations: spec.syntax.operations.string,
    boolean_operations: spec.syntax.operations.boolean,
    control_operations: spec.syntax.operations.control,
  });
});

app.get('/api/operators', (_req: Request, res: Response) => {
  // Return operations instead of operators for YAML-based syntax
  res.json(spec.syntax.operations);
});

app.get('/api/version', (_req: Request, res: Response) => {
  res.json({
    version: spec.metadata.version,
    name: spec.metadata.name,
  });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint with API documentation
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: spec.metadata.name,
    version: spec.metadata.version,
    description: spec.metadata.description,
    endpoints: {
      '/api/spec': 'Get complete language specification',
      '/api/spec/metadata': 'Get language metadata',
      '/api/spec/syntax': 'Get syntax specification',
      '/api/spec/examples': 'Get code examples',
      '/api/keywords': 'Get language operations (string, boolean, control)',
      '/api/operators': 'Get all operations',
      '/api/version': 'Get version information',
      '/health': 'Health check endpoint',
    },
    documentation: 'See spec/language.yaml for full specification',
    syntax_format: 'Programs are written in YAML format',
  });
});

function main() {
  const spec = loadLanguageSpec();

  const program = new Command();

  program
    .name('franka-web')
    .description('Franka Web Server')
    .version(spec.metadata.version)
    .option('-p, --port <number>', 'Port to run the server on', '3000')
    .action((options) => {
      const port = parseInt(options.port, 10);

      app.listen(port, () => {
        console.log(`Franka Web Server v${spec.metadata.version}`);
        console.log(`Server running at http://localhost:${port}`);
        console.log('');
        console.log('Available endpoints:');
        console.log(`  http://localhost:${port}/              - API documentation`);
        console.log(`  http://localhost:${port}/api/spec      - Complete specification`);
        console.log(`  http://localhost:${port}/api/keywords  - Language keywords`);
        console.log(`  http://localhost:${port}/api/operators - Language operators`);
        console.log(`  http://localhost:${port}/health        - Health check`);
        console.log('');
        console.log('Press Ctrl+C to stop the server');
      });
    });

  program.parse(process.argv);
}

main();
