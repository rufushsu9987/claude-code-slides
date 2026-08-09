#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function releaseValidationErrors({ tag, packageJson, changelog }) {
  const errors = [];
  const version = packageJson?.version;
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    errors.push('package.json must contain a releaseable semantic version.');
    return errors;
  }

  const expectedTag = `${packageJson.name}--v${version}`;
  if (tag !== expectedTag) {
    errors.push(`Release tag must be ${expectedTag}; received ${tag || '(empty)'}.`);
  }

  const unreleasedMatch = changelog.match(
    /(?:^|\n)## Unreleased[^\S\r\n]*\r?\n([\s\S]*?)(?=\r?\n## (?!#)|$)/,
  );
  if (!unreleasedMatch) {
    errors.push('CHANGELOG.md must contain an "## Unreleased" section.');
  } else {
    const meaningfulLines = unreleasedMatch[1]
      .replace(/<!--(?:[\s\S]*?)-->/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (meaningfulLines.length > 0) {
      errors.push('CHANGELOG.md Unreleased must be empty before publishing a version tag.');
    }
  }

  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`^## ${escapedVersion} - \\d{4}-\\d{2}-\\d{2}$`, 'm').test(changelog)) {
    errors.push(`CHANGELOG.md must contain a dated "## ${version}" release heading.`);
  }
  return errors;
}

async function main() {
  let values;
  try {
    ({ values } = parseArgs({
      options: {
        tag: { type: 'string' },
        package: { type: 'string', default: 'package.json' },
        changelog: { type: 'string', default: 'CHANGELOG.md' },
      },
      allowPositionals: false,
      strict: true,
    }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }

  const tag = values.tag || process.env.GITHUB_REF_NAME || '';
  const [packageSource, changelog] = await Promise.all([
    readFile(path.resolve(root, values.package), 'utf8'),
    readFile(path.resolve(root, values.changelog), 'utf8'),
  ]);
  const errors = releaseValidationErrors({ tag, packageJson: JSON.parse(packageSource), changelog });
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Release metadata is ready for ${tag}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
