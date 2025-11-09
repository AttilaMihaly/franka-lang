import { FrankaInterpreter } from './interpreter';
import * as fs from 'fs';
import * as path from 'path';

describe('Examples Integration Tests', () => {
  let interpreter: FrankaInterpreter;
  const examplesDir = path.join(__dirname, '../../examples');

  beforeEach(() => {
    interpreter = new FrankaInterpreter();
  });

  // Get all .yaml files from examples directory
  const exampleFiles = fs
    .readdirSync(examplesDir)
    .filter((file) => file.endsWith('.yaml'))
    .sort();

  describe('All examples should execute successfully', () => {
    exampleFiles.forEach((filename) => {
      it(`should execute ${filename} without errors`, () => {
        const filePath = path.join(examplesDir, filename);

        // The test passes if executeFile doesn't throw an error
        expect(() => {
          const result = interpreter.executeFile(filePath);
          // Verify we got some result back
          expect(result).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Specific example validations', () => {
    it('hello.yaml should return a greeting string', () => {
      const filePath = path.join(examplesDir, 'hello.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('string');
      expect(result).toBe('Hello, Franka!');
    });

    it('string-operations.yaml should return a string', () => {
      const filePath = path.join(examplesDir, 'string-operations.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('string');
    });

    it('boolean-logic.yaml should return a string', () => {
      const filePath = path.join(examplesDir, 'boolean-logic.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('string');
    });

    it('conditional-string.yaml should return a string', () => {
      const filePath = path.join(examplesDir, 'conditional-string.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('string');
    });

    it('if-chaining.yaml should return a string', () => {
      const filePath = path.join(examplesDir, 'if-chaining.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('string');
    });

    it('output-single.yaml should return a string', () => {
      const filePath = path.join(examplesDir, 'output-single.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('string');
    });

    it('output-multiple.yaml should return an object with multiple outputs', () => {
      const filePath = path.join(examplesDir, 'output-multiple.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });

    it('get-set-basic.yaml should return an object with named outputs', () => {
      const filePath = path.join(examplesDir, 'get-set-basic.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('greeting');
      expect(result).toHaveProperty('category');
    });

    it('conditional-outputs.yaml should return an object with named outputs', () => {
      const filePath = path.join(examplesDir, 'conditional-outputs.yaml');
      const result = interpreter.executeFile(filePath);

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });
  });
});
