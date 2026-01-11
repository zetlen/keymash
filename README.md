# KeyMash

Stop parsing strings. Start masking bits. The definitive keyboard library for the modern web.

## Why?

KeyMash maps every key to a unique bit in a 512-bit space.
- **0-255**: Hold state (keys currently down)
- **256-511**: Press state (key that just triggered the event)

By using the bitwise OR operator (`|`), you create a unique `BigInt` mask for any possible keyboard chord. This allows for **O(1)** lookup complexity, regardless of how complex the shortcut is.

## Usage

```typescript
import { hold, press, bind } from './lib/keymash';

// Bind to window or any HTMLElement
bind(window, {
  // Simple chord: Ctrl + T
  // You can use (+) to combine keys naturally!
  [hold.ctrl + press.t]: (e) => { 
    e.preventDefault();
    console.log('New Tab');
  },
  
  // Multi-trigger: Ctrl + (O or K)
  // Use (|) for "OR" logic (alternatives)
  [hold.ctrl + (press.o | press.k)]: () => { 
    console.log('Open or Search');
  },

  // Complex: Ctrl + Shift + P
  [hold.ctrl + hold.shift + press.p]: () => {
    console.log('Command Palette');
  }
});
```

## How it works

KeyMash maps every key to a unique bit.
- `hold.ctrl` is a number like `...00010`
- `press.t` is a number like `...01000`

Combining them with `+` results in `...01010`, which uniquely identifies that specific chord.
Using `|` works too, but `+` feels more like "Ctrl + T".


## API

### `hold` & `press`
Static objects containing pre-calculated bitmasks for common keys.
- `hold.ctrl`, `hold.shift`, `hold.alt`, `hold.meta`
- `press.a` through `press.z`
- `press.Enter`, `press.Escape`, `press.Space`
- `press.ArrowUp`, `press.F1`, etc.

### `key(char: string)`
Helper for binding keys that aren't in the standard set.
```typescript
import { key } from './lib/keymash';

const { hold: holdPlay, press: pressPlay } = key('MediaPlay');
```

### `bind(target, bindings)`
Attaches event listeners. Returns an `unbind` function.