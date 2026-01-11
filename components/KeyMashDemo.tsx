
import React, { useState, useEffect } from 'react';
import { keymash, hold, press } from '../lib/keymash';

const KeyMashDemo: React.FC = () => {
  const [currentMask, setCurrentMask] = useState<bigint>(0n);
  const [logs, setLogs] = useState<{ id: number, text: string }[]>([]);

  const addLog = (text: string) => {
    setLogs(prev => [{ id: Date.now(), text }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    const km = keymash({
      label: 'Demo',
      bindings: [
        { combo: hold.ctrl + press.t, handler: () => addLog('Matched: Ctrl + T'), label: 'New Tab' },
        { combo: hold.ctrl + hold.shift + press.p, handler: () => addLog('Matched: Ctrl + Shift + P'), label: 'Command Palette' },
        { combo: hold.alt + (press.ArrowUp | press.ArrowDown), handler: () => addLog('Matched: Alt + Arrow Key'), label: 'Move Line' },
        { combo: hold.ctrl + (press.o | press.k), handler: () => addLog('Matched: Ctrl + (O or K)'), label: 'Quick Open' },
        { combo: press.Escape, handler: () => addLog('Matched: Escape'), label: 'Cancel' },
        { combo: press.Space, handler: () => addLog('Matched: Space'), label: 'Space' },
        { combo: press.Enter, handler: () => addLog('Matched: Enter'), label: 'Confirm' },
      ]
    });

    km.onUpdate((mask) => setCurrentMask(mask));

    return () => km.destroy();
  }, []);

  const getIsActive = (mask: bigint) => {
    return (currentMask & mask) !== 0n;
  };

  // Helper to get combined mask (Hold | Press) for a key
  const m = (key: string) => (hold[key] || 0n) | (press[key] || 0n);
  // Helper for dual-character keys (e.g. 1 and !)
  const d = (k1: string, k2: string) => m(k1) | m(k2);

  // Layout Configuration
  const U_SIZE = 44; // px per unit
  const GAP = 4; // px gap
  
  interface KeyDef {
    x: number;
    y: number;
    w: number;
    h?: number;
    l: string;
    m: bigint;
  }

  const k = (x: number, y: number, w: number, l: string, m: bigint, h: number = 1): KeyDef => ({ x, y, w, h, l, m });

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

  const CANVAS_WIDTH = (16.25 * U_SIZE) + (16 * GAP);
  const CANVAS_HEIGHT = (6.25 * U_SIZE) + (6 * GAP);

  return (
    <div className="w-full flex justify-center">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 overflow-x-auto">
        
        {/* Keyboard Container */}
        <div 
          className="relative bg-gray-50 rounded-2xl border border-gray-100 mx-auto select-none"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {keys.map((k, i) => {
            const isActive = getIsActive(k.m);
            return (
              <div
                key={i}
                className={`
                  absolute flex items-center justify-center text-[10px] font-bold rounded-md transition-all duration-75
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-inner translate-y-[1px]' 
                    : 'bg-white text-gray-500 border-b-2 border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'}
                `}
                style={{
                  left: k.x * (U_SIZE + GAP) + GAP + 10, // Added padding
                  top: k.y * (U_SIZE + GAP) + GAP + 10,
                  width: (k.w * U_SIZE) + ((k.w - 1) * GAP), 
                  height: (k.h! * U_SIZE) + ((k.h! - 1) * GAP),
                }}
              >
                {k.l}
              </div>
            );
          })}
        </div>

        {/* Logs */}
        <div className="border-t border-gray-100 mt-8 pt-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Event Log</h3>
            <div className="font-mono text-sm space-y-2 h-32 overflow-y-auto">
                {logs.length === 0 && <div className="text-gray-300 italic">Try pressing keys...</div>}
                {logs.map(log => (
                    <div key={log.id} className="flex items-center gap-3 text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {log.text}
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default KeyMashDemo;
