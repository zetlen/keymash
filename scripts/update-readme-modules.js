#!/usr/bin/env node
/**
 * Updates README.md with the latest module sizes.
 * Run after building the library with `pnpm build:lib`.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Module definitions: name, dist file, purpose, and optional docs anchor
const MODULES = [
  {
    name: 'keymash',
    file: 'dist/lib/keymash.js',
    purpose: 'Full library with sequences, introspection, and dev warnings',
    anchor: '#two-entry-points',
  },
  {
    name: 'keymash/core',
    file: 'dist/lib/core.js',
    purpose: 'Minimal core for basic keyboard bindings only',
    anchor: '#core-package-1kb-gzipped',
  },
  {
    name: 'keymash/react',
    file: 'dist/lib/react.js',
    purpose: 'React hooks for declarative keyboard binding',
    anchor: '#keymashreact',
  },
];

const START_MARKER = '<!-- MODULES_TABLE_START -->';
const END_MARKER = '<!-- MODULES_TABLE_END -->';

function getGzipSize(filePath) {
  const fullPath = join(ROOT, filePath);
  if (!existsSync(fullPath)) {
    console.warn(`Warning: ${filePath} not found. Run 'pnpm build:lib' first.`);
    return null;
  }
  const content = readFileSync(fullPath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

function formatSize(bytes) {
  if (bytes === null) return 'N/A';
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

function generateTable() {
  const rows = MODULES.map(({ name, file, purpose, anchor }) => {
    const gzipBytes = getGzipSize(file);
    const sizeStr = formatSize(gzipBytes);
    // Format: | [`name`](anchor) | purpose | size |
    return `| [\`${name}\`](${anchor}) | ${purpose} | ${sizeStr} |`;
  });

  return rows.join('\n');
}

function updateReadme() {
  const readmePath = join(ROOT, 'README.md');
  const content = readFileSync(readmePath, 'utf-8');

  const startIdx = content.indexOf(START_MARKER);
  const endIdx = content.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1) {
    console.error('Error: Could not find module table markers in README.md');
    console.error('Make sure README.md contains:');
    console.error(`  ${START_MARKER}`);
    console.error(`  ${END_MARKER}`);
    process.exit(1);
  }

  const table = generateTable();
  const newContent =
    content.slice(0, startIdx + START_MARKER.length) + '\n' + table + '\n' + content.slice(endIdx);

  writeFileSync(readmePath, newContent);
  console.log('README.md updated with latest module sizes.');
}

// Main
updateReadme();
