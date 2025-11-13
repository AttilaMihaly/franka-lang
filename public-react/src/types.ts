export interface DirectoryEntry {
  name: string;
  type: 'directory' | 'file';
  path: string;
}

export interface DirectoryData {
  currentPath: string;
  entries: DirectoryEntry[];
}

export interface FunctionDef {
  description?: string;
  input?: Record<string, { type?: string; default?: any }>;
  output?: { type?: string } | Record<string, { type?: string }>;
  logic: any;
}

export interface ModuleDef {
  module: {
    name: string;
    description?: string;
  };
  functions: Record<string, FunctionDef>;
}

export interface TestCase {
  description?: string;
  input?: Record<string, any>;
  expectedOutput?: any;
}

export interface FunctionSpecs {
  tests?: TestCase[];
}

export interface ModuleSpecs {
  functions?: Record<string, FunctionSpecs>;
}

export interface ModuleData {
  path: string;
  module: ModuleDef;
  specs: ModuleSpecs | null;
}
