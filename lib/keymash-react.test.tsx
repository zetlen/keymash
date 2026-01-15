import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ctrl, hold, press, useKeymash, useKeyState } from './keymash-react';

describe('keymash/react', () => {
  describe('useKeymash', () => {
    beforeEach(() => {
      // Clear any lingering key states by dispatching blur
      window.dispatchEvent(new Event('blur'));
    });

    afterEach(() => {
      vi.clearAllMocks();
      // Clear key states after each test
      window.dispatchEvent(new Event('blur'));
    });

    it('should create a keymash instance', () => {
      const { result } = renderHook(() => useKeymash());

      expect(result.current.instance).toBeDefined();
      expect(result.current.isActive).toBe(false);
    });

    it('should start active when bindings are provided', () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useKeymash({
          bindings: [{ combo: ctrl + press.s, handler }],
        }),
      );

      expect(result.current.isActive).toBe(true);
    });

    it('should respect active prop', () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useKeymash({
          bindings: [{ combo: ctrl + press.s, handler }],
          active: false,
        }),
      );

      expect(result.current.isActive).toBe(false);
    });

    it('should toggle active state with setActive', () => {
      const { result } = renderHook(() => useKeymash());

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.setActive(true);
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.setActive(false);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should fire handlers on key events', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeymash({
          bindings: [{ combo: press.a, handler }],
        }),
      );

      // Simulate keydown
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle modifier combinations', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeymash({
          bindings: [{ combo: ctrl + press.s, handler }],
        }),
      );

      // Press Ctrl first
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }));
      });

      // Then S while Ctrl is held
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should bind imperatively', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useKeymash());

      act(() => {
        result.current.setActive(true);
        result.current.bind(press.b, handler);
      });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should unbind imperatively', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useKeymash());

      // Bind imperatively (not declaratively, so unbind won't be overridden)
      act(() => {
        result.current.setActive(true);
        result.current.bind(press.c, handler);
      });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      });

      expect(handler).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.unbind(press.c);
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'c' }));
      });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      });

      // Should still be 1, not 2
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should track currentMask', () => {
      const { result } = renderHook(() =>
        useKeymash({
          bindings: [{ combo: press.any, handler: () => {} }],
        }),
      );

      expect(result.current.currentMask).toBe(0n);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
      });

      expect(result.current.currentMask).not.toBe(0n);
    });

    it('should check isKeyActive', () => {
      const { result } = renderHook(() =>
        useKeymash({
          bindings: [{ combo: press.any, handler: () => {} }],
        }),
      );

      expect(result.current.isKeyActive(press.e)).toBe(false);

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
      });

      expect(result.current.isKeyActive(press.e)).toBe(true);
    });

    it('should call onUpdate callback', () => {
      const onUpdate = vi.fn();
      renderHook(() =>
        useKeymash({
          bindings: [{ combo: press.any, handler: () => {} }],
          onUpdate,
        }),
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      });

      expect(onUpdate).toHaveBeenCalled();
    });

    it('should clean up on unmount', () => {
      const handler = vi.fn();
      const { unmount } = renderHook(() =>
        useKeymash({
          bindings: [{ combo: press.g, handler }],
        }),
      );

      unmount();

      // Dispatch event after unmount
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));

      // Handler should not be called since keymash was destroyed
      expect(handler).not.toHaveBeenCalled();
    });

    it('should get bindings', () => {
      const handler = vi.fn();
      const { result } = renderHook(() =>
        useKeymash({
          bindings: [{ combo: ctrl + press.h, handler, label: 'Test' }],
        }),
      );

      const bindings = result.current.getBindings();

      expect(bindings).toHaveLength(1);
      expect(bindings[0].label).toBe('Test');
    });

    it('should register sequences', () => {
      const handler = vi.fn();
      renderHook(() =>
        useKeymash({
          sequences: [{ sequence: 'hi', handler }],
          active: true,
        }),
      );

      // Type 'h' then 'i'
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'h' }));
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));
      });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support imperative sequence registration', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useKeymash());

      let unsub: () => void;
      act(() => {
        result.current.setActive(true);
        unsub = result.current.sequence('yo', handler);
      });

      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'y' }));
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
      });

      expect(handler).toHaveBeenCalledTimes(1);

      // Unsubscribe and verify it no longer fires
      act(() => {
        unsub();
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'o' }));
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: 'y' }));
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
      });

      // Should still be 1
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('useKeyState', () => {
    it('should return current mask', () => {
      const { result } = renderHook(() => useKeyState());

      expect(typeof result.current).toBe('bigint');
      expect(result.current).toBe(0n);
    });
  });

  describe('re-exports', () => {
    it('should re-export key helpers', () => {
      expect(ctrl).toBeDefined();
      expect(hold).toBeDefined();
      expect(press).toBeDefined();
    });
  });
});
