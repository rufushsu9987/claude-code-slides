import process from 'node:process';
import { CliError, VERSION, doctor, initDeck, slugify } from './runtime.mjs';
import { checkDeck } from './validate.mjs';

export { CliError, VERSION, doctor, initDeck, slugify } from './runtime.mjs';
export { checkDeck } from './validate.mjs';

function parseArguments(tokens) {
  const positionals = [];
  const options = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    if (!rawKey) throw new CliError(`Invalid option: ${token}`);

    if (inlineValue !== undefined) {
      options[rawKey] = inlineValue;
      continue;
    }

    const next = tokens[index + 1];
    if (next && !next.startsWith('--')) {
      options[rawKey] = next;
      index += 1;
    } else {
      options[rawKey] = true;
    }
  }

  return { positionals, options };
}

function helpText() {
  return `Codex Slides ${VERSION}

Usage:
  codex-slides init <title> [--format html|marp|pptx] [--dir path] [--force]
  codex-slides check <path> [--json]
  codex-slides doctor [--json]
  codex-slides version
  codex-slides help

Examples:
  codex-slides init "AI Agent Platform" --format html
  codex-slides init "Quarterly Review" --format pptx --dir presentations/q3
  codex-slides check slides/ai-agent-platform

The legacy claude-slides command remains an alias for compatibility.
`;
}

function formatResult(result) {
  const lines = [];
  lines.push(`${result.ok ? 'PASS' : 'FAIL'} ${result.format.toUpperCase()} deck: ${result.file}`);
  lines.push(`Slides: ${result.metrics.slides ?? 'unknown'}`);

  for (const finding of result.errors) {
    lines.push(`ERROR [${finding.code}] ${finding.message}`);
  }
  for (const finding of result.warnings) {
    lines.push(`WARN  [${finding.code}] ${finding.message}`);
  }
  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push('No issues found.');
  }
  return lines.join('\n');
}

function write(stream, value) {
  stream.write(`${value}\n`);
}

export async function main(argv = process.argv.slice(2), io = process) {
  const [command = 'help', ...rest] = argv;
  const { positionals, options } = parseArguments(rest);

  if (command === 'help' || command === '--help' || command === '-h') {
    write(io.stdout, helpText().trimEnd());
    return 0;
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    write(io.stdout, VERSION);
    return 0;
  }

  if (command === 'init') {
    const title = positionals.join(' ');
    const result = await initDeck({
      title,
      format: String(options.format || 'html').toLowerCase(),
      destination: options.dir === true ? undefined : options.dir,
      force: Boolean(options.force),
    });
    write(io.stdout, `Created ${result.format.toUpperCase()} deck at ${result.target}`);
    write(io.stdout, result.next);
    return 0;
  }

  if (command === 'check') {
    const target = positionals[0];
    if (!target) throw new CliError('A deck path is required.');
    const result = await checkDeck(target);
    write(io.stdout, options.json ? JSON.stringify(result, null, 2) : formatResult(result));
    return result.ok ? 0 : 1;
  }

  if (command === 'doctor') {
    const result = doctor();
    if (options.json) {
      write(io.stdout, JSON.stringify(result, null, 2));
    } else {
      write(io.stdout, `Node:  ${result.node.available ? 'OK' : 'MISSING'} ${result.node.detail}`);
      write(
        io.stdout,
        `Codex: ${result.codex.available ? 'OK' : 'NOT FOUND'} ${result.codex.detail || ''}`.trimEnd(),
      );
      write(io.stdout, `npx:   ${result.npx.available ? 'OK' : 'NOT FOUND'} ${result.npx.detail || ''}`.trimEnd());
    }
    return result.ok ? 0 : 1;
  }

  throw new CliError(`Unknown command: ${command}\n\n${helpText()}`);
}
