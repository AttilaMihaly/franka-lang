import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface LanguageSpec {
  metadata: {
    name: string;
    version: string;
    description: string;
    file_extension: string;
    comment_style: {
      single_line: string;
      multi_line: {
        start: string;
        end: string;
      };
    };
  };
  syntax: {
    keywords: Array<{
      name: string;
      description: string;
      category: string;
      example: string;
    }>;
    operators: {
      arithmetic: Array<{ symbol: string; description: string; precedence: number }>;
      comparison: Array<{ symbol: string; description: string; precedence: number }>;
      logical: Array<{ symbol: string; description: string; precedence: number }>;
    };
    data_types: {
      primitives: Array<{ name: string; description: string; examples: string[] }>;
      composite: Array<{ name: string; description: string; syntax: string; examples: string[] }>;
    };
  };
  semantics: {
    scoping: { type: string; description: string };
    type_system: { paradigm: string; description: string };
    evaluation: { strategy: string; description: string };
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
  return yaml.load(fileContents) as LanguageSpec;
}

export function getVersion(): string {
  const spec = loadLanguageSpec();
  return spec.metadata.version;
}

export function getMetadata() {
  const spec = loadLanguageSpec();
  return spec.metadata;
}
