#!/usr/bin/env node

import { loadLanguageSpec, getVersion } from '../shared/spec-loader';

function showHelp() {
  const spec = loadLanguageSpec();
  console.log(`
Franka Language CLI - ${spec.metadata.description}
Version: ${spec.metadata.version}

Usage: franka <command> [options]

Commands:
`);

  spec.tooling.cli.commands.forEach((cmd) => {
    console.log(`  ${cmd.usage.padEnd(30)} ${cmd.description}`);
  });

  console.log(`
Options:
  -h, --help     Show this help message
  -v, --version  Show version information
`);
}

function showVersion() {
  const version = getVersion();
  console.log(`Franka Language v${version}`);
}

function runFile(filePath: string) {
  console.log(`Running Franka program: ${filePath}`);
  console.log('Note: Execution engine not yet implemented.');
  console.log('This is a placeholder for future functionality.');
}

function checkFile(filePath: string) {
  console.log(`Checking Franka program: ${filePath}`);
  console.log('Note: Syntax checker not yet implemented.');
  console.log('This is a placeholder for future functionality.');
}

function startRepl() {
  console.log('Starting Franka REPL...');
  console.log('Note: REPL not yet implemented.');
  console.log('This is a placeholder for future functionality.');
  console.log('Type Ctrl+C to exit.');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    showHelp();
    process.exit(0);
  }

  if (args[0] === '-v' || args[0] === '--version' || args[0] === 'version') {
    showVersion();
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case 'run':
      if (commandArgs.length === 0) {
        console.error('Error: No file specified');
        console.error('Usage: franka run <file>');
        process.exit(1);
      }
      runFile(commandArgs[0]);
      break;

    case 'check':
      if (commandArgs.length === 0) {
        console.error('Error: No file specified');
        console.error('Usage: franka check <file>');
        process.exit(1);
      }
      checkFile(commandArgs[0]);
      break;

    case 'repl':
      startRepl();
      break;

    default:
      console.error(`Error: Unknown command '${command}'`);
      console.error('Run "franka --help" for usage information');
      process.exit(1);
  }
}

main();
