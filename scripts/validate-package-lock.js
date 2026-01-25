#!/usr/bin/env node

/**
 * Package Lock Validation Script
 *
 * Performs logical consistency checks on package-lock.json from top to bottom.
 * Validates structure, dependencies, integrity hashes, and consistency with package.json.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let errorCount = 0;
let warningCount = 0;

function error(message) {
  console.error(`${colors.red}✗ ERROR:${colors.reset} ${message}`);
  errorCount++;
}

function warning(message) {
  console.warn(`${colors.yellow}⚠ WARNING:${colors.reset} ${message}`);
  warningCount++;
}

function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

// Load package.json and package-lock.json
function loadPackageFiles() {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageLockPath = join(__dirname, '..', 'package-lock.json');

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));

    return { packageJson, packageLock };
  } catch (err) {
    error(`Failed to load package files: ${err.message}`);
    process.exit(1);
  }
}

// Check 1: Validate top-level metadata
function validateTopLevel(packageJson, packageLock) {
  info('Checking top-level metadata...');

  // Check name
  if (packageLock.name !== packageJson.name) {
    error(
      `Package name mismatch: package.json has "${packageJson.name}", package-lock.json has "${packageLock.name}"`
    );
  } else {
    success(`Package name matches: ${packageJson.name}`);
  }

  // Check version
  if (packageLock.version !== packageJson.version) {
    error(
      `Package version mismatch: package.json has "${packageJson.version}", package-lock.json has "${packageLock.version}"`
    );
  } else {
    success(`Package version matches: ${packageJson.version}`);
  }

  // Check lockfileVersion
  if (!packageLock.lockfileVersion) {
    error('Missing lockfileVersion field');
  } else if (packageLock.lockfileVersion !== 3) {
    warning(
      `Unexpected lockfileVersion: ${packageLock.lockfileVersion} (expected 3)`
    );
  } else {
    success(`lockfileVersion is valid: ${packageLock.lockfileVersion}`);
  }

  // Check requires field
  if (packageLock.requires !== true) {
    warning('Missing or invalid "requires" field (should be true)');
  } else {
    success('Required "requires" field is present');
  }
}

// Check 2: Validate root package entry
function validateRootPackage(packageJson, packageLock) {
  info('Checking root package entry...');

  const rootPackage = packageLock.packages[''];

  if (!rootPackage) {
    error('Missing root package entry (empty string key in packages)');
    return;
  }

  success('Root package entry exists');

  // Check root package name and version
  if (rootPackage.name !== packageJson.name) {
    error(
      `Root package name mismatch: expected "${packageJson.name}", got "${rootPackage.name}"`
    );
  } else {
    success(`Root package name matches: ${rootPackage.name}`);
  }

  if (rootPackage.version !== packageJson.version) {
    error(
      `Root package version mismatch: expected "${packageJson.version}", got "${rootPackage.version}"`
    );
  } else {
    success(`Root package version matches: ${rootPackage.version}`);
  }

  // Check dependencies consistency
  const pkgDeps = packageJson.dependencies || {};
  const pkgDevDeps = packageJson.devDependencies || {};
  const lockDeps = rootPackage.dependencies || {};
  const lockDevDeps = rootPackage.devDependencies || {};

  // Validate dev dependencies match
  for (const dep of Object.keys(pkgDevDeps)) {
    if (!lockDevDeps[dep]) {
      error(`Missing devDependency in root package: ${dep}`);
    }
  }

  for (const dep of Object.keys(lockDevDeps)) {
    if (!pkgDevDeps[dep]) {
      warning(`Extra devDependency in package-lock.json root package: ${dep}`);
    }
  }

  // Validate regular dependencies match
  for (const dep of Object.keys(pkgDeps)) {
    if (!lockDeps[dep]) {
      error(`Missing dependency in root package: ${dep}`);
    }
  }

  for (const dep of Object.keys(lockDeps)) {
    if (!pkgDeps[dep]) {
      warning(`Extra dependency in package-lock.json root package: ${dep}`);
    }
  }

  success(
    `Validated ${Object.keys(lockDevDeps).length} devDependencies and ${Object.keys(lockDeps).length} dependencies`
  );
}

// Check 3: Validate all package entries
function validatePackageEntries(packageLock) {
  info('Checking all package entries...');

  const packages = packageLock.packages || {};
  const packageKeys = Object.keys(packages);

  if (packageKeys.length === 0) {
    error('No packages found in package-lock.json');
    return;
  }

  success(`Found ${packageKeys.length} package entries`);

  let packagesWithoutIntegrity = 0;
  let packagesWithoutResolved = 0;

  for (const key of packageKeys) {
    if (key === '') continue; // Skip root package, already validated

    const pkg = packages[key];

    // Check for required fields in dependency packages
    if (!pkg.version) {
      error(`Package "${key}" is missing version field`);
    }

    // Check for integrity hash (should be present for all non-local packages)
    if (!pkg.integrity && !pkg.link) {
      packagesWithoutIntegrity++;
    }

    // Check for resolved URL (should be present for registry packages)
    if (!pkg.resolved && !pkg.link && pkg.dev !== undefined) {
      packagesWithoutResolved++;
    }
  }

  if (packagesWithoutIntegrity > 0) {
    warning(
      `${packagesWithoutIntegrity} packages are missing integrity hashes`
    );
  } else {
    success('All packages have integrity hashes');
  }

  if (packagesWithoutResolved > 0) {
    warning(`${packagesWithoutResolved} packages are missing resolved URLs`);
  }
}

// Check 4: Validate no duplicate packages
function validateNoDuplicates(packageLock) {
  info('Checking for duplicate package entries...');

  const packages = packageLock.packages || {};
  const packageNames = new Map();

  for (const key of Object.keys(packages)) {
    if (key === '') continue;

    // Extract package name from node_modules path
    const parts = key.split('node_modules/');
    if (parts.length > 0) {
      const packageName = parts[parts.length - 1];

      if (!packageNames.has(packageName)) {
        packageNames.set(packageName, []);
      }
      packageNames.get(packageName).push(key);
    }
  }

  let duplicateCount = 0;
  for (const [name, paths] of packageNames.entries()) {
    if (paths.length > 1) {
      // This is actually common and not necessarily an error
      // Different packages can depend on different versions
      // Only report if versions are actually the same
      const versions = paths.map(p => packages[p].version);
      const uniqueVersions = new Set(versions);

      if (uniqueVersions.size < versions.length) {
        warning(
          `Duplicate package "${name}" with same version found at: ${paths.join(', ')}`
        );
        duplicateCount++;
      }
    }
  }

  if (duplicateCount === 0) {
    success('No problematic duplicate packages found');
  }
}

// Check 5: Validate dependency tree consistency
function validateDependencyTree(packageLock) {
  info('Checking dependency tree consistency...');

  const packages = packageLock.packages || {};
  let missingDependencies = 0;

  for (const [key, pkg] of Object.entries(packages)) {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const [depName, depVersion] of Object.entries(deps)) {
      // Check if the dependency exists somewhere in the tree
      const found = Object.keys(packages).some(pkgKey => {
        return (
          pkgKey.includes(`node_modules/${depName}`) ||
          (pkgKey === '' && packages[pkgKey].name === depName)
        );
      });

      if (!found) {
        error(
          `Package "${key}" declares dependency "${depName}" which is not found in the lock file`
        );
        missingDependencies++;
      }
    }
  }

  if (missingDependencies === 0) {
    success('All declared dependencies are present in the lock file');
  } else {
    error(`Found ${missingDependencies} missing dependencies in the tree`);
  }
}

// Main validation function
function validatePackageLock() {
  console.log(
    '\n' +
      colors.blue +
      '═══════════════════════════════════════════════════' +
      colors.reset
  );
  console.log(
    colors.blue +
      '  Package Lock Validation - Top to Bottom Check' +
      colors.reset
  );
  console.log(
    colors.blue +
      '═══════════════════════════════════════════════════' +
      colors.reset +
      '\n'
  );

  const { packageJson, packageLock } = loadPackageFiles();

  // Run all validation checks in order (top to bottom)
  validateTopLevel(packageJson, packageLock);
  console.log('');

  validateRootPackage(packageJson, packageLock);
  console.log('');

  validatePackageEntries(packageLock);
  console.log('');

  validateNoDuplicates(packageLock);
  console.log('');

  validateDependencyTree(packageLock);
  console.log('');

  // Print summary
  console.log(
    colors.blue +
      '═══════════════════════════════════════════════════' +
      colors.reset
  );
  console.log(colors.blue + '  Validation Summary' + colors.reset);
  console.log(
    colors.blue +
      '═══════════════════════════════════════════════════' +
      colors.reset
  );

  if (errorCount === 0 && warningCount === 0) {
    console.log(
      colors.green +
        '\n✓ All checks passed! package-lock.json is valid.\n' +
        colors.reset
    );
    process.exit(0);
  } else {
    if (errorCount > 0) {
      console.log(
        colors.red + `\n✗ ${errorCount} error(s) found\n` + colors.reset
      );
    }
    if (warningCount > 0) {
      console.log(
        colors.yellow + `⚠ ${warningCount} warning(s) found\n` + colors.reset
      );
    }

    if (errorCount > 0) {
      process.exit(1);
    } else {
      process.exit(0); // Warnings don't fail the build
    }
  }
}

// Run validation
validatePackageLock();
