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
  tests?: TestCase[]; // Legacy format - tests at root level
  functions?: Record<string, { tests: TestCase[] }>; // New format - tests grouped by function
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

    // Check if it's the new format (with functions) or legacy format (with tests at root)
    const hasLegacyFormat = 'tests' in spec && spec.tests !== undefined;
    const hasNewFormat = 'functions' in spec && spec.functions !== undefined;

    if (!hasLegacyFormat && !hasNewFormat) {
      throw new Error(
        'Invalid spec file: must contain either "tests" array (legacy) or "functions" object (new format)'
      );
    }

    if (hasLegacyFormat && hasNewFormat) {
      throw new Error(
        'Invalid spec file: cannot contain both "tests" and "functions" - use one format only'
      );
    }

    // Validate legacy format
    if (hasLegacyFormat) {
      if (!Array.isArray(spec.tests)) {
        throw new Error('Invalid spec file: "tests" must be an array');
      }

      for (let i = 0; i < spec.tests!.length; i++) {
        const test = spec.tests![i];
        if (!test || typeof test !== 'object') {
          throw new Error(`Invalid test case at index ${i}: must be an object`);
        }
        if (!('expectedOutput' in test)) {
          throw new Error(
            `Invalid test case at index ${i}: must contain "expectedOutput" property`
          );
        }
      }
    }

    // Validate new format
    if (hasNewFormat) {
      if (typeof spec.functions !== 'object' || spec.functions === null) {
        throw new Error('Invalid spec file: "functions" must be an object');
      }

      for (const [funcName, funcSpec] of Object.entries(spec.functions)) {
        if (!funcSpec || typeof funcSpec !== 'object') {
          throw new Error(`Invalid function spec for "${funcName}": must be an object`);
        }
        if (!funcSpec.tests || !Array.isArray(funcSpec.tests)) {
          throw new Error(`Invalid function spec for "${funcName}": must contain a "tests" array`);
        }

        for (let i = 0; i < funcSpec.tests.length; i++) {
          const test = funcSpec.tests[i];
          if (!test || typeof test !== 'object') {
            throw new Error(
              `Invalid test case at index ${i} for function "${funcName}": must be an object`
            );
          }
          if (!('expectedOutput' in test)) {
            throw new Error(
              `Invalid test case at index ${i} for function "${funcName}": must contain "expectedOutput" property`
            );
          }
        }
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
    const spec = this.loadSpec(specPath);

    // Handle legacy format (tests at root level)
    if (spec.tests) {
      let program: FrankaProgram;
      if (interpreter.isModuleFile(programPath)) {
        const module = interpreter.loadModule(programPath);
        const func = interpreter.getFunctionFromModule(module, functionName);
        const fname = functionName || Object.keys(module).filter((k) => k !== 'module')[0];
        program = interpreter.functionToProgram(module, func, fname);
      } else {
        program = interpreter.loadProgram(programPath);
      }
      return spec.tests.map((testCase) => this.runTest(program, testCase));
    }

    // Handle new format (tests grouped by function)
    if (spec.functions) {
      // For non-module files, error
      if (!interpreter.isModuleFile(programPath)) {
        throw new Error(
          'Spec file uses new format with multiple functions, but program file is not a module'
        );
      }

      const module = interpreter.loadModule(programPath);

      // If a specific function is requested, run only its tests
      if (functionName) {
        const functionSpec = spec.functions[functionName];
        if (!functionSpec) {
          throw new Error(
            `Function "${functionName}" not found in spec file. Available functions: ${Object.keys(spec.functions).join(', ')}`
          );
        }
        const func = interpreter.getFunctionFromModule(module, functionName);
        const program = interpreter.functionToProgram(module, func, functionName);
        return functionSpec.tests.map((testCase) => this.runTest(program, testCase));
      }

      // No specific function requested - run tests for all functions in spec
      const results: TestResult[] = [];

      for (const [funcName, functionSpec] of Object.entries(spec.functions)) {
        try {
          const func = interpreter.getFunctionFromModule(module, funcName);
          const funcProgram = interpreter.functionToProgram(module, func, funcName);

          const functionResults = functionSpec.tests.map((testCase) => {
            const result = this.runTest(funcProgram, testCase);
            // Add function name to description for clarity
            return {
              ...result,
              description: `[${funcName}] ${result.description || 'Unnamed test'}`,
            };
          });

          results.push(...functionResults);
        } catch (error) {
          // If function doesn't exist in module, add error results for all its tests
          functionSpec.tests.forEach((testCase, index) => {
            results.push({
              passed: false,
              description: `[${funcName}] ${testCase.description || `Test ${index + 1}`}`,
              error: `Function "${funcName}" not found in module: ${error instanceof Error ? error.message : String(error)}`,
            });
          });
        }
      }

      return results;
    }

    return [];
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
