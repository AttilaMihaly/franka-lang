import { FrankaInterpreter } from './interpreter';
import * as path from 'path';

describe('FrankaInterpreter', () => {
  let interpreter: FrankaInterpreter;

  beforeEach(() => {
    interpreter = new FrankaInterpreter();
  });

  describe('basic expressions', () => {
    it('should evaluate a simple string value', () => {
      const program = {
        program: { name: 'Test' },
        expression: 'Hello, World!',
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });

    it('should evaluate a variable reference', () => {
      const program = {
        program: { name: 'Test' },
        variables: { message: 'Hello' },
        expression: '$message',
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello');
    });
  });

  describe('let bindings', () => {
    it('should create a simple let binding', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          let: {
            x: 5,
            in: '$x',
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(5);
    });

    it('should allow later bindings to reference earlier ones', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          let: {
            x: 5,
            y: { concat: ['Value is ', '$x'] },
            in: '$y',
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Value is 5');
    });

    it('should support nested let bindings', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          let: {
            x: 5,
            result: {
              let: {
                y: 10,
                in: '$y',
              },
            },
            in: '$result',
          },
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
        variables: { greeting: 'Hello', name: 'World' },
        expression: {
          concat: ['$greeting', ', ', '$name', '!'],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Hello, World!');
    });

    it('should convert string to uppercase', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          uppercase: 'hello',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('HELLO');
    });

    it('should convert string to lowercase', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          lowercase: 'HELLO',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('hello');
    });

    it('should get string length', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          length: 'Hello',
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(5);
    });

    it('should extract substring', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
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
        expression: {
          and: [true, true],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should perform OR operation', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          or: [false, true],
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should perform NOT operation', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          not: false,
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });

    it('should perform equals operation', () => {
      const program = {
        program: { name: 'Test' },
        variables: { name: 'alice' },
        expression: {
          equals: { left: '$name', right: 'alice' },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe(true);
    });
  });

  describe('control flow', () => {
    it('should execute if-then branch', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          if: {
            condition: true,
            then: 'True branch',
            else: 'False branch',
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('True branch');
    });

    it('should execute if-else branch', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          if: {
            condition: false,
            then: 'True branch',
            else: 'False branch',
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('False branch');
    });

    it('should execute if with complex condition', () => {
      const program = {
        program: { name: 'Test' },
        variables: { username: 'alice', expected: 'alice' },
        expression: {
          if: {
            condition: { equals: { left: '$username', right: '$expected' } },
            then: 'Match',
            else: 'No match',
          },
        },
      };

      const result = interpreter.execute(program);
      expect(result).toBe('Match');
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
        expression: '$undefined',
      };

      expect(() => interpreter.execute(program)).toThrow('Undefined variable: undefined');
    });

    it('should throw error for unknown operation', () => {
      const program = {
        program: { name: 'Test' },
        expression: { unknown_op: 'test' },
      };

      expect(() => interpreter.execute(program)).toThrow('Unknown operation: unknown_op');
    });

    it('should throw error for let without in expression', () => {
      const program = {
        program: { name: 'Test' },
        expression: {
          let: {
            x: 5,
          },
        },
      };

      expect(() => interpreter.execute(program)).toThrow(
        'let operation requires an "in" expression'
      );
    });
  });
});
