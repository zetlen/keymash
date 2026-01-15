#!/usr/bin/env node
/**
 * Updates README.md and App.tsx with the latest module sizes.
 * Run after building the library with `pnpm build:lib`.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Module definitions: name, dist file, purpose, and docs anchor
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

// Calculate sizes once for all generators
function getModuleSizes() {
  return MODULES.map(({ name, file, purpose, anchor }) => ({
    name,
    purpose,
    anchor,
    size: formatSize(getGzipSize(file)),
  }));
}

// Generate markdown table for README.md
function generateMarkdownTable(sizes) {
  return sizes
    .map(({ name, purpose, anchor, size }) => `| [\`${name}\`](${anchor}) | ${purpose} | ${size} |`)
    .join('\n');
}

// Generate a single JSX table row with proper formatting
function generateJsxRow({ name, purpose, anchor, size }) {
  // For longer anchors, split across multiple lines
  const needsMultilineAnchor = anchor.length > 20;

  const anchorTag = needsMultilineAnchor
    ? `<a
                      href="${anchor}"
                      className="font-mono text-blue-600 hover:underline"
                    >`
    : `<a href="${anchor}" className="font-mono text-blue-600 hover:underline">`;

  return `                <tr className="hover:bg-gray-50">
                  <td className="py-4 pr-8">
                    ${anchorTag}
                      ${name}
                    </a>
                  </td>
                  <td className="py-4 pr-8 text-gray-600">
                    ${purpose}
                  </td>
                  <td className="py-4 text-gray-500 font-mono text-sm whitespace-nowrap">
                    ${size}
                  </td>
                </tr>`;
}

// Generate JSX table rows for App.tsx
function generateJsxTable(sizes) {
  const rows = sizes.map(generateJsxRow).join('\n');

  return `{/* MODULES_SECTION_START */}
        <section className="py-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Modules</h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-2xl">
              <tbody className="divide-y divide-gray-100">
${rows}
              </tbody>
            </table>
          </div>
        </section>
        {/* MODULES_SECTION_END */}`;
}

function updateFile(filePath, startMarker, endMarker, newContent, description) {
  const fullPath = join(ROOT, filePath);
  if (!existsSync(fullPath)) {
    console.warn(`Warning: ${filePath} not found, skipping.`);
    return;
  }

  const content = readFileSync(fullPath, 'utf-8');
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.warn(`Warning: Could not find markers in ${filePath}, skipping.`);
    return;
  }

  const updated =
    content.slice(0, startIdx) + newContent + content.slice(endIdx + endMarker.length);

  writeFileSync(fullPath, updated);
  console.log(`${description} updated with latest module sizes.`);
}

// Main
const sizes = getModuleSizes();

// Update README.md
updateFile(
  'README.md',
  '<!-- MODULES_TABLE_START -->',
  '<!-- MODULES_TABLE_END -->',
  `<!-- MODULES_TABLE_START -->\n${generateMarkdownTable(sizes)}\n<!-- MODULES_TABLE_END -->`,
  'README.md',
);

// Update App.tsx
updateFile(
  'App.tsx',
  '{/* MODULES_SECTION_START */}',
  '{/* MODULES_SECTION_END */}',
  generateJsxTable(sizes),
  'App.tsx',
);
