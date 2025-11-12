import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface OperationParameter {
  name: string;
  type: string;
  description: string;
}

export interface Operation {
  name: string;
  description: string;
  parameters: OperationParameter[];
  example: string;
}

export interface LanguageSpec {
  metadata: {
    name: string;
    version: string;
    description: string;
    file_extension: string;
    syntax_format: string;
    comment_style: {
      single_line: string;
      multi_line: {
        start: string;
        end: string;
      };
    };
  };
  syntax: {
    description: string;
    module_structure: {
      description: string;
      root_keys: Array<{
        name: string;
        description: string;
        required: boolean;
      }>;
      function_structure?: {
        description: string;
        keys: Array<{
          name: string;
          description: string;
          required: boolean;
        }>;
      };
    };
    operations: {
      let: Operation[];
      string: Operation[];
      boolean: Operation[];
      control: Operation[];
    };
    data_types: {
      primitives: Array<{ name: string; description: string; examples: string[] }>;
    };
  };
  semantics: {
    scoping: { type: string; description: string };
    purity: { paradigm: string; description: string };
    type_system: { paradigm: string; description: string };
    evaluation: { strategy: string; description: string };
    variables: { reference_syntax: string; description: string };
  };
  tooling: {
    cli: {
      description: string;
      commands: Array<{ name: string; description: string; usage: string }>;
    };
    mcp: {
      description: string;
      capabilities: string[];
    };
    web: {
      description: string;
      features: string[];
    };
  };
  examples: Array<{
    name: string;
    description: string;
    code: string;
  }>;
}

export function loadLanguageSpec(): LanguageSpec {
  const specPath = path.join(__dirname, '../../spec/language.yaml');
  const fileContents = fs.readFileSync(specPath, 'utf8');
  return yaml.load(fileContents, { schema: yaml.CORE_SCHEMA }) as LanguageSpec;
}

export function getVersion(): string {
  const spec = loadLanguageSpec();
  return spec.metadata.version;
}

export function getMetadata() {
  const spec = loadLanguageSpec();
  return spec.metadata;
}
