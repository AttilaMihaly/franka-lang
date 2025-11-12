import { loadLanguageSpec, getVersion, getMetadata } from './spec-loader';

describe('spec-loader', () => {
  describe('loadLanguageSpec', () => {
    it('should load the language specification', () => {
      const spec = loadLanguageSpec();
      expect(spec).toBeDefined();
      expect(spec.metadata).toBeDefined();
      expect(spec.syntax).toBeDefined();
      expect(spec.semantics).toBeDefined();
      expect(spec.tooling).toBeDefined();
      expect(spec.examples).toBeDefined();
    });

    it('should have correct metadata structure', () => {
      const spec = loadLanguageSpec();
      expect(spec.metadata.name).toBe('Franka');
      expect(spec.metadata.version).toBe('1.0.0');
      expect(spec.metadata.description).toContain('collaboration');
      expect(spec.metadata.file_extension).toBe('.yaml');
      expect(spec.metadata.syntax_format).toBe('yaml');
    });

    it('should have operations defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.syntax.operations.let).toBeInstanceOf(Array);
      expect(spec.syntax.operations.string).toBeInstanceOf(Array);
      expect(spec.syntax.operations.boolean).toBeInstanceOf(Array);
      expect(spec.syntax.operations.control).toBeInstanceOf(Array);
      expect(spec.syntax.operations.let.length).toBeGreaterThan(0);
      expect(spec.syntax.operations.string.length).toBeGreaterThan(0);
      expect(spec.syntax.operations.boolean.length).toBeGreaterThan(0);
      expect(spec.syntax.operations.control.length).toBeGreaterThan(0);
    });

    it('should have string operations defined', () => {
      const spec = loadLanguageSpec();
      const concatOp = spec.syntax.operations.string.find((op) => op.name === 'concat');
      expect(concatOp).toBeDefined();
      expect(concatOp?.description).toContain('Concatenate');

      const uppercaseOp = spec.syntax.operations.string.find((op) => op.name === 'uppercase');
      expect(uppercaseOp).toBeDefined();
    });

    it('should have boolean operations defined', () => {
      const spec = loadLanguageSpec();
      const andOp = spec.syntax.operations.boolean.find((op) => op.name === 'and');
      expect(andOp).toBeDefined();
      expect(andOp?.description).toContain('AND');

      const orOp = spec.syntax.operations.boolean.find((op) => op.name === 'or');
      expect(orOp).toBeDefined();

      const notOp = spec.syntax.operations.boolean.find((op) => op.name === 'not');
      expect(notOp).toBeDefined();
    });

    it('should have control operations defined', () => {
      const spec = loadLanguageSpec();
      const ifOp = spec.syntax.operations.control.find((op) => op.name === 'if');
      expect(ifOp).toBeDefined();
      expect(ifOp?.description).toContain('Conditional');
    });

    it('should have data types defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.syntax.data_types.primitives).toBeInstanceOf(Array);
      expect(spec.syntax.data_types.primitives.length).toBeGreaterThan(0);

      const stringType = spec.syntax.data_types.primitives.find((t) => t.name === 'String');
      expect(stringType).toBeDefined();

      const booleanType = spec.syntax.data_types.primitives.find((t) => t.name === 'Boolean');
      expect(booleanType).toBeDefined();
    });

    it('should have examples defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.examples).toBeInstanceOf(Array);
      expect(spec.examples.length).toBeGreaterThan(0);

      const helloWorld = spec.examples.find((ex) => ex.name === 'Hello World');
      expect(helloWorld).toBeDefined();
      expect(helloWorld?.code).toContain('module:');
      expect(helloWorld?.code).toContain('main:');
      expect(helloWorld?.code).toContain('logic:');
    });

    it('should have module structure defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.syntax.module_structure).toBeDefined();
      expect(spec.syntax.module_structure.root_keys).toBeInstanceOf(Array);
      expect(spec.syntax.module_structure.root_keys.length).toBeGreaterThan(0);

      const moduleKey = spec.syntax.module_structure.root_keys.find((k) => k.name === 'module');
      expect(moduleKey).toBeDefined();
      expect(moduleKey?.required).toBe(true);

      const functionKey = spec.syntax.module_structure.root_keys.find(
        (k) => k.name === 'function_name'
      );
      expect(functionKey).toBeDefined();
      expect(functionKey?.required).toBe(true);
    });
  });

  describe('getVersion', () => {
    it('should return the version string', () => {
      const version = getVersion();
      expect(version).toBe('1.0.0');
    });
  });

  describe('getMetadata', () => {
    it('should return metadata object', () => {
      const metadata = getMetadata();
      expect(metadata.name).toBe('Franka');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.file_extension).toBe('.yaml');
      expect(metadata.syntax_format).toBe('yaml');
    });
  });
});
