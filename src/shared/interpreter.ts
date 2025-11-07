import * as fs from 'fs';
import * as yaml from 'js-yaml';

export type FrankaValue = string | number | boolean | null;

export interface FrankaProgram {
  program: {
    name: string;
    description?: string;
  };
  variables?: Record<string, FrankaValue>;
  operations: FrankaOperation[];
}

export interface FrankaOperation {
  operation: string;
  [key: string]: any; // Dynamic operation parameters - acceptable for flexibility
}

export class FrankaInterpreter {
  private variables: Record<string, FrankaValue> = {};
  private output: string[] = [];

  loadProgram(filePath: string): FrankaProgram {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as FrankaProgram;
  }

  execute(program: FrankaProgram): string[] {
    this.output = [];
    this.variables = program.variables ? { ...program.variables } : {};

    for (const operation of program.operations) {
      this.executeOperation(operation);
    }

    return this.output;
  }

  executeFile(filePath: string): string[] {
    const program = this.loadProgram(filePath);
    return this.execute(program);
  }

  private executeOperation(operation: FrankaOperation): any {
    switch (operation.operation) {
      case 'print':
        return this.executePrint(operation);
      case 'assign':
        return this.executeAssign(operation);
      case 'concat':
        return this.executeConcat(operation);
      case 'uppercase':
        return this.executeUppercase(operation);
      case 'lowercase':
        return this.executeLowercase(operation);
      case 'length':
        return this.executeLength(operation);
      case 'substring':
        return this.executeSubstring(operation);
      case 'and':
        return this.executeAnd(operation);
      case 'or':
        return this.executeOr(operation);
      case 'not':
        return this.executeNot(operation);
      case 'equals':
        return this.executeEquals(operation);
      case 'if':
        return this.executeIf(operation);
      default:
        throw new Error(`Unknown operation: ${operation.operation}`);
    }
  }

  private resolveValue(value: any): any {
    if (typeof value === 'string' && value.startsWith('$')) {
      const varName = value.substring(1);
      if (!(varName in this.variables)) {
        throw new Error(`Undefined variable: ${varName}`);
      }
      return this.variables[varName];
    }

    if (typeof value === 'object' && value !== null && 'operation' in value) {
      return this.executeOperation(value);
    }

    return value;
  }

  private executePrint(operation: FrankaOperation): void {
    const value = this.resolveValue(operation.value);
    this.output.push(String(value));
  }

  private executeAssign(operation: FrankaOperation): void {
    const value = this.resolveValue(operation.value);
    this.variables[operation.variable] = value;
  }

  private executeConcat(operation: FrankaOperation): string {
    const values = operation.values.map((v: any) => this.resolveValue(v));
    return values.join('');
  }

  private executeUppercase(operation: FrankaOperation): string {
    const value = this.resolveValue(operation.value);
    return String(value).toUpperCase();
  }

  private executeLowercase(operation: FrankaOperation): string {
    const value = this.resolveValue(operation.value);
    return String(value).toLowerCase();
  }

  private executeLength(operation: FrankaOperation): number {
    const value = this.resolveValue(operation.value);
    return String(value).length;
  }

  private executeSubstring(operation: FrankaOperation): string {
    const value = this.resolveValue(operation.value);
    const start = this.resolveValue(operation.start);
    const end = operation.end !== undefined ? this.resolveValue(operation.end) : undefined;
    return String(value).substring(start, end);
  }

  private executeAnd(operation: FrankaOperation): boolean {
    const values = operation.values.map((v: any) => this.resolveValue(v));
    return values.every((v: any) => Boolean(v));
  }

  private executeOr(operation: FrankaOperation): boolean {
    const values = operation.values.map((v: any) => this.resolveValue(v));
    return values.some((v: any) => Boolean(v));
  }

  private executeNot(operation: FrankaOperation): boolean {
    const value = this.resolveValue(operation.value);
    return !Boolean(value);
  }

  private executeEquals(operation: FrankaOperation): boolean {
    const left = this.resolveValue(operation.left);
    const right = this.resolveValue(operation.right);
    return left === right;
  }

  private executeIf(operation: FrankaOperation): void {
    const condition = this.resolveValue(operation.condition);

    if (Boolean(condition)) {
      if (operation.then) {
        for (const op of operation.then) {
          this.executeOperation(op);
        }
      }
    } else {
      if (operation.else) {
        for (const op of operation.else) {
          this.executeOperation(op);
        }
      }
    }
  }
}
