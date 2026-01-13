import type {
  Binding,
  FullBinding,
  IKeymash,
  IntNamedKeyMap,
  KeyAlias,
  KeyCombo,
  KeyComboHandler,
  KeymashConfig,
  NamedKey,
  NamedKeyMap,
  NumeralKeyAlias,
  SequenceHandler,
  UnionToRequiredKeys,
} from '../types';

// =============================================================================
// DEVELOPMENT MODE
// =============================================================================

/**
 * Development mode flag. Set to true in development builds.
 * Bundlers like Vite, webpack, and Rollup will tree-shake this code in production
 * when the build is configured with NODE_ENV=production.
 *
 * To enable development warnings:
 * - Define __DEV__ as true in your bundler config for development
 * - Define __DEV__ as false (or rely on dead code elimination) for production
 */
declare const __DEV__: boolean | undefined;

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const reportConflict: (message: string) => void = isDev
  ? (message) => {
      throw new Error(`[keymash] ${message}`);
    }
  : (_) => {};

// =============================================================================
// BIT POSITION MAPPING
// =============================================================================

const KEY_CODE_MAP: Partial<IntNamedKeyMap> = {
  ctrl: 1,
  shift: 2,
  alt: 3,
  meta: 4,
  capslock: 5,
  tab: 6,
  escape: 7,
  backspace: 8,
  enter: 9,
  ' ': 10,
  arrowup: 20,
  arrowdown: 21,
  arrowleft: 22,
  arrowright: 23,
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

// Special sentinel for catch-all bindings (uses bit 255 which is reserved)
const ANY_SENTINEL = 1n << 255n;
const ANY_HOLD = ANY_SENTINEL;
const ANY_PRESS = ANY_SENTINEL << 256n;

// =============================================================================
// HOLD & PRESS HELPERS
// =============================================================================

/**
 * Object containing hold (modifier) key masks. Use these for keys that should be
 * held down as part of a chord. Includes common modifiers and aliases.
 *
 * @category Core Exports
 * @example
 * ```typescript
 * import { hold, press } from 'keymash';
 *
 * // Common modifiers
 * hold.ctrl    // Control key
 * hold.shift   // Shift key
 * hold.alt     // Alt/Option key
 * hold.meta    // Meta/Command key
 *
 * // Combine with + operator
 * const combo = hold.ctrl + hold.shift + press.p;
 * ```
 */
export const hold: NamedKeyMap = { any: ANY_HOLD } as unknown as NamedKeyMap;

/**
 * Object containing press key masks. Use these for the key that triggers the binding.
 * Includes letters, numbers, special keys, and function keys.
 *
 * @category Core Exports
 * @example
 * ```typescript
 * import { hold, press } from 'keymash';
 *
 * // Letters and numbers
 * press.a, press.z, press['1']
 *
 * // Special keys
 * press.Enter, press.Escape, press.Space
 * press.ArrowUp, press.ArrowDown
 *
 * // Function keys
 * press.F1, press.F12
 *
 * // Catch-all (matches any key)
 * press.ANY
 * ```
 */
export const press: NamedKeyMap = { any: ANY_PRESS } as unknown as NamedKeyMap;

const numAliases = Object.fromEntries(
  Array.from({ length: 10 }).map((_, i) => [`${i}`, [`num${i}`]]),
) as UnionToRequiredKeys<NamedKey, NumeralKeyAlias[]>;
const aliases: UnionToRequiredKeys<NamedKey, KeyAlias[]> = {
  ...numAliases,
  meta: ['windows', 'command'],
  arrowup: ['up'],
  arrowleft: ['left'],
  arrowright: ['right'],
  arrowdown: ['down'],
  ' ': ['space'],
  '`': ['backtick'],
  '-': ['dash'],
  '=': ['equals'],
  '[': ['leftsquarebracket'],
  ']': ['rightsquarebracket'],
  ';': ['semicolon'],
  "'": ['apostrophe'],
  ',': ['comma'],
  '.': ['period'],
  '/': ['slash'],
  '\\': ['backslash'],
} as const;

const register = (key: string) => {
  const bit = BigInt(getBitPos(key));
  hold[key] = 1n << (bit + HOLD_OFFSET);
  press[key] = 1n << (bit + PRESS_OFFSET);
  const keyAliases = aliases[key];
  if (keyAliases) {
    for (const alias of keyAliases) {
      hold[alias] = hold[key];
      press[alias] = press[key];
    }
  }
};

// Populate known keys
for (const k of Object.keys(KEY_CODE_MAP)) {
  register(k);
}

// ASCII printable characters
for (let i = 32; i < 127; i++) {
  const char = String.fromCharCode(i);
  if (!hold[char]) register(char);
}

// Function keys
for (let i = 1; i <= 12; i++) register(`F${i}`);

/**
 * Helper for binding keys that aren't in the standard set, like media keys or
 * custom key codes.
 *
 * @param name - The key name (e.g., 'MediaPlay', 'MediaPause')
 * @returns Object with hold and press bigint masks for the key
 * @category Core Exports
 * @example
 * ```typescript
 * import { key, keymash } from 'keymash';
 *
 * const { press: pressMedia } = key('MediaPlay');
 * const km = keymash();
 * km.bind(pressMedia, () => togglePlayback());
 * ```
 */
export const key = (name: string) => {
  const bit = BigInt(getBitPos(name));
  // Also register in BIT_TO_KEY_MAP for comboToText
  BIT_TO_KEY_MAP.set(Number(bit), name);
  return {
    hold: 1n << (bit + HOLD_OFFSET),
    press: 1n << (bit + PRESS_OFFSET),
  };
};

// =============================================================================
// MODIFIER SHORTHANDS
// =============================================================================

/**
 * Shorthand for `hold.ctrl`. Use with `+` to build key combos.
 * @category Modifiers
 * @example
 * ```typescript
 * import { keymash, ctrl, shift, press } from 'keymash';
 *
 * const km = keymash();
 * km.bind(ctrl + shift + press.p, () => openCommandPalette());
 * ```
 */
export const ctrl = hold.ctrl;

/**
 * Shorthand for `hold.shift`. Use with `+` to build key combos.
 * @category Modifiers
 */
export const shift = hold.shift;

/**
 * Shorthand for `hold.alt`. Use with `+` to build key combos.
 * @category Modifiers
 */
export const alt = hold.alt;

/**
 * Shorthand for `hold.meta` (Cmd on Mac, Win on Windows).
 * @category Modifiers
 */
export const meta = hold.meta;

/**
 * Alias for `meta`. Shorthand for `hold.meta` (Cmd on Mac).
 * @category Modifiers
 */
export const cmd = hold.meta;

/**
 * Alias for `meta`. Shorthand for `hold.meta` (Win on Windows).
 * @category Modifiers
 */
export const win = hold.meta;

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

// Internal sequence registration
interface SequenceBinding {
  sequence: string;
  handler: SequenceHandler;
  id: number;
}

/**
 * The main Keymash class that manages keyboard bindings for a specific scope.
 * Create instances using the {@link keymash} factory function.
 *
 * @category Keymash Instance
 * @example
 * ```typescript
 * import { keymash, ctrl, press } from 'keymash';
 *
 * const km = keymash({
 *   label: 'My App',
 *   scope: document.getElementById('app'),
 *   bindings: [
 *     { combo: ctrl + press.s, handler: () => save() }
 *   ]
 * });
 *
 * // Add more bindings
 * km.bind(ctrl + press.n, () => newFile());
 *
 * // Clean up when done
 * km.destroy();
 * ```
 */
export class Keymash implements IKeymash {
  label: string;
  /**
   * The scope element for this keymash. Events are filtered by containment.
   * @deprecated Use `scope` instead of `target`.
   */
  target: HTMLElement | Window;
  bindings: Binding[] = [];

  /**
   * Alias for `target`. The scope element for this keymash.
   * Events are captured at window level but only processed if the event
   * originated from within this element (or window for global capture).
   */
  get scope(): HTMLElement | Window {
    return this.target;
  }

  private _active: boolean = false;
  private _activeKeys: Set<string> = new Set();
  private _lookup: Map<string, Binding> = new Map();
  private _changeListeners: Set<() => void> = new Set();
  private _onUpdate?: (mask: bigint) => void;

  // Sequence tracking
  private _sequences: SequenceBinding[] = [];
  private _sequenceBuffer: string = '';
  private _sequenceIdCounter: number = 0;
  private _lastKeyTime: number = 0;
  private _sequenceTimeout: number = 1000; // Reset buffer after 1 second of inactivity

  // Bound handlers for proper cleanup
  private _boundHandleKeyDown: (e: KeyboardEvent) => void;
  private _boundHandleKeyUp: (e: KeyboardEvent) => void;
  private _boundHandleBlur: () => void;

  constructor(config: KeymashConfig = {}) {
    this.label = config.label ?? '';
    // Prefer scope over deprecated target
    this.target = config.scope ?? config.target ?? window;

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
    const comboStrings = new Set(combos.map((c) => c.toString()));

    // Remove from bindings array
    this.bindings = this.bindings.filter((b) => !comboStrings.has(b.combo.toString()));

    // Rebuild lookup
    this._rebuildLookup();
    this._notifyChange();
  }

  /**
   * Activate or deactivate event listeners.
   * Note: Listeners are always attached to window, but events are filtered
   * based on whether the configured target contains the event target.
   */
  setActive(active: boolean): void {
    if (this._active === active) return;
    this._active = active;

    if (active) {
      // Always listen on window - we filter by target containment in handlers
      window.addEventListener('keydown', this._boundHandleKeyDown as EventListener);
      window.addEventListener('keyup', this._boundHandleKeyUp as EventListener);
      window.addEventListener('blur', this._boundHandleBlur);
      registerTarget(this.target, this);
    } else {
      window.removeEventListener('keydown', this._boundHandleKeyDown as EventListener);
      window.removeEventListener('keyup', this._boundHandleKeyUp as EventListener);
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
    this._sequences = [];
    this._sequenceBuffer = '';
  }

  /**
   * Register a sequence trigger. Fires handler when the typed sequence is detected.
   * Returns an unsubscribe function.
   *
   * @param sequence - The character sequence to match (e.g., "show me")
   * @param handler - Function called when sequence is matched
   * @param options - Optional configuration { timeout?: number }
   */
  sequence(sequence: string, handler: SequenceHandler, options?: { timeout?: number }): () => void {
    const id = ++this._sequenceIdCounter;
    const normalizedSequence = sequence.toLowerCase();
    const binding: SequenceBinding = { sequence: normalizedSequence, handler, id };

    // Check for sequence conflicts in development mode
    if (isDev) {
      const labelInfo = this.label ? ` in keymash "${this.label}"` : '';

      for (const existing of this._sequences) {
        // Check for exact duplicates
        if (existing.sequence === normalizedSequence) {
          reportConflict(
            `Duplicate sequence "${sequence}"${labelInfo}. ` +
              `New handler will also fire (both handlers will be called).`,
          );
        }
        // Check for prefix conflicts (one sequence is a prefix of another)
        else if (normalizedSequence.endsWith(existing.sequence)) {
          reportConflict(
            `Sequence conflict${labelInfo}: "${existing.sequence}" is a suffix of "${sequence}". ` +
              `The shorter sequence "${existing.sequence}" will fire first and may prevent the longer one.`,
          );
        } else if (existing.sequence.endsWith(normalizedSequence)) {
          reportConflict(
            `Sequence conflict${labelInfo}: "${sequence}" is a suffix of "${existing.sequence}". ` +
              `The shorter sequence "${sequence}" will fire first and may prevent the longer one.`,
          );
        }
      }
    }

    this._sequences.push(binding);

    if (options?.timeout !== undefined) {
      this._sequenceTimeout = options.timeout;
    }

    this._notifyChange();

    // Return unsubscribe function
    return () => {
      this._sequences = this._sequences.filter((s) => s.id !== id);
      this._notifyChange();
    };
  }

  /**
   * Check if any registered sequences match the current buffer.
   */
  private _checkSequences(key: string): void {
    // Only track single printable characters for sequences
    if (key.length !== 1) return;

    const now = Date.now();

    // Reset buffer if too much time has passed
    if (now - this._lastKeyTime > this._sequenceTimeout) {
      this._sequenceBuffer = '';
    }
    this._lastKeyTime = now;

    // Add key to buffer (lowercase for case-insensitive matching)
    this._sequenceBuffer += key.toLowerCase();

    // Keep buffer trimmed to longest sequence length + some margin
    const maxLen = Math.max(50, ...this._sequences.map((s) => s.sequence.length));
    if (this._sequenceBuffer.length > maxLen) {
      this._sequenceBuffer = this._sequenceBuffer.slice(-maxLen);
    }

    // Check all sequences
    for (const seq of this._sequences) {
      if (this._sequenceBuffer.endsWith(seq.sequence)) {
        // Reset buffer after match to prevent immediate re-triggering
        this._sequenceBuffer = '';
        seq.handler(seq.sequence, undefined, this);
        break; // Only fire first matching sequence
      }
    }
  }

  private _addBindings(bindings: Binding[]): void {
    for (const binding of bindings) {
      // Check for duplicate bindings in development mode
      if (isDev) {
        for (const [key] of explodeBinding(binding)) {
          const existing = this._lookup.get(key);
          if (existing) {
            const newComboText = comboToText(binding.combo);
            const existingComboText = comboToText(existing.combo);
            const labelInfo = this.label ? ` in keymash "${this.label}"` : '';
            reportConflict(
              `Duplicate binding for "${newComboText}"${labelInfo}. ` +
                `New binding will override existing binding for "${existingComboText}".`,
            );
          }
        }
      }

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
    for (const fn of this._changeListeners) {
      fn();
    }
  }

  private _getMask(k: string, offset: bigint, cache: NamedKeyMap): bigint {
    if (cache[k]) return cache[k];
    const mask = 1n << (BigInt(getBitPos(k)) + offset);
    cache[k] = mask;
    return mask;
  }

  /**
   * Check if this keymash should handle an event based on target containment.
   * Returns true if:
   * - target is window (global capture), or
   * - target is an element that contains the event target
   */
  private _shouldHandleEvent(e: KeyboardEvent): boolean {
    // Window target means capture all events
    if (this.target === window) return true;

    // For element targets, check if the event originated from within the target
    const eventTarget = e.target as Node | null;
    if (!eventTarget) return false;

    return (this.target as HTMLElement).contains(eventTarget);
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    // Only handle events for our target
    if (!this._shouldHandleEvent(e)) return;

    // Compute hold mask once
    let holdMask = 0n;
    for (const k of this._activeKeys) {
      holdMask |= this._getMask(k, HOLD_OFFSET, hold);
    }

    const pressMask = this._getMask(e.key, PRESS_OFFSET, press);
    const totalMask = holdMask | pressMask;
    const maskKey = totalMask.toString();

    // Check for exact binding first, then fall back to ANY binding
    let binding = this._lookup.get(maskKey);
    if (!binding) {
      // Check for catch-all press.ANY binding (with same hold modifiers)
      const anyMask = holdMask | ANY_PRESS;
      binding = this._lookup.get(anyMask.toString());
    }

    // Check sequences
    this._checkSequences(e.key);

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

    // Only add to activeKeys if still active
    // (handler may have called setActive(false) which cleared _activeKeys)
    if (this._active) {
      this._activeKeys.add(e.key);
    }
  }

  private _handleKeyUp(e: KeyboardEvent): void {
    // Only handle events for our target
    if (!this._shouldHandleEvent(e)) return;

    this._activeKeys.delete(e.key);
    if (this._onUpdate) {
      let holdMask = 0n;
      for (const k of this._activeKeys) {
        holdMask |= this._getMask(k, HOLD_OFFSET, hold);
      }
      this._onUpdate(holdMask);
    }
  }

  private _handleBlur(): void {
    this._activeKeys.clear();
    this._sequenceBuffer = '';
    if (this._onUpdate) this._onUpdate(0n);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Factory function to create a new Keymash instance.
 *
 * @param config - Optional configuration object
 * @returns A new Keymash instance
 * @category Core Exports
 * @example
 * ```typescript
 * import { keymash, ctrl, shift, press } from 'keymash';
 *
 * // Basic usage
 * const km = keymash();
 * km.bind(ctrl + press.s, () => save());
 * km.bind(ctrl + shift + press.p, () => commandPalette());
 *
 * // With configuration
 * const km2 = keymash({
 *   label: 'Editor',
 *   scope: document.getElementById('editor'),
 *   bindings: [
 *     { combo: ctrl + press.s, handler: () => save(), label: 'Save' }
 *   ]
 * });
 * ```
 */
export function keymash(config: KeymashConfig = {}): Keymash {
  return new Keymash(config);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets all active bindings from a target element or Keymash instance.
 * Returns an array of FullBindings with resolved properties and human-readable combo text.
 *
 * @param target - Target to get bindings from (defaults to window)
 * @returns Array of FullBinding objects with resolved properties
 * @category Core Exports
 * @example
 * ```typescript
 * import { getActiveBindings, keymash, ctrl, press } from 'keymash';
 *
 * const km = keymash();
 * km.bind({ combo: ctrl + press.s, handler: () => {}, label: 'Save' });
 *
 * // Get bindings from an instance
 * const bindings = getActiveBindings(km);
 * console.log(bindings[0].comboText); // "Control+s"
 * console.log(bindings[0].label); // "Save"
 *
 * // Get all bindings from window
 * const allBindings = getActiveBindings();
 * ```
 */
export function getActiveBindings(target?: Window | HTMLElement | Keymash): FullBinding[] {
  const results: FullBinding[] = [];

  if (target instanceof Keymash) {
    // Direct Keymash instance
    for (const binding of target.bindings) {
      results.push(toFullBinding(binding));
    }
  } else {
    // Window or HTMLElement - look up registered instances
    const scope = target ?? window;
    const instances = getKeymashInstances(scope);
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
