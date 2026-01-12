// Core type aliases
export type KeyCombo = bigint;

// Handler type - can optionally receive event and keymash instance
export type KeyComboHandler = (event?: KeyboardEvent, keymash?: IKeymash) => void;

// Binding configuration - combo is part of the binding
export interface Binding {
  combo: KeyCombo;
  handler: KeyComboHandler;
  label?: string;
  delay?: number;
  repeat?: boolean;
}

// Full binding with all properties resolved and human-readable combo text
export interface FullBinding extends Required<Binding> {
  comboText: string;
}

// Sequence handler type
export type SequenceHandler = (sequence: string, event?: KeyboardEvent, keymash?: IKeymash) => void;

// Configuration for keymash() factory
export interface KeymashConfig {
  /**
   * The scope element for this keymash.
   * Events are captured at window level but only processed if the event
   * originated from within this element (or window for global capture).
   * @default window
   */
  scope?: HTMLElement | Window;
  /**
   * @deprecated Use `scope` instead. This will be removed in a future version.
   */
  target?: HTMLElement | Window;
  bindings?: Binding[];
  toActivate?: KeyCombo;
  toDeactivate?: KeyCombo;
  label?: string;
}

// Public interface for Keymash instances
export interface IKeymash {
  label: string;
  /**
   * The scope element for this keymash. Events are filtered by containment.
   * Alias: `target` (deprecated)
   */
  scope: HTMLElement | Window;
  /**
   * @deprecated Use `scope` instead.
   */
  target: HTMLElement | Window;
  bindings: Binding[];

  // Add bindings - multiple overloads
  bind(binding: Binding): void;
  bind(bindings: Binding[]): void;
  bind(combo: KeyCombo, handler: KeyComboHandler): void;

  unbind(combo: KeyCombo | KeyCombo[]): void;
  setActive(active: boolean): void;
  onChange(handler: () => void): () => void;

  /**
   * Register a sequence trigger. Fires handler when the typed sequence is detected.
   * Returns an unsubscribe function.
   */
  sequence(sequence: string, handler: SequenceHandler, options?: { timeout?: number }): () => void;
}

export interface KeyState {
  held: Set<string>;
}

/**
 * Handler for binding conflicts detected in development mode.
 * - 'ignore': Silently ignore conflicts
 * - 'warn': Log warnings to console (default)
 * - 'error': Throw an error on conflict
 * - function: Custom handler receives the conflict message
 */
export type ConflictHandler = 'ignore' | 'warn' | 'error' | ((message: string) => void);
