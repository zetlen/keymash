import type React from 'react';
import CodeBlock from './components/CodeBlock';
import KeyMashDemo from './components/KeyMashDemo';

const App: React.FC = () => {
  const exampleCode = `import { keymash, hold, press } from "keymash";

const km = keymash({
  label: 'My App',
  bindings: [
    {
      combo: hold.ctrl + press.t,
      handler: () => console.log('New Tab'),
      label: 'New Tab'
    },
    // Use | for "OR" (alternatives)
    {
      combo: hold.ctrl + (press.o | press.k),
      handler: () => console.log('Search'),
      label: 'Search'
    }
  ]
});

// Dynamic binding - shorthand
km.bind(hold.ctrl + press.s, () => console.log('Save'));

// Dynamic binding - full object
km.bind({
  combo: hold.ctrl + press.n,
  handler: () => console.log('New'),
  label: 'New File'
});`;

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-100">
      <header className="pt-32 pb-24 px-8 md:px-16 border-b border-gray-100">
        <div className="max-w-7xl space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">KeyMash</h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl leading-relaxed">
            A type-safe, performance-oriented keyboard library for modern web applications.
          </p>
          <div className="pt-4 flex gap-4">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
              TypeScript
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
              ~1kb gzipped
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
              Zero Dependencies
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl px-8 md:px-16 py-24 space-y-32">
        <section className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-16 items-start">
          <div className="space-y-8 max-w-md">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Declarative Bindings</h2>
              <p className="text-gray-600 leading-relaxed">
                KeyMash uses standard JavaScript operators to define shortcuts. No parsing strings,
                no fuzzy matching, just bitwise logic that executes in constant time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Type Safe</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Full TypeScript support with autocomplete for all keys.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Constant Time</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Lookup complexity is O(1) regardless of chord complexity.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Standard Operators</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Use <code className="bg-gray-100 px-1 rounded">+</code> to combine keys and{' '}
                    <code className="bg-gray-100 px-1 rounded">|</code> for alternatives.
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
            <p className="text-gray-500">Focus the window to test the bindings.</p>
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
