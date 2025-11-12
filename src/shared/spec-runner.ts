import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { FrankaInterpreter, FrankaValue, FrankaProgram } from './interpreter';

export interface TestCase {
  description?: string;
  input?: Record<string, FrankaValue>;
  expectedOutput: FrankaValue | Record<string, FrankaValue>;
}

export interface ProgramSpec {
  tests: TestCase[];
}

export interface TestResult {
  passed: boolean;
  description?: string;
  error?: string;
  expected?: FrankaValue | Record<string, FrankaValue>;
  actual?: FrankaValue | Record<string, FrankaValue>;
}

export class SpecRunner {
  private interpreter: FrankaInterpreter;

  constructor() {
    this.interpreter = new FrankaInterpreter();
  }

  /**
   * Load a spec file from disk
   */
  loadSpec(specPath: string): ProgramSpec {
    if (!fs.existsSync(specPath)) {
      throw new Error(`Spec file not found: ${specPath}`);
    }

    const fileContents = fs.readFileSync(specPath, 'utf8');
    const spec = yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as ProgramSpec;

    // Validate spec structure
    if (!spec || typeof spec !== 'object') {
      throw new Error('Invalid spec file: must be a YAML object');
    }

    if (!spec.tests || !Array.isArray(spec.tests)) {
      throw new Error('Invalid spec file: must contain a "tests" array');
    }

    // Validate each test case
    for (let i = 0; i < spec.tests.length; i++) {
      const test = spec.tests[i];
      if (!test || typeof test !== 'object') {
        throw new Error(`Invalid test case at index ${i}: must be an object`);
      }
      if (!('expectedOutput' in test)) {
        throw new Error(`Invalid test case at index ${i}: must contain "expectedOutput" property`);
      }
    }

    return spec;
  }

  /**
   * Find the spec file for a given program file
   * Follows naming convention: program_name.spec.yaml
   */
  findSpecFile(programPath: string): string | null {
    const dir = path.dirname(programPath);
    const basename = path.basename(programPath);
    const nameWithoutExt = basename.replace(/\.(yaml|yml)$/i, '');

    // Try .spec.yaml first, then .spec.yml
    const specPath1 = path.join(dir, `${nameWithoutExt}.spec.yaml`);
    const specPath2 = path.join(dir, `${nameWithoutExt}.spec.yml`);

    if (fs.existsSync(specPath1)) {
      return specPath1;
    }
    if (fs.existsSync(specPath2)) {
      return specPath2;
    }

    return null;
  }

  /**
   * Run a single test case for a program
   */
  runTest(program: FrankaProgram, testCase: TestCase): TestResult {
    try {
      // Create a modified program with test inputs
      const testProgram = { ...program };

      // If test case has input, merge them with program defaults
      if (testCase.input) {
        testProgram.input = testProgram.input || {};
        for (const [key, value] of Object.entries(testCase.input)) {
          if (!(key in testProgram.input)) {
            // Input not declared in program
            throw new Error(`Input "${key}" is not declared in the program`);
          }
          // Override the default value
          testProgram.input[key] = {
            ...testProgram.input[key],
            default: value,
          };
        }
      }

      // Execute the program
      const actual = this.interpreter.execute(testProgram);

      // Compare actual with expected
      const matches = this.compareOutputs(testCase.expectedOutput, actual);

      if (matches) {
        return {
          passed: true,
          description: testCase.description,
        };
      } else {
        return {
          passed: false,
          description: testCase.description,
          expected: testCase.expectedOutput,
          actual,
          error: 'Output mismatch',
        };
      }
    } catch (error) {
      return {
        passed: false,
        description: testCase.description,
        expected: testCase.expectedOutput,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Run all tests in a spec file for a program
   */
  runAllTests(programPath: string, specPath: string, functionName?: string): TestResult[] {
    const interpreter = new FrankaInterpreter();

    let program: FrankaProgram;
    if (interpreter.isModuleFile(programPath)) {
      const module = interpreter.loadModule(programPath);
      const func = interpreter.getFunctionFromModule(module, functionName);
      const fname = functionName || Object.keys(module).filter((k) => k !== 'module')[0];
      program = interpreter.functionToProgram(module, func, fname);
    } else {
      program = interpreter.loadProgram(programPath);
    }

    const spec = this.loadSpec(specPath);

    return spec.tests.map((testCase) => this.runTest(program, testCase));
  }

  /**
   * Compare expected and actual outputs
   */
  private compareOutputs(
    expected: FrankaValue | Record<string, FrankaValue>,
    actual: FrankaValue | Record<string, FrankaValue>
  ): boolean {
    // Deep equality check
    return JSON.stringify(expected) === JSON.stringify(actual);
  }
}
