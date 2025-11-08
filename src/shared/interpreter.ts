import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type FrankaValue = string | number | boolean | null;

export interface FrankaProgram {
  program: {
    name: string;
    description?: string;
  };
  variables?: Record<string, FrankaValue>;
  expression: any;
}

export interface FrankaOperation {
  [key: string]: any; // Operation name as key, parameters as value
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

  private evaluate(expression: any): any {
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
      return expression;
    }

    // Handle arrays
    if (Array.isArray(expression)) {
      return expression.map((item) => this.evaluate(item));
    }

    // Handle operations (object with operation name as key)
    const keys = Object.keys(expression);
    if (keys.length === 0) {
      return expression;
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

  private executeLet(args: any): any {
    if (!args || typeof args !== 'object') {
      throw new Error('let operation requires bindings and an "in" expression');
    }

    // Save current variable scope
    const savedVariables = { ...this.variables };

    // Process bindings - each key is a variable name, each value is the value to bind
    // The "in" key contains the expression to evaluate with these bindings
    const inExpression = args.in;
    if (!inExpression) {
      throw new Error('let operation requires an "in" expression');
    }

    // Add bindings sequentially so later bindings can reference earlier ones
    for (const [key, value] of Object.entries(args)) {
      if (key !== 'in') {
        this.variables[key] = this.evaluate(value);
      }
    }

    // Evaluate the "in" expression with the new bindings
    const result = this.evaluate(inExpression);

    // Restore previous variable scope by clearing and repopulating
    // Don't replace the object to avoid breaking outer scopes
    for (const key of Object.keys(this.variables)) {
      delete this.variables[key];
    }
    Object.assign(this.variables, savedVariables);

    return result;
  }

  private extractValue(args: any): any {
    // Helper method to extract value from args (can be direct or in a 'value' property)
    return typeof args === 'object' && args !== null && !Array.isArray(args) && 'value' in args
      ? this.evaluate(args.value)
      : this.evaluate(args);
  }

  private executeConcat(args: any): string {
    // args can be an array or an object with 'values' key
    let values: any[];
    if (Array.isArray(args)) {
      values = args;
    } else if (args && typeof args === 'object' && 'values' in args) {
      values = args.values;
    } else {
      throw new Error('concat operation requires an array or an object with "values" property');
    }
    return values.map((v: any) => this.evaluate(v)).join('');
  }

  private executeUppercase(args: any): string {
    const value = this.extractValue(args);
    return String(value).toUpperCase();
  }

  private executeLowercase(args: any): string {
    const value = this.extractValue(args);
    return String(value).toLowerCase();
  }

  private executeLength(args: any): number {
    const value = this.extractValue(args);
    return String(value).length;
  }

  private executeSubstring(args: any): string {
    if (!args || typeof args !== 'object' || !('value' in args) || !('start' in args)) {
      throw new Error('substring operation requires "value" and "start" properties');
    }
    const value = this.evaluate(args.value);
    const start = this.evaluate(args.start);
    const end = args.end !== undefined ? this.evaluate(args.end) : undefined;
    return String(value).substring(start, end);
  }

  private executeAnd(args: any): boolean {
    // args can be an array or an object with 'values' key
    let values: any[];
    if (Array.isArray(args)) {
      values = args;
    } else if (args && typeof args === 'object' && 'values' in args) {
      values = args.values;
    } else {
      throw new Error('and operation requires an array or an object with "values" property');
    }
    return values.map((v: any) => this.evaluate(v)).every((v: any) => Boolean(v));
  }

  private executeOr(args: any): boolean {
    // args can be an array or an object with 'values' key
    let values: any[];
    if (Array.isArray(args)) {
      values = args;
    } else if (args && typeof args === 'object' && 'values' in args) {
      values = args.values;
    } else {
      throw new Error('or operation requires an array or an object with "values" property');
    }
    return values.map((v: any) => this.evaluate(v)).some((v: any) => Boolean(v));
  }

  private executeNot(args: any): boolean {
    const value = this.extractValue(args);
    return !Boolean(value);
  }

  private executeEquals(args: any): boolean {
    if (!args || typeof args !== 'object' || !('left' in args) || !('right' in args)) {
      throw new Error('equals operation requires "left" and "right" properties');
    }
    const left = this.evaluate(args.left);
    const right = this.evaluate(args.right);
    return left === right;
  }

  private executeIf(args: any): any {
    if (!args || typeof args !== 'object' || !('condition' in args)) {
      throw new Error('if operation requires "condition" property');
    }
    const condition = this.evaluate(args.condition);

    if (Boolean(condition)) {
      if (args.then !== undefined) {
        return this.evaluate(args.then);
      }
    } else {
      if (args.else !== undefined) {
        return this.evaluate(args.else);
      }
    }
    return null;
  }
}
