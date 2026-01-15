import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ctrl, hold, Keymash, keymash, press, shift } from './keymash-core';

describe('keymash/core', () => {
  describe('key constants', () => {
    it('should have modifier shorthands', () => {
      expect(ctrl).toBeDefined();
      expect(shift).toBeDefined();
      expect(typeof ctrl).toBe('bigint');
      expect(typeof shift).toBe('bigint');
    });

    it('should lazily generate key masks via Proxy', () => {
      expect(press.a).toBeDefined();
      expect(press.escape).toBeDefined();
      expect(hold.ctrl).toBe(ctrl);
      expect(typeof press.a).toBe('bigint');
    });

    it('should support aliases', () => {
      expect(press.up).toBe(press.arrowup);
      expect(press.down).toBe(press.arrowdown);
      expect(press.space).toBe(press[' ']);
    });

    it('should support press.any for catch-all', () => {
      expect(press.any).toBeDefined();
      expect(typeof press.any).toBe('bigint');
    });
  });

  describe('Keymash class', () => {
    let km: Keymash;

    beforeEach(() => {
      km = keymash();
    });

    afterEach(() => {
      km.destroy();
    });

    it('should create an instance', () => {
      expect(km).toBeInstanceOf(Keymash);
      expect(km.isActive()).toBe(false);
    });

    it('should activate and deactivate', () => {
      km.setActive(true);
      expect(km.isActive()).toBe(true);

      km.setActive(false);
      expect(km.isActive()).toBe(false);
    });

    it('should bind and fire handlers', () => {
      const handler = vi.fn();
      km.bind(press.a, handler);
      km.setActive(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle modifier combinations', () => {
      const handler = vi.fn();
      km.bind(ctrl + press.s, handler);
      km.setActive(true);

      // Press Ctrl first (browser reports 'Control' as the key)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true }));
      // Then S while Ctrl is held
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle OR logic', () => {
      const handler = vi.fn();
      km.bind(press.a | press.b, handler);
      km.setActive(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(handler).toHaveBeenCalledTimes(1);

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should handle press.any catch-all', () => {
      const handler = vi.fn();
      km.bind(press.any, handler);
      km.setActive(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      expect(handler).toHaveBeenCalledTimes(1);

      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'x' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' }));
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should unbind handlers', () => {
      const handler = vi.fn();
      km.bind(press.a, handler);
      km.setActive(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(handler).toHaveBeenCalledTimes(1);

      km.unbind(press.a);
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should accept object-style binding', () => {
      const handler = vi.fn();
      km.bind({ combo: press.escape, handler });
      km.setActive(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('scoped instances', () => {
    it('should only fire for events within scope', () => {
      const container = document.createElement('div');
      const outside = document.createElement('div');
      document.body.appendChild(container);
      document.body.appendChild(outside);

      const km = keymash(container);
      const handler = vi.fn();
      km.bind(press.a, handler);
      km.setActive(true);

      // Event from inside container
      const insideEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(insideEvent, 'target', { value: container });
      window.dispatchEvent(insideEvent);
      expect(handler).toHaveBeenCalledTimes(1);

      // Event from outside container
      const outsideEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      Object.defineProperty(outsideEvent, 'target', { value: outside });
      window.dispatchEvent(outsideEvent);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1

      km.destroy();
      document.body.removeChild(container);
      document.body.removeChild(outside);
    });
  });
});
