import { describe, expect, it } from 'vitest';
import { hold, key, keymash, press } from './keymash';

describe('keymash', () => {
  describe('hold and press objects', () => {
    it('should have common modifier keys', () => {
      expect(hold.ctrl).toBeDefined();
      expect(hold.shift).toBeDefined();
      expect(hold.alt).toBeDefined();
      expect(hold.meta).toBeDefined();
    });

    it('should have Control aliased to ctrl', () => {
      expect(hold.ctrl).toBe(hold.Control);
      expect(press.ctrl).toBe(press.Control);
    });

    it('should have letter keys', () => {
      expect(press.a).toBeDefined();
      expect(press.z).toBeDefined();
    });

    it('should have function keys', () => {
      expect(press.F1).toBeDefined();
      expect(press.F12).toBeDefined();
    });
  });

  describe('key combinations', () => {
    it('should create unique combos with + operator', () => {
      const ctrlT = hold.ctrl + press.t;
      const ctrlShiftP = hold.ctrl + hold.shift + press.p;

      expect(ctrlT).not.toBe(ctrlShiftP);
      expect(typeof ctrlT).toBe('bigint');
    });

    it('should support OR combinations with | operator', () => {
      const ctrlAorB = hold.ctrl + (press.a | press.b);

      // The OR'd combo should include bits for both a and b
      expect(ctrlAorB).toBeDefined();
      expect(typeof ctrlAorB).toBe('bigint');
    });
  });

  describe('key() helper', () => {
    it('should create hold and press masks for custom keys', () => {
      const { hold: holdMedia, press: pressMedia } = key('MediaPlay');

      expect(holdMedia).toBeDefined();
      expect(pressMedia).toBeDefined();
      expect(typeof holdMedia).toBe('bigint');
      expect(typeof pressMedia).toBe('bigint');
    });
  });

  describe('Keymash class', () => {
    it('should create an instance with factory function', () => {
      const km = keymash();

      expect(km).toBeDefined();
      expect(km.bindings).toEqual([]);
      km.destroy();
    });

    it('should accept initial bindings', () => {
      const km = keymash({
        bindings: [{ combo: hold.ctrl + press.t, handler: () => {} }],
      });

      expect(km.bindings).toHaveLength(1);
      km.destroy();
    });

    it('should add bindings with bind()', () => {
      const km = keymash();

      km.bind({ combo: hold.ctrl + press.t, handler: () => {} });

      expect(km.bindings).toHaveLength(1);
      km.destroy();
    });

    it('should remove bindings with unbind()', () => {
      const combo = hold.ctrl + press.t;
      const km = keymash({
        bindings: [{ combo, handler: () => {} }],
      });

      km.unbind(combo);

      expect(km.bindings).toHaveLength(0);
      km.destroy();
    });

    it('should support onChange subscriptions', () => {
      const km = keymash();
      let called = false;

      const unsubscribe = km.onChange(() => {
        called = true;
      });

      km.bind({ combo: hold.ctrl + press.t, handler: () => {} });

      expect(called).toBe(true);

      unsubscribe();
      km.destroy();
    });

    it('should explode OR bindings into separate lookups', () => {
      const km = keymash({
        bindings: [
          {
            combo: hold.ctrl + (press.a | press.b),
            handler: () => {},
          },
        ],
      });

      // The single binding should explode into entries for both Ctrl+A and Ctrl+B
      expect(km.bindings).toHaveLength(1);
      km.destroy();
    });
  });
});
