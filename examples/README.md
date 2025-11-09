# Franka Language Examples

This directory contains example Franka programs demonstrating the YAML-based syntax.

## Examples

### hello.yaml
A simple "Hello World" program that demonstrates the basic program structure and returns a greeting value.

**Spec file:** `hello.spec.yaml` - Contains 2 test cases validating the default output.

### string-operations.yaml
Demonstrates string manipulation operations using let/in bindings including:
- String concatenation (`concat`)
- Uppercase conversion (`uppercase`)
- Lowercase conversion (`lowercase`)

**Spec file:** `string-operations.spec.yaml` - Contains 4 test cases covering default inputs, custom inputs, edge cases with empty strings, and single character strings.

### boolean-logic.yaml
Demonstrates boolean operations using let/in bindings including:
- Logical AND (`and`)
- Logical OR (`or`)
- Logical NOT (`not`)
- Conditional execution (`if`)

**Spec file:** `boolean-logic.spec.yaml` - Contains 4 test cases testing different combinations of boolean inputs (valid/invalid, admin/non-admin).

### conditional-string.yaml
Combines boolean and string operations with nested let/in bindings to show how they work together:
- Equality comparison (`equals`)
- Conditional logic with string manipulation

**Spec file:** `conditional-string.spec.yaml` - Contains 3 test cases for matching and non-matching username scenarios.

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

### get-set-basic.yaml
Demonstrates the `get` and `set` operations for input/output handling:
- Uses `get: varname` to reference input variables
- Uses `set: { output: value }` to set multiple named outputs
- Shows how to use both operations together in a program

### conditional-outputs.yaml
Demonstrates setting different outputs based on conditions:
- Uses `get` for input variable references
- Uses `set` at different nodes in an if/else tree
- Shows how to conditionally set multiple named outputs
- Demonstrates if-then chaining with set operations

## Running Examples

To run any of these examples:

```bash
npm run cli -- run examples/hello.yaml
```

To check syntax and run tests (if a spec file exists):

```bash
npm run cli -- check examples/hello.yaml
```

## Program Testing with Spec Files

Franka programs can have associated spec files that define test cases to validate program behavior. Spec files follow the naming convention `program_name.spec.yaml`.

### Spec File Structure

A spec file contains a list of test cases:

```yaml
tests:
  - description: "Test case description (optional)"
    inputs:
      variable_name: value
      another_var: value
    expectedOutputs: "Expected result"
    
  - description: "Another test case"
    inputs:
      variable_name: different_value
    expectedOutputs: "Different result"
```

**Key elements:**
- `tests`: Array of test cases (required)
- `description`: Human-readable description of the test (optional)
- `inputs`: Object mapping input variable names to test values (optional)
- `expectedOutputs`: The expected output from the program (required)
  - For single output programs: a value (string, number, boolean)
  - For multiple output programs: an object with output names and values

### Running Tests

When you run the `check` command, it automatically discovers and runs spec files:

```bash
# Check syntax and run tests
npm run cli -- check examples/hello.yaml

# Output:
# Checking Franka program: examples/hello.yaml
# ✓ Syntax is valid
# ✓ Program name: Hello World
# ...
# --- Running Tests ---
# Found spec file: examples/hello.spec.yaml
# ✓ Test 1: Default greeting
# ✓ Test 2: Test without inputs should use defaults
# Test Results: 2 passed, 0 failed
```

If tests fail, detailed error messages are shown:

```bash
# ✗ Test 1: This test should fail
#   Error: Output mismatch
#   Expected: "Wrong output"
#   Actual: "Hello, Franka!"
```

### Example Spec Files

Check out the existing spec files in this directory:
- `hello.spec.yaml` - Basic test cases
- `string-operations.spec.yaml` - Multiple test cases with different inputs
- `boolean-logic.spec.yaml` - Boolean input combinations
- `conditional-string.spec.yaml` - Conditional logic tests

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

logic:
  # Simple value logic
  "Hello, World!"
  
  # Or use let/in for bindings
  let:
    result: "Success"
    message:
      concat:
        - "Hello, "
        - get: name
    in:
      get: message
```

Variables are referenced using the `get: varname` syntax:

```yaml
get: variable_name
```

For programs with multiple named outputs, use the `set` operation to return an object:

```yaml
output:
  greeting:
    type: string
  count:
    type: number

logic:
  set:
    greeting: "Hello, World!"
    count: 42
```

## Supported Operations

### Input/Output Operations
- `get: varname`: Get an input variable value by name
  ```yaml
  get: username
  ```
- `set: { output: value }`: Set one or more named output values
  ```yaml
  set:
    result: "Success"
    count: 42
  ```
  - Can be used at any node in an if/else tree
  - Returns an object with output names and values

### Let Bindings
- `let`: Define local bindings with logic to evaluate
  ```yaml
  let:
    x: 5
    y: 10
    sum: 15
    in:
      get: sum
  ```

### String Operations
- `concat`: Concatenate strings (array or named args)
  ```yaml
  concat:
    - "Hello, "
    - get: name
  ```
- `length`: Get string length
  ```yaml
  length:
    get: text
  ```
- `substring`: Extract substring
  ```yaml
  substring:
    value:
      get: text
    start: 0
    end: 5
  ```
- `uppercase`: Convert to uppercase
  ```yaml
  uppercase:
    get: text
  ```
- `lowercase`: Convert to lowercase
  ```yaml
  lowercase:
    get: text
  ```

### Boolean Operations
- `and`: Logical AND (array or named args)
  ```yaml
  and:
    - true
    - get: condition
  ```
- `or`: Logical OR (array or named args)
  ```yaml
  or:
    - false
    - get: condition
  ```
- `not`: Logical NOT
  ```yaml
  not:
    get: condition
  ```
- `equals`: Equality comparison
  ```yaml
  equals:
    left:
      get: value1
    right:
      get: value2
  ```

### Control Operations
- `if`: Conditional logic that returns a value
  - **Flat syntax (recommended)**:
    ```yaml
    if:
      get: is_valid
    then: "Valid!"
    else: "Invalid!"
    ```
  - **Nested syntax (legacy)**:
    ```yaml
    if:
      condition:
        get: is_valid
      then: "Valid!"
      else: "Invalid!"
    ```
  - **Chaining syntax**:
    ```yaml
    - if:
        get: condition1
      then: "Result 1"
    - if:
        get: condition2
      then: "Result 2"
    - else: "Default"
    ```
