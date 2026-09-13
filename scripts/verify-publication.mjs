import { readFile } from 'node:fs/promises';
import { exhibits } from './publication-config.mjs';

const needs = JSON.parse(
  await readFile(new URL('../publication-needs.json', import.meta.url), 'utf8')
);
if (
  needs.status !== 'ready' ||
  exhibits.some(name => needs.exhibits[name] !== 'verified')
) {
  throw new Error(
    `Publication is blocked: all four existing AI exhibits need safe credential and runtime verification. Preserve their source and finish the activation evidence at ${needs.issue}`
  );
}
