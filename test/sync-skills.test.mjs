import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  access,
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('skill sync repairs drift and removes only generated orphans', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'slides-skill-sync-'));
  const fixtureRoot = path.join(temporaryRoot, 'fixture');
  const callerRoot = path.join(temporaryRoot, 'external-caller');

  try {
    await mkdir(fixtureRoot, { recursive: true });
    await mkdir(callerRoot, { recursive: true });
    for (const directory of ['references', 'templates', 'lib', 'skills']) {
      await cp(directory, path.join(fixtureRoot, directory), { recursive: true });
    }
    await mkdir(path.join(fixtureRoot, '.agents'), { recursive: true });
    await cp('.agents/skills', path.join(fixtureRoot, '.agents', 'skills'), {
      recursive: true,
    });
    await mkdir(path.join(fixtureRoot, 'bin'), { recursive: true });
    await cp('bin/slides.mjs', path.join(fixtureRoot, 'bin', 'slides.mjs'));
    await mkdir(path.join(fixtureRoot, 'scripts'), { recursive: true });
    for (const script of [
      'skill-cli-wrapper.mjs',
      'generate-slide-art.py',
      'sync-skill-resources.mjs',
    ]) {
      await cp(path.join('scripts', script), path.join(fixtureRoot, 'scripts', script));
    }

    const syncScript = path.join(fixtureRoot, 'scripts', 'sync-skill-resources.mjs');
    const authoritativeSkill = path.join(fixtureRoot, 'skills', 'create-deck', 'SKILL.md');
    const skillBefore = await readFile(authoritativeSkill);
    const runtimeOrphan = path.join(
      fixtureRoot,
      'skills',
      'create-deck',
      'runtime',
      'orphan.txt',
    );
    const referenceOrphan = path.join(
      fixtureRoot,
      'skills',
      'review-deck',
      'references',
      'orphan.md',
    );
    const forwarderOrphan = path.join(
      fixtureRoot,
      '.agents',
      'skills',
      'orphan-skill',
      'SKILL.md',
    );
    await writeFile(runtimeOrphan, 'orphan runtime');
    await writeFile(referenceOrphan, 'orphan reference');
    await mkdir(path.dirname(forwarderOrphan), { recursive: true });
    await writeFile(forwarderOrphan, 'orphan forwarder');

    const driftedRuntime = path.join(
      fixtureRoot,
      'skills',
      'review-deck',
      'runtime',
      'lib',
      'cli.mjs',
    );
    await writeFile(driftedRuntime, 'drifted runtime');
    const runtimeEntry = path.join(
      fixtureRoot,
      'skills',
      'deck-reviewer',
      'runtime',
      'bin',
      'slides.mjs',
    );
    if (process.platform !== 'win32') await chmod(runtimeEntry, 0o644);

    await assert.rejects(
      execFileAsync(process.execPath, [syncScript, '--check'], { cwd: callerRoot }),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stderr, /ORPHAN .*orphan\.txt/);
        assert.match(error.stderr, /ORPHAN .*orphan\.md/);
        assert.match(error.stderr, /ORPHAN .*orphan-skill/);
        assert.match(error.stderr, /OUT OF SYNC .*runtime\/lib\/cli\.mjs/);
        if (process.platform !== 'win32') {
          assert.match(error.stderr, /WRONG MODE .*runtime\/bin\/slides\.mjs/);
        }
        return true;
      },
    );

    await execFileAsync(process.execPath, [syncScript], { cwd: callerRoot });
    for (const orphan of [runtimeOrphan, referenceOrphan, forwarderOrphan]) {
      await assert.rejects(access(orphan), { code: 'ENOENT' });
    }
    assert.deepEqual(await readFile(authoritativeSkill), skillBefore);
    assert.deepEqual(
      await readFile(driftedRuntime),
      await readFile(path.join(fixtureRoot, 'lib', 'cli.mjs')),
    );
    if (process.platform !== 'win32') {
      assert.equal((await stat(runtimeEntry)).mode & 0o777, 0o755);
    }

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [syncScript, '--check'],
      { cwd: callerRoot },
    );
    assert.match(stdout, /Portable skill resources are synchronized/);
    assert.equal(stderr, '');
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
