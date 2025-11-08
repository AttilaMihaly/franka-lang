import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type FrankaValue = string | number | boolean | null;

// Expression types for the pure functional language
export type FrankaExpression =
  | FrankaValue
  | { [key: string]: unknown } // Operations and let bindings
  | FrankaExpression[]; // Arrays in concat, and, or

export interface InputDefinition {
  type: 'string' | 'number' | 'boolean';
  default?: FrankaValue;
}

export interface OutputDefinition {
  type: 'string' | 'number' | 'boolean';
}

export interface FrankaProgram {
  program: {
    name: string;
    description?: string;
  };
  input?: Record<string, InputDefinition>;
  output?:
    | { type: 'string' | 'number' | 'boolean' } // Single unnamed output
    | Record<string, OutputDefinition>; // Multiple named outputs
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
    // Extract default values from input definitions
    this.variables = {};
    if (program.input) {
      for (const [name, definition] of Object.entries(program.input)) {
        if (definition.default !== undefined) {
          this.variables[name] = definition.default;
        }
      }
    }

    // Validate output section if present
    if (program.output) {
      this.validateOutput(program.output);
    }

    return this.evaluate(program.expression);
  }

  private validateOutput(
    output: { type: 'string' | 'number' | 'boolean' } | Record<string, OutputDefinition>
  ): void {
    // Check if it's a single unnamed output
    if ('type' in output && typeof output.type === 'string') {
      const validTypes = ['string', 'number', 'boolean'];
      if (!validTypes.includes(output.type)) {
        throw new Error(`Invalid output type: ${output.type}`);
      }
      // Check that there are no other keys (like 'default')
      const keys = Object.keys(output);
      if (keys.length > 1 || (keys.length === 1 && keys[0] !== 'type')) {
        throw new Error('Single output definition should only contain "type" property');
      }
    } else {
      // Multiple named outputs - validate each one
      for (const [name, definition] of Object.entries(output)) {
        if (!definition || typeof definition !== 'object' || !('type' in definition)) {
          throw new Error(`Output "${name}" must have a "type" property`);
        }
        const validTypes = ['string', 'number', 'boolean'];
        if (!validTypes.includes(definition.type)) {
          throw new Error(`Invalid output type for "${name}": ${definition.type}`);
        }
        // Check that output definitions don't have default values
        if ('default' in definition) {
          throw new Error(`Output "${name}" cannot have a default value`);
        }
        // Check that there are no unexpected keys
        const keys = Object.keys(definition);
        if (keys.length !== 1 || keys[0] !== 'type') {
          throw new Error(`Output "${name}" should only contain "type" property`);
        }
      }
    }
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

    // Handle arrays for if/then/else chaining
    if (Array.isArray(expression)) {
      // Check if this is an if/then/else chain
      if (this.isIfChain(expression)) {
        return this.executeIfChain(expression);
      }
      // Arrays are not directly returned as values, they're used in operations
      throw new Error('Arrays cannot be used as standalone expressions');
    }

    // Handle operations (object with operation name as key)
    const keys = Object.keys(expression);
    if (keys.length === 0) {
      // Empty objects are not valid expressions
      return null;
    }

    // Check if this is a flat if/then/else structure
    if (keys.includes('if') && (keys.includes('then') || keys.includes('else'))) {
      return this.executeFlatIf(expression);
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

  private executeFlatIf(expr: Record<string, unknown>): FrankaValue {
    // Handle flat if/then/else structure where if, then, else are at the same level
    if (!('if' in expr)) {
      throw new Error('Flat if structure requires "if" key');
    }

    const condition = this.evaluate(expr.if as FrankaExpression);

    if (Boolean(condition)) {
      if ('then' in expr) {
        return this.evaluate(expr.then as FrankaExpression);
      }
    } else {
      if ('else' in expr) {
        return this.evaluate(expr.else as FrankaExpression);
      }
    }
    return null;
  }

  private isIfChain(arr: unknown[]): boolean {
    // Check if the array is an if/then/else chain
    // Each element should be an object with either 'if' and 'then' keys, or just 'else' key
    if (arr.length === 0) return false;

    for (let i = 0; i < arr.length - 1; i++) {
      const item = arr[i];
      if (
        !item ||
        typeof item !== 'object' ||
        !('if' in item) ||
        !('then' in item) ||
        Array.isArray(item)
      ) {
        return false;
      }
    }

    // Last element can be either if/then or just else
    const lastItem = arr[arr.length - 1];
    if (!lastItem || typeof lastItem !== 'object' || Array.isArray(lastItem)) {
      return false;
    }

    const lastKeys = Object.keys(lastItem);
    return (lastKeys.includes('if') && lastKeys.includes('then')) || lastKeys.includes('else');
  }

  private executeIfChain(chain: unknown[]): FrankaValue {
    // Execute an if/then/else chain
    for (const item of chain) {
      const itemObj = item as Record<string, unknown>;

      // Check if this is an else clause (final fallback)
      if ('else' in itemObj && !('if' in itemObj)) {
        return this.evaluate(itemObj.else as FrankaExpression);
      }

      // Check if condition is met
      if ('if' in itemObj && 'then' in itemObj) {
        const condition = this.evaluate(itemObj.if as FrankaExpression);
        if (Boolean(condition)) {
          return this.evaluate(itemObj.then as FrankaExpression);
        }
      }
    }

    // No condition was met and no else clause
    return null;
  }
}
