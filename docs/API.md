# KeyMash API Reference

Complete API documentation for KeyMash. Keyboard shortcuts that just work.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [`keymash(config?)`](#keymashconfig)
  - [Modifiers](#modifiers)
  - [`key(char)`](#keychar)
  - [`getActiveBindings(target?)`](#getactivebindingstarget)
- [Types](#types)
- [Modal Keymash Patterns](#modal-keymash-patterns)
- [Advanced Usage](#advanced-usage)
- [How It Works](#how-it-works)

---

## Installation

```bash
npm install keymash
# or
pnpm add keymash
# or
yarn add keymash
```

---

## Quick Start

```typescript
import { keymash, ctrl, press } from 'keymash';

const km = keymash();

km.bind(ctrl + press.s, () => save());

// Clean up when done
km.destroy();
```

---

## API Reference

### `keymash(config?)`

Creates a new Keymash instance.

```typescript
function keymash(config?: KeymashConfig): Keymash;
```

#### KeymashConfig

| Property   | Type                     | Default  | Description                                        |
|------------|--------------------------|----------|----------------------------------------------------|
| `scope`    | `HTMLElement \| Window`  | `window` | The scope element. Events are captured at window level but only processed if the event originated from within this element. |
| `bindings` | `Binding[]`              | `[]`     | Initial bindings to register                       |
| `label`    | `string`                 | `''`     | Optional label for debugging/identification        |
| `target`   | `HTMLElement \| Window`  | `window` | **Deprecated.** Use `scope` instead.              |

#### Example

```typescript
import { keymash, ctrl, press } from 'keymash';

// Basic usage with window (global shortcuts)
const km = keymash({
  label: 'Global Shortcuts',
  bindings: [
    { combo: ctrl + press.k, handler: () => openSearch() }
  ]
});

// Scoped to a specific element
const editor = document.getElementById('editor');
const editorKm = keymash({
  scope: editor,
  label: 'Editor Shortcuts',
  bindings: [
    { combo: ctrl + press.b, handler: () => toggleBold() }
  ]
});
```

---

### Keymash Instance Methods

#### `bind(binding)` / `bind(bindings)` / `bind(combo, handler)`

Add bindings dynamically. Supports three overloads:

```typescript
// Single binding object
km.bind({
  combo: ctrl + press.n,
  handler: () => createNew(),
  label: 'New File'
});

// Array of bindings
km.bind([
  { combo: ctrl + press.c, handler: () => copy() },
  { combo: ctrl + press.v, handler: () => paste() }
]);

// Shorthand: combo + handler only
km.bind(ctrl + press.z, () => undo());
```

#### `unbind(combo)` / `unbind(combos)`

Remove binding(s) for the given combo(s).

```typescript
// Remove a single binding
km.unbind(ctrl + press.z);

// Remove multiple bindings
km.unbind([ctrl + press.c, ctrl + press.v]);
```

#### `setActive(active: boolean)`

Activate or deactivate the keymash instance. When inactive, no keyboard events are processed.

```typescript
// Disable all bindings
km.setActive(false);

// Re-enable
km.setActive(true);
```

#### `isActive(): boolean`

Check if the keymash instance is currently active.

```typescript
if (km.isActive()) {
  console.log('Keyboard shortcuts are enabled');
}
```

#### `onChange(handler): () => void`

Subscribe to changes (bindings added/removed, activation state changed). Returns an unsubscribe function.

```typescript
const unsubscribe = km.onChange(() => {
  console.log('Bindings changed:', km.bindings);
});

// Later, stop listening
unsubscribe();
```

#### `onUpdate(callback: (mask: bigint) => void)`

Set a callback for real-time key state updates. Useful for keyboard visualizers.

```typescript
km.onUpdate((mask) => {
  // mask contains both hold and press bits for currently active keys
  updateKeyboardVisualizer(mask);
});
```

#### `sequence(sequence, handler, options?): () => void`

Register a sequence trigger. Fires the handler when the user types the specified character sequence. Returns an unsubscribe function.

```typescript
// Trigger on typing "show me"
const unsubscribe = km.sequence('show me', (sequence, event, keymash) => {
  console.log('Sequence detected:', sequence);
  enterModalMode();
});

// With custom timeout (default is 1000ms)
km.sequence('hello', handler, { timeout: 2000 });

// Unsubscribe when done
unsubscribe();
```

**Options:**
- `timeout`: Time in milliseconds after which the buffer resets if no keys are pressed (default: 1000)

**Notes:**
- Sequences are case-insensitive
- The buffer automatically resets after a successful match
- Only single printable characters are tracked (not modifier keys or special keys)

#### `destroy()`

Clean up the keymash instance, removing all event listeners.

```typescript
km.destroy();
```

---

### Instance Properties

| Property   | Type                    | Description                              |
|------------|-------------------------|------------------------------------------|
| `label`    | `string`                | The label assigned during creation       |
| `scope`    | `HTMLElement \| Window` | The scope element for event filtering    |
| `target`   | `HTMLElement \| Window` | **Deprecated.** Alias for `scope`        |
| `bindings` | `Binding[]`             | Array of all registered bindings         |

---

### Modifiers

KeyMash exports convenient shorthands for modifier keys:

```typescript
import { ctrl, shift, alt, meta, cmd, press } from 'keymash';

ctrl + press.s           // Ctrl+S
shift + press.Enter      // Shift+Enter
cmd + press.k            // Cmd+K (meta on Windows)
ctrl + shift + press.p   // Ctrl+Shift+P
```

For the full set of modifiers, use `hold.*`:

```typescript
import { hold, press } from 'keymash';

hold.ctrl + hold.shift + press.p
hold.alt + press.Tab
```

#### Common Keys (use with `press`)

```typescript
// Letters (lowercase)
press.a through press.z

// Numbers
press['0'] through press['9']

// Function keys
press.F1 through press.F12

// Navigation
press.ArrowUp, press.ArrowDown, press.ArrowLeft, press.ArrowRight
press.Home, press.End, press.PageUp, press.PageDown

// Editing
press.Enter, press.Backspace, press.Delete, press.Tab

// Other
press.Escape  // or press.esc
press.Space
press.CapsLock
```

#### Symbols

```typescript
press['['], press[']'], press['\\']
press[';'], press["'"]
press[','], press['.'], press['/']
press['`'], press['-'], press['=']
```

#### Catch-All Binding

Use `press.ANY` to create a catch-all binding that fires for any key not explicitly bound:

```typescript
// Trap all keyboard input in modal mode
modalKm.bind({
  combo: press.ANY,
  handler: (e) => {
    e?.preventDefault();
    console.log('Key trapped:', e?.key);
  },
  label: 'Catch All'
});

// Specific bindings take priority over ANY
modalKm.bind(press.Escape, () => exitModal()); // This wins over press.ANY
```

`hold.ANY` is also available for matching any modifier combination with a specific press key, though `press.ANY` is more commonly used.

---

### `key(char)`

Create hold and press masks for keys not in the standard set.

```typescript
function key(char: string): { hold: bigint; press: bigint };
```

#### Example

```typescript
import { key } from 'keymash';

// Media keys
const { hold: holdPlay, press: pressPlay } = key('MediaPlayPause');

km.bind({
  combo: pressPlay,
  handler: () => togglePlayback()
});

// Custom/non-standard keys
const { press: pressCustom } = key('CustomKey');
```

---

### `getActiveBindings(target?)`

Get all active bindings from a target or Keymash instance.

```typescript
function getActiveBindings(
  target?: Window | HTMLElement | Keymash
): FullBinding[];
```

Returns an array of `FullBinding` objects with resolved properties and human-readable combo text.

#### Example

```typescript
import { getActiveBindings } from 'keymash';

// Get bindings from a specific instance
const bindings = getActiveBindings(km);

// Get bindings from a DOM target
const windowBindings = getActiveBindings(window);

// Display in UI
bindings.forEach(b => {
  console.log(`${b.comboText}: ${b.label}`);
  // Output: "Control+S: Save"
});
```

---

## Types

### Binding

Configuration object for a keyboard binding.

```typescript
interface Binding {
  combo: KeyCombo;                    // The key combination (bigint)
  handler: KeyComboHandler;           // Function to call when matched
  label?: string;                     // Human-readable label
  delay?: number;                     // Delay in ms before executing handler
  repeat?: boolean;                   // Fire on key repeat (default: false)
}
```

### KeyComboHandler

```typescript
type KeyComboHandler = (
  event?: KeyboardEvent,
  keymash?: IKeymash
) => void;
```

The handler receives:
- `event`: The original KeyboardEvent (call `e.preventDefault()` to stop default browser behavior)
- `keymash`: The Keymash instance that triggered the handler

### SequenceHandler

```typescript
type SequenceHandler = (
  sequence: string,
  event?: KeyboardEvent,
  keymash?: IKeymash
) => void;
```

The handler receives:
- `sequence`: The sequence string that was matched
- `event`: The original KeyboardEvent (may be undefined)
- `keymash`: The Keymash instance that triggered the handler

### FullBinding

Extended binding with all properties resolved.

```typescript
interface FullBinding extends Required<Binding> {
  comboText: string;  // Human-readable combo, e.g., "Control+Shift+P"
}
```

### KeyCombo

```typescript
type KeyCombo = bigint;
```

---

## Modal Keymash Patterns

A "modal" keymash is one that activates on a trigger and deactivates on another. This is useful for creating keyboard-driven interfaces like:

- Command palettes
- Vim-style modes
- Game controls
- Focus traps

### Basic Modal Pattern

```typescript
import { keymash, ctrl, press } from 'keymash';

// Create an inactive keymash for the modal
const modalKm = keymash({
  label: 'Modal Mode',
  scope: document.getElementById('modal-container')!,
});

// Add bindings BEFORE activating
modalKm.bind([
  { combo: press.j, handler: () => moveDown(), label: 'Move Down' },
  { combo: press.k, handler: () => moveUp(), label: 'Move Up' },
  { combo: press.Enter, handler: () => select(), label: 'Select' },
  {
    combo: press.Escape,
    handler: () => {
      modalKm.setActive(false);
      globalKm.setActive(true);
    },
    label: 'Exit Modal'
  },
  // Catch-all to trap unbound keys
  { combo: press.ANY, handler: (e) => e?.preventDefault(), label: 'Trap All' },
]);

// Start inactive
modalKm.setActive(false);

// Create global keymash with modal trigger
const globalKm = keymash({
  label: 'Global',
  bindings: [
    {
      combo: ctrl + press.k,
      handler: () => {
        globalKm.setActive(false);
        modalKm.setActive(true);
        document.getElementById('modal-container')?.focus();
      },
      label: 'Open Modal'
    }
  ]
});
```

### Sequence-Activated Modal

Activate a modal by typing a specific sequence using the built-in `sequence()` method:

```typescript
const globalKm = keymash({
  scope: window,
  label: 'Global',
});

const modalKm = keymash({
  scope: document.getElementById('modal-container')!,
  label: 'Modal',
});

// Use built-in sequence detection
globalKm.sequence('show me', () => {
  globalKm.setActive(false);
  modalKm.setActive(true);
  console.log('Entered modal mode! Press Escape to exit.');
});

// Exit with Escape
modalKm.bind(press.Escape, () => {
  modalKm.setActive(false);
  globalKm.setActive(true);
});

// Trap all unbound keys
modalKm.bind(press.ANY, (e) => e?.preventDefault());

modalKm.setActive(false);
```

### Focus-Trap Modal

A modal that captures keyboard input within a specific element:

```typescript
const container = document.getElementById('app')!;

// Both keymashes scope to the same container
const globalKm = keymash({
  scope: container,
  label: 'Global',
});

const modalKm = keymash({
  scope: container,
  label: 'Focus Trap',
});

// Arrow keys work reliably - events are captured at window level
// and filtered by container containment
modalKm.bind({
  combo: press.ArrowUp,
  handler: () => navigateUp(),
  label: 'Navigate Up',
  repeat: true,
});

modalKm.bind({
  combo: press.Escape,
  handler: () => exitTrap(),
  label: 'Exit Trap'
});

// Catch-all to truly trap all keyboard input
modalKm.bind({
  combo: press.ANY,
  handler: (e) => e?.preventDefault(),
  label: 'Trap All'
});

// Modal starts inactive
modalKm.setActive(false);

function enterTrap() {
  globalKm.setActive(false);
  modalKm.setActive(true);
  container.focus();  // Ensure container has focus
}

function exitTrap() {
  modalKm.setActive(false);
  globalKm.setActive(true);
}
```

**How it works**: KeyMash always listens on `window` and filters events based on whether the configured `target` contains the event's origin element. This means arrow keys, escape, and other special keys work reliably without being intercepted by browser scrolling or other default behaviors.

### Multiple Modal Layers

Stack modal keymashes for nested interfaces:

```typescript
const layers: Keymash[] = [];

function pushLayer(km: Keymash) {
  // Deactivate current top layer
  if (layers.length > 0) {
    layers[layers.length - 1].setActive(false);
  }
  // Activate new layer
  km.setActive(true);
  layers.push(km);
}

function popLayer() {
  if (layers.length === 0) return;

  // Deactivate current layer
  const current = layers.pop()!;
  current.setActive(false);

  // Reactivate previous layer
  if (layers.length > 0) {
    layers[layers.length - 1].setActive(true);
  }
}

// Usage
const mainMenu = keymash({ label: 'Main Menu' });
const subMenu = keymash({ label: 'Sub Menu' });

mainMenu.bind(press.Enter, () => pushLayer(subMenu));
subMenu.bind(press.Escape, () => popLayer());

pushLayer(mainMenu);
```

---

## Advanced Usage

### Delayed Execution

Use the `delay` option to add a delay before the handler fires:

```typescript
km.bind({
  combo: ctrl + press.q,
  handler: () => confirmQuit(),
  delay: 500,  // Wait 500ms - gives user time to release
  label: 'Quit (hold)'
});
```

### Key Repeat

Enable key repeat for continuous actions:

```typescript
km.bind({
  combo: press.ArrowDown,
  handler: () => scrollDown(10),
  repeat: true,  // Fire on every key repeat event
  label: 'Scroll Down'
});
```

### Element-Scoped Bindings

Scope bindings to specific elements for contextual shortcuts:

```typescript
import { keymash, ctrl, press } from 'keymash';

// Global shortcuts
const globalKm = keymash({ scope: window });

// Editor-specific shortcuts
const editorKm = keymash({
  scope: document.getElementById('editor')!,
  bindings: [
    { combo: ctrl + press.b, handler: () => bold() },
    { combo: ctrl + press.i, handler: () => italic() },
  ]
});

// These only work when the editor has focus
```

### Keyboard Visualizer

Use `onUpdate` to create real-time keyboard visualizations:

```typescript
const km = keymash({ label: 'Visualizer' });

km.onUpdate((mask) => {
  // Check if a specific key is active
  const ctrlActive = (mask & hold.ctrl) !== 0n;
  const tPressed = (mask & press.t) !== 0n;

  // Update your UI
  updateKeyHighlight('ctrl', ctrlActive);
  updateKeyHighlight('t', tPressed);
});
```

### Dynamic Binding Updates

Change bindings on the fly:

```typescript
import { keymash, ctrl, press } from 'keymash';

const km = keymash();

// Add bindings when entering a mode
function enterEditMode() {
  km.bind([
    { combo: ctrl + press.s, handler: save },
    { combo: ctrl + press.z, handler: undo },
  ]);
}

// Remove bindings when exiting
function exitEditMode() {
  km.unbind([
    ctrl + press.s,
    ctrl + press.z,
  ]);
}
```

### Inspecting Bindings

Use `getActiveBindings` to display available shortcuts:

```typescript
import { getActiveBindings } from 'keymash';

function showKeyboardShortcuts() {
  const bindings = getActiveBindings(km);

  const shortcuts = bindings
    .filter(b => b.label)  // Only labeled bindings
    .map(b => `${b.comboText}: ${b.label}`)
    .join('\n');

  alert(`Keyboard Shortcuts:\n\n${shortcuts}`);
}
```

---

## Design Notes & Gotchas

### Event Capture Architecture

KeyMash always listens for keyboard events on `window`, then filters based on whether the configured `scope` contains the event's origin element. This means:

- Arrow keys, Escape, and other special keys work reliably
- No race condition with browser scrolling
- Events are captured even if focus shifts within your scope element
- Use `scope: window` for truly global shortcuts

### Activation Behavior

When you create a keymash **without initial bindings**, it starts inactive:

```typescript
const km = keymash({ scope: element }); // NOT active yet
km.bind(press.a, handler);               // Binding added but still not active
km.setActive(true);                      // NOW it listens for events
```

When you create a keymash **with initial bindings**, it auto-activates:

```typescript
const km = keymash({
  scope: element,
  bindings: [{ combo: press.a, handler }]  // Auto-activates!
});
```

### Catch-All Bindings

KeyMash supports catch-all bindings using `press.ANY` to capture any key that isn't explicitly bound:

```typescript
// Trap all unbound keys in modal mode
modalKm.bind(press.ANY, (e) => {
  e?.preventDefault();
  console.log('Trapped:', e?.key);
});

// Specific bindings always take priority over ANY
modalKm.bind(press.Escape, () => exitModal()); // This wins
```

This is useful for creating true modal traps where you want to block ALL keyboard input.

### Handler Gets Event

Your handler receives the original `KeyboardEvent` and the keymash instance:

```typescript
km.bind(press.a, (event, keymash) => {
  event?.preventDefault();  // Already called by keymash, but safe to call again
  console.log('Keymash label:', keymash?.label);
});
```

KeyMash automatically calls `preventDefault()` when a binding matches, but calling it in your handler too is harmless and can be clearer.

---

## How It Works

KeyMash uses bitwise operations for fast chord lookup. Each key maps to a unique bit in a 512-bit bigint space:

- **Bits 0-255**: Hold state (modifier keys currently pressed)
- **Bits 256-511**: Press state (the key that triggered the event)

Use JavaScript's native operators to define key combinations:

```typescript
// Use + to combine keys (feels natural: "Ctrl + T")
const ctrlT = ctrl + press.t;

// Use | for alternatives (OR logic)
const ctrlAOrB = ctrl + (press.a | press.b);
```

When you use `|` for alternatives, KeyMash "explodes" the combination into separate lookup entries at registration time, so lookup stays fast regardless of how many alternatives you define.

---

## Browser Compatibility

KeyMash uses `BigInt` which is supported in all modern browsers:
- Chrome 67+
- Firefox 68+
- Safari 14+
- Edge 79+

For older browser support, you'll need a BigInt polyfill.

---

## License

MIT
