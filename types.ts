/** @internal */
type StringToUnion<S extends string> = S extends `${infer First}${infer Rest}`
  ? First | StringToUnion<Rest>
  : never;

/** @internal */
export type UnionToRequiredKeys<T extends string, U> = {
  [KeyName in T]-?: U;
};

type NumeralKey = StringToUnion<'1234567890'>;
export type NumeralKeyAlias = `num${NumeralKey}`;
type FKeyNum = Exclude<NumeralKey, '0'> | '10' | '11' | '12';
type BasicKey = StringToUnion<" `-=qwertyuiop[]asdfghjkl;'zxcvbnm,./\\"> | NumeralKey;
type FKey = `F${FKeyNum}`;
type SpecialKey =
  | 'ctrl'
  | 'shift'
  | 'alt'
  | 'meta'
  | 'capslock'
  | 'tab'
  | 'escape'
  | 'backspace'
  | 'enter'
  | 'arrowup'
  | 'arrowleft'
  | 'arrowdown'
  | 'arrowright';
export type KeyAlias =
  | NumeralKeyAlias
  | 'windows'
  | 'command'
  | 'up'
  | 'left'
  | 'down'
  | 'right'
  | 'space'
  | 'backtick'
  | 'dash'
  | 'equals'
  | 'leftsquarebracket'
  | 'rightsquarebracket'
  | 'semicolon'
  | 'apostrophe'
  | 'comma'
  | 'period'
  | 'slash'
  | 'backslash';

type AbstractKey = 'any';

export type NamedKey = BasicKey | SpecialKey | FKey | AbstractKey;
export type IntNamedKeyMap = UnionToRequiredKeys<NamedKey, number>;
export type NamedKeyMap = UnionToRequiredKeys<NamedKey | KeyAlias, bigint>;

/**
 * A key combination represented as a bigint bitmask.
 * Create using hold and press objects with + and | operators.
 *
 * @category Types
 * @example
 * ```typescript
 * import { hold, press, KeyCombo } from 'keymash';
 *
 * // Simple combo
 * const combo: KeyCombo = hold.ctrl + press.s;
 *
 * // Combo with alternatives (OR)
 * const searchCombo: KeyCombo = hold.ctrl + (press.k | press.f);
 * ```
 */
export type KeyCombo = bigint;

/**
 * Context object passed to key combo handlers.
 * Using an object parameter allows for future extensibility and cleaner destructuring.
 *
 * @category Types
 */
export interface HandlerContext {
  /** The keyboard event that triggered the binding */
  event: KeyboardEvent;
  /** The Keymash instance that triggered the binding */
  instance: IKeymash;
}

/**
 * Handler function for key combos. Called when a binding is triggered.
 * Receives a context object with the event and instance.
 *
 * @category Types
 * @example
 * ```typescript
 * // Destructure what you need
 * const handler: KeyComboHandler = ({ event, instance }) => {
 *   event.preventDefault();
 *   console.log('Triggered on', instance.label);
 * };
 *
 * // Or ignore context entirely
 * const simpleHandler: KeyComboHandler = () => save();
 * ```
 */
export type KeyComboHandler = (context: HandlerContext) => void;

/**
 * A keyboard binding configuration. Defines what key combination triggers
 * a handler and optional metadata.
 *
 * @category Types
 * @example
 * ```typescript
 * import { hold, press, Binding } from 'keymash';
 *
 * const saveBinding: Binding = {
 *   combo: hold.ctrl + press.s,
 *   handler: () => save(),
 *   label: 'Save',
 *   delay: 0,
 *   repeat: false
 * };
 * ```
 */
export interface Binding {
  /** The key combination (bigint bitmask) */
  combo: KeyCombo;
  /** Function to call when the combo is triggered */
  handler: KeyComboHandler;
  /** Human-readable label for the binding */
  label?: string;
  /** Delay in milliseconds before firing the handler */
  delay?: number;
  /** Whether to fire on key repeat */
  repeat?: boolean;
}

/**
 * A binding with all optional properties resolved to their default values,
 * plus a human-readable combo text string.
 *
 * @category Types
 */
export interface FullBinding extends Required<Binding> {
  /** Human-readable combo text (e.g., "ctrl+s") */
  comboText: string;
}

/**
 * Context object passed to sequence handlers.
 *
 * @category Types
 */
export interface SequenceHandlerContext {
  /** The matched sequence string */
  sequence: string;
  /** The Keymash instance that triggered the sequence */
  instance: IKeymash;
}

/**
 * Handler function for sequence triggers. Called when a typed sequence matches.
 * Receives a context object with the sequence and instance.
 *
 * @category Types
 * @example
 * ```typescript
 * const handler: SequenceHandler = ({ sequence, instance }) => {
 *   console.log(`Typed "${sequence}" on ${instance.label}`);
 * };
 * ```
 */
export type SequenceHandler = (context: SequenceHandlerContext) => void;

/**
 * Configuration object for creating a Keymash instance via the factory function.
 *
 * @category Types
 * @example
 * ```typescript
 * import { keymash, hold, press, KeymashConfig } from 'keymash';
 *
 * const config: KeymashConfig = {
 *   scope: document.getElementById('editor'),
 *   label: 'Editor Shortcuts',
 *   bindings: [
 *     { combo: hold.ctrl + press.s, handler: () => save() }
 *   ]
 * };
 *
 * const km = keymash(config);
 * ```
 */
export interface KeymashConfig {
  /**
   * The scope element for this keymash.
   * Events are captured at window level but only processed if the event
   * originated from within this element (or window for global capture).
   * @default window
   */
  scope?: HTMLElement | Window;
  /** Initial bindings to register */
  bindings?: Binding[];
  /** Combo to activate this keymash (not yet implemented) */
  toActivate?: KeyCombo;
  /** Combo to deactivate this keymash (not yet implemented) */
  toDeactivate?: KeyCombo;
  /** Human-readable label for debugging */
  label?: string;
}

/**
 * Public interface for Keymash instances. Describes all methods and properties
 * available on a Keymash instance.
 *
 * @category Types
 */
export interface IKeymash {
  /** Human-readable label for debugging */
  label: string;
  /**
   * The scope element for this keymash. Events are filtered by containment.
   */
  scope: HTMLElement | Window;
  /** Array of all registered bindings */
  bindings: Binding[];

  /**
   * Add keyboard bindings. Supports shorthand syntax or full binding objects.
   */
  bind(binding: Binding): void;
  bind(bindings: Binding[]): void;
  bind(combo: KeyCombo, handler: KeyComboHandler): void;

  /** Remove binding(s) for the given combo(s) */
  unbind(combo: KeyCombo | KeyCombo[]): void;
  /** Activate or deactivate event listeners */
  setActive(active: boolean): void;
  /** Subscribe to changes. Returns an unsubscribe function. */
  onChange(handler: () => void): () => void;

  /**
   * Register a sequence trigger. Fires handler when the typed sequence is detected.
   * Returns an unsubscribe function.
   */
  sequence(sequence: string, handler: SequenceHandler, options?: { timeout?: number }): () => void;

  /** Check if the keymash is currently active (listening for events) */
  isActive(): boolean;

  /**
   * Set a callback for real-time key state updates (for visualizers).
   * Called with the current bitmask whenever keys are pressed or released.
   */
  onUpdate(callback: (mask: bigint) => void): void;

  /** Destroy the keymash instance, removing all listeners */
  destroy(): void;
}

/**
 * Internal state tracking for currently held keys.
 *
 * @category Types
 */
export interface KeyState {
  /** Set of currently held key names */
  held: Set<string>;
}
