import { FrankaInterpreter, FrankaModule } from './interpreter';
import * as path from 'path';
import * as fs from 'fs';

describe('FrankaInterpreter', () => {
  let interpreter: FrankaInterpreter;

  beforeEach(() => {
    interpreter = new FrankaInterpreter();
  });

  describe('basic logic', () => {
    it('should evaluate a simple string value', () => {
      const program = {
        program: { name: 'Test' },
        logic: 'Hello, World!',
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });

    it('should evaluate a variable reference', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          message: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: { get: 'message' },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello');
    });

    it('should handle input without default value', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          message: {
            type: 'string' as const,
          },
        },
        logic: 'Hello, World!',
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });
  });

  describe('let bindings', () => {
    it('should create a simple let binding', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          let: {
            x: 5,
          },
          in: { get: 'x' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(5);
    });

    it('should allow later bindings to reference earlier ones', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          let: {
            x: 5,
            y: { concat: ['Value is ', { get: 'x' }] },
          },
          in: { get: 'y' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Value is 5');
    });

    it('should support flat let/in syntax', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          let: {
            x: 5,
          },
          in: { get: 'x' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(5);
    });

    it('should support flat let/in with multiple bindings', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          let: {
            x: 5,
            y: { concat: ['Value is ', { get: 'x' }] },
          },
          in: { get: 'y' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Value is 5');
    });

    it('should support nested flat let/in bindings', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          let: {
            x: 5,
            result: {
              let: {
                y: 10,
              },
              in: { get: 'y' },
            },
          },
          in: { get: 'result' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(10);
    });
  });

  describe('string operations', () => {
    it('should concatenate strings', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
          name: {
            type: 'string' as const,
            default: 'World',
          },
        },
        logic: {
          concat: [{ get: 'greeting' }, ', ', { get: 'name' }, '!'],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });

    it('should convert string to uppercase', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          uppercase: 'hello',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO');
    });

    it('should convert string to lowercase', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          lowercase: 'HELLO',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('hello');
    });

    it('should get string length', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          length: 'Hello',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(5);
    });

    it('should extract substring', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          substring: { value: 'Hello World', start: 0, end: 5 },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello');
    });
  });

  describe('boolean operations', () => {
    it('should perform AND operation', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          and: [true, true],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should perform OR operation', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          or: [false, true],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should perform NOT operation', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          not: false,
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should perform equals operation', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          name: {
            type: 'string' as const,
            default: 'alice',
          },
        },
        logic: {
          equals: { left: { get: 'name' }, right: 'alice' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });
  });

  describe('control flow', () => {
    // Test flat syntax
    it('should execute flat if-then-else (true condition)', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          if: true,
          then: 'True branch',
          else: 'False branch',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('True branch');
    });

    it('should execute flat if-then-else (false condition)', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          if: false,
          then: 'True branch',
          else: 'False branch',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('False branch');
    });

    it('should execute flat if with complex condition', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          username: {
            type: 'string' as const,
            default: 'alice',
          },
          expected: {
            type: 'string' as const,
            default: 'alice',
          },
        },
        logic: {
          if: { equals: { left: { get: 'username' }, right: { get: 'expected' } } },
          then: 'Match',
          else: 'No match',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Match');
    });

    // Test chaining syntax
    it('should execute if-then chain with first condition true', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ if: true, then: 'First' }, { if: true, then: 'Second' }, { else: 'Default' }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('First');
    });

    it('should execute if-then chain with second condition true', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ if: false, then: 'First' }, { if: true, then: 'Second' }, { else: 'Default' }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Second');
    });

    it('should execute if-then chain with else fallback', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ if: false, then: 'First' }, { if: false, then: 'Second' }, { else: 'Default' }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Default');
    });

    it('should execute if-then chain with complex conditions', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          score: {
            type: 'number' as const,
            default: 85,
          },
        },
        logic: [
          { if: { equals: { left: { get: 'score' }, right: 100 } }, then: 'Perfect' },
          { if: { equals: { left: { get: 'score' }, right: 85 } }, then: 'Great' },
          { else: 'Good' },
        ],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Great');
    });

    it('should execute if-then chain without else (no match)', () => {
      const program = {
        program: { name: 'Test' },
        logic: [
          { if: false, then: 'First' },
          { if: false, then: 'Second' },
        ],
      };

      const result = interpreter.execute(program);
      expect(result).toBe(null);
    });
  });

  describe('example files', () => {
    it('should execute hello.yaml', () => {
      const filePath = path.join(__dirname, '../../examples/hello.yaml');
      const result = interpreter.executeFile(filePath);
      expect(result).toBe('Hello, Franka!');
    });

    it('should execute string-operations.yaml', () => {
      const filePath = path.join(__dirname, '../../examples/string-operations.yaml');
      const result = interpreter.executeFile(filePath);
      expect(result).toBe('Hello, World!\nHELLO, WORLD!\nhello, world!');
    });

    it('should execute boolean-logic.yaml', () => {
      const filePath = path.join(__dirname, '../../examples/boolean-logic.yaml');
      const result = interpreter.executeFile(filePath);
      expect(result).toBe('Access denied\nYou can view the content\nWelcome, guest!');
    });

    it('should execute conditional-string.yaml', () => {
      const filePath = path.join(__dirname, '../../examples/conditional-string.yaml');
      const result = interpreter.executeFile(filePath);
      expect(result).toBe('Welcome, alice!\nALICE');
    });
  });

  describe('error handling', () => {
    it('should throw error for undefined variable', () => {
      const program = {
        program: { name: 'Test' },
        logic: { get: 'undefined' },
      };

      expect(() => interpreter.execute(program)).toThrow('Undefined variable: undefined');
    });

    it('should throw error for referencing input without default value', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          message: {
            type: 'string' as const,
          },
        },
        logic: { get: 'message' },
      };

      expect(() => interpreter.execute(program)).toThrow('Undefined variable: message');
    });

    it('should throw error for unknown operation', () => {
      const program = {
        program: { name: 'Test' },
        logic: { unknown_op: 'test' },
      };

      expect(() => interpreter.execute(program)).toThrow('Unknown operation: unknown_op');
    });

    it('should throw error for let without in logic', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          let: {
            x: 5,
          },
        },
      };

      expect(() => interpreter.execute(program)).toThrow('Let structure requires "in" key');
    });
  });

  describe('output section', () => {
    it('should accept single unnamed output', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          type: 'string' as const,
        },
        logic: 'Hello, World!',
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });

    it('should accept multiple named outputs', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          foo: {
            type: 'string' as const,
          },
          bar: {
            type: 'boolean' as const,
          },
        },
        logic: 'Hello, World!',
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });

    it('should validate single output type', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          type: 'invalid' as any,
        },
        logic: 'Hello',
      };

      expect(() => interpreter.execute(program)).toThrow('Invalid output type: invalid');
    });

    it('should validate named output types', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          result: {
            type: 'invalid' as any,
          },
        },
        logic: 'Hello',
      };

      expect(() => interpreter.execute(program)).toThrow(
        'Invalid output type for "result": invalid'
      );
    });

    it('should reject default values in single output', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          type: 'string' as const,
          default: 'test',
        } as any,
        logic: 'Hello',
      };

      expect(() => interpreter.execute(program)).toThrow(
        'Single output definition should only contain "type" property'
      );
    });

    it('should reject default values in named outputs', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          result: {
            type: 'string' as const,
            default: 'test',
          } as any,
        },
        logic: 'Hello',
      };

      expect(() => interpreter.execute(program)).toThrow(
        'Output "result" cannot have a default value'
      );
    });

    it('should require type property in named outputs', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          result: {} as any,
        },
        logic: 'Hello',
      };

      expect(() => interpreter.execute(program)).toThrow(
        'Output "result" must have a "type" property'
      );
    });

    it('should accept number type in output', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          type: 'number' as const,
        },
        logic: 42,
      };

      const result = interpreter.execute(program);
      expect(result).toBe(42);
    });

    it('should accept boolean type in output', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          type: 'boolean' as const,
        },
        logic: true,
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should work with both input and output sections', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        output: {
          type: 'string' as const,
        },
        logic: {
          concat: [{ get: 'greeting' }, ', World!'],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });
  });

  describe('get operation', () => {
    it('should get an input variable', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          message: {
            type: 'string' as const,
            default: 'Hello',
          },
        },
        logic: {
          get: 'message',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello');
    });

    it('should get an input variable in a concat operation', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'Hello',
          },
          name: {
            type: 'string' as const,
            default: 'World',
          },
        },
        logic: {
          concat: [{ get: 'greeting' }, ', ', { get: 'name' }, '!'],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });

    it('should throw error for undefined variable with get', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          get: 'undefined',
        },
      };

      expect(() => interpreter.execute(program)).toThrow('Undefined variable: undefined');
    });

    it('should throw error if get argument is not a string', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          get: 123,
        } as any,
      };

      expect(() => interpreter.execute(program)).toThrow(
        'get operation requires a variable name as a string'
      );
    });
  });

  describe('set operation', () => {
    it('should set a single named output', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          result: {
            type: 'string' as const,
          },
        },
        logic: {
          set: {
            result: 'Hello, World!',
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ result: 'Hello, World!' });
    });

    it('should set multiple named outputs', () => {
      const program = {
        program: { name: 'Test' },
        output: {
          greeting: {
            type: 'string' as const,
          },
          count: {
            type: 'number' as const,
          },
        },
        logic: {
          set: {
            greeting: 'Hello',
            count: 42,
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ greeting: 'Hello', count: 42 });
    });

    it('should set named outputs with logic', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          value: {
            type: 'number' as const,
            default: 21,
          },
        },
        output: {
          doubled: {
            type: 'string' as const,
          },
        },
        logic: {
          set: {
            doubled: {
              concat: ['Value: ', { get: 'value' }],
            },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ doubled: 'Value: 21' });
    });

    it('should set outputs in if/then/else branches', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          condition: {
            type: 'boolean' as const,
            default: true,
          },
        },
        output: {
          result: {
            type: 'string' as const,
          },
        },
        logic: {
          if: { get: 'condition' },
          then: {
            set: {
              result: 'True branch',
            },
          },
          else: {
            set: {
              result: 'False branch',
            },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ result: 'True branch' });
    });

    it('should set outputs in nested if/then/else', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          condition: {
            type: 'boolean' as const,
            default: false,
          },
        },
        output: {
          result: {
            type: 'string' as const,
          },
        },
        logic: {
          if: { get: 'condition' },
          then: {
            set: {
              result: 'True branch',
            },
          },
          else: {
            set: {
              result: 'False branch',
            },
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ result: 'False branch' });
    });

    it('should allow setting outputs at different nodes in if/else tree', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          score: {
            type: 'number' as const,
            default: 85,
          },
        },
        output: {
          grade: {
            type: 'string' as const,
          },
          passed: {
            type: 'boolean' as const,
          },
        },
        logic: [
          {
            if: { equals: { left: { get: 'score' }, right: 100 } },
            then: {
              set: {
                grade: 'A+',
                passed: true,
              },
            },
          },
          {
            if: { equals: { left: { get: 'score' }, right: 85 } },
            then: {
              set: {
                grade: 'B+',
                passed: true,
              },
            },
          },
          {
            else: {
              set: {
                grade: 'F',
                passed: false,
              },
            },
          },
        ],
      };

      const result = interpreter.execute(program);
      expect(result).toEqual({ grade: 'B+', passed: true });
    });

    it('should throw error if set argument is not an object', () => {
      const program = {
        program: { name: 'Test' },
        logic: {
          set: 'invalid',
        } as any,
      };

      expect(() => interpreter.execute(program)).toThrow(
        'set operation requires an object with output names and values'
      );
    });
  });

  describe('operation chaining', () => {
    it('should chain simple operations', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          text: {
            type: 'string' as const,
            default: 'hello',
          },
        },
        logic: [{ get: 'text' }, 'uppercase'],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO');
    });

    it('should chain multiple operations', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          text: {
            type: 'string' as const,
            default: 'hello',
          },
        },
        logic: [{ get: 'text' }, 'uppercase', 'length'],
      };

      const result = interpreter.execute(program);
      expect(result).toBe(5);
    });

    it('should chain operations with parameters', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'hello',
          },
        },
        logic: [{ get: 'greeting' }, 'uppercase', { concat: ' world!' }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO world!');
    });

    it('should chain with concat using array', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'hello',
          },
        },
        logic: [{ get: 'greeting' }, 'uppercase', { concat: [' ', 'world'] }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO world');
    });

    it('should chain with substring operation', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          text: {
            type: 'string' as const,
            default: 'hello world',
          },
        },
        logic: [{ get: 'text' }, { substring: { start: 0, end: 5 } }, 'uppercase'],
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO');
    });

    it('should chain boolean operations', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          value: {
            type: 'boolean' as const,
            default: true,
          },
        },
        logic: [{ get: 'value' }, 'not', 'not'],
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should chain with equals operation', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          text: {
            type: 'string' as const,
            default: 'hello',
          },
        },
        logic: [{ get: 'text' }, 'uppercase', { equals: 'HELLO' }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should chain with and operation', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          value: {
            type: 'boolean' as const,
            default: true,
          },
        },
        logic: [{ get: 'value' }, { and: [true, true] }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should chain with or operation', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          value: {
            type: 'boolean' as const,
            default: false,
          },
        },
        logic: [{ get: 'value' }, { or: [true] }],
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should work with complex chaining example', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          greeting: {
            type: 'string' as const,
            default: 'hello',
          },
          name: {
            type: 'string' as const,
            default: 'world',
          },
        },
        logic: {
          let: {
            message: [
              { get: 'greeting' },
              'uppercase',
              { concat: [', ', { get: 'name' }] },
              { concat: '!' },
            ],
          },
          in: { get: 'message' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO, world!');
    });

    it('should throw error for unsupported operation in chain', () => {
      const program = {
        program: { name: 'Test' },
        input: {
          text: {
            type: 'string' as const,
            default: 'hello',
          },
        },
        logic: [{ get: 'text' }, 'unsupported'],
      };

      expect(() => interpreter.execute(program)).toThrow(
        "Operation 'unsupported' cannot be used without parameters in a chain"
      );
    });

    it('should require at least 2 elements for operation chain', () => {
      const program = {
        program: { name: 'Test' },
        logic: ['uppercase'],
      };

      // Single element arrays are not treated as chains
      expect(() => interpreter.execute(program)).toThrow(
        'Arrays cannot be used as standalone logic'
      );
    });
  });

  describe('module format with functions section', () => {
    it('should support new format with functions section', () => {
      const module = {
        module: {
          name: 'Test Module',
          description: 'A test module',
        },
        functions: {
          main: {
            description: 'Main function',
            logic: 'Hello from functions section!',
          },
          helper: {
            description: 'Helper function',
            logic: 'Helper output',
          },
        },
      };

      const func = interpreter.getFunctionFromModule(module);
      expect(func).toBeDefined();
      expect(func.logic).toBe('Hello from functions section!');
    });

    it('should get specific function from functions section by name', () => {
      const module = {
        module: {
          name: 'Test Module',
        },
        functions: {
          main: {
            logic: 'Main logic',
          },
          helper: {
            logic: 'Helper logic',
          },
        },
      };

      const func = interpreter.getFunctionFromModule(module, 'helper');
      expect(func).toBeDefined();
      expect(func.logic).toBe('Helper logic');
    });

    it('should execute module with functions section', () => {
      const module = {
        module: {
          name: 'Test Module',
        },
        functions: {
          greet: {
            input: {
              name: {
                type: 'string' as const,
                default: 'World',
              },
            },
            logic: {
              concat: ['Hello, ', { get: 'name' }, '!'],
            },
          },
        },
      };

      const func = interpreter.getFunctionFromModule(module, 'greet');
      const program = interpreter.functionToProgram(module, func, 'greet');
      const result = interpreter.execute(program);

      expect(result).toBe('Hello, World!');
    });

    it('should throw error if module has no functions', () => {
      const module = {
        module: {
          name: 'Test Module',
        },
        functions: {},
      } as FrankaModule;

      expect(() => interpreter.getFunctionFromModule(module)).toThrow(
        'Module has no functions defined'
      );
    });

    it('should throw error for invalid function definition', () => {
      const module = {
        module: {
          name: 'Test Module',
        },
        functions: {
          badFunc: 'not an object' as any,
        },
      } as FrankaModule;

      expect(() => interpreter.getFunctionFromModule(module, 'badFunc')).toThrow(
        'not a valid function definition'
      );
    });

    it('should throw error when loading module without module section', () => {
      const tempFile = path.join(__dirname, '../../tmp-no-module-section.yaml');
      fs.writeFileSync(
        tempFile,
        `
functions:
  test:
    logic: "hello"
`
      );

      try {
        expect(() => interpreter.loadModule(tempFile)).toThrow('must contain "module" section');
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should throw error when loading module without functions section', () => {
      const tempFile = path.join(__dirname, '../../tmp-no-functions.yaml');
      fs.writeFileSync(
        tempFile,
        `
module:
  name: Test
`
      );

      try {
        expect(() => interpreter.loadModule(tempFile)).toThrow('must contain "functions" section');
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should throw error when module functions is not an object', () => {
      const tempFile = path.join(__dirname, '../../tmp-functions-not-object.yaml');
      fs.writeFileSync(
        tempFile,
        `
module:
  name: Test
functions: "not an object"
`
      );

      try {
        expect(() => interpreter.loadModule(tempFile)).toThrow('"functions" must be an object');
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe('error handling and edge cases', () => {
    it('should throw error for empty object in logic', () => {
      const program = {
        program: { name: 'Test' },
        logic: {},
      };

      const result = interpreter.execute(program);
      expect(result).toBeNull();
    });

    it('should throw error for let without in', () => {
      const program = {
        program: { name: 'Test' },
        logic: { let: { x: 5 } },
      };

      expect(() => interpreter.execute(program)).toThrow('Let structure requires "in" key');
    });

    it('should throw error for if without then or else', () => {
      const program = {
        program: { name: 'Test' },
        logic: { if: true },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'If structure must include "then" or "else" key'
      );
    });

    it('should throw error for concat with invalid args', () => {
      const program = {
        program: { name: 'Test' },
        logic: { concat: 'invalid' },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'concat operation requires an array or an object with "values" property'
      );
    });

    it('should handle concat with values property', () => {
      const program = {
        program: { name: 'Test' },
        logic: { concat: { values: ['Hello', ' ', 'World'] } },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello World');
    });

    it('should throw error for substring without required properties', () => {
      const program = {
        program: { name: 'Test' },
        logic: { substring: { value: 'test' } },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'substring operation requires "value" and "start" properties'
      );
    });

    it('should throw error for and with invalid args', () => {
      const program = {
        program: { name: 'Test' },
        logic: { and: 'invalid' },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'and operation requires an array or an object with "values" property'
      );
    });

    it('should handle and with values property', () => {
      const program = {
        program: { name: 'Test' },
        logic: { and: { values: [true, true] } },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should throw error for or with invalid args', () => {
      const program = {
        program: { name: 'Test' },
        logic: { or: 'invalid' },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'or operation requires an array or an object with "values" property'
      );
    });

    it('should handle or with values property', () => {
      const program = {
        program: { name: 'Test' },
        logic: { or: { values: [false, true] } },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should throw error for equals without left and right', () => {
      const program = {
        program: { name: 'Test' },
        logic: { equals: { left: 5 } },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'equals operation requires "left" and "right" properties'
      );
    });

    it('should handle extractValue with value property', () => {
      const program = {
        program: { name: 'Test' },
        logic: { not: { value: false } },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should throw error for substring in chain without proper args', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'message' }, { substring: 'invalid' }],
        input: {
          message: { type: 'string' as const, default: 'Hello World' },
        },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'substring operation requires start and optional end parameters in chain'
      );
    });

    it('should handle concat in chain with values property', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'message' }, { concat: { values: [' additional'] } }],
        input: {
          message: { type: 'string' as const, default: 'Hello' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello additional');
    });

    it('should handle uppercase in chain', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'message' }, 'uppercase'],
        input: {
          message: { type: 'string' as const, default: 'hello' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO');
    });

    it('should handle lowercase in chain', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'message' }, 'lowercase'],
        input: {
          message: { type: 'string' as const, default: 'HELLO' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('hello');
    });

    it('should handle length in chain', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'message' }, 'length'],
        input: {
          message: { type: 'string' as const, default: 'hello' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(5);
    });

    it('should handle not in chain', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, 'not'],
        input: {
          value: { type: 'boolean' as const, default: false },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should handle and in chain with array', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, { and: [true, true] }],
        input: {
          value: { type: 'boolean' as const, default: true },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should handle and in chain with single value', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, { and: true }],
        input: {
          value: { type: 'boolean' as const, default: true },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should handle or in chain with array', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, { or: [false, true] }],
        input: {
          value: { type: 'boolean' as const, default: false },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should handle or in chain with single value', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, { or: true }],
        input: {
          value: { type: 'boolean' as const, default: false },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should handle equals in chain with right property', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, { equals: { right: 5 } }],
        input: {
          value: { type: 'number' as const, default: 5 },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should handle equals in chain with direct value', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, { equals: 5 }],
        input: {
          value: { type: 'number' as const, default: 5 },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should throw error for unsupported operation in chain', () => {
      const program = {
        program: { name: 'Test' },
        logic: [{ get: 'value' }, { unsupported: 'test' }],
        input: {
          value: { type: 'string' as const, default: 'hello' },
        },
      };

      expect(() => interpreter.execute(program)).toThrow(
        "Operation 'unsupported' is not supported in chains with arguments"
      );
    });
  });
});
