import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';

// Vite's public directory copy must not turn untracked inputs into HEAD provenance.
export async function assertTrackedInputs(root, exhibit, trackedPaths) {
  const base = `absorb-alchemize/${exhibit}`;
  async function visit(relative) {
    for (const name of await readdir(path.join(root, relative))) {
      if (
        relative === base &&
        ['node_modules', 'dist', 'dist-ssr'].includes(name)
      )
        continue;
      const filename = `${relative}/${name}`;
      const stat = await lstat(path.join(root, filename));
      if (stat.isSymbolicLink())
        throw new Error(`Symlink in exhibit input: ${filename}`);
      if (stat.isDirectory()) await visit(filename);
      else if (!stat.isFile() || !trackedPaths.has(filename))
        throw new Error(`Uncommitted exhibit input: ${filename}`);
    }
  }
  await visit(base);
}
