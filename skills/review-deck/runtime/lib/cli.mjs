import process from 'node:process';
import { parseArgs } from 'node:util';
import {
  CliError,
  VERSION,
  doctor,
  initDeck,
  listLayouts,
  listTemplates,
  slugify,
} from './runtime.mjs';
import { checkDeck } from './validate.mjs';

export {
  CliError,
  VERSION,
  doctor,
  initDeck,
  listLayouts,
  listTemplates,
  slugify,
} from './runtime.mjs';
export { checkDeck } from './validate.mjs';

const helpOption = { type: 'boolean', short: 'h' };
const commandOptions = {
  templates: {
    format: { type: 'string' },
    json: { type: 'boolean' },
    help: helpOption,
  },
  layouts: {
    family: { type: 'string' },
    json: { type: 'boolean' },
    help: helpOption,
  },
  init: {
    format: { type: 'string' },
    template: { type: 'string' },
    dir: { type: 'string' },
    force: { type: 'boolean' },
    lang: { type: 'string' },
    locale: { type: 'string' },
    help: helpOption,
  },
  check: {
    format: { type: 'string' },
    strict: { type: 'boolean' },
    json: { type: 'boolean' },
    help: helpOption,
  },
  doctor: {
    json: { type: 'boolean' },
    help: helpOption,
  },
  version: { help: helpOption },
  help: { help: helpOption },
};

function parseArguments(command, tokens) {
  try {
    const { positionals, values } = parseArgs({
      args: tokens,
      options: commandOptions[command],
      allowPositionals: true,
      strict: true,
    });
    for (const [name, value] of Object.entries(values)) {
      if (commandOptions[command][name]?.type === 'string' && value === '') {
        throw new CliError(`Option '--${name}' requires a non-empty value.`);
      }
    }
    return { positionals, options: values };
  } catch (error) {
    if (error?.code?.startsWith('ERR_PARSE_ARGS_')) throw new CliError(error.message);
    throw error;
  }
}

function requirePositionals(command, positionals, count, missingMessage) {
  if (positionals.length < count) throw new CliError(missingMessage);
  if (positionals.length > count) {
    throw new CliError(
      `Unexpected positional argument for ${command}: ${JSON.stringify(positionals[count])}`,
    );
  }
}

function helpText() {
  return `Claude Code Slides ${VERSION}

Usage:
  codex-slides templates [--format html|marp|pptx] [--json]
  codex-slides layouts [--family name] [--json]
  codex-slides init <title> [--format html|marp|pptx] [--template name] [--dir path] [--lang locale] [--force]
  codex-slides check <path> [--format html|marp|pptx] [--strict] [--json]
  codex-slides doctor [--json]
  codex-slides version
  codex-slides help

The claude-slides command exposes the same interface inside Claude Code.

Examples:
  codex-slides templates
  codex-slides layouts
  codex-slides layouts --family system --json
  codex-slides init "AI Agent Platform" --format html --template claude-editorial
  claude-slides init "Quarterly Review" --format pptx --template executive-brief
  codex-slides check slides/ai-agent-platform
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

function formatTemplateList(result) {
  const lines = [`Templates (${result.templates.length})`];
  for (const template of result.templates) {
    const marker = template.isDefault ? ' [default]' : '';
    const aliases = template.aliases.length ? ` · Aliases: ${template.aliases.join(', ')}` : '';
    lines.push(`- ${template.name}${marker}`);
    lines.push(`  ${template.displayName}: ${template.description}`);
    lines.push(`  Formats: ${template.formats.join(', ')} · Mode: ${template.mode}${aliases}`);
  }
  return lines.join('\n');
}

function formatLayoutList(result) {
  const lines = [`${result.displayName} (${result.archetypes.length})`, result.description];
  for (const layout of result.archetypes) {
    const card = layout.cardBased ? ' · card-based' : '';
    lines.push(`- ${layout.name} [${layout.family}]${card}`);
    lines.push(`  ${layout.description}`);
    lines.push(`  Best for: ${layout.bestFor.join(', ')}`);
  }
  lines.push(`Starter sequence: ${result.starterSequence.join(' → ')}`);
  return lines.join('\n');
}

function write(stream, value) {
  stream.write(`${value}\n`);
}

export async function main(argv = process.argv.slice(2), io = process) {
  const [rawCommand = 'help', ...rest] = argv;
  const command = rawCommand === '--help' || rawCommand === '-h'
    ? 'help'
    : rawCommand === '--version' || rawCommand === '-v'
      ? 'version'
      : rawCommand;

  if (!Object.hasOwn(commandOptions, command)) {
    throw new CliError(`Unknown command: ${command}\n\n${helpText()}`);
  }

  const { positionals, options } = parseArguments(command, rest);

  if (options.help) {
    write(io.stdout, helpText().trimEnd());
    return 0;
  }

  if (command === 'help') {
    requirePositionals(command, positionals, 0, '');
    write(io.stdout, helpText().trimEnd());
    return 0;
  }

  if (command === 'version') {
    requirePositionals(command, positionals, 0, '');
    write(io.stdout, VERSION);
    return 0;
  }

  if (command === 'templates') {
    requirePositionals(command, positionals, 0, '');
    const format = options.format?.toLowerCase();
    const result = await listTemplates({ format });
    write(io.stdout, options.json ? JSON.stringify(result, null, 2) : formatTemplateList(result));
    return 0;
  }

  if (command === 'layouts') {
    requirePositionals(command, positionals, 0, '');
    const family = options.family?.toLowerCase();
    const result = await listLayouts({ family });
    write(io.stdout, options.json ? JSON.stringify(result, null, 2) : formatLayoutList(result));
    return 0;
  }

  if (command === 'init') {
    requirePositionals(command, positionals, 1, 'A deck title is required.');
    if (options.lang && options.locale) {
      throw new CliError('Use either --lang or --locale, not both.');
    }
    const [title] = positionals;
    const result = await initDeck({
      title,
      format: (options.format || 'html').toLowerCase(),
      template: options.template?.toLowerCase(),
      destination: options.dir,
      force: options.force ?? false,
      language: options.lang ?? options.locale ?? 'en-US',
    });
    write(
      io.stdout,
      `Created ${result.format.toUpperCase()} deck with ${result.templateDisplayName} at ${result.target}`,
    );
    write(io.stdout, result.next);
    return 0;
  }

  if (command === 'check') {
    requirePositionals(command, positionals, 1, 'A deck path is required.');
    const [target] = positionals;
    const result = await checkDeck(target, {
      strict: options.strict ?? false,
      format: options.format?.toLowerCase(),
    });
    write(io.stdout, options.json ? JSON.stringify(result, null, 2) : formatResult(result));
    return result.ok ? 0 : 1;
  }

  if (command === 'doctor') {
    requirePositionals(command, positionals, 0, '');
    const result = doctor();
    if (options.json) {
      write(io.stdout, JSON.stringify(result, null, 2));
    } else {
      write(io.stdout, `Node:   ${result.node.available ? 'OK' : 'MISSING'} ${result.node.detail}`);
      write(
        io.stdout,
        `Python: ${result.python.available ? 'OK' : 'MISSING / NEEDS 3.10+'} ${result.python.detail || ''}`.trimEnd(),
      );
      write(
        io.stdout,
        `Codex:  ${result.codex.available ? 'OK' : 'NOT FOUND'} ${result.codex.detail || ''}`.trimEnd(),
      );
      write(
        io.stdout,
        `Claude: ${result.claude.available ? 'OK' : 'NOT FOUND'} ${result.claude.detail || ''}`.trimEnd(),
      );
      write(io.stdout, `npx:    ${result.npx.available ? 'OK' : 'NOT FOUND'} ${result.npx.detail || ''}`.trimEnd());
    }
    return result.ok ? 0 : 1;
  }

  throw new CliError(`Unknown command: ${command}\n\n${helpText()}`);
}
