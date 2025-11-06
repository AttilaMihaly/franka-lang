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
      expect(spec.metadata.file_extension).toBe('.franka');
    });

    it('should have keywords defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.syntax.keywords).toBeInstanceOf(Array);
      expect(spec.syntax.keywords.length).toBeGreaterThan(0);

      const letKeyword = spec.syntax.keywords.find((k) => k.name === 'let');
      expect(letKeyword).toBeDefined();
      expect(letKeyword?.category).toBe('declaration');
    });

    it('should have operators defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.syntax.operators.arithmetic).toBeInstanceOf(Array);
      expect(spec.syntax.operators.comparison).toBeInstanceOf(Array);
      expect(spec.syntax.operators.logical).toBeInstanceOf(Array);
    });

    it('should have data types defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.syntax.data_types.primitives).toBeInstanceOf(Array);
      expect(spec.syntax.data_types.composite).toBeInstanceOf(Array);
      expect(spec.syntax.data_types.primitives.length).toBeGreaterThan(0);
    });

    it('should have examples defined', () => {
      const spec = loadLanguageSpec();
      expect(spec.examples).toBeInstanceOf(Array);
      expect(spec.examples.length).toBeGreaterThan(0);

      const helloWorld = spec.examples.find((ex) => ex.name === 'Hello World');
      expect(helloWorld).toBeDefined();
      expect(helloWorld?.code).toContain('Hello');
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
      expect(metadata.file_extension).toBe('.franka');
    });
  });
});
