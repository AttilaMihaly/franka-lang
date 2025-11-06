#!/usr/bin/env node

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
  res.json(spec.syntax.keywords);
});

app.get('/api/operators', (_req: Request, res: Response) => {
  res.json(spec.syntax.operators);
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
      '/api/keywords': 'Get language keywords',
      '/api/operators': 'Get operators',
      '/api/version': 'Get version information',
      '/health': 'Health check endpoint',
    },
    documentation: 'See spec/language.yaml for full specification',
  });
});

function main() {
  const args = process.argv.slice(2);
  const portArg = args.find((arg) => arg.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3000;

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
}

main();
