import { SpecRunner } from './spec-runner';
import * as fs from 'fs';
import * as path from 'path';

describe('SpecRunner', () => {
  let runner: SpecRunner;
  const tmpDir = '/tmp/spec-runner-tests';

  beforeEach(() => {
    runner = new SpecRunner();
    // Create temporary directory for test files
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temporary files
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('loadSpec', () => {
    it('should load a valid spec file (legacy format)', () => {
      const specPath = path.join(tmpDir, 'test.spec.yaml');
      const specContent = `
tests:
  - description: "Test case 1"
    input:
      greeting: "Hi"
    expectedOutput: "Hi, World!"
`;
      fs.writeFileSync(specPath, specContent);

      const spec = runner.loadSpec(specPath);
      expect(spec.tests).toBeDefined();
      expect(spec.tests).toHaveLength(1);
      expect(spec.tests![0].description).toBe('Test case 1');
      expect(spec.tests![0].input).toEqual({ greeting: 'Hi' });
      expect(spec.tests![0].expectedOutput).toBe('Hi, World!');
    });

    it('should load a valid spec file (new format)', () => {
      const specPath = path.join(tmpDir, 'test-new.spec.yaml');
      const specContent = `
functions:
  myFunction:
    tests:
      - description: "Test case 1"
        input:
          greeting: "Hi"
        expectedOutput: "Hi, World!"
`;
      fs.writeFileSync(specPath, specContent);

      const spec = runner.loadSpec(specPath);
      expect(spec.functions).toBeDefined();
      expect(spec.functions!['myFunction']).toBeDefined();
      expect(spec.functions!['myFunction'].tests).toHaveLength(1);
      expect(spec.functions!['myFunction'].tests[0].description).toBe('Test case 1');
      expect(spec.functions!['myFunction'].tests[0].input).toEqual({ greeting: 'Hi' });
      expect(spec.functions!['myFunction'].tests[0].expectedOutput).toBe('Hi, World!');
    });

    it('should throw error for missing spec file', () => {
      expect(() => runner.loadSpec('/nonexistent/file.spec.yaml')).toThrow('Spec file not found');
    });

    it('should throw error for spec without tests or functions', () => {
      const specPath = path.join(tmpDir, 'invalid.spec.yaml');
      fs.writeFileSync(specPath, 'invalid: true\n');

      expect(() => runner.loadSpec(specPath)).toThrow('must contain either "tests" array');
    });

    it('should throw error for spec with both tests and functions', () => {
      const specPath = path.join(tmpDir, 'invalid-both.spec.yaml');
      const specContent = `
tests:
  - expectedOutput: "test"
functions:
  myFunction:
    tests:
      - expectedOutput: "test"
`;
      fs.writeFileSync(specPath, specContent);

      expect(() => runner.loadSpec(specPath)).toThrow(
        'cannot contain both "tests" and "functions"'
      );
    });

    it('should throw error for test case without expectedOutputs (legacy format)', () => {
      const specPath = path.join(tmpDir, 'invalid2.spec.yaml');
      const specContent = `
tests:
  - description: "Missing expected outputs"
    input:
      greeting: "Hi"
`;
      fs.writeFileSync(specPath, specContent);

      expect(() => runner.loadSpec(specPath)).toThrow('must contain "expectedOutput"');
    });

    it('should throw error for test case without expectedOutputs (new format)', () => {
      const specPath = path.join(tmpDir, 'invalid3.spec.yaml');
      const specContent = `
functions:
  myFunction:
    tests:
      - description: "Missing expected outputs"
        input:
          greeting: "Hi"
`;
      fs.writeFileSync(specPath, specContent);

      expect(() => runner.loadSpec(specPath)).toThrow('must contain "expectedOutput"');
    });

    it('should throw error for invalid functions structure', () => {
      const specPath = path.join(tmpDir, 'invalid4.spec.yaml');
      const specContent = `
functions:
  myFunction: "invalid"
`;
      fs.writeFileSync(specPath, specContent);

      expect(() => runner.loadSpec(specPath)).toThrow('must be an object');
    });

    it('should throw error for function without tests array', () => {
      const specPath = path.join(tmpDir, 'invalid5.spec.yaml');
      const specContent = `
functions:
  myFunction:
    invalid: true
`;
      fs.writeFileSync(specPath, specContent);

      expect(() => runner.loadSpec(specPath)).toThrow('must contain a "tests" array');
    });
  });

  describe('findSpecFile', () => {
    it('should find spec file with .spec.yaml extension', () => {
      const programPath = path.join(tmpDir, 'hello.yaml');
      const specPath = path.join(tmpDir, 'hello.spec.yaml');

      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');
      fs.writeFileSync(specPath, 'tests: []\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBe(specPath);
    });

    it('should find spec file with .spec.yml extension', () => {
      const programPath = path.join(tmpDir, 'hello.yaml');
      const specPath = path.join(tmpDir, 'hello.spec.yml');

      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');
      fs.writeFileSync(specPath, 'tests: []\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBe(specPath);
    });

    it('should return null if spec file does not exist', () => {
      const programPath = path.join(tmpDir, 'hello.yaml');
      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBeNull();
    });

    it('should handle program files with .yml extension', () => {
      const programPath = path.join(tmpDir, 'hello.yml');
      const specPath = path.join(tmpDir, 'hello.spec.yaml');

      fs.writeFileSync(programPath, 'program:\n  name: "Test"\nlogic: "Hello"\n');
      fs.writeFileSync(specPath, 'tests: []\n');

      const found = runner.findSpecFile(programPath);
      expect(found).toBe(specPath);
    });
  });

  describe('runTest', () => {
    it('should pass a test with matching outputs', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: { get: 'greeting' },
      };

      const testCase = {
        description: 'Test with Hi',
        input: { greeting: 'Hi' },
        expectedOutput: 'Hi',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(true);
      expect(result.description).toBe('Test with Hi');
    });

    it('should fail a test with mismatched outputs', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: { get: 'greeting' },
      };

      const testCase = {
        description: 'Test with mismatch',
        input: { greeting: 'Hi' },
        expectedOutput: 'Hello',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(false);
      expect(result.error).toBe('Output mismatch');
      expect(result.expected).toBe('Hello');
      expect(result.actual).toBe('Hi');
    });

    it('should fail a test when program throws error', () => {
      const program = {
        program: { name: 'Test' },
        logic: { get: 'nonexistent' },
      };

      const testCase = {
        expectedOutput: 'anything',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(false);
      expect(result.error).toContain('Undefined variable');
    });

    it('should test programs with multiple outputs', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          name: {
            type: 'string' as const,
            default: 'World',
          },
        },
        output: {
          greeting: { type: 'string' as const },
          length: { type: 'number' as const },
        },
        logic: {
          let: {
            msg: { concat: ['Hello, ', { get: 'name' }] },
          },
          in: {
            set: {
              greeting: { get: 'msg' },
              length: { length: { get: 'msg' } },
            },
          },
        },
      };

      const testCase = {
        input: { name: 'Franka' },
        expectedOutput: {
          greeting: 'Hello, Franka',
          length: 13,
        },
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(true);
    });

    it('should handle test without inputs', () => {
      const program = {
        program: { name: 'Test' },
        logic: 'Hello, World!',
      };

      const testCase = {
        expectedOutput: 'Hello, World!',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(true);
    });

    it('should fail when test input is not declared in program', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: { get: 'greeting' },
      };

      const testCase = {
        input: { undeclared: 'value' },
        expectedOutput: 'anything',
      };

      const result = runner.runTest(program, testCase);
      expect(result.passed).toBe(false);
      expect(result.error).toContain('not declared in the program');
    });
  });

  describe('runAllTests', () => {
    it('should run all tests in a spec file (legacy format)', () => {
      const programPath = path.join(tmpDir, 'program.yaml');
      const specPath = path.join(tmpDir, 'program.spec.yaml');

      const programContent = `
program:
  name: "Echo"
  description: "Echoes the input"

input:
  message:
    type: string
    default: "Hello"

logic:
  get: message
`;

      const specContent = `
tests:
  - description: "Test 1"
    input:
      message: "Hi"
    expectedOutput: "Hi"
  - description: "Test 2"
    input:
      message: "World"
    expectedOutput: "World"
  - description: "Test 3 - should fail"
    input:
      message: "Fail"
    expectedOutput: "Wrong"
`;

      fs.writeFileSync(programPath, programContent);
      fs.writeFileSync(specPath, specContent);

      const results = runner.runAllTests(programPath, specPath);
      expect(results).toHaveLength(3);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(true);
      expect(results[2].passed).toBe(false);
    });

    it('should run tests for a specific function in a module (new format)', () => {
      const modulePath = path.join(tmpDir, 'module.yaml');
      const specPath = path.join(tmpDir, 'module.spec.yaml');

      const moduleContent = `
module:
  name: "Test Module"
  description: "Module with multiple functions"

greet:
  description: "Returns a greeting"
  input:
    name:
      type: string
      default: "World"
  logic:
    concat:
      - "Hello, "
      - get: name

farewell:
  description: "Returns a farewell"
  input:
    name:
      type: string
      default: "World"
  logic:
    concat:
      - "Goodbye, "
      - get: name
`;

      const specContent = `
functions:
  greet:
    tests:
      - description: "Default greeting"
        expectedOutput: "Hello, World"
      - description: "Custom greeting"
        input:
          name: "Franka"
        expectedOutput: "Hello, Franka"
  farewell:
    tests:
      - description: "Default farewell"
        expectedOutput: "Goodbye, World"
      - description: "Custom farewell"
        input:
          name: "Franka"
        expectedOutput: "Goodbye, Franka"
`;

      fs.writeFileSync(modulePath, moduleContent);
      fs.writeFileSync(specPath, specContent);

      // Run tests for specific function
      const greetResults = runner.runAllTests(modulePath, specPath, 'greet');
      expect(greetResults).toHaveLength(2);
      expect(greetResults[0].passed).toBe(true);
      expect(greetResults[0].description).toBe('Default greeting');
      expect(greetResults[1].passed).toBe(true);
      expect(greetResults[1].description).toBe('Custom greeting');
    });

    it('should run tests for all functions in a module (new format)', () => {
      const modulePath = path.join(tmpDir, 'module2.yaml');
      const specPath = path.join(tmpDir, 'module2.spec.yaml');

      const moduleContent = `
module:
  name: "Test Module"
  description: "Module with multiple functions"

greet:
  description: "Returns a greeting"
  input:
    name:
      type: string
      default: "World"
  logic:
    concat:
      - "Hello, "
      - get: name

farewell:
  description: "Returns a farewell"
  input:
    name:
      type: string
      default: "World"
  logic:
    concat:
      - "Goodbye, "
      - get: name
`;

      const specContent = `
functions:
  greet:
    tests:
      - description: "Default greeting"
        expectedOutput: "Hello, World"
  farewell:
    tests:
      - description: "Default farewell"
        expectedOutput: "Goodbye, World"
`;

      fs.writeFileSync(modulePath, moduleContent);
      fs.writeFileSync(specPath, specContent);

      // Run tests for all functions (no function name specified)
      const results = runner.runAllTests(modulePath, specPath);
      expect(results).toHaveLength(2);
      expect(results[0].description).toContain('[greet]');
      expect(results[0].passed).toBe(true);
      expect(results[1].description).toContain('[farewell]');
      expect(results[1].passed).toBe(true);
    });

    it('should throw error if requested function not in spec (new format)', () => {
      const modulePath = path.join(tmpDir, 'module3.yaml');
      const specPath = path.join(tmpDir, 'module3.spec.yaml');

      const moduleContent = `
module:
  name: "Test Module"

greet:
  logic: "Hello"
`;

      const specContent = `
functions:
  greet:
    tests:
      - expectedOutput: "Hello"
`;

      fs.writeFileSync(modulePath, moduleContent);
      fs.writeFileSync(specPath, specContent);

      expect(() => runner.runAllTests(modulePath, specPath, 'nonexistent')).toThrow(
        'Function "nonexistent" not found in spec file'
      );
    });

    it('should handle missing function in module gracefully (new format)', () => {
      const modulePath = path.join(tmpDir, 'module4.yaml');
      const specPath = path.join(tmpDir, 'module4.spec.yaml');

      const moduleContent = `
module:
  name: "Test Module"

greet:
  logic: "Hello"
`;

      const specContent = `
functions:
  greet:
    tests:
      - expectedOutput: "Hello"
  missing:
    tests:
      - description: "Test for missing function"
        expectedOutput: "Won't work"
`;

      fs.writeFileSync(modulePath, moduleContent);
      fs.writeFileSync(specPath, specContent);

      const results = runner.runAllTests(modulePath, specPath);
      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(false);
      expect(results[1].description).toContain('[missing]');
      expect(results[1].error).toContain('not found in module');
    });
  });
});
