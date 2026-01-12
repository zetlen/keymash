import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Keymash } from '../lib/keymash';
import { hold, keymash, press } from '../lib/keymash';

const TRIGGER_PHRASE = 'show me';
const TRIGGER_CHARS = TRIGGER_PHRASE.split('').map((char, idx) => ({
  char,
  key: `trigger-${idx}-${char === ' ' ? 'space' : char}`,
}));

const KeyMashDemo: React.FC = () => {
  const [currentMask, setCurrentMask] = useState<bigint>(0n);
  const [logs, setLogs] = useState<
    { id: number; text: string; type: 'info' | 'action' | 'exit' }[]
  >([]);
  const [isTrapped, setIsTrapped] = useState(false);
  const [typedBuffer, setTypedBuffer] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const globalKmRef = useRef<Keymash | null>(null);
  const modalKmRef = useRef<Keymash | null>(null);

  const addLog = useCallback((text: string, type: 'info' | 'action' | 'exit' = 'info') => {
    setLogs((prev) => [{ id: Date.now(), text, type }, ...prev].slice(0, 12));
  }, []);

  const enterModalMode = useCallback(() => {
    setIsTrapped(true);
    setTypedBuffer('');
    addLog('TRAPPED! Focus is now captured.', 'action');
    addLog('Press Escape to exit. Try all the keys!', 'info');

    globalKmRef.current?.setActive(false);
    modalKmRef.current?.setActive(true);
    containerRef.current?.focus();
  }, [addLog]);

  const exitModalMode = useCallback(() => {
    setIsTrapped(false);
    setTypedBuffer('');
    addLog('Escaped! Back to normal mode.', 'exit');

    modalKmRef.current?.setActive(false);
    globalKmRef.current?.setActive(true);
  }, [addLog]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Track buffer for UI display (separate from sequence detection)
    let uiBuffer = '';

    // Global keymash - listens for the trigger phrase
    const globalKm = keymash({
      scope: window,
      label: 'Global (type "show me")',
    });
    globalKmRef.current = globalKm;

    // Use built-in sequence detection for trigger
    globalKm.sequence(TRIGGER_PHRASE, () => {
      uiBuffer = '';
      setTypedBuffer('');
      enterModalMode();
    });

    // Track typed characters for UI highlighting
    const chars = 'abcdefghijklmnopqrstuvwxyz ';
    for (const char of chars) {
      globalKm.bind(press[char], () => {
        uiBuffer += char;
        if (uiBuffer.length > TRIGGER_PHRASE.length) {
          uiBuffer = uiBuffer.slice(-TRIGGER_PHRASE.length);
        }
        setTypedBuffer(uiBuffer);
      });
    }

    // Modal keymash - scoped to the container for focus trapping
    const modalKm = keymash({
      scope: container,
      label: 'Modal Mode',
    });
    modalKmRef.current = modalKm;

    // Real-time key visualization
    modalKm.onUpdate((mask) => setCurrentMask(mask));

    // Exit with Escape
    modalKm.bind({
      combo: press.Escape,
      handler: (e) => {
        e?.preventDefault();
        exitModalMode();
      },
      label: 'Exit Modal',
    });

    // Some fun bindings to show in the log
    modalKm.bind({
      combo: hold.ctrl + press.t,
      handler: (e) => {
        e?.preventDefault();
        addLog('Ctrl+T - New tab (blocked!)', 'action');
      },
      label: 'New Tab',
    });

    modalKm.bind({
      combo: hold.ctrl + hold.shift + press.p,
      handler: (e) => {
        e?.preventDefault();
        addLog('Ctrl+Shift+P - Command palette!', 'action');
      },
      label: 'Command Palette',
    });

    modalKm.bind({
      combo: hold.alt + (press.ArrowUp | press.ArrowDown),
      handler: (e) => {
        e?.preventDefault();
        addLog('Alt+Arrow - Move line!', 'action');
      },
      label: 'Move Line',
      repeat: true,
    });

    // Arrow keys
    modalKm.bind({
      combo: press.ArrowUp,
      handler: (e) => {
        e?.preventDefault();
        addLog('↑ Arrow Up', 'action');
      },
      label: 'Up',
      repeat: true,
    });

    modalKm.bind({
      combo: press.ArrowDown,
      handler: (e) => {
        e?.preventDefault();
        addLog('↓ Arrow Down', 'action');
      },
      label: 'Down',
      repeat: true,
    });

    modalKm.bind({
      combo: press.ArrowLeft,
      handler: (e) => {
        e?.preventDefault();
        addLog('← Arrow Left', 'action');
      },
      label: 'Left',
      repeat: true,
    });

    modalKm.bind({
      combo: press.ArrowRight,
      handler: (e) => {
        e?.preventDefault();
        addLog('→ Arrow Right', 'action');
      },
      label: 'Right',
      repeat: true,
    });

    modalKm.bind({
      combo: press.Enter,
      handler: (e) => {
        e?.preventDefault();
        addLog('Enter - Confirmed!', 'action');
      },
      label: 'Confirm',
    });

    modalKm.bind({
      combo: press.Space,
      handler: (e) => {
        e?.preventDefault();
        addLog('Space - Toggle!', 'action');
      },
      label: 'Toggle',
    });

    // Vim-style navigation
    modalKm.bind({
      combo: press.h,
      handler: (e) => {
        e?.preventDefault();
        addLog('h (vim left)', 'action');
      },
      label: 'Vim Left',
      repeat: true,
    });

    modalKm.bind({
      combo: press.j,
      handler: (e) => {
        e?.preventDefault();
        addLog('j (vim down)', 'action');
      },
      label: 'Vim Down',
      repeat: true,
    });

    modalKm.bind({
      combo: press.k,
      handler: (e) => {
        e?.preventDefault();
        addLog('k (vim up)', 'action');
      },
      label: 'Vim Up',
      repeat: true,
    });

    modalKm.bind({
      combo: press.l,
      handler: (e) => {
        e?.preventDefault();
        addLog('l (vim right)', 'action');
      },
      label: 'Vim Right',
      repeat: true,
    });

    modalKm.bind({
      combo: hold.shift + press.g,
      handler: (e) => {
        e?.preventDefault();
        addLog('Shift+G - Go to end', 'action');
      },
      label: 'Go to End',
    });

    modalKm.bind({
      combo: press.g,
      handler: (e) => {
        e?.preventDefault();
        addLog('g - Go to start', 'action');
      },
      label: 'Go to Start',
    });

    // Catch-all to trap ALL unbound keyboard input
    modalKm.bind({
      combo: press.ANY,
      handler: (e) => {
        e?.preventDefault();
        // Silently trap - the keyboard visual shows what's pressed
      },
      label: 'Trap All Input',
    });

    // Modal starts inactive
    modalKm.setActive(false);

    // Global starts active
    globalKm.setActive(true);

    return () => {
      globalKm.destroy();
      modalKm.destroy();
    };
  }, [addLog, enterModalMode, exitModalMode]);

  const getIsActive = (mask: bigint) => {
    return (currentMask & mask) !== 0n;
  };

  // Calculate which letters of the trigger phrase are matched
  const getMatchedLetters = (): boolean[] => {
    const result = new Array(TRIGGER_PHRASE.length).fill(false);
    const buffer = typedBuffer.toLowerCase();

    // Find how many consecutive characters from the end of the buffer match the start of the phrase
    for (let matchLen = Math.min(buffer.length, TRIGGER_PHRASE.length); matchLen > 0; matchLen--) {
      const bufferEnd = buffer.slice(-matchLen);
      const phraseStart = TRIGGER_PHRASE.slice(0, matchLen);
      if (bufferEnd === phraseStart) {
        for (let i = 0; i < matchLen; i++) {
          result[i] = true;
        }
        break;
      }
    }
    return result;
  };

  const matchedLetters = getMatchedLetters();

  // Helper to get combined mask (Hold | Press) for a key
  const m = (key: string) => (hold[key] || 0n) | (press[key] || 0n);
  // Helper for dual-character keys (e.g. 1 and !)
  const d = (k1: string, k2: string) => m(k1) | m(k2);

  // Layout Configuration
  const U_SIZE = 44; // px per unit
  const GAP = 4; // px gap

  interface KeyDef {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    l: string;
    m: bigint;
  }

  const k = (x: number, y: number, w: number, l: string, m: bigint, h: number = 1): KeyDef => ({
    id: `${l}-${x}-${y}`,
    x,
    y,
    w,
    h,
    l,
    m,
  });

  const keys: KeyDef[] = [
    // --- Row 0 (Functions) ---
    k(0, 0, 1, 'Esc', m('Escape')),
    k(2, 0, 1, 'F1', m('F1')),
    k(3, 0, 1, 'F2', m('F2')),
    k(4, 0, 1, 'F3', m('F3')),
    k(5, 0, 1, 'F4', m('F4')),
    k(6.5, 0, 1, 'F5', m('F5')),
    k(7.5, 0, 1, 'F6', m('F6')),
    k(8.5, 0, 1, 'F7', m('F7')),
    k(9.5, 0, 1, 'F8', m('F8')),
    k(11, 0, 1, 'F9', m('F9')),
    k(12, 0, 1, 'F10', m('F10')),
    k(13, 0, 1, 'F11', m('F11')),
    k(14, 0, 1, 'F12', m('F12')),

    // --- Row 1 (Numbers) ---
    k(0, 1.25, 1, '`', d('`', '~')),
    k(1, 1.25, 1, '1', d('1', '!')),
    k(2, 1.25, 1, '2', d('2', '@')),
    k(3, 1.25, 1, '3', d('3', '#')),
    k(4, 1.25, 1, '4', d('4', '$')),
    k(5, 1.25, 1, '5', d('5', '%')),
    k(6, 1.25, 1, '6', d('6', '^')),
    k(7, 1.25, 1, '7', d('7', '&')),
    k(8, 1.25, 1, '8', d('8', '*')),
    k(9, 1.25, 1, '9', d('9', '(')),
    k(10, 1.25, 1, '0', d('0', ')')),
    k(11, 1.25, 1, '-', d('-', '_')),
    k(12, 1.25, 1, '=', d('=', '+')),
    k(13, 1.25, 2, 'Backspace', m('Backspace')),
    k(15.25, 1.25, 1, 'Del', m('Delete')), // Nav cluster start

    // --- Row 2 (Tab/QWERTY) ---
    k(0, 2.25, 1.5, 'Tab', m('Tab')),
    k(1.5, 2.25, 1, 'Q', m('q')),
    k(2.5, 2.25, 1, 'W', m('w')),
    k(3.5, 2.25, 1, 'E', m('e')),
    k(4.5, 2.25, 1, 'R', m('r')),
    k(5.5, 2.25, 1, 'T', m('t')),
    k(6.5, 2.25, 1, 'Y', m('y')),
    k(7.5, 2.25, 1, 'U', m('u')),
    k(8.5, 2.25, 1, 'I', m('i')),
    k(9.5, 2.25, 1, 'O', m('o')),
    k(10.5, 2.25, 1, 'P', m('p')),
    k(11.5, 2.25, 1, '[', d('[', '{')),
    k(12.5, 2.25, 1, ']', d(']', '}')),
    k(13.5, 2.25, 1.5, '\\', d('\\', '|')),
    k(15.25, 2.25, 1, 'PgUp', m('PageUp')),

    // --- Row 3 (Caps/ASDF) ---
    k(0, 3.25, 1.75, 'Caps', m('CapsLock')),
    k(1.75, 3.25, 1, 'A', m('a')),
    k(2.75, 3.25, 1, 'S', m('s')),
    k(3.75, 3.25, 1, 'D', m('d')),
    k(4.75, 3.25, 1, 'F', m('f')),
    k(5.75, 3.25, 1, 'G', m('g')),
    k(6.75, 3.25, 1, 'H', m('h')),
    k(7.75, 3.25, 1, 'J', m('j')),
    k(8.75, 3.25, 1, 'K', m('k')),
    k(9.75, 3.25, 1, 'L', m('l')),
    k(10.75, 3.25, 1, ';', d(';', ':')),
    k(11.75, 3.25, 1, "'", d("'", '"')),
    k(12.75, 3.25, 2.25, 'Enter', m('Enter')),
    k(15.25, 3.25, 1, 'PgDn', m('PageDown')),

    // --- Row 4 (Shift/ZXCV) ---
    k(0, 4.25, 2.25, 'Shift', m('Shift')),
    k(2.25, 4.25, 1, 'Z', m('z')),
    k(3.25, 4.25, 1, 'X', m('x')),
    k(4.25, 4.25, 1, 'C', m('c')),
    k(5.25, 4.25, 1, 'V', m('v')),
    k(6.25, 4.25, 1, 'B', m('b')),
    k(7.25, 4.25, 1, 'N', m('n')),
    k(8.25, 4.25, 1, 'M', m('m')),
    k(9.25, 4.25, 1, ',', d(',', '<')),
    k(10.25, 4.25, 1, '.', d('.', '>')),
    k(11.25, 4.25, 1, '/', d('/', '?')),
    k(12.25, 4.25, 1.75, 'Shift', m('Shift')),
    k(14.25, 4.25, 1, '↑', m('ArrowUp')),
    k(15.25, 4.25, 1, 'End', m('End')),

    // --- Row 5 (Mods) ---
    k(0, 5.25, 1.25, 'Ctrl', m('Control')),
    k(1.25, 5.25, 1.25, 'Win', m('Meta')),
    k(2.5, 5.25, 1.25, 'Alt', m('Alt')),
    k(3.75, 5.25, 6.25, '', m('Space')), // Spacebar
    k(10, 5.25, 1.25, 'Alt', m('Alt')),
    k(11.25, 5.25, 1, 'Fn', 0n), // Function key (usually hardware only)
    k(12.25, 5.25, 1, 'Ctrl', m('Control')),
    k(13.25, 5.25, 1, '←', m('ArrowLeft')),
    k(14.25, 5.25, 1, '↓', m('ArrowDown')),
    k(15.25, 5.25, 1, '→', m('ArrowRight')),
  ];

  const CANVAS_WIDTH = 16.25 * U_SIZE + 16 * GAP;
  const CANVAS_HEIGHT = 6.25 * U_SIZE + 6 * GAP;

  return (
    <div className="w-full flex justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 overflow-x-auto">
        {/* Focus Container */}
        <div
          ref={containerRef}
          role="application"
          aria-label="Keyboard demo - type 'show me' to enter trapped mode"
          tabIndex={0}
          className="outline-none"
        >
          {/* Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`
                  w-3 h-3 rounded-full transition-colors duration-300
                  ${isTrapped ? 'bg-red-500 animate-pulse' : 'bg-green-500'}
                `}
              />
              <span className={`font-semibold ${isTrapped ? 'text-red-700' : 'text-gray-700'}`}>
                {isTrapped ? 'FOCUS TRAPPED' : 'Normal Mode'}
              </span>
            </div>
            {isTrapped ? (
              <kbd className="px-2 py-1 bg-white border border-red-200 rounded text-xs font-mono text-red-600 shadow-sm">
                Press ESC to exit
              </kbd>
            ) : (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">Type</span>
                <span className="font-mono tracking-wider">
                  {TRIGGER_CHARS.map(({ char, key }, i) => (
                    <span
                      key={key}
                      className={`
                        inline-block transition-all duration-150
                        ${matchedLetters[i] ? 'text-blue-600 font-bold scale-110' : 'text-gray-400'}
                        ${char === ' ' ? 'w-2' : ''}
                      `}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </span>
                <span className="text-gray-500">to trap focus</span>
              </div>
            )}
          </div>

          {/* Keyboard Container */}
          <div
            className={`
              relative rounded-2xl border mx-auto select-none transition-all duration-300
              ${
                isTrapped
                  ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                  : 'bg-gray-50 border-gray-100'
              }
            `}
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
            {keys.map((keyDef) => {
              const isActive = getIsActive(keyDef.m);
              return (
                <div
                  key={keyDef.id}
                  className={`
                    absolute flex items-center justify-center text-[10px] font-bold rounded-md transition-all duration-75
                    ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-inner translate-y-[1px]'
                        : isTrapped
                          ? 'bg-white text-gray-500 border-b-2 border-red-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                          : 'bg-white text-gray-500 border-b-2 border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    }
                  `}
                  style={{
                    left: keyDef.x * (U_SIZE + GAP) + GAP + 10,
                    top: keyDef.y * (U_SIZE + GAP) + GAP + 10,
                    width: keyDef.w * U_SIZE + (keyDef.w - 1) * GAP,
                    height: keyDef.h * U_SIZE + (keyDef.h - 1) * GAP,
                  }}
                >
                  {keyDef.l}
                </div>
              );
            })}
          </div>
        </div>

        {/* Logs */}
        <div className="border-t border-gray-100 mt-8 pt-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Event Log
          </h3>
          <div className="font-mono text-sm space-y-2 h-48 overflow-y-auto">
            {logs.length === 0 && (
              <div className="text-gray-300 italic">Type "show me" to enter trapped mode...</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3">
                <span
                  className={`
                    w-1.5 h-1.5 rounded-full shrink-0
                    ${log.type === 'action' ? 'bg-orange-500' : ''}
                    ${log.type === 'exit' ? 'bg-green-500' : ''}
                    ${log.type === 'info' ? 'bg-blue-500' : ''}
                  `}
                />
                <span
                  className={`
                    ${log.type === 'action' ? 'text-orange-700' : ''}
                    ${log.type === 'exit' ? 'text-green-700' : ''}
                    ${log.type === 'info' ? 'text-gray-600' : ''}
                  `}
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div className="border-t border-gray-100 mt-6 pt-6">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            How It Works
          </h3>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
            <code>{`// Global keymash with sequence detection
const globalKm = keymash({ scope: window });
globalKm.sequence('show me', () => enterTrapMode());

// Modal keymash traps ALL input
const modalKm = keymash({ scope: container });
modalKm.bind(press.Escape, exitTrapMode);
modalKm.bind(press.ANY, (e) => e?.preventDefault());

// Keyboard visualizer uses onUpdate
modalKm.onUpdate((mask) => {
  const isCtrlPressed = (mask & hold.ctrl) !== 0n;
  // Update UI based on real-time key state
});`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default KeyMashDemo;
