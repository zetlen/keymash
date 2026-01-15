import type React from 'react';
import CodeBlock from './components/CodeBlock';
import KeyMashDemo from './components/KeyMashDemo';

const App: React.FC = () => {
  const exampleCode = `import { keymash, ctrl, shift, press } from "keymash";

const km = keymash();

// Type-safe, autocompletes, catches typos at compile time
km.bind(ctrl + press.s, () => save());
km.bind(ctrl + shift + press.p, () => commandPalette());

// Want Ctrl+K or Ctrl+O to open search? Use |
km.bind(ctrl + (press.k | press.o), () => openSearch());

// With options
km.bind({
  combo: press.arrowdown,
  handler: () => scrollDown(),
  repeat: true,  // Fire on key repeat
  label: 'Scroll Down'
});`;

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-100">
      <header className="pt-32 pb-24 px-8 md:px-16 border-b border-gray-100">
        <div className="max-w-7xl space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">KeyMash</h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
            Keyboard shortcuts that just work. No string parsing. No modifier key bugs. No scope
            conflicts.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
              TypeScript-first
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
              ~2.6kb gzipped
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
              Zero dependencies
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl px-8 md:px-16 py-24 space-y-32">
        <section className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-16 items-start">
          <div className="space-y-8 max-w-md">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why KeyMash?</h2>
              <p className="text-gray-600 leading-relaxed">
                Other keyboard libraries make you write{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">"ctrl+shift+p"</code>{' '}
                and hope you got the casing right. KeyMash uses TypeScript operators that
                autocomplete.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">No String Parsing</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Type-safe operators. Autocomplete for all keys. Typos caught at compile time.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Arrow Keys That Work</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Captures events before browser scrolling. Your handlers fire first.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Modal UIs Made Simple</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Command palettes, vim-style modes, focus traps. Create instances and toggle
                    them.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Conflict Detection</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    In development, KeyMash warns you when bindings collide. No more mystery
                    debugging.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <CodeBlock code={exampleCode} />
          </div>
        </section>

        <section id="demo" className="py-10">
          <div className="mb-16 space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Interactive Demo</h2>
            <p className="text-gray-500 max-w-2xl">
              Type{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-mono text-sm">
                "show me"
              </code>{' '}
              to enter trapped mode. All keyboard input will be captured and visualized on the
              keyboard below. Press{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm">Esc</code> to
              exit.
            </p>
          </div>
          <KeyMashDemo />
        </section>
      </main>

      <footer className="py-12 px-8 md:px-16 border-t border-gray-100 bg-gray-50 text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} KeyMash. MIT License.</p>
      </footer>
    </div>
  );
};

export default App;
