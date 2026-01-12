# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Start dev server on http://localhost:3000
pnpm build    # Build for production
pnpm preview  # Preview production build
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

### External Dependencies

Tailwind CSS and Prettier are loaded from CDN (see `index.html` import map). The core keymash library has zero runtime dependencies.
