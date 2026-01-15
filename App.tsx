import type React from 'react';
import CodeBlock from './components/CodeBlock';
import KeyMashDemo from './components/KeyMashDemo';

const App: React.FC = () => {
  const heroExample = `import { keymash, ctrl, shift, press } from "keymash";

const km = keymash();

// Type-safe, autocompletes, catches typos at compile time
km.bind(ctrl + press.s, () => save());
km.bind(ctrl + shift + press.p, () => commandPalette());

// Want Ctrl+K or Ctrl+O to open search? Use |
km.bind(ctrl + (press.k | press.o), () => openSearch());`;

  const basicBindingExample = `import { keymash, ctrl, shift, press } from 'keymash';

const km = keymash({
  bindings: [
    { combo: ctrl + press.s, handler: () => save(), label: 'Save' },
    { combo: ctrl + shift + press.p, handler: () => palette(), label: 'Command Palette' },
  ]
});`;

  const dynamicBindingExample = `// Shorthand
km.bind(ctrl + press.z, () => undo());

// With options
km.bind({
  combo: press.arrowdown,
  handler: ({ event }) => {
    event.preventDefault();
    scrollDown();
  },
  repeat: true,  // Fire on key repeat
  label: 'Scroll Down'
});`;

  const scopedExample = `const editor = document.getElementById('editor');
const editorKm = keymash({
  scope: editor,
  bindings: [
    { combo: ctrl + press.b, handler: () => bold() },
  ]
});
// Only active when focus is inside #editor`;

  const sequenceExample = `// Fire when user types "hello"
km.sequence('hello', () => {
  console.log('Hello triggered!');
});`;

  const modalExample = `const globalKm = keymash({ label: 'Global' });
const modalKm = keymash({ label: 'Modal' });

// Start modal inactive
modalKm.setActive(false);

// Toggle between them
globalKm.bind(ctrl + press.k, () => {
  globalKm.setActive(false);
  modalKm.setActive(true);
});

modalKm.bind(press.escape, () => {
  modalKm.setActive(false);
  globalKm.setActive(true);
});`;

  const catchAllExample = `// Trap all keys in modal mode
modalKm.bind({
  combo: press.any,
  handler: ({ event }) => event.preventDefault(),
});

// Specific bindings still take priority
modalKm.bind(press.escape, () => exit());`;

  const coreExample = `import { keymash, ctrl, press } from 'keymash/core';

// Same API, smaller bundle (~1kb)
const km = keymash();
km.bind(ctrl + press.s, () => save());`;

  const reactBasicExample = `import { useKeymash, ctrl, press, hold } from 'keymash/react';

function Editor() {
  const { isActive, isKeyActive, triggered } = useKeymash({
    label: 'Editor',
    bindings: [
      { combo: ctrl + press.s, handler: () => save(), label: 'Save' },
      { combo: ctrl + press.z, handler: () => undo(), label: 'Undo' },
    ],
  });

  return (
    <div>
      <span>Status: {isActive ? 'Active' : 'Inactive'}</span>
      <span>Ctrl held: {isKeyActive(hold.ctrl) ? 'Yes' : 'No'}</span>
      <span>Last action: {triggered?.label}</span>
    </div>
  );
}`;

  const reactHandlerExample = `function SaveIndicator() {
  const { result, triggered } = useKeymash<{ saved: boolean }>({
    bindings: [
      {
        combo: ctrl + press.s,
        handler: ({ event, setResult }) => {
          event.preventDefault();
          saveDocument();
          setResult({ saved: true });
        },
        label: 'Save',
      },
    ],
  });

  return (
    <div>
      {result?.saved && <span>Saved!</span>}
      {triggered && <span>Triggered: {triggered.comboText}</span>}
    </div>
  );
}`;

  const reactScopedExample = `function Modal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useKeymash({
    scope: containerRef,  // Only active when focus is inside container
    bindings: [
      { combo: press.escape, handler: () => closeModal() },
      { combo: press.j, handler: () => moveDown() },
      { combo: press.k, handler: () => moveUp() },
    ],
  });

  return <div ref={containerRef} tabIndex={-1}>Modal content</div>;
}`;

  const useKeymashBindingsExample = `import { useKeymashBindings } from 'keymash/react';

function ShortcutsDialog() {
  const bindings = useKeymashBindings();

  return (
    <ul>
      {bindings.map((b, i) => (
        <li key={i}>
          <kbd>{b.comboText}</kbd> {b.label}
          {!b.isActive && <span>(inactive)</span>}
        </li>
      ))}
    </ul>
  );
}`;

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-100">
      {/* Hero / About Section */}
      <header id="about" className="pt-32 pb-24 px-8 md:px-16 border-b border-gray-100">
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
        {/* Why KeyMash */}
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
            <CodeBlock code={heroExample} />
          </div>
        </section>

        {/* Modules Table */}
        {/* MODULES_SECTION_START */}
        <section className="py-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Modules</h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-2xl">
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="py-4 pr-8">
                    <a href="#usage" className="font-mono text-blue-600 hover:underline">
                      keymash
                    </a>
                  </td>
                  <td className="py-4 pr-8 text-gray-600">
                    Full library with sequences, introspection, and dev warnings
                  </td>
                  <td className="py-4 text-gray-500 font-mono text-sm whitespace-nowrap">
                    3.21 KB
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-4 pr-8">
                    <a href="#usage" className="font-mono text-blue-600 hover:underline">
                      keymash/core
                    </a>
                  </td>
                  <td className="py-4 pr-8 text-gray-600">
                    Minimal core for basic keyboard bindings only
                  </td>
                  <td className="py-4 text-gray-500 font-mono text-sm whitespace-nowrap">
                    1.07 KB
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-4 pr-8">
                    <a href="#react" className="font-mono text-blue-600 hover:underline">
                      keymash/react
                    </a>
                  </td>
                  <td className="py-4 pr-8 text-gray-600">
                    React hooks for declarative keyboard binding
                  </td>
                  <td className="py-4 text-gray-500 font-mono text-sm whitespace-nowrap">
                    1.49 KB
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        {/* MODULES_SECTION_END */}

        {/* Demo Section */}
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

        {/* Usage Section */}
        <section id="usage" className="py-10 space-y-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Usage</h2>
            <p className="text-gray-600 max-w-2xl">
              KeyMash provides a simple, type-safe API for keyboard bindings. Install and start
              binding shortcuts in minutes.
            </p>
          </div>

          {/* Installation */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Installation</h3>
            <CodeBlock
              code={`npm install keymash\n# or\npnpm add keymash\n# or\nyarn add keymash`}
            />
          </div>

          {/* Basic Binding */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Basic Binding</h3>
            <p className="text-gray-600">
              Create a keymash instance and define bindings with full type safety.
            </p>
            <CodeBlock code={basicBindingExample} />
          </div>

          {/* Dynamic Bindings */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Dynamic Bindings</h3>
            <p className="text-gray-600">
              Add and remove bindings at runtime. Handlers receive a context object with{' '}
              <code className="bg-gray-100 px-1 rounded">event</code> and{' '}
              <code className="bg-gray-100 px-1 rounded">instance</code>.
            </p>
            <CodeBlock code={dynamicBindingExample} />
          </div>

          {/* Scoped Bindings */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Scoped to an Element</h3>
            <p className="text-gray-600">
              Scope bindings to specific elements. Events only fire when focus is within the scope.
            </p>
            <CodeBlock code={scopedExample} />
          </div>

          {/* Sequences */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Sequence Triggers</h3>
            <p className="text-gray-600">
              Trigger handlers when users type a specific character sequence.
            </p>
            <CodeBlock code={sequenceExample} />
          </div>

          {/* Modal Pattern */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Modal UI Pattern</h3>
            <p className="text-gray-600">
              Create multiple keymash instances and toggle between them for modal interfaces like
              command palettes or vim-style modes.
            </p>
            <CodeBlock code={modalExample} />
          </div>

          {/* Catch-All */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Catch-All Binding</h3>
            <p className="text-gray-600">
              Use <code className="bg-gray-100 px-1 rounded">press.any</code> to trap all keyboard
              input. Specific bindings still take priority.
            </p>
            <CodeBlock code={catchAllExample} />
          </div>

          {/* Core Package */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Core Package (~1kb)</h3>
            <p className="text-gray-600">
              Need the smallest bundle? Use{' '}
              <code className="bg-gray-100 px-1 rounded">keymash/core</code> for just the
              essentials: type-safe keys, OR logic, catch-all bindings, and scoped instances.
              Missing from core: sequences, human-readable combo text, binding introspection, and
              dev mode warnings.
            </p>
            <CodeBlock code={coreExample} />
          </div>
        </section>

        {/* React Section */}
        <section id="react" className="py-10 space-y-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">React</h2>
            <p className="text-gray-600 max-w-2xl">
              The <code className="bg-gray-100 px-1 rounded">keymash/react</code> module provides
              hooks for declarative keyboard binding in React components.
            </p>
          </div>

          {/* useKeymash */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">useKeymash</h3>
            <p className="text-gray-600">
              The main hook. Returns instance state, key tracking utilities, and binding methods.
              Auto-activates when bindings are provided.
            </p>
            <CodeBlock code={reactBasicExample} />
          </div>

          {/* Handler Context */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Handler Context</h3>
            <p className="text-gray-600">
              React handlers receive{' '}
              <code className="bg-gray-100 px-1 rounded">{'{ event, instance, setResult }'}</code>.
              Call <code className="bg-gray-100 px-1 rounded">setResult</code> to trigger a
              re-render with custom state.
            </p>
            <CodeBlock code={reactHandlerExample} />
          </div>

          {/* Scoped to Element */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Scoped to Element</h3>
            <p className="text-gray-600">
              Pass a ref to scope bindings. Events only fire when focus is within the container.
            </p>
            <CodeBlock code={reactScopedExample} />
          </div>

          {/* useKeymashBindings */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">useKeymashBindings</h3>
            <p className="text-gray-600">
              Get all bindings from all keymash instances. Perfect for building keyboard shortcuts
              dialogs.
            </p>
            <CodeBlock code={useKeymashBindingsExample} />
          </div>

          {/* useKeyState */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">useKeyState</h3>
            <p className="text-gray-600">
              Simple hook that returns the current key state bitmask. Useful for keyboard
              visualizers.
            </p>
            <CodeBlock
              code={`import { useKeyState, hold, press } from 'keymash/react';

function KeyIndicator() {
  const mask = useKeyState();
  const ctrlPressed = (mask & hold.ctrl) !== 0n;
  return <span>Ctrl: {ctrlPressed ? 'pressed' : 'released'}</span>;
}`}
            />
          </div>
        </section>
      </main>

      <footer className="py-12 px-8 md:px-16 border-t border-gray-100 bg-gray-50 text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} KeyMash. MIT License.</p>
      </footer>
    </div>
  );
};

export default App;
