/**
 * keymash/react - React bindings for keymash
 *
 * Provides a `useKeymash` hook for declarative keyboard binding in React components.
 *
 * @module keymash/react
 * @packageDocumentation
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Binding, KeyCombo, KeyComboHandler, SequenceHandler } from '../types';
import { getActiveBindings, type Keymash, keymash } from './keymash';

export type { Binding, FullBinding, KeyCombo, KeyComboHandler, SequenceHandler } from '../types';
// Re-export everything from keymash for convenience
export {
  alt,
  cmd,
  ctrl,
  getActiveBindings,
  hold,
  Keymash,
  key,
  keymash,
  meta,
  press,
  shift,
  win,
} from './keymash';

/**
 * A sequence binding configuration for useKeymash.
 */
export interface SequenceBinding {
  /** The character sequence to match (e.g., "show me") */
  sequence: string;
  /** Handler called when sequence is typed */
  handler: SequenceHandler;
  /** Timeout in ms before buffer resets (default: 1000) */
  timeout?: number;
}

/**
 * Options for the useKeymash hook.
 */
export interface UseKeymashOptions {
  /**
   * Element or ref to scope bindings to.
   * Events only fire when originating from within this element.
   * @default window
   */
  scope?: HTMLElement | Window | React.RefObject<HTMLElement | null>;

  /**
   * Initial bindings to register.
   * Changes to this array will update bindings (compared by combo).
   */
  bindings?: Binding[];

  /**
   * Sequence triggers to register.
   */
  sequences?: SequenceBinding[];

  /**
   * Whether the keymash should be active.
   * @default true (if bindings provided) or false (if no bindings)
   */
  active?: boolean;

  /**
   * Human-readable label for debugging.
   */
  label?: string;

  /**
   * Callback for real-time key state updates.
   * Useful for building keyboard visualizers.
   */
  onUpdate?: (mask: bigint) => void;
}

/**
 * Return type for the useKeymash hook.
 */
export interface UseKeymashReturn {
  /** The underlying Keymash instance */
  instance: Keymash | null;

  /** Whether the keymash is currently active */
  isActive: boolean;

  /** Activate or deactivate the keymash */
  setActive: (active: boolean) => void;

  /** Current key state mask (for visualizers) */
  currentMask: bigint;

  /**
   * Check if a specific key/combo is currently pressed.
   * @example isKeyActive(hold.ctrl) or isKeyActive(press.a)
   */
  isKeyActive: (mask: bigint) => boolean;

  /**
   * Imperatively bind a key combo.
   * Prefer declarative bindings via options when possible.
   */
  bind: {
    (combo: KeyCombo, handler: KeyComboHandler): void;
    (binding: Binding): void;
  };

  /**
   * Imperatively unbind a key combo.
   */
  unbind: (combo: KeyCombo) => void;

  /**
   * Register a sequence trigger imperatively.
   * Returns an unsubscribe function.
   */
  sequence: (
    sequence: string,
    handler: SequenceHandler,
    options?: { timeout?: number },
  ) => () => void;

  /**
   * Get all active bindings from this instance.
   */
  getBindings: () => ReturnType<typeof getActiveBindings>;
}

/**
 * React hook for declarative keyboard bindings.
 *
 * @param options - Configuration options
 * @returns Object with instance, state, and methods
 *
 * @example
 * ```tsx
 * import { useKeymash, ctrl, press } from 'keymash/react';
 *
 * function MyComponent() {
 *   const { isActive, setActive } = useKeymash({
 *     bindings: [
 *       { combo: ctrl + press.s, handler: () => save(), label: 'Save' },
 *       { combo: ctrl + press.z, handler: () => undo(), label: 'Undo' },
 *     ],
 *   });
 *
 *   return <div>Shortcuts {isActive ? 'enabled' : 'disabled'}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Scoped to a specific element
 * function Modal() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useKeymash({
 *     scope: containerRef,
 *     bindings: [
 *       { combo: press.escape, handler: () => close() },
 *     ],
 *   });
 *
 *   return <div ref={containerRef}>Modal content</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With keyboard visualizer
 * function KeyboardVisualizer() {
 *   const { currentMask, isKeyActive } = useKeymash({
 *     bindings: [{ combo: press.any, handler: () => {} }],
 *   });
 *
 *   return (
 *     <div>
 *       Ctrl: {isKeyActive(hold.ctrl) ? 'pressed' : 'released'}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With sequences
 * function SecretMode() {
 *   const [secretEnabled, setSecretEnabled] = useState(false);
 *
 *   useKeymash({
 *     sequences: [
 *       { sequence: 'secret', handler: () => setSecretEnabled(true) },
 *     ],
 *   });
 *
 *   return secretEnabled ? <SecretPanel /> : null;
 * }
 * ```
 */
export function useKeymash(options: UseKeymashOptions = {}): UseKeymashReturn {
  const { scope, bindings, sequences, active, label, onUpdate } = options;

  // Track the keymash instance
  const instanceRef = useRef<Keymash | null>(null);

  // Track current mask for visualizers
  const [currentMask, setCurrentMask] = useState<bigint>(0n);

  // Track active state for external sync
  const [isActive, setIsActiveState] = useState(false);

  // Version counter for useSyncExternalStore
  const versionRef = useRef(0);

  // Resolve scope - handle refs, elements, and window
  const resolvedScope = useMemo(() => {
    if (!scope) return window;
    if ('current' in scope) return scope.current ?? window;
    return scope;
  }, [scope]);

  // Create or update instance
  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only recreating on scope/label change. Other deps (active, bindings, onUpdate, scope.current) are handled in separate effects.
  useEffect(() => {
    // Don't create instance until scope is resolved (for refs)
    if (scope && 'current' in scope && !scope.current) {
      return;
    }

    const km = keymash({
      scope: resolvedScope,
      label,
    });

    instanceRef.current = km;

    // Set up onUpdate handler
    km.onUpdate((mask) => {
      setCurrentMask(mask);
      onUpdate?.(mask);
    });

    // Determine initial active state
    const shouldBeActive = active ?? (bindings && bindings.length > 0);
    if (shouldBeActive) {
      km.setActive(true);
      setIsActiveState(true);
    }

    return () => {
      km.destroy();
      instanceRef.current = null;
      setIsActiveState(false);
      setCurrentMask(0n);
    };
  }, [resolvedScope, label]);

  // Sync onUpdate callback changes
  useEffect(() => {
    const km = instanceRef.current;
    if (!km) return;

    km.onUpdate((mask) => {
      setCurrentMask(mask);
      onUpdate?.(mask);
    });
  }, [onUpdate]);

  // Handle declarative bindings changes
  useEffect(() => {
    const km = instanceRef.current;
    if (!km || !bindings) return;

    // Get current combo strings
    const currentCombos = new Set(km.bindings.map((b) => b.combo.toString()));
    const newCombos = new Set(bindings.map((b) => b.combo.toString()));

    // Remove bindings that are no longer present
    for (const binding of km.bindings) {
      if (!newCombos.has(binding.combo.toString())) {
        km.unbind(binding.combo);
      }
    }

    // Add new bindings
    for (const binding of bindings) {
      if (!currentCombos.has(binding.combo.toString())) {
        km.bind(binding);
      }
    }

    versionRef.current++;
  }, [bindings]);

  // Handle declarative sequences changes
  useEffect(() => {
    const km = instanceRef.current;
    if (!km || !sequences) return;

    const unsubscribers: Array<() => void> = [];

    for (const seq of sequences) {
      const unsub = km.sequence(seq.sequence, seq.handler, { timeout: seq.timeout });
      unsubscribers.push(unsub);
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    };
  }, [sequences]);

  // Handle active prop changes
  useEffect(() => {
    const km = instanceRef.current;
    if (!km || active === undefined) return;

    km.setActive(active);
    setIsActiveState(active);
  }, [active]);

  // Stable setActive callback
  const setActive = useCallback((value: boolean) => {
    const km = instanceRef.current;
    if (km) {
      km.setActive(value);
      setIsActiveState(value);
    }
  }, []);

  // Stable bind callback
  const bind = useCallback((comboOrBinding: KeyCombo | Binding, handler?: KeyComboHandler) => {
    const km = instanceRef.current;
    if (!km) return;

    if (typeof comboOrBinding === 'bigint') {
      if (!handler)
        throw new Error('useKeymash: bind() requires a handler when called with a KeyCombo');
      km.bind(comboOrBinding, handler);
    } else {
      km.bind(comboOrBinding);
    }
    versionRef.current++;
  }, []);

  // Stable unbind callback
  const unbind = useCallback((combo: KeyCombo) => {
    const km = instanceRef.current;
    if (km) {
      km.unbind(combo);
      versionRef.current++;
    }
  }, []);

  // Stable sequence callback
  const sequence = useCallback(
    (seq: string, handler: SequenceHandler, opts?: { timeout?: number }) => {
      const km = instanceRef.current;
      if (!km) return () => {};
      return km.sequence(seq, handler, opts);
    },
    [],
  );

  // Stable getBindings callback
  const getBindings = useCallback(() => {
    const km = instanceRef.current;
    return km ? getActiveBindings(km) : [];
  }, []);

  // isKeyActive helper
  const isKeyActive = useCallback(
    (mask: bigint) => {
      return (currentMask & mask) !== 0n;
    },
    [currentMask],
  );

  return {
    instance: instanceRef.current,
    isActive,
    setActive,
    currentMask,
    isKeyActive,
    bind,
    unbind,
    sequence,
    getBindings,
  };
}

/**
 * Hook to get the current key state mask.
 * Useful for components that only need to read key state, not bind shortcuts.
 *
 * @param scope - Optional scope element or ref
 * @returns Current key state mask
 *
 * @example
 * ```tsx
 * function KeyIndicator() {
 *   const mask = useKeyState();
 *   const isCtrl = (mask & hold.ctrl) !== 0n;
 *   return <span>{isCtrl ? 'Ctrl pressed' : 'Ctrl not pressed'}</span>;
 * }
 * ```
 */
export function useKeyState(
  scope?: HTMLElement | Window | React.RefObject<HTMLElement | null>,
): bigint {
  const { currentMask } = useKeymash({ scope, bindings: [{ combo: 0n, handler: () => {} }] });
  return currentMask;
}
