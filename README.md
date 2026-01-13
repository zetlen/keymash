# KeyMash

Keyboard shortcuts that just work. No string parsing. No modifier key bugs. No scope conflicts.

```typescript
import { keymash, ctrl, press } from 'keymash';

const km = keymash();
km.bind(ctrl + press.s, () => save());
```

## Install

```bash
npm install keymash
```

## Why KeyMash?

**No more string parsing.** Other libraries make you write `"ctrl+shift+p"` and hope you got the casing right. KeyMash uses TypeScript operators that autocomplete.

```typescript
// Type-safe, autocompletes, catches typos at compile time
km.bind(ctrl + shift + press.p, () => commandPalette());

// Want Ctrl+K or Ctrl+O to do the same thing? Use |
km.bind(ctrl + (press.k | press.o), () => search());
```

**Arrow keys that don't fight the browser.** KeyMash captures events at the window level, so your handlers fire before browser scrolling kicks in.

**Modal UIs made simple.** Building a command palette? Vim-style modes? Create separate instances and toggle them.

```typescript
const globalKm = keymash({ label: 'Global' });
const modalKm = keymash({ label: 'Modal' });

// Start modal inactive
modalKm.setActive(false);

// Toggle between them
globalKm.bind(ctrl + press.k, () => {
  globalKm.setActive(false);
  modalKm.setActive(true);
});

modalKm.bind(press.Escape, () => {
  modalKm.setActive(false);
  globalKm.setActive(true);
});
```

**Built-in conflict detection.** In development, KeyMash warns you when bindings collide. No more mystery debugging.

**Show users their shortcuts.** Get human-readable labels for your help menu.

```typescript
import { getActiveBindings } from 'keymash';

getActiveBindings(km).forEach(b => {
  console.log(`${b.comboText}: ${b.label}`);
  // "Ctrl+S: Save"
});
```

## Features

- **~2.6kb gzipped** - Tiny footprint
- **Zero dependencies** - Just keyboard handling, nothing else
- **TypeScript-first** - Full type safety and autocomplete
- **Scoped instances** - Bind to window or specific elements
- **Sequence detection** - Trigger on typed sequences like "show me"
- **Key repeat control** - Explicit opt-in for repeat behavior

## Quick Examples

### Basic binding

```typescript
import { keymash, ctrl, shift, press } from 'keymash';

const km = keymash({
  bindings: [
    { combo: ctrl + press.s, handler: () => save(), label: 'Save' },
    { combo: ctrl + shift + press.p, handler: () => palette(), label: 'Command Palette' },
  ]
});
```

### Dynamic bindings

```typescript
// Shorthand
km.bind(ctrl + press.z, () => undo());

// With options
km.bind({
  combo: press.ArrowDown,
  handler: () => scrollDown(),
  repeat: true,  // Fire on key repeat
  label: 'Scroll Down'
});
```

### Scoped to an element

```typescript
const editor = document.getElementById('editor');
const editorKm = keymash({
  scope: editor,
  bindings: [
    { combo: ctrl + press.b, handler: () => bold() },
  ]
});
// Only active when focus is inside #editor
```

### Sequence triggers

```typescript
// Fire when user types "hello"
km.sequence('hello', () => {
  console.log('Hello triggered!');
});
```

### Catch-all binding

```typescript
// Trap all keys in modal mode
modalKm.bind({
  combo: press.ANY,
  handler: (e) => e?.preventDefault(),
});

// Specific bindings still take priority
modalKm.bind(press.Escape, () => exit());
```

## API

### `keymash(config?)`

Create a new keymash instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `scope` | `HTMLElement \| Window` | `window` | Element to scope events to |
| `bindings` | `Binding[]` | `[]` | Initial bindings |
| `label` | `string` | `''` | Label for debugging |

### Modifiers

```typescript
import { ctrl, shift, alt, meta, cmd, hold, press } from 'keymash';

// Shorthands
ctrl + press.s           // Ctrl+S
shift + press.Enter      // Shift+Enter
cmd + press.k            // Cmd+K (meta on Windows)

// Or use hold.* for the full set
hold.ctrl + hold.shift + press.p
```

### Instance Methods

| Method | Description |
|--------|-------------|
| `bind(combo, handler)` | Add a binding |
| `bind(binding)` | Add a binding with options |
| `unbind(combo)` | Remove a binding |
| `setActive(boolean)` | Enable/disable the instance |
| `isActive()` | Check if active |
| `sequence(str, handler)` | Trigger on typed sequence |
| `onChange(handler)` | Subscribe to binding changes |
| `onUpdate(handler)` | Real-time key state updates |
| `destroy()` | Clean up all listeners |

### Utilities

```typescript
import { getActiveBindings, key } from 'keymash';

// Get all bindings with human-readable combo text
getActiveBindings(km);

// Create masks for non-standard keys
const { press: pressPlay } = key('MediaPlayPause');
```

## Full Documentation

See the [API Reference](https://zetlen.github.io/keymash/api) for complete documentation.

## License

MIT
