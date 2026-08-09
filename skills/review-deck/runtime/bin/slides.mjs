#!/usr/bin/env node

import process from 'node:process';
import { CliError, main } from '../lib/cli.mjs';

try {
  const exitCode = await main();
  process.exitCode = exitCode;
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`slides: ${message}\n`);
  process.exitCode = error instanceof CliError ? error.exitCode : 1;
}
