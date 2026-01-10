
import React, { useState, useEffect } from 'react';
import { hold, press, bind } from '../lib/keymash';

const KeyMashDemo: React.FC = () => {
  const [currentMask, setCurrentMask] = useState<bigint>(0n);
  const [logs, setLogs] = useState<{ id: number, text: string }[]>([]);

  const addLog = (text: string) => {
    setLogs(prev => [{ id: Date.now(), text }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    const unbind = bind(window as any, {
      [(hold.ctrl | press.t).toString()]: () => addLog('🚀 MATCH: Ctrl + T'),
      [(hold.ctrl | hold.shift | press.p).toString()]: () => addLog('✨ MATCH: Ctrl + Shift + P'),
      [(hold.alt | (press.ArrowUp | press.ArrowDown)).toString()]: () => addLog('↕️ MATCH: Alt + Arrow Key'),
      [(hold.ctrl | (press.o | press.k)).toString()]: () => addLog('🎹 MATCH: Ctrl + (O or K)'),
      [(press.Escape).toString()]: () => addLog('🚫 MATCH: Escape'),
    }, (mask) => setCurrentMask(mask));

    return unbind;
  }, []);

  // Visualizing the 512-bit space as a grid
  const renderBits = () => {
    const bits = [];
    // Just show a representative sample of the 512 bits to avoid DOM lag
    for (let i = 0; i < 128; i++) {
        const isSet = (currentMask & (1n << BigInt(i))) || (currentMask & (1n << BigInt(i + 256)));
        bits.push(
            <div 
                key={i} 
                className={`w-2 h-2 rounded-sm transition-all duration-75 ${isSet ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] scale-125' : 'bg-white/5'}`}
            />
        );
    }
    return bits;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-12">
            
            {/* Left side: Visualization */}
            <div className="flex-1 space-y-6">
                <div>
                    <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Bit-Field Resonance</h3>
                    <div className="grid grid-cols-16 gap-1">
                        {renderBits()}
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <div className="text-[10px] text-white/20 uppercase font-bold mb-2">Internal Representation (BigInt)</div>
                    <div className="mono text-xs text-purple-400 break-all bg-black/40 p-4 rounded-xl border border-white/5">
                        {currentMask.toString()}n
                    </div>
                </div>
            </div>

            {/* Right side: Log */}
            <div className="w-full md:w-64 flex flex-col">
                <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Detection Engine</h3>
                <div className="flex-1 bg-black/60 rounded-2xl border border-white/5 p-4 mono text-[11px] space-y-2 min-h-[200px]">
                    {logs.length === 0 && <div className="text-white/10 animate-pulse">Scanning for chords...</div>}
                    {logs.map(log => (
                        <div key={log.id} className="text-green-400 animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-white/20 mr-2">&gt;</span>{log.text}
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {/* Legend */}
        <div className="mt-8 flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white/20 border-t border-white/5 pt-6">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div> Hold State</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 shadow-[0_0_5px_purple] rounded-full"></div> Trigger Event</div>
            <div className="ml-auto italic">O(1) Pattern Matching Active</div>
        </div>
      </div>
    </div>
  );
};

export default KeyMashDemo;
