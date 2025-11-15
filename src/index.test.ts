import * as FrankaLang from './index';

describe('FrankaLang exports', () => {
  it('should export loadLanguageSpec from spec-loader', () => {
    expect(FrankaLang.loadLanguageSpec).toBeDefined();
    expect(typeof FrankaLang.loadLanguageSpec).toBe('function');
  });

  it('should export getMetadata from spec-loader', () => {
    expect(FrankaLang.getMetadata).toBeDefined();
    expect(typeof FrankaLang.getMetadata).toBe('function');
  });

  it('should export getVersion from spec-loader', () => {
    expect(FrankaLang.getVersion).toBeDefined();
    expect(typeof FrankaLang.getVersion).toBe('function');
  });

  it('should export FrankaInterpreter', () => {
    expect(FrankaLang.FrankaInterpreter).toBeDefined();
    expect(typeof FrankaLang.FrankaInterpreter).toBe('function');
  });

  it('should be able to instantiate FrankaInterpreter', () => {
    const interpreter = new FrankaLang.FrankaInterpreter();
    expect(interpreter).toBeInstanceOf(FrankaLang.FrankaInterpreter);
  });

  it('should be able to call getMetadata', () => {
    const metadata = FrankaLang.getMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.name).toBe('Franka');
  });

  it('should be able to call getVersion', () => {
    const version = FrankaLang.getVersion();
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
  });
});
