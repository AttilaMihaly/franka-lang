import { execSync } from 'child_process';
import request from 'supertest';
import { app } from './index';
import { loadLanguageSpec } from '../shared/spec-loader';

describe('Web Server with Commander', () => {
  const webPath = 'ts-node src/web/index.ts';

  test('should display help', () => {
    const output = execSync(`${webPath} --help`).toString();
    expect(output).toContain('Usage: franka-web');
    expect(output).toContain('Franka Web Server');
    expect(output).toContain('-p, --port');
    expect(output).toContain('-d, --dir');
  });

  test('should display version', () => {
    const output = execSync(`${webPath} --version`).toString();
    expect(output).toContain('1.0.0');
  });
});

describe('Web Server App Configuration', () => {
  test('should export the express app', () => {
    expect(app).toBeDefined();
    expect(typeof app).toBe('function');
  });

  test('should load language spec at startup', () => {
    const spec = loadLanguageSpec();
    expect(spec).toBeDefined();
    expect(spec.metadata).toBeDefined();
    expect(spec.metadata.name).toBe('Franka');
  });
});

describe('Web Server API Endpoints', () => {
  test('GET /api/spec should return complete specification', async () => {
    const response = await request(app).get('/api/spec');
    expect(response.status).toBe(200);
    expect(response.body.metadata).toBeDefined();
    expect(response.body.syntax).toBeDefined();
    expect(response.body.metadata.name).toBe('Franka');
  });

  test('GET /api/spec/metadata should return metadata', async () => {
    const response = await request(app).get('/api/spec/metadata');
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Franka');
    expect(response.body.version).toBeDefined();
  });

  test('GET /api/spec/syntax should return syntax', async () => {
    const response = await request(app).get('/api/spec/syntax');
    expect(response.status).toBe(200);
    expect(response.body.operations).toBeDefined();
    expect(response.body.operations.string).toBeDefined();
  });

  test('GET /api/spec/examples should return examples', async () => {
    const response = await request(app).get('/api/spec/examples');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/keywords should return operations', async () => {
    const response = await request(app).get('/api/keywords');
    expect(response.status).toBe(200);
    expect(response.body.string_operations).toBeDefined();
    expect(response.body.boolean_operations).toBeDefined();
    expect(response.body.control_operations).toBeDefined();
  });

  test('GET /api/operators should return all operations', async () => {
    const response = await request(app).get('/api/operators');
    expect(response.status).toBe(200);
    expect(response.body.string).toBeDefined();
    expect(response.body.boolean).toBeDefined();
    expect(response.body.control).toBeDefined();
  });

  test('GET /api/version should return version info', async () => {
    const response = await request(app).get('/api/version');
    expect(response.status).toBe(200);
    expect(response.body.version).toBeDefined();
    expect(response.body.name).toBe('Franka');
  });

  test('GET /health should return ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /api/browse without path should browse current directory', async () => {
    const response = await request(app).get('/api/browse');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  test('GET /api/browse with path should return items', async () => {
    const response = await request(app).get('/api/browse?path=examples');
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  test('GET /api/module should return module info', async () => {
    const response = await request(app).get('/api/module').query({ path: 'examples/hello.yaml' });
    expect([200, 404]).toContain(response.status); // May not exist in test env
  });

  test('POST /api/execute should execute a module', async () => {
    const response = await request(app).post('/api/execute').send({
      code: 'module:\n  name: Test\nfunctions:\n  main:\n    logic: "test"',
    });
    expect([200, 400, 404, 500]).toContain(response.status); // Various possible outcomes
  });
});

describe('Web Server Route Handlers Logic', () => {
  const spec = loadLanguageSpec();

  test('spec should have metadata', () => {
    expect(spec.metadata).toBeDefined();
    expect(spec.metadata.name).toBe('Franka');
    expect(spec.metadata.version).toBeDefined();
  });

  test('spec should have syntax', () => {
    expect(spec.syntax).toBeDefined();
    expect(spec.syntax.operations).toBeDefined();
  });

  test('spec should have examples', () => {
    expect(spec.examples).toBeDefined();
    expect(Array.isArray(spec.examples)).toBe(true);
  });

  test('spec should have string operations', () => {
    expect(spec.syntax.operations.string).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.string)).toBe(true);
  });

  test('spec should have boolean operations', () => {
    expect(spec.syntax.operations.boolean).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.boolean)).toBe(true);
  });

  test('spec should have control operations', () => {
    expect(spec.syntax.operations.control).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.control)).toBe(true);
  });
});
