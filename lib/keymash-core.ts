/**
 * keymash/core - Lightweight keyboard binding (~1KB gzipped)
 *
 * A minimal version of keymash with just the essentials:
 * - Type-safe key constants (hold.*, press.*)
 * - OR logic for alternatives (press.a | press.b)
 * - Scope-based instances
 * - Catch-all bindings (press.any)
 *
 * Missing from core (use full keymash instead):
 * - Sequences (km.sequence('hello', handler))
 * - comboToText() / getActiveBindings()
 * - onUpdate() for visualizers
 * - onChange() for binding subscriptions
 * - Dev mode conflict detection
 *
 * @module keymash/core
 * @packageDocumentation
 */

import type { KeyCombo, NamedKeyMap } from '../types';

/** Handler for keyboard bindings in keymash/core */
export type CoreKeyComboHandler = (event: KeyboardEvent, keymash: Keymash) => void;

// =============================================================================
// BIT POSITION MAPPING
// =============================================================================

// Special keys with fixed bit positions (must match full keymash for compatibility)
const S: Record<string, number> = {
  ctrl: 1,
  shift: 2,
  alt: 3,
  meta: 4,
  escape: 7,
  enter: 9,
  ' ': 10,
  arrowup: 20,
  arrowdown: 21,
  arrowleft: 22,
  arrowright: 23,
};

// Alias -> canonical key (includes browser key names)
const A: Record<string, string> = {
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  space: ' ',
  // Browser sends these PascalCase names on keydown events
  control: 'ctrl',
};

const B = (k: string): number => {
  const l = k.toLowerCase(),
    c = A[l] ?? l;
  return S[c] ?? (c.length === 1 ? c.charCodeAt(0) : (c.charCodeAt(0) % 100) + 128);
};

// =============================================================================
// CONSTANTS
// =============================================================================

const H_OFF = 0n,
  P_OFF = 256n,
  P_MASK = ((1n << 256n) - 1n) << 256n,
  ANY_P = (1n << 255n) << 256n;

// =============================================================================
// LAZY KEY MASK GENERATION
// =============================================================================

const hc: Record<string, bigint> = { any: 1n << 255n };
const pc: Record<string, bigint> = { any: ANY_P };

const H = (k: string): bigint => {
  const l = k.toLowerCase(),
    c = A[l] ?? l;
  if (hc[c] === undefined) {
    hc[c] = 1n << (BigInt(B(c)) + H_OFF);
  }
  return hc[c];
};

const P = (k: string): bigint => {
  const l = k.toLowerCase(),
    c = A[l] ?? l;
  if (pc[c] === undefined) {
    pc[c] = 1n << (BigInt(B(c)) + P_OFF);
  }
  return pc[c];
};

/**
 * Object containing hold (modifier) key masks.
 * Keys are generated lazily on first access.
 *
 * @example
 * ```typescript
 * import { hold, press } from 'keymash/core';
 *
 * hold.ctrl + press.s  // Ctrl+S
 * hold.shift + hold.alt + press.delete  // Shift+Alt+Delete
 * ```
 */
export const hold = new Proxy({} as NamedKeyMap, { get: (_, k: string) => H(k) });

/**
 * Object containing press key masks.
 * Keys are generated lazily on first access.
 *
 * @example
 * ```typescript
 * import { press, ctrl } from 'keymash/core';
 *
 * press.a          // A key
 * press.escape     // Escape key
 * press.up         // Arrow up (alias for arrowup)
 * press.any        // Catch-all for any key
 * ctrl + press.s   // Ctrl+S
 * ```
 */
export const press = new Proxy({} as NamedKeyMap, { get: (_, k: string) => P(k) });

/** Shorthand for hold.ctrl */
export const ctrl = H('ctrl');
/** Shorthand for hold.shift */
export const shift = H('shift');
/** Shorthand for hold.alt */
export const alt = H('alt');
/** Shorthand for hold.meta */
export const meta = H('meta');
/** Shorthand for hold.meta (alias for Mac users) */
export const cmd = meta;

// =============================================================================
// OR-LOGIC EXPLOSION
// =============================================================================

// Explode OR'd bindings into individual lookup entries
const X = (c: KeyCombo, h: CoreKeyComboHandler): [string, CoreKeyComboHandler][] => {
  const r: [string, CoreKeyComboHandler][] = [],
    hm = c & ((1n << 256n) - 1n);
  let pm = (c & P_MASK) >> 256n,
    i = 0n,
    f = false;
  while (pm > 0n) {
    if (pm & 1n) {
      r.push([(hm | (1n << (i + 256n))).toString(), h]);
      f = true;
    }
    pm >>= 1n;
    i++;
  }
  return f ? r : [[c.toString(), h]];
};

// =============================================================================
// BINDING TYPE
// =============================================================================

/**
 * A keyboard binding configuration object.
 */
export interface CoreBinding {
  /** The key combination to bind */
  combo: KeyCombo;
  /** Handler function called when the combo is pressed */
  handler: CoreKeyComboHandler;
}

// =============================================================================
// KEYMASH CLASS
// =============================================================================

/**
 * Lightweight keyboard binding manager.
 *
 * @example
 * ```typescript
 * import { Keymash, ctrl, press } from 'keymash/core';
 *
 * const km = new Keymash();
 * km.bind(ctrl + press.s, (e) => {
 *   e.preventDefault();
 *   save();
 * });
 * km.setActive(true);
 *
 * // Later: cleanup
 * km.destroy();
 * ```
 */
export class Keymash {
  private _a = false;
  private _k = new Set<string>();
  private _l = new Map<string, CoreKeyComboHandler>();
  private _hd: (e: KeyboardEvent) => void;
  private _hu: (e: KeyboardEvent) => void;

  /**
   * Create a new Keymash instance.
   * @param scope - Element to scope bindings to (default: window)
   */
  constructor(private _t: HTMLElement | Window = window) {
    this._hd = this._d.bind(this);
    this._hu = this._up.bind(this);
  }

  /**
   * Add a keyboard binding.
   *
   * @example
   * ```typescript
   * // Simple binding
   * km.bind(ctrl + press.s, () => save());
   *
   * // With OR logic
   * km.bind(ctrl + (press.k | press.p), () => openPalette());
   *
   * // Object form
   * km.bind({ combo: press.escape, handler: () => close() });
   * ```
   */
  bind(c: KeyCombo | CoreBinding, h?: CoreKeyComboHandler): void {
    const combo = typeof c === 'bigint' ? c : c.combo;
    const handler = typeof c === 'bigint' ? (h as CoreKeyComboHandler) : c.handler;
    for (const [k, v] of X(combo, handler)) this._l.set(k, v);
  }

  /**
   * Remove a keyboard binding.
   * @param combo - The key combination to unbind
   */
  unbind(c: KeyCombo): void {
    for (const [k] of X(c, () => {})) this._l.delete(k);
  }

  /**
   * Enable or disable this keymash instance.
   * When disabled, no bindings will fire.
   */
  setActive(v: boolean): void {
    if (this._a === v) return;
    this._a = v;
    const w = window,
      m = v ? 'addEventListener' : 'removeEventListener';
    w[m]('keydown', this._hd as EventListener);
    w[m]('keyup', this._hu as EventListener);
    if (!v) this._k.clear();
  }

  /**
   * Check if this instance is active.
   */
  isActive(): boolean {
    return this._a;
  }

  /**
   * Destroy this instance and remove all listeners.
   */
  destroy(): void {
    this.setActive(false);
    this._l.clear();
  }

  private _d(e: KeyboardEvent): void {
    if (this._t !== window && !(this._t as HTMLElement).contains(e.target as Node)) return;
    let hm = 0n;
    for (const k of this._k) hm |= H(k);
    const tm = hm | P(e.key),
      h = this._l.get(tm.toString()) ?? this._l.get((hm | ANY_P).toString());
    if (this._k.has(e.key)) return;
    if (h) {
      e.preventDefault();
      h(e, this);
    }
    if (this._a) this._k.add(e.key);
  }

  private _up(e: KeyboardEvent): void {
    this._k.delete(e.key);
  }
}

/**
 * Create a new keymash instance.
 *
 * @param scope - Element to scope bindings to (default: window)
 * @returns A new Keymash instance
 *
 * @example
 * ```typescript
 * import { keymash, ctrl, press } from 'keymash/core';
 *
 * const km = keymash();
 * km.bind(ctrl + press.s, () => save());
 * km.setActive(true);
 * ```
 */
export const keymash = (scope?: HTMLElement | Window): Keymash => new Keymash(scope);
