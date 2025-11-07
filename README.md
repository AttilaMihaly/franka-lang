# Franka Programming Language

The language of collaboration - A programming language designed for clear communication and collaborative development.

## Overview

Franka is a modern programming language with a self-documenting specification defined in YAML format. Programs are also written in YAML format using structured operations for clear and collaborative development. This repository contains the language specification and TypeScript-based tooling including a CLI, MCP (Model Context Protocol) server, and Web API server.

## Language Features

- **YAML-Based Syntax**: Programs are written in structured YAML format
- **Self-Documenting Specification**: Language specification in YAML format (`spec/language.yaml`)
- **String Operations**: concat, uppercase, lowercase, length, substring
- **Boolean Operations**: and, or, not, equals
- **Control Flow**: if/then/else, variable assignment, print
- **Variable References**: Use `$variable_name` to reference variables
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
npm run cli -- check <file>     # Check syntax
npm run cli -- repl             # Start REPL (coming soon)
```

#### Running Example Programs

```bash
# Run hello world example
npm run cli -- run examples/hello.franka

# Run string operations example
npm run cli -- run examples/string-operations.franka

# Run boolean logic example
npm run cli -- run examples/boolean-logic.franka

# Check syntax of a program
npm run cli -- check examples/hello.franka
```

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
│   ├── hello.franka      # Hello world
│   ├── string-operations.franka
│   ├── boolean-logic.franka
│   ├── conditional-string.franka
│   └── README.md         # Examples documentation
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

Franka programs are written in YAML format:

```yaml
program:
  name: "Program Name"
  description: "Program description"

variables:
  greeting: "Hello"
  name: "World"

operations:
  - operation: concat
    values:
      - "$greeting"
      - ", "
      - "$name"
      - "!"
  - operation: print
    value: "$message"
```

### Supported Operations

#### String Operations
- `concat`: Concatenate strings
- `uppercase`: Convert string to uppercase
- `lowercase`: Convert string to lowercase
- `length`: Get string length
- `substring`: Extract substring

#### Boolean Operations
- `and`: Logical AND operation
- `or`: Logical OR operation
- `not`: Logical NOT operation
- `equals`: Equality comparison

#### Control Operations
- `if`: Conditional execution with then/else branches
- `print`: Print value to output
- `assign`: Assign value to variable

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
