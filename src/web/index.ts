#!/usr/bin/env node

import { Command } from 'commander';
import express, { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { loadLanguageSpec } from '../shared/spec-loader';
import { FrankaInterpreter } from '../shared/interpreter';
import { SpecRunner } from '../shared/spec-runner';

const app = express();
const spec = loadLanguageSpec();
let workingDirectory = process.cwd();

// Get the absolute path to the public directory
const publicPath = path.join(__dirname, '../../public');

// Middleware
app.use(express.json());
app.use(express.static(publicPath));

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

// Directory browsing API
app.get('/api/browse', (req: Request, res: Response) => {
  try {
    const relativePath = (req.query.path as string) || '';
    const fullPath = path.join(workingDirectory, relativePath);

    // Security check: ensure path is within working directory
    const normalizedPath = path.normalize(fullPath);
    const normalizedWorkingDir = path.normalize(workingDirectory);
    if (!normalizedPath.startsWith(normalizedWorkingDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if path exists and is a directory
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Path not found' });
    }

    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    // Read directory contents
    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const entries = items
      .filter((item) => {
        // Filter out hidden files
        if (item.name.startsWith('.')) return false;
        // Include directories and .yaml files (but not .spec.yaml files in the listing)
        return (
          item.isDirectory() || (item.name.endsWith('.yaml') && !item.name.endsWith('.spec.yaml'))
        );
      })
      .map((item) => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
        path: path.join(relativePath, item.name),
      }))
      .sort((a, b) => {
        // Sort directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

    res.json({
      currentPath: relativePath,
      entries,
    });
  } catch (error) {
    console.error('Error browsing directory:', error);
    res.status(500).json({ error: 'Failed to browse directory' });
  }
});

// Module details API
app.get('/api/module', (req: Request, res: Response) => {
  try {
    const relativePath = req.query.path as string;
    if (!relativePath) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    const modulePath = path.join(workingDirectory, relativePath);

    // Security check
    const normalizedPath = path.normalize(modulePath);
    const normalizedWorkingDir = path.normalize(workingDirectory);
    if (!normalizedPath.startsWith(normalizedWorkingDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(modulePath)) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Load the module
    const interpreter = new FrankaInterpreter();
    const module = interpreter.loadModule(modulePath);

    // Check for corresponding spec file
    const specPath = modulePath.replace(/\.yaml$/, '.spec.yaml');
    let specs = null;
    if (fs.existsSync(specPath)) {
      const specRunner = new SpecRunner();
      specs = specRunner.loadSpec(specPath);
    }

    res.json({
      path: relativePath,
      module,
      specs,
    });
  } catch (error) {
    console.error('Error loading module:', error);
    res.status(500).json({
      error: 'Failed to load module',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: spec.metadata.name,
    version: spec.metadata.version,
    description: spec.metadata.description,
    workingDirectory: workingDirectory,
    endpoints: {
      '/api/spec': 'Get complete language specification',
      '/api/spec/metadata': 'Get language metadata',
      '/api/spec/syntax': 'Get syntax specification',
      '/api/spec/examples': 'Get code examples',
      '/api/keywords': 'Get language operations (string, boolean, control)',
      '/api/operators': 'Get all operations',
      '/api/version': 'Get version information',
      '/api/browse?path=<path>': 'Browse directory contents',
      '/api/module?path=<path>': 'Get module details and tests',
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
    .option('-d, --dir <path>', 'Working directory to serve', process.cwd())
    .action((options) => {
      const port = parseInt(options.port, 10);
      workingDirectory = path.resolve(options.dir);

      // Validate working directory
      if (!fs.existsSync(workingDirectory)) {
        console.error(`Error: Directory does not exist: ${workingDirectory}`);
        process.exit(1);
      }

      if (!fs.statSync(workingDirectory).isDirectory()) {
        console.error(`Error: Path is not a directory: ${workingDirectory}`);
        process.exit(1);
      }

      app.listen(port, () => {
        console.log(`Franka Web Server v${spec.metadata.version}`);
        console.log(`Server running at http://localhost:${port}`);
        console.log(`Working directory: ${workingDirectory}`);
        console.log('');
        console.log('Available endpoints:');
        console.log(`  http://localhost:${port}/              - API documentation`);
        console.log(`  http://localhost:${port}/api/spec      - Complete specification`);
        console.log(`  http://localhost:${port}/api/browse    - Browse modules`);
        console.log(`  http://localhost:${port}/api/module    - Module details`);
        console.log(`  http://localhost:${port}/health        - Health check`);
        console.log('');
        console.log('Press Ctrl+C to stop the server');
      });
    });

  program.parse(process.argv);
}

main();
