# Franka Language Examples

This directory contains example Franka programs demonstrating the YAML-based syntax.

## Examples

### hello.yaml
A simple "Hello World" program that demonstrates the basic program structure and returns a greeting value.

### string-operations.yaml
Demonstrates string manipulation operations using let/in bindings including:
- String concatenation (`concat`)
- Uppercase conversion (`uppercase`)
- Lowercase conversion (`lowercase`)

### boolean-logic.yaml
Demonstrates boolean operations using let/in bindings including:
- Logical AND (`and`)
- Logical OR (`or`)
- Logical NOT (`not`)
- Conditional execution (`if`)

### conditional-string.yaml
Combines boolean and string operations with nested let/in bindings to show how they work together:
- Equality comparison (`equals`)
- Conditional logic with string manipulation

### if-chaining.yaml
Demonstrates if-then chaining syntax for handling multiple conditional branches:
- Chain multiple `if`/`then` conditions in a list
- Final `else` clause for default fallback
- Useful for implementing if-elif-else patterns

### output-single.yaml
Demonstrates a program with a single unnamed output declaration:
- Uses `output: type: string` syntax
- Shows how to document the expected output type
- Combines input with default values and output declaration

### output-multiple.yaml
Demonstrates a program with multiple named output declarations:
- Documents multiple outputs with descriptive names
- Each output has its own type specification
- Useful for programs that conceptually produce multiple results

## Running Examples

To run any of these examples:

```bash
npm run cli -- run examples/hello.yaml
```

## Syntax Overview

Franka is a pure functional language. Programs are written in YAML format and evaluate to a single value:

```yaml
program:
  name: "Program Name"
  description: "Program description"

input:
  variable_name:
    type: string
    default: value
  another_var:
    type: string
    default: value

output:
  type: string
  # OR multiple named outputs:
  # result:
  #   type: string
  # count:
  #   type: number

expression:
  # Simple value expression
  "Hello, World!"
  
  # Or use let/in for bindings
  let:
    result: "Success"
    message:
      concat:
        - "Hello, "
        - "$name"
    in: "$message"
```

Variables are referenced using the `$variable_name` syntax.

## Supported Operations

### Let Bindings
- `let`: Define local bindings with an expression to evaluate
  ```yaml
  let:
    x: 5
    y: 10
    sum: 15
    in: "$sum"
  ```

### String Operations
- `concat`: Concatenate strings (array or named args)
  ```yaml
  concat:
    - "Hello, "
    - "$name"
  ```
- `length`: Get string length
  ```yaml
  length: "$text"
  ```
- `substring`: Extract substring
  ```yaml
  substring:
    value: "$text"
    start: 0
    end: 5
  ```
- `uppercase`: Convert to uppercase
  ```yaml
  uppercase: "$text"
  ```
- `lowercase`: Convert to lowercase
  ```yaml
  lowercase: "$text"
  ```

### Boolean Operations
- `and`: Logical AND (array or named args)
  ```yaml
  and:
    - true
    - "$condition"
  ```
- `or`: Logical OR (array or named args)
  ```yaml
  or:
    - false
    - "$condition"
  ```
- `not`: Logical NOT
  ```yaml
  not: "$condition"
  ```
- `equals`: Equality comparison
  ```yaml
  equals:
    left: "$value1"
    right: "$value2"
  ```

### Control Operations
- `if`: Conditional expression that returns a value
  - **Flat syntax (recommended)**:
    ```yaml
    if: "$is_valid"
    then: "Valid!"
    else: "Invalid!"
    ```
  - **Nested syntax (legacy)**:
    ```yaml
    if:
      condition: "$is_valid"
      then: "Valid!"
      else: "Invalid!"
    ```
  - **Chaining syntax**:
    ```yaml
    - if: "$condition1"
      then: "Result 1"
    - if: "$condition2"
      then: "Result 2"
    - else: "Default"
    ```
