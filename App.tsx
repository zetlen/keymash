
import React from 'react';
import KeyMashDemo from './components/KeyMashDemo';
import CodeBlock from './components/CodeBlock';

const App: React.FC = () => {
  const exampleCode = `import { hold, press, bind } from "keymash";

bind(window, {
  // Use | to combine bits into a single chord mask
  [hold.ctrl | press.t]() { 
    console.log('Instant O(1) match!') 
  },
  
  // OR logic automatically expands at registration
  [hold.ctrl | (press.o | press.k)]() { 
    console.log('Triggered by either O or K!') 
  }
});`;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/40">
      <header className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter italic bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">
                KEYMASH<span className="text-purple-600">.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/40 font-light max-w-2xl mx-auto">
                Stop parsing strings. Start masking bits. The definitive keyboard library for the modern web.
            </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 space-y-32">
        
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Binary Composition</h2>
                <p className="text-white/50 leading-relaxed">
                    KeyMash maps every key to a unique bit in a 512-bit space. By using the <code className="text-purple-400">|</code> operator, you create a unique constant for any possible keyboard state.
                </p>
                <ul className="space-y-3 text-sm font-medium">
                    <li className="flex items-center gap-3"><span className="text-purple-500">✔</span> No string concatenation</li>
                    <li className="flex items-center gap-3"><span className="text-purple-500">✔</span> No array comparisons</li>
                    <li className="flex items-center gap-3"><span className="text-purple-500">✔</span> Constant time lookup</li>
                </ul>
            </div>
            <CodeBlock code={exampleCode} />
        </section>

        <section id="demo" className="py-20">
            <div className="text-center mb-12 space-y-4">
                <h2 className="text-4xl font-black uppercase italic tracking-widest">Live Lab</h2>
                <p className="text-white/30 text-sm">Focus this window and try the shortcuts from the code above.</p>
            </div>
            <KeyMashDemo />
        </section>

      </main>

      <footer className="py-24 text-center border-t border-white/5 mt-32">
        <p className="text-[10px] uppercase tracking-[0.5em] text-white/20 font-black">Performance is a Feature</p>
      </footer>
    </div>
  );
};

export default App;
