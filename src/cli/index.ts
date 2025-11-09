#!/usr/bin/env node

import { Command } from 'commander';
import { loadLanguageSpec, getVersion } from '../shared/spec-loader';
import { FrankaInterpreter } from '../shared/interpreter';
import * as fs from 'fs';

function runFile(filePath: string) {
  console.log(`Running Franka program: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const interpreter = new FrankaInterpreter();
    const result = interpreter.executeFile(filePath);

    console.log('\nProgram result:');
    console.log('---------------');
    console.log(result);
    console.log('---------------');
  } catch (error) {
    console.error('Error executing program:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function checkFile(filePath: string) {
  console.log(`Checking Franka program: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    const interpreter = new FrankaInterpreter();
    const program = interpreter.loadProgram(filePath);

    console.log('✓ Syntax is valid');
    console.log(`✓ Program name: ${program.program.name}`);
    if (program.program.description) {
      console.log(`✓ Description: ${program.program.description}`);
    }
    console.log(`✓ Logic: ${program.logic ? 'present' : 'missing'}`);
    if (program.input) {
      console.log(`✓ Inputs: ${Object.keys(program.input).length}`);
    }
    if (program.output) {
      // Check if it's a single unnamed output or multiple named outputs
      if ('type' in program.output) {
        console.log(`✓ Output: 1 (type: ${program.output.type})`);
      } else {
        console.log(`✓ Outputs: ${Object.keys(program.output).length}`);
      }
    }
  } catch (error) {
    console.error('✗ Syntax error:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function startRepl() {
  console.log('Starting Franka REPL...');
  console.log('Note: REPL not yet implemented.');
  console.log('This is a placeholder for future functionality.');
  console.log('Type Ctrl+C to exit.');
}

function main() {
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
    .action((file: string) => {
      runFile(file);
    });

  program
    .command('check')
    .description('Check syntax of a Franka program')
    .argument('<file>', 'Path to the Franka program file')
    .action((file: string) => {
      checkFile(file);
    });

  program
    .command('repl')
    .description('Start interactive REPL (placeholder)')
    .action(() => {
      startRepl();
    });

  program.parse(process.argv);
}

main();
