
import { BindingMap, KeyHandler } from '../types';

const KEY_CODE_MAP: Record<string, number> = {
  'Control': 1, 'Shift': 2, 'Alt': 3, 'Meta': 4,
  'CapsLock': 5, 'Tab': 6, 'Escape': 7, 'Backspace': 8,
  'Enter': 9, 'Space': 10, ' ': 10,
  'ArrowUp': 20, 'ArrowDown': 21, 'ArrowLeft': 22, 'ArrowRight': 23,
};

const getBitPos = (key: string): number => {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  if (KEY_CODE_MAP[normalized]) return KEY_CODE_MAP[normalized];
  if (normalized.length === 1) return normalized.charCodeAt(0);
  return (normalized.charCodeAt(0) % 100) + 128;
};

const HOLD_OFFSET = 0n;
const PRESS_OFFSET = 256n;

export const hold: Record<string, bigint> = {};
export const press: Record<string, bigint> = {};

const register = (key: string, alias?: string) => {
  const bit = BigInt(getBitPos(key));
  hold[key] = 1n << (bit + HOLD_OFFSET);
  press[key] = 1n << (bit + PRESS_OFFSET);
  if (alias) {
    hold[alias] = hold[key];
    press[alias] = press[key];
  }
};

// Populate known keys
Object.keys(KEY_CODE_MAP).forEach(k => register(k));

// Aliases
register('Control', 'ctrl');
register('Shift', 'shift');
register('Alt', 'alt');
register('Meta', 'meta');
register('Escape', 'esc');

// ASCII printable characters
for (let i = 32; i < 127; i++) {
  const char = String.fromCharCode(i);
  if (!hold[char]) register(char);
}

// Function keys
for (let i = 1; i <= 12; i++) register(`F${i}`);

/**
 * Helper for binding keys that aren't in the standard set.
 * Usage: key('MediaPlay')
 */
export const key = (char: string) => {
  const bit = BigInt(getBitPos(char));
  return {
    hold: 1n << (bit + HOLD_OFFSET),
    press: 1n << (bit + PRESS_OFFSET)
  };
};

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

  const getHoldMask = (k: string) => hold[k] || (1n << (BigInt(getBitPos(k)) + HOLD_OFFSET));
  const getPressMask = (k: string) => press[k] || (1n << (BigInt(getBitPos(k)) + PRESS_OFFSET));

  const handleKeyDown = (e: KeyboardEvent) => {
    // If the key is already held, we don't want to re-trigger the "press" bit logic
    // unless we want repeat behavior. For shortcuts, we usually don't.
    if (activeKeys.has(e.key)) return;

    let holdMask = 0n;
    activeKeys.forEach(k => {
      holdMask |= getHoldMask(k);
    });

    const pressMask = getPressMask(e.key);
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
        activeKeys.forEach(k => holdMask |= getHoldMask(k));
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
