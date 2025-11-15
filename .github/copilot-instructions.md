# Copilot Instructions for Franka Language

## Project Overview

Franka is a YAML-based programming language designed for clear communication and collaborative development. This repository contains:

- **Language specification** (`spec/language.yaml`) - Self-documenting YAML spec defining the language
- **TypeScript tooling** - CLI, MCP server, and Web API server
- **Interpreter** (`src/shared/interpreter.ts`) - Core language evaluation engine
- **Examples** (`examples/`) - Sample Franka programs demonstrating language features

### Key Concepts

- **Pure functional language**: Functions evaluate to values without side effects
- **YAML-based syntax**: Programs are written in structured YAML format
- **Module system**: Code organized into modules with named functions
- **Operation chaining**: Support for pipe-like operations (similar to `|>` in functional languages)
- **Let/in bindings**: Declarative variable bindings with lexical scoping

## Architecture

### Core Components

1. **Interpreter** (`src/shared/interpreter.ts`)
   - Evaluates Franka programs
   - Supports string, boolean, and control operations
   - Handles operation chaining and let/in bindings
   - Main entry point: `evaluateProgram()` and `evaluateOperation()`

2. **Spec Loader** (`src/shared/spec-loader.ts`)
   - Loads and parses the language specification
   - Provides access to metadata, syntax, and examples

3. **Spec Runner** (`src/shared/spec-runner.ts`)
   - Runs test specifications against Franka programs
   - Validates program output against expected results

4. **CLI** (`src/cli/index.ts`)
   - Command-line interface for running and checking Franka programs
   - Commands: `run`, `check`, `version`

5. **MCP Server** (`src/mcp/index.ts`)
   - Model Context Protocol server for AI integration
   - Provides language capabilities and specification access

6. **Web Server** (`src/web/index.ts`)
   - RESTful API for accessing language specification
   - Endpoints for browsing modules and getting language details

## Development Workflow

### Before Making Changes

**ALWAYS** run these commands to understand the current state:

```bash
npm test              # Run all tests (140 tests should pass)
npm run build         # Compile TypeScript
npm run lint          # Check code quality
npm run format:check  # Verify code formatting
```

### During Development

1. **Make small, incremental changes** - Test each change before moving on
2. **Run tests frequently** - Catch issues early with `npm test`
3. **Validate with examples** - Test changes with example programs:
   ```bash
   npm run cli -- run examples/hello.yaml
   npm run cli -- check examples/multi-function.yaml
   ```

### Before Committing

**ALWAYS** verify all checks pass:

```bash
npm test
npm run build
npm run lint
npm run format:check
```

## Code Style and Conventions

### Formatting

- **ALWAYS** run `npm run format:check` before committing
- If formatting issues exist, fix with `npm run format`
- Prettier configuration: `.prettierrc.json`
- ESLint configuration: `eslint.config.mjs`

### TypeScript Conventions

- Use explicit types where appropriate
- Avoid `any` type (some test exceptions are acceptable)
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### File Organization

- **Tests**: Place `.test.ts` files next to the code they test
- **Shared code**: Use `src/shared/` for code used by multiple components
- **Examples**: Keep example programs in `examples/` directory
- **Spec files**: Module tests go in `<module>.spec.yaml` files

## Testing Strategy

### Unit Tests

- All core functionality has unit tests (Jest framework)
- Tests are colocated with source files (`.test.ts` suffix)
- Run specific test files: `npm test -- interpreter.test.ts`
- Watch mode for development: `npm run test:watch`

### Integration Tests

- Example programs serve as integration tests
- Use `npm run cli -- check <file>` to run program tests
- Spec files (`.spec.yaml`) define expected outputs

### Test Requirements

- **All tests must pass** before committing (200+ tests)
- **Coverage must be ≥90%** - enforced by `npm run test:coverage`
- **Add tests for new features** - Follow existing test patterns
- **Update tests for changes** - Don't break existing tests
- **Test edge cases** - Empty inputs, invalid data, boundary conditions

### Coverage Requirements

**Minimum 90% line coverage is enforced:**

- Run `npm run test:coverage` to check coverage and enforce threshold
- Coverage report is in `coverage/` directory
- Focus on testing business logic in `src/shared/` modules
- Entry point files (`src/cli`, `src/mcp`, `src/web`) have integration tests
- Use `scripts/check-coverage.js` for automated checking

**Before committing code:**

```bash
npm run test:coverage  # Must pass 90% threshold
npm run build
npm run lint
npm run format:check
```

## Common Patterns

### Adding a New Operation

1. Add operation to `spec/language.yaml` under appropriate category
2. Implement in `src/shared/interpreter.ts` in `evaluateOperation()`
3. Add unit tests in `src/shared/interpreter.test.ts`
4. Add example usage in `examples/` directory
5. Update README.md with operation documentation

### Adding a CLI Command

1. Add command handler in `src/cli/index.ts`
2. Add tests in `src/cli/index.test.ts`
3. Update README.md with command documentation

### Working with YAML Specs

- Use `js-yaml` library for parsing
- Validate structure before processing
- Handle errors gracefully with clear messages

## Troubleshooting

### Build Errors

- **"Cannot find module"**: Run `npm install` to install dependencies
- **Type errors**: Check TypeScript version compatibility in `package.json`
- **"Cannot find name 'console'"**: Check `tsconfig.json` includes proper libs

### Test Failures

- Run `npm test -- --verbose` for detailed output
- Check if example files have been modified
- Verify spec files (`.spec.yaml`) match expected outputs

### Formatting Issues

- Run `npm run format` to auto-fix formatting
- Check `.prettierrc.json` for configuration
- Some lint warnings about `any` types are acceptable in tests

## Documentation Requirements

### When to Update Documentation

- **README.md**: For user-facing changes (new commands, features, examples)
- **spec/language.yaml**: For language syntax or semantic changes
- **Examples**: When adding new language features or operations
- **examples/README.md**: Keep synchronized with example files

### Documentation Style

- Clear, concise explanations
- Include code examples where appropriate
- Follow existing documentation patterns
- Use proper YAML formatting in examples

## Important Files

- **spec/language.yaml**: Language specification (source of truth)
- **src/shared/interpreter.ts**: Core interpreter logic
- **src/shared/interpreter.test.ts**: Interpreter tests (comprehensive)
- **package.json**: Scripts and dependencies
- **tsconfig.json**: TypeScript configuration
- **.prettierrc.json**: Prettier formatting rules
- **eslint.config.mjs**: ESLint configuration

## Quick Reference

### Useful Commands

```bash
npm run build          # Compile TypeScript
npm test              # Run all tests
npm run test:watch    # Watch mode for tests
npm run lint          # Check code quality
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format all code
npm run format:check  # Check formatting
npm run cli           # Run CLI tool
npm run mcp           # Start MCP server
npm run web           # Start web server
```

### Running Examples

```bash
# Run a program
npm run cli -- run examples/hello.yaml

# Run specific function in a module
npm run cli -- run examples/multi-function.yaml -f greet

# Check program syntax and run tests
npm run cli -- check examples/multi-function.yaml
```
