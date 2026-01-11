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

// Configuration for keymash() factory
export interface KeymashConfig {
  target?: HTMLElement | Window;
  bindings?: Binding[];
  toActivate?: KeyCombo;
  toDeactivate?: KeyCombo;
  label?: string;
}

// Public interface for Keymash instances
export interface IKeymash {
  label: string;
  target: HTMLElement | Window;
  bindings: Binding[];

  // Add bindings - multiple overloads
  bind(binding: Binding): void;
  bind(bindings: Binding[]): void;
  bind(combo: KeyCombo, handler: KeyComboHandler): void;

  unbind(combo: KeyCombo | KeyCombo[]): void;
  setActive(active: boolean): void;
  onChange(handler: () => void): () => void;
}

export interface KeyState {
  held: Set<string>;
}
