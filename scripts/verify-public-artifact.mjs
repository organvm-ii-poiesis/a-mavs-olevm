import { execFileSync } from 'node:child_process';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exhibits } from './publication-config.mjs';
import { sha256 } from './stage-public.mjs';

export async function verifyArtifact(directory, sourceCommit) {
  const manifest = JSON.parse(
    await readFile(path.join(directory, 'build-provenance.json'), 'utf8')
  );
  if (manifest.schemaVersion !== 1 || manifest.sourceCommit !== sourceCommit)
    throw new Error('Publication artifact source does not match this revision');
  const expected = new Map(manifest.files.map(file => [file.path, file]));
  if (expected.size !== manifest.files.length)
    throw new Error('Duplicate artifact manifest paths');
  const found = [];
  async function visit(relative = '') {
    for (const name of await readdir(path.join(directory, relative))) {
      const filename = relative ? `${relative}/${name}` : name;
      const stat = await lstat(path.join(directory, filename));
      if (stat.isSymbolicLink())
        throw new Error(`Symlink in publication artifact: ${filename}`);
      if (stat.isDirectory()) {
        await visit(filename);
        continue;
      }
      if (['.nojekyll', 'build-provenance.json'].includes(filename)) continue;
      const record = expected.get(filename);
      if (!record || !stat.isFile())
        throw new Error(`Unexpected publication file: ${filename}`);
      const bytes = await readFile(path.join(directory, filename));
      if (record.bytes !== bytes.length || record.sha256 !== sha256(bytes))
        throw new Error(`Publication checksum mismatch: ${filename}`);
      found.push(filename);
    }
  }
  await visit();
  if (found.length !== expected.size)
    throw new Error('Publication artifact is incomplete');
  for (const name of exhibits) {
    if (!expected.has(`absorb-alchemize/${name}/dist/index.html`))
      throw new Error(`Publication exhibit is missing: ${name}`);
  }
  return found.length;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const commit =
    process.env.GITHUB_SHA ||
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const count = await verifyArtifact(path.resolve('_site'), commit);
  console.log(`Verified ${count} publication file hashes for ${commit}`);
}
