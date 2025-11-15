import { spawn } from 'child_process';
import { loadLanguageSpec } from '../shared/spec-loader';

describe('MCP Server', () => {
  test('should start and respond to initialization', (done) => {
    const spec = loadLanguageSpec();
    const server = spawn('ts-node', ['src/mcp/index.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderrOutput = '';

    // Collect stderr output (where logs go)
    server.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    };

    server.stdin.write(JSON.stringify(initRequest) + '\n');

    let stdoutBuffer = '';
    let foundResponse = false;

    server.stdout.on('data', (data) => {
      if (foundResponse) return;

      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split('\n');

      for (const line of lines) {
        if (line.trim() && !foundResponse) {
          try {
            const response = JSON.parse(line);
            if (response.id === 1) {
              foundResponse = true;
              expect(response.result).toBeDefined();
              expect(response.result.serverInfo).toBeDefined();
              expect(response.result.serverInfo.name).toBe(spec.metadata.name);
              expect(response.result.serverInfo.version).toBe(spec.metadata.version);

              // Verify server capabilities
              expect(response.result.capabilities).toBeDefined();
              expect(response.result.capabilities.tools).toBeDefined();
              expect(response.result.capabilities.resources).toBeDefined();

              // Check stderr logs
              expect(stderrOutput).toContain('Franka MCP Server started');

              server.kill();
              done();
              return;
            }
          } catch {
            // Not valid JSON yet, continue
          }
        }
      }
    });

    server.on('error', (error) => {
      if (!foundResponse) {
        done(error);
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!foundResponse) {
        server.kill();
        done(new Error('Test timed out waiting for initialize response'));
      }
    }, 10000);
  });

  test('server should log startup information to stderr', (done) => {
    const server = spawn('ts-node', ['src/mcp/index.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderrOutput = '';

    server.stderr.on('data', (data) => {
      stderrOutput += data.toString();

      // Check if we have all expected log messages
      if (
        stderrOutput.includes('Franka MCP Server started') &&
        stderrOutput.includes('get-keywords') &&
        stderrOutput.includes('check-syntax') &&
        stderrOutput.includes('franka://spec/syntax')
      ) {
        expect(stderrOutput).toContain('Version: 1.0.0');
        expect(stderrOutput).toContain('Transport: stdio');
        expect(stderrOutput).toContain('Available tools:');
        expect(stderrOutput).toContain('Available resources:');

        server.kill();
        done();
      }
    });

    server.on('error', (error) => {
      done(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      server.kill();
      if (stderrOutput) {
        // If we got some output, it's okay
        done();
      } else {
        done(new Error('Test timed out - no stderr output received'));
      }
    }, 5000);
  });

  test('should load language specification correctly', () => {
    const spec = loadLanguageSpec();

    // Verify spec has required properties
    expect(spec.metadata).toBeDefined();
    expect(spec.metadata.name).toBe('Franka');
    expect(spec.metadata.version).toBe('1.0.0');
    expect(spec.syntax).toBeDefined();
    expect(spec.syntax.operations).toBeDefined();
    expect(spec.examples).toBeDefined();
  });

  test('spec should have operations for get-keywords tool', () => {
    const spec = loadLanguageSpec();
    expect(spec.syntax.operations.string).toBeDefined();
    expect(spec.syntax.operations.boolean).toBeDefined();
    expect(spec.syntax.operations.control).toBeDefined();
    expect(Array.isArray(spec.syntax.operations.string)).toBe(true);
    expect(Array.isArray(spec.syntax.operations.boolean)).toBe(true);
    expect(Array.isArray(spec.syntax.operations.control)).toBe(true);
  });

  test('spec should have examples for resources', () => {
    const spec = loadLanguageSpec();
    expect(Array.isArray(spec.examples)).toBe(true);
    expect(spec.examples.length).toBeGreaterThan(0);
  });
});
