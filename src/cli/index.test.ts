import { execSync } from 'child_process';

describe('CLI with Commander', () => {
  const cliPath = 'ts-node src/cli/index.ts';

  test('should display help', () => {
    const output = execSync(`${cliPath} --help`).toString();
    expect(output).toContain('Usage: franka');
    expect(output).toContain('Commands:');
    expect(output).toContain('run <file>');
    expect(output).toContain('check <file>');
    expect(output).toContain('repl');
  });

  test('should display version', () => {
    const output = execSync(`${cliPath} --version`).toString();
    expect(output).toContain('1.0.0');
  });

  test('should show error for missing file in run command', () => {
    try {
      execSync(`${cliPath} run nonexistent.yaml`, { stdio: 'pipe' });
      fail('Should have thrown an error');
    } catch (error: any) {
      const output = error.stderr.toString() + error.stdout.toString();
      expect(output).toContain('File not found');
    }
  });

  test('should show error for missing file in check command', () => {
    try {
      execSync(`${cliPath} check nonexistent.yaml`, { stdio: 'pipe' });
      fail('Should have thrown an error');
    } catch (error: any) {
      const output = error.stderr.toString() + error.stdout.toString();
      expect(output).toContain('File not found');
    }
  });

  test('should start REPL', () => {
    const output = execSync(`${cliPath} repl`).toString();
    expect(output).toContain('Starting Franka REPL');
    expect(output).toContain('REPL not yet implemented');
  });
});
