import { execSync } from 'child_process';

describe('Web Server with Commander', () => {
  const webPath = 'ts-node src/web/index.ts';

  test('should display help', () => {
    const output = execSync(`${webPath} --help`).toString();
    expect(output).toContain('Usage: franka-web');
    expect(output).toContain('Franka Web Server');
    expect(output).toContain('-p, --port');
  });

  test('should display version', () => {
    const output = execSync(`${webPath} --version`).toString();
    expect(output).toContain('1.0.0');
  });
});
