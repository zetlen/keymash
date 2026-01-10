
import { BindingMap, KeyHandler } from '../types';

const KEY_CODE_MAP: Record<string, number> = {
  'Control': 1, 'Shift': 2, 'Alt': 3, 'Meta': 4,
  'CapsLock': 5, 'Tab': 6, 'Escape': 7, 'Backspace': 8,
  'Enter': 9, 'Space': 10,
  'ArrowUp': 20, 'ArrowDown': 21, 'ArrowLeft': 22, 'ArrowRight': 23,
};

for (let i = 65; i <= 90; i++) KEY_CODE_MAP[String.fromCharCode(i).toLowerCase()] = i;
for (let i = 0; i < 10; i++) KEY_CODE_MAP[i.toString()] = 48 + i;

const getBitPos = (key: string): number => {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  return KEY_CODE_MAP[normalized] || (normalized.charCodeAt(0) % 100) + 128;
};

const HOLD_OFFSET = 0n;
const PRESS_OFFSET = 256n;

export const hold = new Proxy({} as any, {
  get: (_, prop: string) => {
    const key = prop === 'ctrl' ? 'Control' : prop === 'shift' ? 'Shift' : prop === 'alt' ? 'Alt' : prop === 'meta' ? 'Meta' : prop;
    return 1n << (BigInt(getBitPos(key)) + HOLD_OFFSET);
  }
});

export const press = new Proxy({} as any, {
  get: (_, prop: string) => {
    const key = prop === 'ctrl' ? 'Control' : prop === 'shift' ? 'Shift' : prop === 'alt' ? 'Alt' : prop === 'meta' ? 'Meta' : prop;
    return 1n << (BigInt(getBitPos(key)) + PRESS_OFFSET);
  }
});

/**
 * Explodes bindings that use OR (|) in the press range.
 * This allows O(1) lookup even for multi-trigger shortcuts.
 */
function processBindings(bindings: BindingMap): Record<string, KeyHandler> {
  const processed: Record<string, KeyHandler> = {};
  const PRESS_RANGE_MASK = ((1n << 256n) - 1n) << 256n;
  const HOLD_RANGE_MASK = (1n << 256n) - 1n;

  for (const [maskStr, handler] of Object.entries(bindings)) {
    const mask = BigInt(maskStr);
    const holdPart = mask & HOLD_RANGE_MASK;
    const pressPart = (mask & PRESS_RANGE_MASK) >> 256n;

    let tempPress = pressPart;
    let bitIndex = 0n;
    let registered = false;

    while (tempPress > 0n) {
      if (tempPress & 1n) {
        const individualMask = holdPart | (1n << (bitIndex + 256n));
        processed[individualMask.toString()] = handler;
        registered = true;
      }
      tempPress >>= 1n;
      bitIndex++;
    }

    if (!registered) processed[maskStr] = handler;
  }
  return processed;
}

export function bind(target: HTMLElement | Window, bindings: BindingMap, onUpdate?: (mask: bigint) => void) {
  const activeKeys = new Set<string>();
  const lookup = processBindings(bindings);

  const handleKeyDown = (e: KeyboardEvent) => {
    // If the key is already held, we don't want to re-trigger the "press" bit logic
    // unless we want repeat behavior. For shortcuts, we usually don't.
    if (activeKeys.has(e.key)) return;

    let holdMask = 0n;
    activeKeys.forEach(key => {
      holdMask |= (1n << (BigInt(getBitPos(key)) + HOLD_OFFSET));
    });

    const pressMask = (1n << (BigInt(getBitPos(e.key)) + PRESS_OFFSET));
    const totalMask = holdMask | pressMask;

    if (onUpdate) onUpdate(totalMask);

    if (lookup[totalMask.toString()]) {
      e.preventDefault();
      lookup[totalMask.toString()](e);
    }
    
    activeKeys.add(e.key);
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    activeKeys.delete(e.key);
    if (onUpdate) {
        let holdMask = 0n;
        activeKeys.forEach(key => holdMask |= (1n << BigInt(getBitPos(key))));
        onUpdate(holdMask);
    }
  };

  target.addEventListener('keydown', handleKeyDown as any);
  target.addEventListener('keyup', handleKeyUp as any);
  window.addEventListener('blur', () => {
    activeKeys.clear();
    if (onUpdate) onUpdate(0n);
  });

  return () => {
    target.removeEventListener('keydown', handleKeyDown as any);
    target.removeEventListener('keyup', handleKeyUp as any);
  };
}
