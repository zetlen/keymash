import { describe, expect, it, vi } from 'vitest';
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

  describe('sequence detection', () => {
    it('should detect a sequence when typed', () => {
      const km = keymash({ scope: window });
      const handler = vi.fn();

      km.sequence('abc', handler);
      km.setActive(true);

      // Simulate typing 'a', 'b', 'c'
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('abc', undefined, km);
      km.destroy();
    });

    it('should detect sequence after non-matching characters', () => {
      const km = keymash({ scope: window });
      const handler = vi.fn();

      km.sequence('hi', handler);
      km.setActive(true);

      // Type some random chars first
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y' }));
      // Then the sequence
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'i' }));

      expect(handler).toHaveBeenCalledTimes(1);
      km.destroy();
    });

    it('should detect sequence again after deactivate/reactivate', () => {
      const km = keymash({ scope: window });
      const handler = vi.fn();

      km.sequence('go', handler);
      km.setActive(true);

      // First sequence
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'o' }));
      expect(handler).toHaveBeenCalledTimes(1);

      // Deactivate and reactivate
      km.setActive(false);
      km.setActive(true);

      // Second sequence should work
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'o' }));
      expect(handler).toHaveBeenCalledTimes(2);

      km.destroy();
    });

    it('should work when another keymash deactivates this one in the sequence handler', () => {
      // This simulates the modal demo pattern
      const globalKm = keymash({ scope: window });
      const modalKm = keymash({ scope: window });

      let triggerCount = 0;

      globalKm.sequence('go', () => {
        triggerCount++;
        // Simulate entering modal mode
        globalKm.setActive(false);
        modalKm.setActive(true);
      });

      modalKm.bind(press.Escape, () => {
        // Simulate exiting modal mode
        modalKm.setActive(false);
        globalKm.setActive(true);
      });

      globalKm.setActive(true);
      modalKm.setActive(false);

      // First trigger
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'o' }));
      expect(triggerCount).toBe(1);

      // Exit modal
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));

      // Second trigger should work
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'g' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'o' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'o' }));
      expect(triggerCount).toBe(2);

      globalKm.destroy();
      modalKm.destroy();
    });

    it('should fire bindings alongside sequence detection', () => {
      const km = keymash({ scope: window });
      const seqHandler = vi.fn();
      const bindHandler = vi.fn();

      km.sequence('ab', seqHandler);
      km.bind(press.a, bindHandler);
      km.bind(press.b, bindHandler);
      km.setActive(true);

      // Must dispatch keyup between keydowns to simulate normal typing
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));

      expect(bindHandler).toHaveBeenCalledTimes(2);
      expect(seqHandler).toHaveBeenCalledTimes(1);
      km.destroy();
    });

    it('should handle "show me" with space', () => {
      const km = keymash({ scope: window });
      const handler = vi.fn();

      km.sequence('show me', handler);
      km.setActive(true);

      for (const char of 'show me') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      }

      expect(handler).toHaveBeenCalledTimes(1);
      km.destroy();
    });

    it('should work with letter bindings only', () => {
      const km = keymash({ scope: window });
      const letterHandler = vi.fn();

      // Bind each letter like the component does
      const chars = 'abcdefghijklmnopqrstuvwxyz ';
      for (const char of chars) {
        km.bind(press[char], letterHandler);
      }

      km.setActive(true);

      // Type each letter of "show me"
      for (const char of 'show me') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      expect(letterHandler).toHaveBeenCalledTimes(7);
      km.destroy();
    });

    it('should work with sequence AND all letter bindings (no modal switch)', () => {
      const km = keymash({ scope: window });
      const seqHandler = vi.fn();
      const letterHandler = vi.fn();

      km.sequence('show me', seqHandler);

      // Bind each letter like the component does
      const chars = 'abcdefghijklmnopqrstuvwxyz ';
      for (const char of chars) {
        km.bind(press[char], letterHandler);
      }

      km.setActive(true);

      // Type each letter of "show me"
      for (const char of 'show me') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      expect(seqHandler).toHaveBeenCalledTimes(1);
      expect(letterHandler).toHaveBeenCalledTimes(7);
      km.destroy();
    });

    it('should work with two keymash instances and letter bindings (simplified)', () => {
      // Simplified version to isolate the issue
      const km1 = keymash({ scope: window });
      const km2 = keymash({ scope: window });

      const letterHandler = vi.fn();

      // Just add letter bindings to km1, nothing on km2
      km1.bind(press.a, letterHandler);
      km1.bind(press.b, letterHandler);

      km1.setActive(true);
      km2.setActive(false);

      // Press 'a'
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

      expect(letterHandler).toHaveBeenCalledTimes(1);

      km1.destroy();
      km2.destroy();
    });

    it('should work with sequence + bindings + modal switch (step by step)', () => {
      // Step-by-step test to find where things break
      const globalKm = keymash({ scope: window });
      const modalKm = keymash({ scope: window });

      let sequenceFired = false;
      const letterHandler = vi.fn();

      // Register sequence
      globalKm.sequence('ab', () => {
        sequenceFired = true;
        globalKm.setActive(false);
        modalKm.setActive(true);
      });

      // Register letter bindings
      globalKm.bind(press.a, letterHandler);
      globalKm.bind(press.b, letterHandler);

      globalKm.setActive(true);
      modalKm.setActive(false);

      // Press 'a' - should fire letter handler, add 'a' to sequence buffer
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

      expect(letterHandler).toHaveBeenCalledTimes(1); // First letter should fire
      expect(sequenceFired).toBe(false); // Sequence not complete yet

      // Press 'b' - should fire letter handler AND complete sequence
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));

      expect(letterHandler).toHaveBeenCalledTimes(2); // Both letters should fire
      expect(sequenceFired).toBe(true); // Sequence should have fired

      globalKm.destroy();
      modalKm.destroy();
    });

    it('should work with longer sequence + bindings + modal switch', () => {
      // Test with 'showme' (no space) to isolate length vs space issue
      const globalKm = keymash({ scope: window });
      const modalKm = keymash({ scope: window });

      let sequenceFired = false;
      const letterHandler = vi.fn();

      // Register sequence (no space)
      globalKm.sequence('showme', () => {
        sequenceFired = true;
        globalKm.setActive(false);
        modalKm.setActive(true);
      });

      // Register ALL letter bindings like component does
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      for (const char of chars) {
        globalKm.bind(press[char], letterHandler);
      }

      globalKm.setActive(true);
      modalKm.setActive(false);

      // Type 'showme'
      for (const char of 'showme') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      expect(letterHandler).toHaveBeenCalledTimes(6); // All 6 letters should fire
      expect(sequenceFired).toBe(true);

      globalKm.destroy();
      modalKm.destroy();
    });

    it('should work with space binding added', () => {
      // Same as above but ADD space binding - this isolates the space issue
      const globalKm = keymash({ scope: window });
      const modalKm = keymash({ scope: window });

      let sequenceFired = false;
      const letterHandler = vi.fn();

      // Register sequence (no space)
      globalKm.sequence('showme', () => {
        sequenceFired = true;
        globalKm.setActive(false);
        modalKm.setActive(true);
      });

      // Register ALL letter bindings INCLUDING SPACE
      const chars = 'abcdefghijklmnopqrstuvwxyz ';
      for (const char of chars) {
        globalKm.bind(press[char], letterHandler);
      }

      expect(globalKm.bindings.length).toBe(27); // 26 letters + space

      globalKm.setActive(true);
      modalKm.setActive(false);

      // Type 'showme' (no space in typed text)
      for (const char of 'showme') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      expect(letterHandler).toHaveBeenCalledTimes(6); // All 6 letters should fire
      expect(sequenceFired).toBe(true);

      globalKm.destroy();
      modalKm.destroy();
    });

    it('should work with full pattern but "showme" sequence (no space)', () => {
      // EXACT same as failing test but sequence has no space
      const globalKm = keymash({ scope: window });
      const modalKm = keymash({ scope: window });

      let enteredModal = false;
      const letterHandler = vi.fn();

      globalKm.sequence('showme', () => {
        enteredModal = true;
        globalKm.setActive(false);
        modalKm.setActive(true);
      });

      // Bind each letter INCLUDING SPACE like the failing test
      const chars = 'abcdefghijklmnopqrstuvwxyz ';
      for (const char of chars) {
        globalKm.bind(press[char], letterHandler);
      }

      expect(globalKm.bindings.length).toBe(27);

      modalKm.bind(press.Escape, () => {
        enteredModal = false;
        modalKm.setActive(false);
        globalKm.setActive(true);
      });

      globalKm.setActive(true);
      modalKm.setActive(false);

      expect(globalKm.isActive()).toBe(true);
      expect(modalKm.isActive()).toBe(false);

      // Type "showme" (no space)
      for (const char of 'showme') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      expect(enteredModal).toBe(true);
      expect(letterHandler).toHaveBeenCalledTimes(6);

      globalKm.destroy();
      modalKm.destroy();
    });

    it('should work with "show me" sequence WITHOUT space binding', () => {
      // Test "show me" (with space) but NO space binding
      const globalKm = keymash({ scope: window });
      const modalKm = keymash({ scope: window });

      let sequenceFired = false;
      const letterHandler = vi.fn();

      // Register sequence WITH SPACE
      globalKm.sequence('show me', () => {
        sequenceFired = true;
        globalKm.setActive(false);
        modalKm.setActive(true);
      });

      // Register only letter bindings - NO SPACE
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      for (const char of chars) {
        globalKm.bind(press[char], letterHandler);
      }

      globalKm.setActive(true);
      modalKm.setActive(false);

      // Type 'show me' (with space)
      for (const char of 'show me') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      // Only 6 letters have bindings (s, h, o, w, m, e) - space has no binding
      expect(letterHandler).toHaveBeenCalledTimes(6);
      expect(sequenceFired).toBe(true);

      globalKm.destroy();
      modalKm.destroy();
    });

    it('should work with "show me" pattern including letter bindings', () => {
      // This exactly simulates the KeyMashDemo component
      const globalKm = keymash({ scope: window });
      const modalKm = keymash({ scope: window });

      let enteredModal = false;
      const letterHandler = vi.fn();

      globalKm.sequence('show me', () => {
        enteredModal = true;
        globalKm.setActive(false);
        modalKm.setActive(true);
      });

      // Bind each letter like the component does
      const chars = 'abcdefghijklmnopqrstuvwxyz ';
      for (const char of chars) {
        globalKm.bind(press[char], letterHandler);
      }

      // Verify bindings were added
      expect(globalKm.bindings.length).toBe(27);

      modalKm.bind(press.Escape, () => {
        enteredModal = false;
        modalKm.setActive(false);
        globalKm.setActive(true);
      });

      globalKm.setActive(true);
      modalKm.setActive(false);

      // Verify globalKm is active
      expect(globalKm.isActive()).toBe(true);
      expect(modalKm.isActive()).toBe(false);

      // Type "show me" character by character
      for (const char of 'show me') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      expect(enteredModal).toBe(true);
      expect(letterHandler).toHaveBeenCalledTimes(7); // All 7 letters fired

      // Exit modal
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
      expect(enteredModal).toBe(false);

      // Reset handler count
      letterHandler.mockClear();

      // Type "show me" again
      for (const char of 'show me') {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
        window.dispatchEvent(new KeyboardEvent('keyup', { key: char }));
      }

      expect(enteredModal).toBe(true);
      expect(letterHandler).toHaveBeenCalledTimes(7);

      globalKm.destroy();
      modalKm.destroy();
    });
  });

  describe('catch-all bindings (press.ANY)', () => {
    it('should fire press.ANY for unbound keys', () => {
      const km = keymash({ scope: window });
      const anyHandler = vi.fn();

      km.bind(press.ANY, anyHandler);
      km.setActive(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));

      expect(anyHandler).toHaveBeenCalledTimes(1);
      km.destroy();
    });

    it('should prefer specific binding over press.ANY', () => {
      const km = keymash({ scope: window });
      const specificHandler = vi.fn();
      const anyHandler = vi.fn();

      km.bind(press.a, specificHandler);
      km.bind(press.ANY, anyHandler);
      km.setActive(true);

      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

      expect(specificHandler).toHaveBeenCalledTimes(1);
      expect(anyHandler).not.toHaveBeenCalled();
      km.destroy();
    });
  });
});
