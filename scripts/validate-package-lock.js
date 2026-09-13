#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

/** Resolve a dependency from its importing package, following Node's ancestry. */
function dependencyKeys(packageKey, dependency) {
  const candidates = [];
  let current = packageKey;
  while (current) {
    candidates.push(`${current}/node_modules/${dependency}`);
    const parent = current.lastIndexOf('/node_modules/');
    current = parent < 0 ? '' : current.slice(0, parent);
  }
  candidates.push(`node_modules/${dependency}`);
  return candidates;
}

/** Registry lock contract. Returns every failure; never edits either input. */
export function validatePackageLock(manifest, lock) {
  const errors = [];
  if (!lock || lock.lockfileVersion !== 3) {
    return ['A version 3 package lock is required'];
  }
  const packages = lock.packages;
  if (!packages || !packages['']) return ['The lock root package is missing'];
  const root = packages[''];
  for (const field of ['name', 'version']) {
    if (manifest[field] !== lock[field] || manifest[field] !== root[field]) {
      errors.push(`${field} differs between manifest and lock metadata`);
    }
  }
  for (const field of [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
  ]) {
    const declared = manifest[field] || {};
    const recorded = root[field] || {};
    for (const name of new Set([
      ...Object.keys(declared),
      ...Object.keys(recorded),
    ])) {
      if (declared[name] !== recorded[name]) {
        errors.push(`${field}.${name} differs between manifest and lock`);
      }
    }
  }
  for (const [key, entry] of Object.entries(packages)) {
    if (key && !entry.link) {
      if (!semver.valid(entry.version))
        errors.push(`${key}: missing or invalid version`);
      if (!entry.resolved?.startsWith('https://registry.npmjs.org/')) {
        errors.push(`${key}: expected an HTTPS npm registry resolution`);
      }
      if (
        !/^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$/.test(entry.integrity || '')
      ) {
        errors.push(`${key}: missing or invalid package integrity`);
      }
    }
    const declared = {
      ...entry.dependencies,
      ...(key === '' ? entry.devDependencies : {}),
      ...entry.optionalDependencies,
    };
    for (const [name, range] of Object.entries(declared)) {
      const resolvedKey = dependencyKeys(key, name).find(
        candidate => packages[candidate]
      );
      if (!resolvedKey) {
        if (!Object.hasOwn(entry.optionalDependencies || {}, name)) {
          errors.push(`${key || '<root>'}: unresolved dependency ${name}`);
        }
        continue;
      }
      const dependency = packages[resolvedKey];
      const importer = key
        .split('/node_modules/')
        .at(-1)
        .replace(/^node_modules\//, '');
      const override = manifest.overrides?.[importer]?.[name];
      const effectiveRange = typeof override === 'string' ? override : range;
      if (
        !dependency.link &&
        (!semver.validRange(effectiveRange) ||
          !semver.satisfies(dependency.version, effectiveRange))
      ) {
        errors.push(
          `${key || '<root>'}: ${name}@${dependency.version} does not satisfy ${effectiveRange}`
        );
      }
    }
  }
  return errors;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  try {
    const manifest = JSON.parse(
      readFileSync(resolve(root, 'package.json'), 'utf8')
    );
    const lock = JSON.parse(
      readFileSync(resolve(root, 'package-lock.json'), 'utf8')
    );
    const errors = validatePackageLock(manifest, lock);
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else
      console.log(
        'Package lock metadata, ranges, resolution ancestry, and integrity pass.'
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
