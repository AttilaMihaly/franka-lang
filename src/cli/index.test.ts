import { execSync } from 'child_process';
import { runFile, checkFile, startRepl } from './index';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI with Commander', () => {
  const cliPath = 'ts-node src/cli/index.ts';

  test('should display help', () => {
    const output = execSync(`${cliPath} --help`).toString();
    expect(output).toContain('Usage: franka');
    expect(output).toContain('Commands:');
    expect(output).toContain('run');
    expect(output).toContain('<file>');
    expect(output).toContain('check');
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

describe('CLI Functions', () => {
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('runFile', () => {
    test('should throw error for non-existent file', () => {
      expect(() => runFile('nonexistent.yaml')).toThrow('File not found');
    });

    test('should run a simple hello world program', () => {
      const result = runFile(path.join(__dirname, '../../examples/hello.yaml'));
      expect(result).toBe('Hello, Franka!');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/Running Franka program:.*hello\.yaml/)
      );
    });

    test('should run a module with specific function', () => {
      const result = runFile(path.join(__dirname, '../../examples/multi-function.yaml'), 'greet');
      expect(result).toBe('Hello, World!');
      expect(mockConsoleLog).toHaveBeenCalledWith('Function: greet');
    });

    test('should run a module with default function', () => {
      const result = runFile(path.join(__dirname, '../../examples/multi-function.yaml'));
      expect(result).toBeDefined();
    });

    test('should throw error for invalid YAML syntax', () => {
      const tempFile = path.join(__dirname, '../../tmp-test-invalid.yaml');
      fs.writeFileSync(tempFile, 'invalid: yaml: content:');

      try {
        expect(() => runFile(tempFile)).toThrow();
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('checkFile', () => {
    test('should throw error for non-existent file', () => {
      expect(() => checkFile('nonexistent.yaml')).toThrow('File not found');
    });

    test('should check a valid module file', () => {
      const result = checkFile(path.join(__dirname, '../../examples/multi-function.yaml'));
      expect(result).toEqual({ hasErrors: false });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Syntax is valid'));
    });

    test('should check a specific function in a module', () => {
      const result = checkFile(path.join(__dirname, '../../examples/multi-function.yaml'), 'greet');
      expect(result).toEqual({ hasErrors: false });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Checking function'));
    });

    test('should display module metadata', () => {
      checkFile(path.join(__dirname, '../../examples/multi-function.yaml'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Module name:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Functions:'));
    });

    test('should display function with single output type', () => {
      // The greet function doesn't have an explicit output, so it won't display output info
      // Let's use get-set-basic which has multiple named outputs
      checkFile(path.join(__dirname, '../../examples/get-set-basic.yaml'), 'main');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Outputs:'));
    });

    test('should display function input count', () => {
      checkFile(path.join(__dirname, '../../examples/conditional-outputs.yaml'), 'main');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Inputs:'));
    });

    test('should display multiple outputs', () => {
      checkFile(path.join(__dirname, '../../examples/conditional-outputs.yaml'), 'main');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Outputs:'));
    });

    test('should run tests when spec file exists', () => {
      checkFile(path.join(__dirname, '../../examples/string-operations.yaml'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Running Tests'));
    });

    test('should display test results', () => {
      checkFile(path.join(__dirname, '../../examples/string-operations.yaml'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/Test Results:/));
    });

    test('should handle passing tests', () => {
      const result = checkFile(path.join(__dirname, '../../examples/string-operations.yaml'));
      expect(result.hasErrors).toBe(false);
    });

    test('should handle file without spec', () => {
      // Use a file that doesn't have a spec
      const tempFile = path.join(__dirname, '../../tmp-test-no-spec.yaml');
      fs.writeFileSync(
        tempFile,
        `module:
  name: Test Module
functions:
  main:
    logic: "test"
`
      );

      try {
        checkFile(tempFile);
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('No spec file found'));
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    test('should throw error for invalid module structure', () => {
      const tempFile = path.join(__dirname, '../../tmp-test-invalid-structure.yaml');
      fs.writeFileSync(
        tempFile,
        `
notmodule:
  name: Test
functions:
  test:
    logic: "hello"
`
      );

      try {
        expect(() => checkFile(tempFile)).toThrow();
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    test('should handle checking all functions in a module', () => {
      checkFile(path.join(__dirname, '../../examples/multi-function.yaml'));
      // Should list all functions without specifying one
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/greet/));
    });

    test('should detect and report failing tests', () => {
      // Create a temporary module with a failing test
      const tempModule = '/tmp/test-module-fail.yaml';
      const tempSpec = '/tmp/test-module-fail.spec.yaml';

      fs.writeFileSync(
        tempModule,
        `module:
  name: Test Module
functions:
  main:
    logic: "actual output"
`
      );

      fs.writeFileSync(
        tempSpec,
        `functions:
  main:
    tests:
      - description: "Should fail"
        expectedOutput: "expected output"
`
      );

      try {
        expect(() => checkFile(tempModule)).toThrow('Checks failed');
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/Test.*failed/));
      } finally {
        if (fs.existsSync(tempModule)) fs.unlinkSync(tempModule);
        if (fs.existsSync(tempSpec)) fs.unlinkSync(tempSpec);
      }
    });

    test('should handle errors during test execution', () => {
      // Create a module with invalid logic
      const tempModule = '/tmp/test-module-error.yaml';
      const tempSpec = '/tmp/test-module-error.spec.yaml';

      fs.writeFileSync(
        tempModule,
        `module:
  name: Test Module
functions:
  main:
    logic:
      invalid_operation: "test"
`
      );

      fs.writeFileSync(
        tempSpec,
        `functions:
  main:
    tests:
      - expectedOutput: "anything"
`
      );

      try {
        expect(() => checkFile(tempModule)).toThrow();
      } finally {
        if (fs.existsSync(tempModule)) fs.unlinkSync(tempModule);
        if (fs.existsSync(tempSpec)) fs.unlinkSync(tempSpec);
      }
    });

    test('should display single output type for function', () => {
      const tempFile = '/tmp/test-single-output.yaml';
      fs.writeFileSync(
        tempFile,
        `module:
  name: Test Module
functions:
  test:
    output:
      type: string
    logic: "test"
`
      );

      try {
        checkFile(tempFile, 'test');
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Output: 1'));
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }
    });

    test('should display logic present status', () => {
      const tempFile = '/tmp/test-logic-present.yaml';
      fs.writeFileSync(
        tempFile,
        `module:
  name: Test Module
functions:
  test:
    logic: "test"
`
      );

      try {
        checkFile(tempFile, 'test');
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Logic: present'));
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }
    });
  });

  describe('startRepl', () => {
    test('should display REPL message', () => {
      startRepl();
      expect(mockConsoleLog).toHaveBeenCalledWith('Starting Franka REPL...');
      expect(mockConsoleLog).toHaveBeenCalledWith('Note: REPL not yet implemented.');
    });
  });
});
