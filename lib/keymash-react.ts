/**
 * keymash/react - React bindings for keymash
 *
 * Provides a `useKeymash` hook for declarative keyboard binding in React components.
 *
 * @module keymash/react
 * @packageDocumentation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  HandlerContext,
  KeyCombo,
  KeyComboHandler,
  SequenceHandler,
  SequenceHandlerContext,
} from '../types';
import {
  getActiveBindings,
  getAllKeymashInstances,
  type Keymash,
  keymash,
  onGlobalChange,
  press,
} from './keymash';

export type {
  Binding,
  FullBinding,
  HandlerContext,
  KeyCombo,
  KeyComboHandler,
  SequenceHandler,
  SequenceHandlerContext,
} from '../types';
// Re-export everything from keymash for convenience
export {
  alt,
  cmd,
  code,
  ctrl,
  getActiveBindings,
  getAllKeymashInstances,
  hold,
  Keymash,
  key,
  keymash,
  meta,
  onGlobalChange,
  press,
  shift,
  win,
} from './keymash';

/**
 * Extended handler context for React bindings.
 * Includes `setResult` to trigger re-renders with custom state.
 *
 * @category Types
 */
export interface ReactHandlerContext<T = unknown> extends HandlerContext {
  /**
   * Set a result value that will be available in the hook's return.
   * Calling this triggers a re-render with the new result.
   */
  setResult: (value: T) => void;
}

/**
 * Handler function for React key combo bindings.
 * Receives extended context with `setResult` for triggering re-renders.
 *
 * @category Types
 */
export type ReactKeyComboHandler<T = unknown> = (context: ReactHandlerContext<T>) => void;

/**
 * Extended sequence handler context for React bindings.
 */
export interface ReactSequenceHandlerContext<T = unknown> extends SequenceHandlerContext {
  setResult: (value: T) => void;
}

/**
 * Handler function for React sequence bindings.
 */
export type ReactSequenceHandler<T = unknown> = (context: ReactSequenceHandlerContext<T>) => void;

/**
 * A binding configuration for React useKeymash hook.
 */
export interface ReactBinding<T = unknown> {
  /** The key combination (bigint bitmask) */
  combo: KeyCombo;
  /** Function to call when the combo is triggered */
  handler: ReactKeyComboHandler<T>;
  /** Human-readable label for the binding */
  label?: string;
  /** Delay in milliseconds before firing the handler */
  delay?: number;
  /** Whether to fire on key repeat */
  repeat?: boolean;
}

/**
 * A sequence binding configuration for useKeymash.
 */
export interface ReactSequenceBinding<T = unknown> {
  /** The character sequence to match (e.g., "show me") */
  sequence: string;
  /** Handler called when sequence is typed */
  handler: ReactSequenceHandler<T>;
  /** Timeout in ms before buffer resets (default: 1000) */
  timeout?: number;
}

/**
 * Information about which binding was triggered.
 */
export interface TriggeredBinding {
  /** The combo that was triggered */
  combo: KeyCombo;
  /** Human-readable combo text */
  comboText: string;
  /** The binding's label (if provided) */
  label: string;
  /** Timestamp when triggered */
  timestamp: number;
}

/**
 * Options for the useKeymash hook.
 */
export interface UseKeymashOptions<T = unknown> {
  /**
   * Element or ref to scope bindings to.
   * Events only fire when originating from within this element.
   * @default window
   */
  scope?: HTMLElement | Window | React.RefObject<HTMLElement | null>;

  /**
   * Bindings to register. Handlers receive `{ event, instance, setResult }`.
   * When bindings change, all are re-registered to ensure handlers stay current.
   */
  bindings?: ReactBinding<T>[];

  /**
   * Sequence triggers to register.
   */
  sequences?: ReactSequenceBinding<T>[];

  /**
   * Whether the keymash should be active (listening for keyboard events).
   *
   * **Default behavior:**
   * - `true` if `bindings` array is provided and non-empty
   * - `false` if no bindings are provided (you must call `setActive(true)` manually)
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
export interface UseKeymashReturn<T = unknown> {
  /**
   * The underlying Keymash instance.
   * Will be `null` on first render if using a ref-based scope.
   */
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
   * Information about the most recently triggered binding.
   * Resets to null after each render cycle.
   */
  triggered: TriggeredBinding | null;

  /**
   * The result value set by the most recent handler via `setResult`.
   * Use this to react to binding triggers in your component.
   */
  result: T | undefined;

  /**
   * Imperatively bind a key combo.
   * Prefer declarative bindings via options when possible.
   */
  bind: (binding: ReactBinding<T>) => void;

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
    handler: ReactSequenceHandler<T>,
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
 * Handlers receive `{ event, instance, setResult }`. Call `setResult(value)` to
 * trigger a re-render and make the value available via the `result` return property.
 *
 * @param options - Configuration options
 * @returns Object with instance, state, triggered info, and result
 *
 * @category React Hooks
 *
 * @example
 * ```tsx
 * import { useKeymash, ctrl, press } from 'keymash/react';
 *
 * function Editor() {
 *   const { result, triggered } = useKeymash({
 *     bindings: [
 *       {
 *         combo: ctrl + press.s,
 *         handler: ({ setResult }) => setResult({ action: 'save' }),
 *         label: 'Save',
 *       },
 *       {
 *         combo: ctrl + press.z,
 *         handler: ({ setResult }) => setResult({ action: 'undo' }),
 *         label: 'Undo',
 *       },
 *     ],
 *   });
 *
 *   useEffect(() => {
 *     if (result?.action === 'save') saveDocument();
 *     if (result?.action === 'undo') undoLastChange();
 *   }, [result]);
 *
 *   return <div>Last action: {triggered?.label}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Handlers can also just do work directly
 * useKeymash({
 *   bindings: [
 *     { combo: press.escape, handler: () => closeModal() },
 *   ],
 * });
 *
 * @example
 * Just one handler, minimal fuss
 * ```tsx
 * useKeymash(ctrl + press.s, () => save());
 * ```
 * ```
 */
export function useKeymash<T = unknown>(options?: UseKeymashOptions<T>): UseKeymashReturn<T>;
/**
 * Simple overload for a single key combo binding.
 * @param combo - The key combination to bind
 * @param handler - Function to call when the combo is triggered
 * @param options - Additional configuration options
 */
export function useKeymash<T = unknown>(
  combo: KeyCombo,
  handler: ReactKeyComboHandler<T>,
  options?: UseKeymashOptions<T>,
): UseKeymashReturn<T>;
export function useKeymash<T = unknown>(
  first: KeyCombo | UseKeymashOptions<T> = {},
  handlerOrOptions?: ReactKeyComboHandler<T> | UseKeymashOptions<T>,
  thirdOptions?: UseKeymashOptions<T>,
): UseKeymashReturn<T> {
  // Normalize arguments
  let options: UseKeymashOptions<T>;

  if (typeof first === 'bigint') {
    // Overload: useKeymash(combo, handler, options)
    const combo = first;
    const handler = handlerOrOptions as ReactKeyComboHandler<T>;
    const baseOptions = (thirdOptions ?? {}) as UseKeymashOptions<T>;

    options = {
      ...baseOptions,
      bindings: [{ combo, handler }, ...(baseOptions.bindings ?? [])],
    };
  } else {
    // Overload: useKeymash(options)
    options = first as UseKeymashOptions<T>;
  }

  const { scope, bindings, sequences, active, label, onUpdate } = options;

  // Store instance in state so changes trigger re-renders
  const [instance, setInstance] = useState<Keymash | null>(null);

  // Track current mask for visualizers
  const [currentMask, setCurrentMask] = useState<bigint>(0n);

  // Track active state
  const [isActive, setIsActiveState] = useState(false);

  // Track triggered binding and result
  const [triggered, setTriggered] = useState<TriggeredBinding | null>(null);
  const [result, setResult] = useState<T | undefined>(undefined);

  // Ref for setResult to avoid stale closures in handlers
  const setResultRef = useRef(setResult);
  setResultRef.current = setResult;

  // Ref for setTriggered
  const setTriggeredRef = useRef(setTriggered);
  setTriggeredRef.current = setTriggered;

  // Track resolved scope element in state to handle ref mounting.
  // Refs don't trigger re-renders when .current changes, so we need to sync
  // the actual element into state after each render.
  const [scopeElement, setScopeElement] = useState<HTMLElement | Window | null>(() => {
    if (!scope) return window;
    if ('current' in scope) return scope.current;
    return scope;
  });

  // Sync scope element after each render (handles ref mounting)
  useEffect(() => {
    let resolved: HTMLElement | Window | null;
    if (!scope) {
      resolved = window;
    } else if ('current' in scope) {
      resolved = scope.current;
    } else {
      resolved = scope;
    }

    if (resolved !== scopeElement) {
      setScopeElement(resolved);
    }
  });

  // Store onUpdate in a ref to avoid recreating instance when it changes
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  // Track if we've set initial active state (declared before effect that uses it in cleanup)
  const initialActiveSetRef = useRef(false);

  // Create instance on mount
  useEffect(() => {
    // Don't create instance until scope element is available
    if (!scopeElement) {
      return;
    }

    const km = keymash({
      scope: scopeElement,
      label,
    });

    setInstance(km);

    // Set up onUpdate handler using ref to always get latest callback
    km.onUpdate((mask) => {
      setCurrentMask(mask);
      onUpdateRef.current?.(mask);
    });

    return () => {
      km.destroy();
      setInstance(null);
      setIsActiveState(false);
      setCurrentMask(0n);
      initialActiveSetRef.current = false;
    };
  }, [scopeElement, label]);

  // Handle initial active state (only once when instance is created)
  useEffect(() => {
    if (!instance || initialActiveSetRef.current) return;
    initialActiveSetRef.current = true;

    // Determine initial active state: explicit active prop, or auto-activate if bindings provided
    const shouldBeActive = active ?? (bindings && bindings.length > 0);
    if (shouldBeActive) {
      instance.setActive(true);
      setIsActiveState(true);
    }
  }, [instance, active, bindings]);

  // Handle declarative bindings changes - rebind ALL when array changes
  useEffect(() => {
    if (!instance || !bindings) return;

    // Clear all existing bindings
    for (const binding of [...instance.bindings]) {
      instance.unbind(binding.combo);
    }

    // Add all bindings with wrapped handlers that include setResult
    for (const binding of bindings) {
      const wrappedHandler: KeyComboHandler = ({ event, instance: inst }) => {
        // Set triggered info
        setTriggeredRef.current({
          combo: binding.combo,
          comboText:
            getActiveBindings(inst as Keymash).find((b) => b.combo === binding.combo)?.comboText ??
            '',
          label: binding.label ?? '',
          timestamp: Date.now(),
        });

        // Call user's handler with extended context
        binding.handler({
          event,
          instance: inst,
          setResult: (value: T) => setResultRef.current(value),
        });
      };

      instance.bind({
        combo: binding.combo,
        handler: wrappedHandler,
        label: binding.label,
        delay: binding.delay,
        repeat: binding.repeat,
      });
    }
  }, [instance, bindings]);

  // Handle declarative sequences changes
  useEffect(() => {
    if (!instance || !sequences) return;

    const unsubscribers: Array<() => void> = [];

    for (const seq of sequences) {
      const wrappedHandler: SequenceHandler = ({ sequence: seqStr, instance: inst }) => {
        seq.handler({
          sequence: seqStr,
          instance: inst,
          setResult: (value: T) => setResultRef.current(value),
        });
      };

      const unsub = instance.sequence(seq.sequence, wrappedHandler, { timeout: seq.timeout });
      unsubscribers.push(unsub);
    }

    return () => {
      for (const unsub of unsubscribers) {
        unsub();
      }
    };
  }, [instance, sequences]);

  // Handle active prop changes
  useEffect(() => {
    if (!instance || active === undefined) return;

    instance.setActive(active);
    setIsActiveState(active);
  }, [instance, active]);

  // Stable setActive callback
  const setActiveCallback = useCallback(
    (value: boolean) => {
      if (instance) {
        instance.setActive(value);
        setIsActiveState(value);
      }
    },
    [instance],
  );

  // Stable bind callback
  const bind = useCallback(
    (binding: ReactBinding<T>) => {
      if (!instance) return;

      const wrappedHandler: KeyComboHandler = ({ event, instance: inst }) => {
        setTriggeredRef.current({
          combo: binding.combo,
          comboText:
            getActiveBindings(inst as Keymash).find((b) => b.combo === binding.combo)?.comboText ??
            '',
          label: binding.label ?? '',
          timestamp: Date.now(),
        });

        binding.handler({
          event,
          instance: inst,
          setResult: (value: T) => setResultRef.current(value),
        });
      };

      instance.bind({
        combo: binding.combo,
        handler: wrappedHandler,
        label: binding.label,
        delay: binding.delay,
        repeat: binding.repeat,
      });
    },
    [instance],
  );

  // Stable unbind callback
  const unbind = useCallback(
    (combo: KeyCombo) => {
      if (instance) {
        instance.unbind(combo);
      }
    },
    [instance],
  );

  // Stable sequence callback
  const sequenceCallback = useCallback(
    (seq: string, handler: ReactSequenceHandler<T>, opts?: { timeout?: number }) => {
      if (!instance) return () => {};

      const wrappedHandler: SequenceHandler = ({ sequence: seqStr, instance: inst }) => {
        handler({
          sequence: seqStr,
          instance: inst,
          setResult: (value: T) => setResultRef.current(value),
        });
      };

      return instance.sequence(seq, wrappedHandler, opts);
    },
    [instance],
  );

  // Stable getBindings callback
  const getBindings = useCallback(() => {
    return instance ? getActiveBindings(instance) : [];
  }, [instance]);

  // isKeyActive helper
  const isKeyActive = useCallback(
    (mask: bigint) => {
      return (currentMask & mask) !== 0n;
    },
    [currentMask],
  );

  return {
    instance,
    isActive,
    setActive: setActiveCallback,
    currentMask,
    isKeyActive,
    triggered,
    result,
    bind,
    unbind,
    sequence: sequenceCallback,
    getBindings,
  };
}

/**
 * Hook to get the current key state mask without registering bindings.
 *
 * Returns a bigint bitmask representing currently pressed keys. Use bitwise AND
 * with `hold.*` or `press.*` values to check specific key states. This hook
 * creates an internal keymash instance scoped to the provided element.
 *
 * Useful for components that only need to read key state (e.g., showing visual
 * indicators) without handling keyboard shortcuts.
 *
 * @param scope - Element, Window, or React ref to scope key listening to. Defaults to `window`.
 * @returns Current key state as a bigint bitmask
 *
 * @category React Hooks
 * @see {@link useKeymash} for registering keyboard shortcuts
 * @see {@link hold} for modifier key bitmasks
 * @see {@link press} for key press bitmasks
 *
 * @example
 * ```tsx
 * import { useKeyState, hold } from 'keymash/react';
 *
 * function KeyIndicator() {
 *   const mask = useKeyState();
 *   const isCtrl = (mask & hold.ctrl) !== 0n;
 *   return <span>{isCtrl ? 'Ctrl pressed' : 'Ctrl not pressed'}</span>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Scoped to a specific element
 * function ScopedIndicator() {
 *   const ref = useRef<HTMLDivElement>(null);
 *   const mask = useKeyState(ref);
 *   return <div ref={ref} tabIndex={0}>Focus me to track keys</div>;
 * }
 * ```
 */
export function useKeyState(
  scope?: HTMLElement | Window | React.RefObject<HTMLElement | null>,
): bigint {
  // Use press.any to listen to all key events and track state via onUpdate
  const { currentMask } = useKeymash({
    scope,
    bindings: [{ combo: press.any, handler: () => {} }],
  });
  return currentMask;
}

/**
 * Represents a binding from a specific keymash instance,
 * including metadata about the instance.
 */
export interface GlobalBinding {
  /** The keymash instance this binding belongs to */
  instance: Keymash;
  /** Label of the keymash instance (for grouping in UI) */
  instanceLabel: string;
  /** Whether the keymash instance is currently active */
  isActive: boolean;
  /** The key combo bitmask */
  combo: KeyCombo;
  /** Human-readable combo text (e.g., "ctrl+s") */
  comboText: string;
  /** Handler function for this binding */
  handler: KeyComboHandler;
  /** Optional label for this specific binding */
  label: string;
  /** Delay in ms before handler fires */
  delay: number;
  /** Whether this binding fires on key repeat */
  repeat: boolean;
}

/**
 * Hook to get all bindings from all keymash instances.
 * Useful for building keyboard shortcuts dialogs or help panels.
 *
 * @returns Array of GlobalBinding objects from all active keymash instances
 *
 * @category React Hooks
 *
 * @example
 * ```tsx
 * import { useKeymashBindings } from 'keymash/react';
 *
 * function KeyboardShortcutsDialog() {
 *   const bindings = useKeymashBindings();
 *
 *   return (
 *     <ul>
 *       {bindings.map((b, i) => (
 *         <li key={i}>
 *           <kbd>{b.comboText}</kbd> {b.label}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useKeymashBindings(): GlobalBinding[] {
  const [bindings, setBindings] = useState<GlobalBinding[]>([]);

  // Function to collect all bindings from all instances
  const collectBindings = useCallback(() => {
    const allBindings: GlobalBinding[] = [];
    const instances = getAllKeymashInstances();

    for (const inst of instances) {
      const instanceBindings = getActiveBindings(inst);
      const active = inst.isActive();
      const instanceLabel = inst.label;

      for (const binding of instanceBindings) {
        allBindings.push({
          instance: inst,
          instanceLabel,
          isActive: active,
          combo: binding.combo,
          comboText: binding.comboText,
          handler: binding.handler,
          label: binding.label,
          delay: binding.delay,
          repeat: binding.repeat,
        });
      }
    }

    return allBindings;
  }, []);

  // Initial collection and subscription
  useEffect(() => {
    // Collect initial bindings
    setBindings(collectBindings());

    // Subscribe to global changes
    const unsubscribe = onGlobalChange(() => {
      setBindings(collectBindings());
    });

    return unsubscribe;
  }, [collectBindings]);

  return bindings;
}
