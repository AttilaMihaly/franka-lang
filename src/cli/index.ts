#!/usr/bin/env node

import { Command } from 'commander';
import { loadLanguageSpec, getVersion } from '../shared/spec-loader';
import { FrankaInterpreter } from '../shared/interpreter';
import { SpecRunner } from '../shared/spec-runner';
import * as fs from 'fs';

function runFile(filePath: string, functionName?: string) {
  console.log(`Running Franka program: ${filePath}`);
  if (functionName) {
    console.log(`Function: ${functionName}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const interpreter = new FrankaInterpreter();
  const result = interpreter.executeFile(filePath, functionName);

  console.log('\nProgram result:');
  console.log('---------------');
  console.log(result);
  console.log('---------------');

  return result;
}

function checkFile(filePath: string, functionName?: string) {
  console.log(`Checking Franka program: ${filePath}`);
  if (functionName) {
    console.log(`Function: ${functionName}`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  let hasErrors = false;

  const interpreter = new FrankaInterpreter();

  // Load module
  const module = interpreter.loadModule(filePath);
  console.log('✓ Syntax is valid (Module format)');
  console.log(`✓ Module name: ${module.module.name}`);
  if (module.module.description) {
    console.log(`✓ Description: ${module.module.description}`);
  }

  // List all functions in the module
  const functionNames = Object.keys(module.functions);
  console.log(`✓ Functions: ${functionNames.length} (${functionNames.join(', ')})`);

  // If a specific function was requested, check it
  if (functionName) {
    const func = interpreter.getFunctionFromModule(module, functionName);
    console.log(`✓ Checking function: ${functionName}`);
    if (func.description) {
      console.log(`✓ Function description: ${func.description}`);
    }
    console.log(`✓ Logic: ${func.logic ? 'present' : 'missing'}`);
    if (func.input) {
      console.log(`✓ Inputs: ${Object.keys(func.input).length}`);
    }
    if (func.output) {
      if ('type' in func.output) {
        console.log(`✓ Output: 1 (type: ${func.output.type})`);
      } else {
        console.log(`✓ Outputs: ${Object.keys(func.output).length}`);
      }
    }
  } else {
    // Check all functions
    for (const fname of functionNames) {
      const func = module.functions[fname];
      if (func && typeof func === 'object' && 'logic' in func) {
        console.log(`  - ${fname}: ${func.description || 'No description'}`);
      }
    }
  }

  // Check for spec file and run tests
  try {
    const specRunner = new SpecRunner();
    const specPath = specRunner.findSpecFile(filePath);

    if (specPath) {
      console.log('\n--- Running Tests ---');
      console.log(`Found spec file: ${specPath}`);

      const results = specRunner.runAllTests(filePath, specPath, functionName);

      let passedCount = 0;
      let failedCount = 0;

      results.forEach((result, index) => {
        if (result.passed) {
          passedCount++;
          const desc = result.description ? `: ${result.description}` : '';
          console.log(`✓ Test ${index + 1}${desc}`);
        } else {
          failedCount++;
          hasErrors = true;
          const desc = result.description ? `: ${result.description}` : '';
          console.log(`✗ Test ${index + 1}${desc}`);
          if (result.error) {
            console.log(`  Error: ${result.error}`);
          }
          if (result.expected !== undefined) {
            console.log(`  Expected: ${JSON.stringify(result.expected)}`);
          }
          if (result.actual !== undefined) {
            console.log(`  Actual: ${JSON.stringify(result.actual)}`);
          }
        }
      });

      console.log(`\nTest Results: ${passedCount} passed, ${failedCount} failed`);
    } else {
      console.log('\nNo spec file found (optional)');
    }
  } catch (error) {
    console.error('\n✗ Error running tests:');
    console.error(error instanceof Error ? error.message : String(error));
    hasErrors = true;
  }

  if (hasErrors) {
    throw new Error('Checks failed');
  }

  return { hasErrors };
}

function startRepl() {
  console.log('Starting Franka REPL...');
  console.log('Note: REPL not yet implemented.');
  console.log('This is a placeholder for future functionality.');
  console.log('Type Ctrl+C to exit.');
}

export function main() {
  const spec = loadLanguageSpec();
  const version = getVersion();

  const program = new Command();

  program
    .name('franka')
    .description(`${spec.metadata.description}`)
    .version(version, '-v, --version', 'Show version information');

  program
    .command('run')
    .description('Execute a Franka program')
    .argument('<file>', 'Path to the Franka program file')
    .option('-f, --function <name>', 'Function name to execute (for module files)')
    .action((file: string, options: { function?: string }) => {
      try {
        runFile(file, options.function);
      } catch (error) {
        console.error('Error executing program:');
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  program
    .command('check')
    .description('Check syntax of a Franka program')
    .argument('<file>', 'Path to the Franka program file')
    .option('-f, --function <name>', 'Function name to check (for module files)')
    .action((file: string, options: { function?: string }) => {
      try {
        checkFile(file, options.function);
      } catch (error) {
        if (error instanceof Error && error.message !== 'Checks failed') {
          console.error('✗ Syntax error:');
          console.error(error.message);
        }
        process.exit(1);
      }
    });

  program
    .command('repl')
    .description('Start interactive REPL (placeholder)')
    .action(() => {
      startRepl();
    });

  program.parse(process.argv);
}

// Export functions for testing
export { runFile, checkFile, startRepl };

// Only run main if this file is executed directly
if (require.main === module) {
  main();
}
