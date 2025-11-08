import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type FrankaValue = string | number | boolean | null;

// Expression types for the pure functional language
export type FrankaExpression =
  | FrankaValue
  | { [key: string]: unknown } // Operations and let bindings
  | FrankaExpression[]; // Arrays in concat, and, or

export interface FrankaProgram {
  program: {
    name: string;
    description?: string;
  };
  variables?: Record<string, FrankaValue>;
  expression: FrankaExpression;
}

export interface FrankaOperation {
  [key: string]: unknown; // Operation name as key, parameters as value
}

export class FrankaInterpreter {
  private variables: Record<string, FrankaValue> = {};

  loadProgram(filePath: string): FrankaProgram {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as FrankaProgram;
  }

  execute(program: FrankaProgram): FrankaValue {
    this.variables = program.variables ? { ...program.variables } : {};
    return this.evaluate(program.expression);
  }

  executeFile(filePath: string): FrankaValue {
    const program = this.loadProgram(filePath);
    return this.execute(program);
  }

  private evaluate(expression: FrankaExpression): FrankaValue {
    // Handle primitive values
    if (expression === null || expression === undefined) {
      return expression;
    }

    // Handle variable references
    if (typeof expression === 'string' && expression.startsWith('$')) {
      const varName = expression.substring(1);
      if (!(varName in this.variables)) {
        throw new Error(`Undefined variable: ${varName}`);
      }
      return this.variables[varName];
    }

    // Handle primitive types (string, number, boolean)
    if (typeof expression !== 'object') {
      return expression as FrankaValue;
    }

    // Handle arrays - arrays are not directly returned as values, they're used in operations
    if (Array.isArray(expression)) {
      // This shouldn't happen in well-formed programs, but handle it gracefully
      throw new Error('Arrays cannot be used as standalone expressions');
    }

    // Handle operations (object with operation name as key)
    const keys = Object.keys(expression);
    if (keys.length === 0) {
      // Empty objects are not valid expressions
      return null;
    }

    const operationName = keys[0];
    const operationArgs = expression[operationName];

    switch (operationName) {
      case 'let':
        return this.executeLet(operationArgs);
      case 'concat':
        return this.executeConcat(operationArgs);
      case 'uppercase':
        return this.executeUppercase(operationArgs);
      case 'lowercase':
        return this.executeLowercase(operationArgs);
      case 'length':
        return this.executeLength(operationArgs);
      case 'substring':
        return this.executeSubstring(operationArgs);
      case 'and':
        return this.executeAnd(operationArgs);
      case 'or':
        return this.executeOr(operationArgs);
      case 'not':
        return this.executeNot(operationArgs);
      case 'equals':
        return this.executeEquals(operationArgs);
      case 'if':
        return this.executeIf(operationArgs);
      default:
        throw new Error(`Unknown operation: ${operationName}`);
    }
  }

  private executeLet(args: unknown): FrankaValue {
    if (!args || typeof args !== 'object') {
      throw new Error('let operation requires bindings and an "in" expression');
    }

    const argsObj = args as Record<string, unknown>;

    // Save current variable scope
    const savedVariables = { ...this.variables };

    // Process bindings - each key is a variable name, each value is the value to bind
    // The "in" key contains the expression to evaluate with these bindings
    const inExpression = argsObj.in;
    if (!inExpression) {
      throw new Error('let operation requires an "in" expression');
    }

    // Add bindings sequentially so later bindings can reference earlier ones
    for (const [key, value] of Object.entries(argsObj)) {
      if (key !== 'in') {
        this.variables[key] = this.evaluate(value as FrankaExpression);
      }
    }

    // Evaluate the "in" expression with the new bindings
    const result = this.evaluate(inExpression as FrankaExpression);

    // Restore previous variable scope by clearing and repopulating
    // Don't replace the object to avoid breaking outer scopes
    for (const key of Object.keys(this.variables)) {
      delete this.variables[key];
    }
    Object.assign(this.variables, savedVariables);

    return result;
  }

  private extractValue(args: unknown): FrankaValue {
    // Helper method to extract value from args (can be direct or in a 'value' property)
    if (args && typeof args === 'object' && !Array.isArray(args) && 'value' in args) {
      return this.evaluate((args as { value: FrankaExpression }).value);
    }
    return this.evaluate(args as FrankaExpression);
  }

  private executeConcat(args: unknown): string {
    // args can be an array or an object with 'values' key
    let values: unknown[];
    if (Array.isArray(args)) {
      values = args;
    } else if (args && typeof args === 'object' && 'values' in args) {
      values = (args as { values: unknown[] }).values;
    } else {
      throw new Error('concat operation requires an array or an object with "values" property');
    }
    return values.map((v: unknown) => this.evaluate(v as FrankaExpression)).join('');
  }

  private executeUppercase(args: unknown): string {
    const value = this.extractValue(args);
    return String(value).toUpperCase();
  }

  private executeLowercase(args: unknown): string {
    const value = this.extractValue(args);
    return String(value).toLowerCase();
  }

  private executeLength(args: unknown): number {
    const value = this.extractValue(args);
    return String(value).length;
  }

  private executeSubstring(args: unknown): string {
    if (!args || typeof args !== 'object' || !('value' in args) || !('start' in args)) {
      throw new Error('substring operation requires "value" and "start" properties');
    }
    const argsObj = args as {
      value: FrankaExpression;
      start: FrankaExpression;
      end?: FrankaExpression;
    };
    const value = this.evaluate(argsObj.value);
    const start = this.evaluate(argsObj.start);
    const end = argsObj.end !== undefined ? this.evaluate(argsObj.end) : undefined;
    return String(value).substring(start as number, end as number | undefined);
  }

  private executeAnd(args: unknown): boolean {
    // args can be an array or an object with 'values' key
    let values: unknown[];
    if (Array.isArray(args)) {
      values = args;
    } else if (args && typeof args === 'object' && 'values' in args) {
      values = (args as { values: unknown[] }).values;
    } else {
      throw new Error('and operation requires an array or an object with "values" property');
    }
    return values
      .map((v: unknown) => this.evaluate(v as FrankaExpression))
      .every((v: FrankaValue) => Boolean(v));
  }

  private executeOr(args: unknown): boolean {
    // args can be an array or an object with 'values' key
    let values: unknown[];
    if (Array.isArray(args)) {
      values = args;
    } else if (args && typeof args === 'object' && 'values' in args) {
      values = (args as { values: unknown[] }).values;
    } else {
      throw new Error('or operation requires an array or an object with "values" property');
    }
    return values
      .map((v: unknown) => this.evaluate(v as FrankaExpression))
      .some((v: FrankaValue) => Boolean(v));
  }

  private executeNot(args: unknown): boolean {
    const value = this.extractValue(args);
    return !Boolean(value);
  }

  private executeEquals(args: unknown): boolean {
    if (!args || typeof args !== 'object' || !('left' in args) || !('right' in args)) {
      throw new Error('equals operation requires "left" and "right" properties');
    }
    const argsObj = args as { left: FrankaExpression; right: FrankaExpression };
    const left = this.evaluate(argsObj.left);
    const right = this.evaluate(argsObj.right);
    return left === right;
  }

  private executeIf(args: unknown): FrankaValue {
    if (!args || typeof args !== 'object' || !('condition' in args)) {
      throw new Error('if operation requires "condition" property');
    }
    const argsObj = args as {
      condition: FrankaExpression;
      then?: FrankaExpression;
      else?: FrankaExpression;
    };
    const condition = this.evaluate(argsObj.condition);

    if (Boolean(condition)) {
      if (argsObj.then !== undefined) {
        return this.evaluate(argsObj.then);
      }
    } else {
      if (argsObj.else !== undefined) {
        return this.evaluate(argsObj.else);
      }
    }
    return null;
  }
}
