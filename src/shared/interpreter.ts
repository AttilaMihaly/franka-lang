import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type FrankaValue = string | number | boolean | null;

// Logic types for the pure functional language
export type FrankaLogic =
  | FrankaValue
  | { [key: string]: unknown } // Operations and let bindings
  | FrankaLogic[]; // Arrays in concat, and, or

export interface InputDefinition {
  type: 'string' | 'number' | 'boolean';
  default?: FrankaValue;
}

export interface OutputDefinition {
  type: 'string' | 'number' | 'boolean';
}

// Function definition within a module
export interface FrankaFunction {
  description?: string;
  input?: Record<string, InputDefinition>;
  output?:
    | { type: 'string' | 'number' | 'boolean' } // Single unnamed output
    | Record<string, OutputDefinition>; // Multiple named outputs
  logic: FrankaLogic;
}

// Module structure (supports both old and new formats)
export interface FrankaModule {
  module: {
    name: string;
    description?: string;
  };
  // New format: functions under 'functions' key
  functions?: Record<string, FrankaFunction>;
  // Old format: functions at root level (index signature for backward compatibility)
  [functionName: string]:
    | FrankaFunction
    | { name: string; description?: string }
    | Record<string, FrankaFunction>
    | undefined;
}

// Legacy program structure (for backward compatibility)
export interface FrankaProgram {
  program: {
    name: string;
    description?: string;
  };
  input?: Record<string, InputDefinition>;
  output?:
    | { type: 'string' | 'number' | 'boolean' } // Single unnamed output
    | Record<string, OutputDefinition>; // Multiple named outputs
  logic: FrankaLogic;
}

export interface FrankaOperation {
  [key: string]: unknown; // Operation name as key, parameters as value
}

export class FrankaInterpreter {
  private variables: Record<string, FrankaValue> = {};
  private outputs: Record<string, FrankaValue> = {};

  /**
   * Load a program from file. Supports both legacy program format and new module format.
   * For modules, specify functionName to select which function to execute.
   */
  loadProgram(filePath: string): FrankaProgram {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as FrankaProgram;
  }

  /**
   * Load a module from file
   */
  loadModule(filePath: string): FrankaModule {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as FrankaModule;
  }

  /**
   * Check if a file contains a module (new format) or program (legacy format)
   */
  isModuleFile(filePath: string): boolean {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as Record<string, unknown>;
    return 'module' in data;
  }

  /**
   * Get a function from a module by name. If no name is provided, returns the first function found.
   * Supports both old format (functions at root) and new format (functions under 'functions' key).
   */
  getFunctionFromModule(module: FrankaModule, functionName?: string): FrankaFunction {
    // Check if module uses new format with 'functions' key
    const hasNewFormat = 'functions' in module;

    let functionsSource: Record<string, unknown>;
    let functionKeys: string[];

    if (hasNewFormat) {
      // New format: functions are under 'functions' key
      const functions = module.functions as Record<string, unknown>;
      if (!functions || typeof functions !== 'object') {
        throw new Error('Module has invalid "functions" section');
      }
      functionsSource = functions;
      functionKeys = Object.keys(functions);
    } else {
      // Old format: functions are at root level (except 'module' key)
      functionsSource = module;
      functionKeys = Object.keys(module).filter((key) => key !== 'module');
    }

    if (functionKeys.length === 0) {
      throw new Error('Module has no functions defined');
    }

    // If no function name specified, use the first one
    const targetFunction = functionName || functionKeys[0];

    if (!(targetFunction in functionsSource)) {
      throw new Error(
        `Function "${targetFunction}" not found in module. Available functions: ${functionKeys.join(', ')}`
      );
    }

    const func = functionsSource[targetFunction];

    // Validate that it's a function object
    if (!func || typeof func !== 'object' || !('logic' in func)) {
      throw new Error(`"${targetFunction}" is not a valid function definition`);
    }

    return func as FrankaFunction;
  }

  /**
   * Convert a module function to program format (for backward compatibility with execute)
   */
  functionToProgram(
    module: FrankaModule,
    func: FrankaFunction,
    functionName: string
  ): FrankaProgram {
    return {
      program: {
        name: `${module.module.name} - ${functionName}`,
        description: func.description || module.module.description,
      },
      input: func.input,
      output: func.output,
      logic: func.logic,
    };
  }

  execute(program: FrankaProgram): FrankaValue | Record<string, FrankaValue> {
    // Extract default values from input definitions
    this.variables = {};
    this.outputs = {};
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

    const result = this.evaluate(program.logic);

    // If outputs were set using 'set:', return them; otherwise return the result
    if (Object.keys(this.outputs).length > 0) {
      return this.outputs;
    }
    return result;
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

  /**
   * Execute a file that can be either a program (legacy) or module (new format).
   * For modules, specify functionName to select which function to execute.
   */
  executeFile(filePath: string, functionName?: string): FrankaValue | Record<string, FrankaValue> {
    if (this.isModuleFile(filePath)) {
      const module = this.loadModule(filePath);
      const func = this.getFunctionFromModule(module, functionName);
      const program = this.functionToProgram(
        module,
        func,
        functionName || Object.keys(module).filter((k) => k !== 'module')[0]
      );
      return this.execute(program);
    } else {
      const program = this.loadProgram(filePath);
      return this.execute(program);
    }
  }

  private evaluate(logic: FrankaLogic): FrankaValue {
    // Handle primitive values
    if (logic === null || logic === undefined) {
      return logic;
    }

    // Handle primitive types (string, number, boolean)
    if (typeof logic !== 'object') {
      return logic as FrankaValue;
    }

    // Handle arrays for if/then/else chaining, operation chaining, or sequences
    if (Array.isArray(logic)) {
      // Check if this is an if/then/else chain
      if (this.isIfChain(logic)) {
        return this.executeIfChain(logic);
      }
      // Check if this is an operation chain
      if (this.isOperationChain(logic)) {
        return this.executeOperationChain(logic);
      }
      // Otherwise, treat it as a sequence of operations to execute in order
      return this.executeSequence(logic);
    }

    // Handle operations (object with operation name as key)
    const keys = Object.keys(logic);
    if (keys.length === 0) {
      // Empty objects are not valid logic
      return null;
    }

    // Check if this is a flat if/then/else structure
    if (keys.includes('if') && (keys.includes('then') || keys.includes('else'))) {
      return this.executeFlatIf(logic);
    }

    // Check if this is a flat let/in structure
    if (keys.includes('let') && keys.includes('in')) {
      return this.executeFlatLet(logic);
    }

    const operationName = keys[0];
    const operationArgs = logic[operationName];

    switch (operationName) {
      case 'let':
        return this.executeLet(operationArgs);
      case 'get':
        return this.executeGet(operationArgs);
      case 'set':
        return this.executeSet(operationArgs);
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
      throw new Error('let operation requires bindings and an "in" logic');
    }

    const argsObj = args as Record<string, unknown>;

    // Save current variable scope
    const savedVariables = { ...this.variables };

    // Process bindings - each key is a variable name, each value is the value to bind
    // The "in" key contains the logic to evaluate with these bindings
    const inLogic = argsObj.in;
    if (!inLogic) {
      throw new Error('let operation requires an "in" logic');
    }

    // Add bindings sequentially so later bindings can reference earlier ones
    for (const [key, value] of Object.entries(argsObj)) {
      if (key !== 'in') {
        this.variables[key] = this.evaluate(value as FrankaLogic);
      }
    }

    // Evaluate the "in" logic with the new bindings
    const result = this.evaluate(inLogic as FrankaLogic);

    // Restore previous variable scope by clearing and repopulating
    // Don't replace the object to avoid breaking outer scopes
    for (const key of Object.keys(this.variables)) {
      delete this.variables[key];
    }
    Object.assign(this.variables, savedVariables);

    return result;
  }

  private executeFlatLet(expr: Record<string, unknown>): FrankaValue {
    // Handle flat let/in structure where let and in are at the same indentation level
    if (!('let' in expr)) {
      throw new Error('Flat let structure requires "let" key');
    }
    if (!('in' in expr)) {
      throw new Error('Flat let structure requires "in" key');
    }

    const letBindings = expr.let;
    const inLogic = expr.in;

    if (!letBindings || typeof letBindings !== 'object' || Array.isArray(letBindings)) {
      throw new Error('let bindings must be an object');
    }

    // Save current variable scope
    const savedVariables = { ...this.variables };

    // Add bindings sequentially so later bindings can reference earlier ones
    for (const [key, value] of Object.entries(letBindings as Record<string, unknown>)) {
      this.variables[key] = this.evaluate(value as FrankaLogic);
    }

    // Evaluate the "in" logic with the new bindings
    const result = this.evaluate(inLogic as FrankaLogic);

    // Restore previous variable scope
    for (const key of Object.keys(this.variables)) {
      delete this.variables[key];
    }
    Object.assign(this.variables, savedVariables);

    return result;
  }

  private executeGet(args: unknown): FrankaValue {
    // Get an input variable by name
    // Usage: get: varname
    if (typeof args !== 'string') {
      throw new Error('get operation requires a variable name as a string');
    }
    const varName = args;
    if (!(varName in this.variables)) {
      throw new Error(`Undefined variable: ${varName}`);
    }
    return this.variables[varName];
  }

  private executeSet(args: unknown): FrankaValue {
    // Set one or more output values
    // Usage: set: outputname: value
    // or: set: { outputname1: value1, outputname2: value2 }
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw new Error('set operation requires an object with output names and values');
    }

    const argsObj = args as Record<string, unknown>;
    let lastValue: FrankaValue = null;

    for (const [outputName, value] of Object.entries(argsObj)) {
      const evaluatedValue = this.evaluate(value as FrankaLogic);
      this.outputs[outputName] = evaluatedValue;
      lastValue = evaluatedValue;
    }

    // Return the last value set (useful for chaining)
    return lastValue;
  }

  private extractValue(args: unknown): FrankaValue {
    // Helper method to extract value from args (can be direct or in a 'value' property)
    if (args && typeof args === 'object' && !Array.isArray(args) && 'value' in args) {
      return this.evaluate((args as { value: FrankaLogic }).value);
    }
    return this.evaluate(args as FrankaLogic);
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
    return values.map((v: unknown) => this.evaluate(v as FrankaLogic)).join('');
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
      value: FrankaLogic;
      start: FrankaLogic;
      end?: FrankaLogic;
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
      .map((v: unknown) => this.evaluate(v as FrankaLogic))
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
      .map((v: unknown) => this.evaluate(v as FrankaLogic))
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
    const argsObj = args as { left: FrankaLogic; right: FrankaLogic };
    const left = this.evaluate(argsObj.left);
    const right = this.evaluate(argsObj.right);
    return left === right;
  }

  private executeIf(args: unknown): FrankaValue {
    if (!args || typeof args !== 'object' || !('condition' in args)) {
      throw new Error('if operation requires "condition" property');
    }
    const argsObj = args as {
      condition: FrankaLogic;
      then?: FrankaLogic;
      else?: FrankaLogic;
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

    const condition = this.evaluate(expr.if as FrankaLogic);

    if (Boolean(condition)) {
      if ('then' in expr) {
        return this.evaluate(expr.then as FrankaLogic);
      }
    } else {
      if ('else' in expr) {
        return this.evaluate(expr.else as FrankaLogic);
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
        return this.evaluate(itemObj.else as FrankaLogic);
      }

      // Check if condition is met
      if ('if' in itemObj && 'then' in itemObj) {
        const condition = this.evaluate(itemObj.if as FrankaLogic);
        if (Boolean(condition)) {
          return this.evaluate(itemObj.then as FrankaLogic);
        }
      }
    }

    // No condition was met and no else clause
    return null;
  }

  private executeSequence(sequence: unknown[]): FrankaValue {
    // Execute a sequence of operations in order
    // If any operation sets outputs, accumulate them
    // Return the last evaluated value (or null if empty)

    // Sequences must have at least 2 elements to make sense
    if (sequence.length < 2) {
      throw new Error('Arrays cannot be used as standalone logic');
    }

    let lastValue: FrankaValue = null;

    for (const item of sequence) {
      lastValue = this.evaluate(item as FrankaLogic);
    }

    return lastValue;
  }

  private isOperationChain(arr: unknown[]): boolean {
    // Check if the array is an operation chain (pipe-like)
    // Operation chains must have at least 2 elements
    // First element can be any operation (typically get)
    // Subsequent elements should be operations or strings (operation names)
    if (arr.length < 2) return false;

    // All elements should be either objects or strings
    for (const item of arr) {
      if (typeof item === 'string') {
        // Simple operation name
        continue;
      }
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return false;
      }
      // Check if this looks like an operation (has at least one key)
      const keys = Object.keys(item as Record<string, unknown>);
      if (keys.length === 0) {
        return false;
      }
      // If it has 'if' and 'then', it's part of an if-chain, not an operation chain
      if (keys.includes('if') && keys.includes('then')) {
        return false;
      }
      // If it only has 'else', it's part of an if-chain
      if (keys.length === 1 && keys[0] === 'else') {
        return false;
      }
    }

    return true;
  }

  private executeOperationChain(chain: unknown[]): FrankaValue {
    // Execute a chain of operations where each operation receives the result of the previous one
    // Similar to the pipe operator (|>) in functional languages
    let result: FrankaValue = null;

    for (let i = 0; i < chain.length; i++) {
      const item = chain[i];

      if (typeof item === 'string') {
        // Simple operation name without parameters - apply it to the previous result
        result = this.applyOperationToValue(item, result);
      } else if (item && typeof item === 'object' && !Array.isArray(item)) {
        const itemObj = item as Record<string, unknown>;
        const keys = Object.keys(itemObj);

        if (keys.length === 1) {
          const operationName = keys[0];
          const operationArgs = itemObj[operationName];

          // For the first operation, evaluate normally (no piped value yet)
          if (i === 0) {
            result = this.evaluate(item as FrankaLogic);
          } else {
            // For subsequent operations, apply with the piped value
            result = this.applyOperationWithArgs(operationName, operationArgs, result);
          }
        } else {
          // Multiple keys - evaluate as is
          result = this.evaluate(item as FrankaLogic);
        }
      } else {
        throw new Error('Invalid operation in chain');
      }
    }

    return result;
  }

  private applyOperationToValue(operationName: string, value: FrankaValue): FrankaValue {
    // Apply an operation to a value (used in operation chains)
    switch (operationName) {
      case 'uppercase':
        return String(value).toUpperCase();
      case 'lowercase':
        return String(value).toLowerCase();
      case 'length':
        return String(value).length;
      case 'not':
        return !Boolean(value);
      default:
        throw new Error(
          `Operation '${operationName}' cannot be used without parameters in a chain`
        );
    }
  }

  private applyOperationWithArgs(
    operationName: string,
    args: unknown,
    pipedValue: FrankaValue
  ): FrankaValue {
    // Apply an operation with arguments, using the piped value
    switch (operationName) {
      case 'concat':
        // If args is an array, prepend the piped value
        if (Array.isArray(args)) {
          const values = [pipedValue, ...args];
          return values.map((v: unknown) => this.evaluate(v as FrankaLogic)).join('');
        } else if (args && typeof args === 'object' && 'values' in args) {
          const values = [pipedValue, ...(args as { values: unknown[] }).values];
          return values.map((v: unknown) => this.evaluate(v as FrankaLogic)).join('');
        }
        // If it's a simple value, treat as concat with piped value
        return String(pipedValue) + String(this.evaluate(args as FrankaLogic));
      case 'substring':
        // For substring, the piped value becomes the 'value' parameter
        if (!args || typeof args !== 'object') {
          throw new Error(
            'substring operation requires start and optional end parameters in chain'
          );
        }
        const substringArgs = args as { start: FrankaLogic; end?: FrankaLogic };
        const start = this.evaluate(substringArgs.start);
        const end = substringArgs.end !== undefined ? this.evaluate(substringArgs.end) : undefined;
        return String(pipedValue).substring(start as number, end as number | undefined);
      case 'uppercase':
        // Ignore args, just uppercase the piped value
        return String(pipedValue).toUpperCase();
      case 'lowercase':
        // Ignore args, just lowercase the piped value
        return String(pipedValue).toLowerCase();
      case 'length':
        // Ignore args, just get length of piped value
        return String(pipedValue).length;
      case 'not':
        // Ignore args, just negate the piped value
        return !Boolean(pipedValue);
      case 'and':
        // Combine piped value with other values in AND operation
        if (Array.isArray(args)) {
          const values = [pipedValue, ...args.map((v: unknown) => this.evaluate(v as FrankaLogic))];
          return values.every((v: FrankaValue) => Boolean(v));
        }
        return Boolean(pipedValue) && Boolean(this.evaluate(args as FrankaLogic));
      case 'or':
        // Combine piped value with other values in OR operation
        if (Array.isArray(args)) {
          const values = [pipedValue, ...args.map((v: unknown) => this.evaluate(v as FrankaLogic))];
          return values.some((v: FrankaValue) => Boolean(v));
        }
        return Boolean(pipedValue) || Boolean(this.evaluate(args as FrankaLogic));
      case 'equals':
        // Compare piped value with the argument
        if (args && typeof args === 'object' && 'right' in args) {
          const right = this.evaluate((args as { right: FrankaLogic }).right);
          return pipedValue === right;
        }
        // If just a value, compare with piped value
        return pipedValue === this.evaluate(args as FrankaLogic);
      default:
        throw new Error(`Operation '${operationName}' is not supported in chains with arguments`);
    }
  }
}
