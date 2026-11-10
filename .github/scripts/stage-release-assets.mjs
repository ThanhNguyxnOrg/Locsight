#!/usr/bin/env node
/**
 * Stage one Locsight Tauri target into the flat organization release contract.
 *
 * The source remains Tauri's native bundle tree; this script copies only the
 * exact, versioned artifacts expected by the central release policy.
 */
import fs from 'node:fs';
import path from 'node:path';

const version = process.env.VERSION;
const variant = process.env.VARIANT;
if (!version || !variant) {
  throw new Error('VERSION and VARIANT are required.');
}

const expectedByVariant = {
  'windows-x64': [
    `Locsight_${version}_x64-setup.exe`,
    `Locsight_${version}_x64_en-US.msi`,
  ],
  'windows-arm64': [
    `Locsight_${version}_arm64-setup.exe`,
    `Locsight_${version}_arm64_en-US.msi`,
  ],
  'macos-arm64': [
    `Locsight_${version}_aarch64.app.tar.gz`,
    `Locsight_${version}_aarch64.dmg`,
  ],
  'macos-x64': [
    `Locsight_${version}_x64.app.tar.gz`,
    `Locsight_${version}_x64.dmg`,
  ],
  'linux-x64': [
    `Locsight_${version}_amd64.AppImage`,
    `Locsight_${version}_amd64.deb`,
    `Locsight-${version}-1.x86_64.rpm`,
  ],
  'linux-arm64': [
    `Locsight_${version}_aarch64.AppImage`,
    `Locsight_${version}_arm64.deb`,
    `Locsight-${version}-1.aarch64.rpm`,
  ],
};

const expected = expectedByVariant[variant];
if (!expected) {
  throw new Error(`Unsupported Locsight release target: ${variant}`);
}

const root = path.resolve('src-tauri/target/release/bundle');
const destination = path.resolve('dist/release');
if (!fs.existsSync(root)) {
  throw new Error(`Tauri bundle directory not found: ${root}`);
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return entry.isFile() ? [fullPath] : [];
  });
}

fs.mkdirSync(destination, { recursive: true });
const candidates = listFiles(root);
for (const name of expected) {
  const matches = candidates.filter((candidate) => path.basename(candidate) === name);
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${name} in Tauri bundles, found ${matches.length}`,
    );
  }
  fs.copyFileSync(matches[0], path.join(destination, name));
  console.log(`Staged ${variant}: ${name}`);
}

const staged = fs.readdirSync(destination).sort();
if (staged.length !== expected.length || expected.some((name) => !staged.includes(name))) {
  throw new Error(`Staged release set does not match the ${variant} contract: ${staged.join(', ')}`);
}
console.log(`Validated ${staged.length} ${variant} release assets.`);
