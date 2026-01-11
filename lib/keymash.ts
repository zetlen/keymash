import {
  Binding,
  FullBinding,
  IKeymash,
  KeyCombo,
  KeyComboHandler,
  KeymashConfig,
} from '../types';

// =============================================================================
// BIT POSITION MAPPING
// =============================================================================

const KEY_CODE_MAP: Record<string, number> = {
  'Control': 1, 'Shift': 2, 'Alt': 3, 'Meta': 4,
  'CapsLock': 5, 'Tab': 6, 'Escape': 7, 'Backspace': 8,
  'Enter': 9, 'Space': 10, ' ': 10,
  'ArrowUp': 20, 'ArrowDown': 21, 'ArrowLeft': 22, 'ArrowRight': 23,
};

// Inverse map for comboToText
const BIT_TO_KEY_MAP: Map<number, string> = new Map();

// Populate inverse map from KEY_CODE_MAP
for (const [name, bit] of Object.entries(KEY_CODE_MAP)) {
  // Prefer longer names over single chars (e.g., 'Space' over ' ')
  if (!BIT_TO_KEY_MAP.has(bit) || name.length > 1) {
    BIT_TO_KEY_MAP.set(bit, name);
  }
}

// Add printable ASCII characters (32-126)
for (let code = 32; code <= 126; code++) {
  if (!BIT_TO_KEY_MAP.has(code)) {
    BIT_TO_KEY_MAP.set(code, String.fromCharCode(code));
  }
}

const getBitPos = (key: string): number => {
  const normalized = key.length === 1 ? key.toLowerCase() : key;
  if (KEY_CODE_MAP[normalized]) return KEY_CODE_MAP[normalized];
  if (normalized.length === 1) return normalized.charCodeAt(0);
  return (normalized.charCodeAt(0) % 100) + 128;
};

const HOLD_OFFSET = 0n;
const PRESS_OFFSET = 256n;
const HOLD_RANGE_MASK = (1n << 256n) - 1n;
const PRESS_RANGE_MASK = ((1n << 256n) - 1n) << 256n;

// =============================================================================
// HOLD & PRESS HELPERS
// =============================================================================

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
  // Also register in BIT_TO_KEY_MAP for comboToText
  BIT_TO_KEY_MAP.set(Number(bit), char);
  return {
    hold: 1n << (bit + HOLD_OFFSET),
    press: 1n << (bit + PRESS_OFFSET)
  };
};

// =============================================================================
// COMBO TEXT CONVERSION
// =============================================================================

/**
 * Converts a KeyCombo bitmask back to a human-readable string.
 */
function comboToText(combo: KeyCombo): string {
  const parts: string[] = [];
  const holdMask = combo & HOLD_RANGE_MASK;
  const pressMask = (combo & PRESS_RANGE_MASK) >> 256n;

  // Extract hold keys (modifiers first, then others)
  const modifierOrder = ['Control', 'Shift', 'Alt', 'Meta'];
  const holdKeys: string[] = [];

  for (let i = 0n; i < 256n; i++) {
    if (holdMask & (1n << i)) {
      const keyName = BIT_TO_KEY_MAP.get(Number(i)) ?? `Key${i}`;
      holdKeys.push(keyName);
    }
  }

  // Sort modifiers first
  holdKeys.sort((a, b) => {
    const aIdx = modifierOrder.indexOf(a);
    const bIdx = modifierOrder.indexOf(b);
    if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
    if (aIdx >= 0) return -1;
    if (bIdx >= 0) return 1;
    return a.localeCompare(b);
  });

  parts.push(...holdKeys);

  // Extract press key (should typically be one in a processed binding)
  for (let i = 0n; i < 256n; i++) {
    if (pressMask & (1n << i)) {
      const keyName = BIT_TO_KEY_MAP.get(Number(i)) ?? `Key${i}`;
      parts.push(keyName);
    }
  }

  return parts.join('+');
}

// =============================================================================
// BINDING PROCESSING
// =============================================================================

/**
 * Processes a binding, exploding OR'd combos into separate entries for O(1) lookup.
 * Returns an array of [comboString, Binding] pairs for the lookup map.
 */
function explodeBinding(binding: Binding): Array<[string, Binding]> {
  const results: Array<[string, Binding]> = [];
  const combo = binding.combo;
  const holdPart = combo & HOLD_RANGE_MASK;
  const pressPart = (combo & PRESS_RANGE_MASK) >> 256n;

  let tempPress = pressPart;
  let bitIndex = 0n;
  let registered = false;

  while (tempPress > 0n) {
    if (tempPress & 1n) {
      const individualCombo = holdPart | (1n << (bitIndex + 256n));
      results.push([individualCombo.toString(), binding]);
      registered = true;
    }
    tempPress >>= 1n;
    bitIndex++;
  }

  if (!registered) {
    results.push([combo.toString(), binding]);
  }

  return results;
}

/**
 * Converts a binding to a FullBinding with all properties resolved.
 */
function toFullBinding(binding: Binding): FullBinding {
  return {
    combo: binding.combo,
    handler: binding.handler,
    label: binding.label ?? '',
    delay: binding.delay ?? 0,
    repeat: binding.repeat ?? false,
    comboText: comboToText(binding.combo),
  };
}

// =============================================================================
// TARGET REGISTRY
// =============================================================================

const targetRegistry = new WeakMap<object, Set<Keymash>>();

function registerTarget(target: HTMLElement | Window, instance: Keymash): void {
  let instances = targetRegistry.get(target);
  if (!instances) {
    instances = new Set();
    targetRegistry.set(target, instances);
  }
  instances.add(instance);
}

function unregisterTarget(target: HTMLElement | Window, instance: Keymash): void {
  targetRegistry.get(target)?.delete(instance);
}

function getKeymashInstances(target: HTMLElement | Window): Set<Keymash> | undefined {
  return targetRegistry.get(target);
}

// =============================================================================
// KEYMASH CLASS
// =============================================================================

export class Keymash implements IKeymash {
  label: string;
  target: HTMLElement | Window;
  bindings: Binding[] = [];

  private _active: boolean = false;
  private _activeKeys: Set<string> = new Set();
  private _lookup: Map<string, Binding> = new Map();
  private _changeListeners: Set<() => void> = new Set();
  private _onUpdate?: (mask: bigint) => void;

  // Bound handlers for proper cleanup
  private _boundHandleKeyDown: (e: KeyboardEvent) => void;
  private _boundHandleKeyUp: (e: KeyboardEvent) => void;
  private _boundHandleBlur: () => void;

  constructor(config: KeymashConfig = {}) {
    this.label = config.label ?? '';
    this.target = config.target ?? window;

    // Bind event handlers
    this._boundHandleKeyDown = this._handleKeyDown.bind(this);
    this._boundHandleKeyUp = this._handleKeyUp.bind(this);
    this._boundHandleBlur = this._handleBlur.bind(this);

    // Add initial bindings
    if (config.bindings && config.bindings.length > 0) {
      this._addBindings(config.bindings);
      this.setActive(true);
    }
  }

  /**
   * Add bindings - supports multiple overloads:
   * - bind(binding: Binding) - single binding object
   * - bind(bindings: Binding[]) - array of bindings
   * - bind(combo: KeyCombo, handler: KeyComboHandler) - shorthand
   */
  bind(bindingOrCombo: Binding | Binding[] | KeyCombo, handler?: KeyComboHandler): void {
    if (typeof bindingOrCombo === 'bigint') {
      // Shorthand: bind(combo, handler)
      if (!handler) {
        throw new Error('bind() requires a handler when called with a KeyCombo');
      }
      this._addBindings([{ combo: bindingOrCombo, handler }]);
    } else if (Array.isArray(bindingOrCombo)) {
      // Array of bindings
      this._addBindings(bindingOrCombo);
    } else {
      // Single binding object
      this._addBindings([bindingOrCombo]);
    }

    this._notifyChange();
  }

  /**
   * Remove binding(s) for the given combo(s).
   */
  unbind(combo: KeyCombo | KeyCombo[]): void {
    const combos = Array.isArray(combo) ? combo : [combo];
    const comboStrings = new Set(combos.map(c => c.toString()));

    // Remove from bindings array
    this.bindings = this.bindings.filter(b => !comboStrings.has(b.combo.toString()));

    // Rebuild lookup
    this._rebuildLookup();
    this._notifyChange();
  }

  /**
   * Activate or deactivate event listeners.
   */
  setActive(active: boolean): void {
    if (this._active === active) return;
    this._active = active;

    if (active) {
      this.target.addEventListener('keydown', this._boundHandleKeyDown as EventListener);
      this.target.addEventListener('keyup', this._boundHandleKeyUp as EventListener);
      window.addEventListener('blur', this._boundHandleBlur);
      registerTarget(this.target, this);
    } else {
      this.target.removeEventListener('keydown', this._boundHandleKeyDown as EventListener);
      this.target.removeEventListener('keyup', this._boundHandleKeyUp as EventListener);
      window.removeEventListener('blur', this._boundHandleBlur);
      unregisterTarget(this.target, this);
      this._activeKeys.clear();
    }

    this._notifyChange();
  }

  /**
   * Subscribe to changes. Returns an unsubscribe function.
   */
  onChange(handler: () => void): () => void {
    this._changeListeners.add(handler);
    return () => this._changeListeners.delete(handler);
  }

  /**
   * Set a callback for real-time key state updates (for visualizers).
   */
  onUpdate(callback: (mask: bigint) => void): void {
    this._onUpdate = callback;
  }

  /**
   * Check if the keymash is currently active.
   */
  isActive(): boolean {
    return this._active;
  }

  /**
   * Destroy the keymash instance, removing all listeners.
   */
  destroy(): void {
    this.setActive(false);
    this._changeListeners.clear();
    this._onUpdate = undefined;
  }

  private _addBindings(bindings: Binding[]): void {
    for (const binding of bindings) {
      this.bindings.push(binding);
      // Add to lookup (exploding OR'd combos)
      for (const [key, b] of explodeBinding(binding)) {
        this._lookup.set(key, b);
      }
    }
  }

  private _rebuildLookup(): void {
    this._lookup.clear();
    for (const binding of this.bindings) {
      for (const [key, b] of explodeBinding(binding)) {
        this._lookup.set(key, b);
      }
    }
  }

  private _notifyChange(): void {
    this._changeListeners.forEach(fn => fn());
  }

  private _getHoldMask(k: string): bigint {
    return hold[k] || (1n << (BigInt(getBitPos(k)) + HOLD_OFFSET));
  }

  private _getPressMask(k: string): bigint {
    return press[k] || (1n << (BigInt(getBitPos(k)) + PRESS_OFFSET));
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    // Compute hold mask once
    let holdMask = 0n;
    this._activeKeys.forEach(k => {
      holdMask |= this._getHoldMask(k);
    });

    const pressMask = this._getPressMask(e.key);
    const totalMask = holdMask | pressMask;
    const maskKey = totalMask.toString();
    const binding = this._lookup.get(maskKey);

    if (this._activeKeys.has(e.key)) {
      // Key repeat - only fire if repeat is enabled for this binding
      if (binding?.repeat) {
        e.preventDefault();
        binding.handler(e, this);
      }
      return;
    }

    if (this._onUpdate) this._onUpdate(totalMask);

    if (binding) {
      e.preventDefault();
      // Handle delay if specified
      if (binding.delay && binding.delay > 0) {
        setTimeout(() => binding.handler(e, this), binding.delay);
      } else {
        binding.handler(e, this);
      }
    }

    this._activeKeys.add(e.key);
  }

  private _handleKeyUp(e: KeyboardEvent): void {
    this._activeKeys.delete(e.key);
    if (this._onUpdate) {
      let holdMask = 0n;
      this._activeKeys.forEach(k => holdMask |= this._getHoldMask(k));
      this._onUpdate(holdMask);
    }
  }

  private _handleBlur(): void {
    this._activeKeys.clear();
    if (this._onUpdate) this._onUpdate(0n);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Creates a new Keymash instance.
 */
export function keymash(config: KeymashConfig = {}): Keymash {
  return new Keymash(config);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets all active bindings from a target or Keymash instance.
 * Returns an array of FullBindings with resolved properties and human-readable combo text.
 */
export function getActiveBindings(
  bindingsHaver?: Window | HTMLElement | Keymash
): FullBinding[] {
  const results: FullBinding[] = [];

  if (bindingsHaver instanceof Keymash) {
    // Direct Keymash instance
    for (const binding of bindingsHaver.bindings) {
      results.push(toFullBinding(binding));
    }
  } else {
    // Window or HTMLElement - look up registered instances
    const target = bindingsHaver ?? window;
    const instances = getKeymashInstances(target);
    if (instances) {
      for (const km of instances) {
        for (const binding of km.bindings) {
          results.push(toFullBinding(binding));
        }
      }
    }
  }

  return results;
}