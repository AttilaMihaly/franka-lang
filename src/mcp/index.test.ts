import { execSync } from 'child_process';

describe('MCP Server with Commander', () => {
  const mcpPath = 'ts-node src/mcp/index.ts';

  test('should display help', () => {
    const output = execSync(`${mcpPath} --help`).toString();
    expect(output).toContain('Usage: franka-mcp');
    expect(output).toContain('Franka MCP Server');
    expect(output).toContain('-p, --port');
  });

  test('should display version', () => {
    const output = execSync(`${mcpPath} --version`).toString();
    expect(output).toContain('1.0.0');
  });
});
