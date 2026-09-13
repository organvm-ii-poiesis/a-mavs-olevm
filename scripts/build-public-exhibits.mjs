import { execFileSync } from 'node:child_process';
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { exhibits, staticExhibitFiles } from './publication-config.mjs';
import { inspectExhibit, sha256 } from './stage-public.mjs';

import { assertTrackedInputs } from './check-public-inputs.mjs';

const root = process.cwd();
// Public static builds must never receive durable provider credentials.
if (process.env.GEMINI_API_KEY || process.env.API_KEY)
  throw new Error(
    'Remove provider credentials before building a public artifact'
  );
for (const name of exhibits) {
  const directory = path.join(root, 'absorb-alchemize', name);
  if (
    (await readdir(directory)).some(
      file => file === '.env' || file.startsWith('.env.')
    )
  ) {
    throw new Error(`Environment files cannot enter a public build: ${name}`);
  }
}
execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'absorb-alchemize'], {
  cwd: root,
});
const tracked = new Set(
  execFileSync(
    'git',
    ['ls-tree', '-rz', '--name-only', 'HEAD', 'absorb-alchemize'],
    { cwd: root, encoding: 'utf8' }
  )
    .split('\0')
    .filter(Boolean)
);
for (const name of exhibits) await assertTrackedInputs(root, name, tracked);

const receipt = {
  schemaVersion: 1,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
  node: process.version,
  npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
  runtimeStatus: 'blocked-see-publication-needs',
  exhibits: {},
};
for (const name of exhibits) {
  const cwd = path.join(root, 'absorb-alchemize', name);
  execFileSync('npm', ['ci', '--no-fund'], { cwd, stdio: 'inherit' });
  execFileSync('npm', ['run', 'build', '--', '--base=./'], {
    cwd,
    stdio: 'inherit',
  });
  for (const [source, target] of Object.entries(
    staticExhibitFiles[name] || {}
  )) {
    const input = path.join(cwd, source);
    if (!(await lstat(input)).isFile())
      throw new Error(
        `Required exhibit input must be a regular file: ${name}/${source}`
      );
    const output = path.join(cwd, 'dist', target);
    await mkdir(path.dirname(output), { recursive: true });
    await copyFile(input, output);
  }
  receipt.exhibits[name] = {
    command: 'npm ci && npm run build -- --base=./',
    lockSha256: sha256(await readFile(path.join(cwd, 'package-lock.json'))),
    files: await inspectExhibit(root, name),
  };
}
await mkdir(path.join(root, '.publication'), { recursive: true });
await writeFile(
  path.join(root, '.publication/exhibits.json'),
  `${JSON.stringify(receipt, null, 2)}\n`
);
console.log(
  'All four bundles built. This is packaging evidence, not public AI runtime approval.'
);
