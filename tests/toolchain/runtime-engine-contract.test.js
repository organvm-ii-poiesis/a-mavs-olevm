import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import semver from 'semver';

test('the advertised Node floor supports the complete locked toolchain', () => {
  const root = new URL('../../', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('package.json', root)));
  const lock = JSON.parse(readFileSync(new URL('package-lock.json', root)));
  const floor = semver.minVersion(manifest.engines.node);
  assert.ok(floor, 'The root runtime range must have a supported minimum');
  const incompatible = Object.entries(lock.packages)
    .filter(([, entry]) => entry.engines?.node)
    .filter(([, entry]) => !semver.satisfies(floor, entry.engines.node))
    .map(([name, entry]) => `${name || 'root'} requires ${entry.engines.node}`);
  assert.deepEqual(incompatible, [], `Unsupported advertised runtime ${floor}`);
  const pinned = readFileSync(new URL('.nvmrc', root), 'utf8').trim();
  assert.ok(semver.satisfies(pinned, manifest.engines.node));
});
