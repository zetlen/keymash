
export type KeyHandler = (event: KeyboardEvent) => void;

export interface BindingMap {
  [key: string]: KeyHandler;
}

export type KeyBitmask = bigint;

export interface KeyState {
  held: Set<string>;
}
