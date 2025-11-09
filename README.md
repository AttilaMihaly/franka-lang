# Franka Programming Language

The language of collaboration - A programming language designed for clear communication and collaborative development.

## Overview

Franka is a modern programming language with a self-documenting specification defined in YAML format. Programs are also written in YAML format using structured operations for clear and collaborative development. This repository contains the language specification and TypeScript-based tooling including a CLI, MCP (Model Context Protocol) server, and Web API server.

## Language Features

- **YAML-Based Syntax**: Programs are written in structured YAML format
- **Pure Functional**: No side effects - programs evaluate to values
- **Self-Documenting Specification**: Language specification in YAML format (`spec/language.yaml`)
- **Let/In Bindings**: Declarative variable bindings with lexical scoping
- **String Operations**: concat, uppercase, lowercase, length, substring
- **Boolean Operations**: and, or, not, equals
- **Control Flow**: if/then/else conditional logic
- **Input/Output Operations**: 
  - `get: varname` - Reference input variables
  - `set: { output: value }` - Set named outputs
- **CLI Tool**: Command-line interface for running and checking Franka programs
- **MCP Server**: Model Context Protocol server for AI integration
- **Web API Server**: RESTful API for accessing language specification
- **TypeScript Implementation**: Modern, type-safe tooling
- **Comprehensive Testing**: Unit tests with Jest
- **Code Quality**: ESLint and Prettier for code quality and consistency

## Installation

```bash
npm install
```

## Usage

### Build the Project

```bash
npm run build
```

### CLI Tool

Run the Franka CLI:

```bash
# Using npm script
npm run cli -- --help

# After building
node dist/cli/index.js --help

# Available commands
npm run cli -- version          # Show version
npm run cli -- run <file>       # Run a Franka program
npm run cli -- check <file>     # Check syntax and run tests
npm run cli -- repl             # Start REPL (coming soon)
```

#### Running Example Programs

```bash
# Run hello world example
npm run cli -- run examples/hello.yaml

# Run string operations example
npm run cli -- run examples/string-operations.yaml

# Run boolean logic example
npm run cli -- run examples/boolean-logic.yaml

# Check syntax and run tests (if spec file exists)
npm run cli -- check examples/hello.yaml
```

#### Program Testing with Spec Files

Franka supports automatic testing through spec files. Create a file named `program_name.spec.yaml` alongside your program:

```yaml
tests:
  - description: "Test with default inputs"
    expectedOutputs: "Expected result"
    
  - description: "Test with custom inputs"
    inputs:
      variable: "custom value"
    expectedOutputs: "Different result"
```

The `check` command automatically discovers and runs spec files, reporting test results.

### MCP Server

Start the Model Context Protocol server:

```bash
# Default port (3001)
npm run mcp

# Custom port
npm run mcp -- --port=3002
```

### Web Server

Start the web API server:

```bash
# Default port (3000)
npm run web

# Custom port
npm run web -- --port=8080
```

The web server provides a RESTful API with the following endpoints:

- `GET /` - API documentation
- `GET /api/spec` - Complete language specification
- `GET /api/spec/metadata` - Language metadata
- `GET /api/spec/syntax` - Syntax specification
- `GET /api/spec/examples` - Code examples
- `GET /api/keywords` - Language keywords
- `GET /api/operators` - Language operators
- `GET /api/version` - Version information
- `GET /health` - Health check

## Development

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Development Mode

```bash
# Run CLI in development mode
npm run dev -- --help

# Run web server in development mode
npm run web

# Run MCP server in development mode
npm run mcp
```

## Project Structure

```
franka-lang/
├── spec/                  # Language specification
│   └── language.yaml      # Self-documenting YAML spec
├── examples/              # Example Franka programs
│   ├── hello.yaml         # Hello world
│   ├── string-operations.yaml
│   ├── boolean-logic.yaml
│   ├── conditional-string.yaml
│   └── README.md          # Examples documentation
├── src/
│   ├── cli/              # Command-line interface
│   │   └── index.ts
│   ├── mcp/              # MCP server
│   │   └── index.ts
│   ├── web/              # Web API server
│   │   └── index.ts
│   ├── shared/           # Shared utilities
│   │   ├── spec-loader.ts
│   │   ├── spec-loader.test.ts
│   │   ├── interpreter.ts
│   │   └── interpreter.test.ts
│   └── index.ts          # Main library entry
├── dist/                 # Compiled output (generated)
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest configuration
├── eslint.config.mjs     # ESLint configuration
├── .prettierrc.json      # Prettier configuration
├── .gitignore           # Git ignore rules
└── package.json         # Project metadata and scripts
```

## Language Specification

The Franka language specification is defined in `spec/language.yaml` and includes:

- **Metadata**: Language name, version, description, file extensions, syntax format
- **Syntax**: Program structure, operations (string, boolean, control)
- **Semantics**: Scoping rules, type system, evaluation strategy, variable references
- **Tooling**: CLI commands, MCP capabilities, web features
- **Examples**: Code samples demonstrating language features

### Program Structure

Franka is a pure functional language where programs evaluate to a single value:

```yaml
program:
  name: "Program Name"
  description: "Program description"

input:
  greeting:
    type: string
    default: "Hello"
  name:
    type: string
    default: "World"

output:
  type: string
  # OR multiple named outputs:
  # result:
  #   type: string
  # count:
  #   type: number

logic:
  # Use let/in for local bindings
  let:
    message:
      concat:
        - get: greeting
        - ", "
        - get: name
        - "!"
  in:
    get: message
```

For programs with multiple named outputs, use the `set` operation:

```yaml
output:
  greeting:
    type: string
  length:
    type: number

logic:
  let:
    msg:
      concat:
        - get: greeting
        - ", "
        - get: name
  in:
    set:
      greeting:
        get: msg
      length:
        length:
          get: msg
```

#### Input and Output Sections

- **Input**: Declares typed input variables with optional default values
  - Supports `string`, `number`, and `boolean` types
  - Default values are optional
  - Variables with defaults are available in the logic

- **Output**: Declares the expected output type(s) from the program
  - Supports `string`, `number`, and `boolean` types
  - No default values allowed
  - Can be a single unnamed output: `output: type: string`
  - Or multiple named outputs: `output: result: type: string\n count: type: number`
  - Output declarations are for documentation and validation purposes

### Supported Operations

#### Let Bindings
- `let`: Define local variable bindings with lexical scoping
  - Supports flat syntax where `let` and `in` are at the same indentation level (recommended)
  - Also supports legacy nested syntax for backward compatibility
  - Each binding defines a variable name and its value
  - The `in` logic specifies what to evaluate with those bindings
  - Bindings can reference earlier bindings in the same let block

#### Input/Output Operations
- `get: varname`: Get an input variable value by name
  - Example: `get: username`
  
- `set: { output: value }`: Set one or more named output values
  - Used with multiple named outputs defined in the output section
  - Can set multiple outputs in a single operation
  - Can be placed at any node of an if/else tree
  - Example: `set: { result: "Success", count: 42 }`
  - When `set` is used, the program returns an object with output names and values

#### String Operations
- `concat`: Concatenate strings (accepts array or named args)
- `uppercase`: Convert string to uppercase (accepts value directly or as named arg)
- `lowercase`: Convert string to lowercase (accepts value directly or as named arg)
- `length`: Get string length (accepts value directly or as named arg)
- `substring`: Extract substring (requires named args: value, start, end)

#### Boolean Operations
- `and`: Logical AND operation (accepts array or named args)
- `or`: Logical OR operation (accepts array or named args)
- `not`: Logical NOT operation (accepts value directly or as named arg)
- `equals`: Equality comparison (requires named args: left, right)

#### Control Operations
- `if`: Conditional logic that returns a value based on condition
  - Supports three syntax variants:
    1. **Nested syntax** (legacy): `if: { condition: <expr>, then: <expr>, else: <expr> }`
    2. **Flat syntax** (recommended): `if: <expr>`, `then: <expr>`, `else: <expr>` on same level
    3. **Chaining syntax**: List of `if`/`then` pairs with final `else` for if-elif-else patterns
  - The condition is evaluated, and returns `then` logic if true, `else` logic if false
  - The `else` branch is optional

View the specification file directly or access it programmatically through the API.

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run dev` | Run CLI in development mode |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check code with ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run cli` | Run the CLI tool |
| `npm run mcp` | Start MCP server |
| `npm run web` | Start web API server |

## Contributing

This project uses:
- TypeScript for type-safe development
- ESLint for code quality
- Prettier for code formatting
- Jest for testing

Please ensure all tests pass and code is properly formatted before submitting changes.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Version

Current version: 1.0.0

For version information, run:
```bash
npm run cli -- version
```
