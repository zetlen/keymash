# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server on http://localhost:3000
pnpm build        # Build demo app for production
pnpm build:lib    # Build library for npm publishing
pnpm preview      # Preview production build

pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage

pnpm lint         # Check linting with Biome
pnpm lint:fix     # Fix lint issues
pnpm format       # Format code with Biome

pnpm storybook    # Start Storybook on http://localhost:6006
```

## Architecture

KeyMash is a keyboard binding library that uses bitwise operations for O(1) chord lookup. The demo app showcases this library with an interactive keyboard visualization.

### Core Library (`lib/keymash.ts`)

The library maps each key to a unique bit in a 512-bit bigint space:
- **Bits 0-255**: Hold state (modifier keys currently pressed)
- **Bits 256-511**: Press state (the key that triggered the event)

Key concepts:
- `hold` and `press` are pre-populated Record<string, bigint> objects for all common keys
- Use `+` to combine keys naturally: `hold.ctrl + press.t`
- Use `|` for OR logic (alternatives): `hold.ctrl + (press.a | press.b)`
- OR'd combinations are "exploded" into separate lookup entries at registration time

The `Keymash` class manages:
- Event listener lifecycle (keydown/keyup/blur)
- Binding explosion for OR'd combos
- WeakMap-based target registry for tracking instances per DOM element
- Change notification via subscriber pattern
- Real-time key state updates via `onUpdate` callback for UI visualizers

### React Components

- **`App.tsx`**: Marketing/demo page layout with feature sections
- **`components/KeyMashDemo.tsx`**: Interactive keyboard with visual key state feedback and event logging
- **`components/CodeBlock.tsx`**: Responsive code display using Prettier in a Web Worker (`lib/prettier-worker.ts`)

### Types (`types.ts`)

- `KeyCombo`: Type alias for bigint
- `Binding`: Config object with `combo`, `handler`, optional `label`, `delay`, `repeat`
- `FullBinding`: Extended binding with resolved properties and human-readable `comboText`
- `IKeymash`: Public interface for instances

## Tooling

- **Biome**: Linting and formatting (replaces ESLint + Prettier)
- **Vitest**: Unit testing with jsdom environment
- **Storybook**: Component documentation and visual testing
- **Lefthook**: Git hooks for pre-commit linting and commit message validation
- **Commitlint**: Enforces conventional commit format
- **Release Please**: Automated changelog and npm releases via GitHub Actions

## Git Workflow

Commits must follow [Conventional Commits](https://conventionalcommits.org/) format:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `chore:` maintenance tasks

Pre-commit hooks automatically lint and format staged files.
