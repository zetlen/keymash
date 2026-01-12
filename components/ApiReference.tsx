import type React from 'react';
import CodeBlock from './CodeBlock';

interface ApiSectionProps {
  title: string;
  children: React.ReactNode;
}

const ApiSection: React.FC<ApiSectionProps> = ({ title, children }) => (
  <section className="mb-16">
    <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">{title}</h2>
    {children}
  </section>
);

interface ApiItemProps {
  name: string;
  signature?: string;
  description: string;
  params?: Array<{ name: string; type: string; description: string }>;
  returns?: string;
  example?: string;
}

const ApiItem: React.FC<ApiItemProps> = ({
  name,
  signature,
  description,
  params,
  returns,
  example,
}) => (
  <div className="mb-10 last:mb-0">
    <h3 className="text-lg font-semibold text-gray-900 mb-2 font-mono">{name}</h3>
    {signature && (
      <pre className="bg-gray-100 px-4 py-2 rounded text-sm text-gray-700 mb-3 overflow-x-auto">
        {signature}
      </pre>
    )}
    <p className="text-gray-600 mb-4">{description}</p>
    {params && params.length > 0 && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h4>
        <ul className="space-y-2">
          {params.map((param) => (
            <li key={param.name} className="text-sm">
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">{param.name}</code>
              <span className="text-gray-400 mx-2">:</span>
              <code className="text-gray-600">{param.type}</code>
              <span className="text-gray-500 ml-2">— {param.description}</span>
            </li>
          ))}
        </ul>
      </div>
    )}
    {returns && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Returns</h4>
        <p className="text-sm text-gray-600">{returns}</p>
      </div>
    )}
    {example && (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Example</h4>
        <CodeBlock code={example} />
      </div>
    )}
  </div>
);

const ApiReference: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="max-w-4xl mx-auto px-8 md:px-16 py-16">
        <header className="mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
          <p className="text-xl text-gray-500">Complete API documentation for KeyMash.</p>
        </header>

        <ApiSection title="Installation">
          <CodeBlock code={`npm install keymash\n# or\npnpm add keymash\n# or\nyarn add keymash`} />
        </ApiSection>

        <ApiSection title="Core Exports">
          <ApiItem
            name="keymash(config?)"
            signature="function keymash(config?: KeymashConfig): Keymash"
            description="Factory function to create a new Keymash instance."
            params={[
              {
                name: 'config',
                type: 'KeymashConfig',
                description: 'Optional configuration object',
              },
            ]}
            returns="A new Keymash instance"
            example={`import { keymash, hold, press } from 'keymash';

const km = keymash({
  label: 'My App',
  scope: document.getElementById('app'),
  bindings: [
    { combo: hold.ctrl + press.s, handler: () => save() }
  ]
});`}
          />

          <ApiItem
            name="hold"
            signature="const hold: Record<string, bigint>"
            description="Object containing hold (modifier) key masks. Use these for keys that should be held down as part of a chord."
            example={`// Common modifiers
hold.ctrl    // Control key
hold.shift   // Shift key
hold.alt     // Alt/Option key
hold.meta    // Meta/Command key

// Combine with + operator
const combo = hold.ctrl + hold.shift + press.p;`}
          />

          <ApiItem
            name="press"
            signature="const press: Record<string, bigint>"
            description="Object containing press key masks. Use these for the key that triggers the binding."
            example={`// Letters and numbers
press.a, press.z, press['1']

// Special keys
press.Enter, press.Escape, press.Space
press.ArrowUp, press.ArrowDown

// Function keys
press.F1, press.F12

// Catch-all (matches any key)
press.ANY`}
          />

          <ApiItem
            name="key(name)"
            signature="function key(name: string): { hold: bigint; press: bigint }"
            description="Helper for binding keys not in the standard set, like media keys."
            params={[
              { name: 'name', type: 'string', description: 'The key name (e.g., "MediaPlay")' },
            ]}
            returns="Object with hold and press bigint masks"
            example={`const { press: pressMedia } = key('MediaPlay');
km.bind(pressMedia, () => togglePlayback());`}
          />

          <ApiItem
            name="setConflictHandler(handler)"
            signature="function setConflictHandler(handler: ConflictHandler): void"
            description="Configure how keymash handles binding conflicts in development mode. Has no effect in production builds (tree-shaken)."
            params={[
              {
                name: 'handler',
                type: "'ignore' | 'warn' | 'error' | (message: string) => void",
                description: 'How to handle conflicts',
              },
            ]}
            example={`import { setConflictHandler } from 'keymash';

// Throw errors on conflicts (useful for tests)
setConflictHandler('error');

// Custom handler
setConflictHandler((msg) => myLogger.warn(msg));`}
          />

          <ApiItem
            name="getActiveBindings(target?)"
            signature="function getActiveBindings(target?: Window | HTMLElement | Keymash): FullBinding[]"
            description="Get all active bindings from a target element or Keymash instance."
            params={[
              {
                name: 'target',
                type: 'Window | HTMLElement | Keymash',
                description: 'Target to get bindings from (defaults to window)',
              },
            ]}
            returns="Array of FullBinding objects with resolved properties"
          />
        </ApiSection>

        <ApiSection title="Keymash Instance Methods">
          <ApiItem
            name="bind(combo, handler)"
            signature={`bind(combo: KeyCombo, handler: KeyComboHandler): void
bind(binding: Binding): void
bind(bindings: Binding[]): void`}
            description="Add keyboard bindings. Supports shorthand syntax or full binding objects."
            example={`// Shorthand
km.bind(hold.ctrl + press.s, () => save());

// Full binding object
km.bind({
  combo: hold.ctrl + press.n,
  handler: () => newFile(),
  label: 'New File',
  delay: 100,    // Delay before firing (ms)
  repeat: true   // Fire on key repeat
});

// OR combos (alternatives)
km.bind({
  combo: hold.ctrl + (press.o | press.k),
  handler: () => openSearch()
});`}
          />

          <ApiItem
            name="unbind(combo)"
            signature="unbind(combo: KeyCombo | KeyCombo[]): void"
            description="Remove binding(s) for the given combo(s)."
            example={`km.unbind(hold.ctrl + press.s);

// Remove multiple
km.unbind([
  hold.ctrl + press.c,
  hold.ctrl + press.v
]);`}
          />

          <ApiItem
            name="sequence(sequence, handler, options?)"
            signature="sequence(sequence: string, handler: SequenceHandler, options?: { timeout?: number }): () => void"
            description="Register a sequence trigger that fires when the user types a specific string."
            params={[
              { name: 'sequence', type: 'string', description: 'The character sequence to match' },
              {
                name: 'handler',
                type: 'SequenceHandler',
                description: 'Function called when sequence matches',
              },
              {
                name: 'options.timeout',
                type: 'number',
                description: 'Reset buffer after this many ms of inactivity (default: 1000)',
              },
            ]}
            returns="Unsubscribe function"
            example={`// Konami code
const unsubscribe = km.sequence('uuddlrlrba', () => {
  enableCheatMode();
});

// Clean up
unsubscribe();`}
          />

          <ApiItem
            name="setActive(active)"
            signature="setActive(active: boolean): void"
            description="Activate or deactivate the keymash instance. When inactive, no events are processed."
            example={`// Disable while modal is open
km.setActive(false);

// Re-enable
km.setActive(true);`}
          />

          <ApiItem
            name="isActive()"
            signature="isActive(): boolean"
            description="Check if the keymash instance is currently active."
          />

          <ApiItem
            name="onChange(handler)"
            signature="onChange(handler: () => void): () => void"
            description="Subscribe to changes (bindings added/removed, active state changed). Returns unsubscribe function."
            example={`const unsubscribe = km.onChange(() => {
  console.log('Bindings changed:', km.bindings);
});`}
          />

          <ApiItem
            name="onUpdate(callback)"
            signature="onUpdate(callback: (mask: bigint) => void): void"
            description="Set a callback for real-time key state updates. Useful for building keyboard visualizers."
            example={`km.onUpdate((mask) => {
  // mask contains the current hold + press state
  updateKeyboardVisualization(mask);
});`}
          />

          <ApiItem
            name="destroy()"
            signature="destroy(): void"
            description="Destroy the keymash instance, removing all event listeners and cleaning up resources."
          />
        </ApiSection>

        <ApiSection title="Instance Properties">
          <ApiItem
            name="scope"
            signature="scope: HTMLElement | Window"
            description="The scope element for this keymash. Events are captured at window level but only processed if they originate from within this element."
          />

          <ApiItem
            name="bindings"
            signature="bindings: Binding[]"
            description="Array of all registered bindings."
          />

          <ApiItem
            name="label"
            signature="label: string"
            description="Optional label for this instance (useful for debugging)."
          />
        </ApiSection>

        <ApiSection title="Types">
          <ApiItem
            name="KeymashConfig"
            signature={`interface KeymashConfig {
  scope?: HTMLElement | Window;  // Default: window
  bindings?: Binding[];
  label?: string;
}`}
            description="Configuration object for creating a Keymash instance."
          />

          <ApiItem
            name="Binding"
            signature={`interface Binding {
  combo: KeyCombo;           // The key combination (bigint)
  handler: KeyComboHandler;  // Function to call
  label?: string;            // Human-readable label
  delay?: number;            // Delay before firing (ms)
  repeat?: boolean;          // Fire on key repeat
}`}
            description="A keyboard binding configuration."
          />

          <ApiItem
            name="KeyCombo"
            signature="type KeyCombo = bigint"
            description="A key combination represented as a bigint bitmask. Create using hold and press objects with + and | operators."
          />

          <ApiItem
            name="KeyComboHandler"
            signature="type KeyComboHandler = (event?: KeyboardEvent, keymash?: IKeymash) => void"
            description="Handler function for key combos."
          />

          <ApiItem
            name="SequenceHandler"
            signature="type SequenceHandler = (sequence: string, event?: KeyboardEvent, keymash?: IKeymash) => void"
            description="Handler function for sequences."
          />

          <ApiItem
            name="ConflictHandler"
            signature="type ConflictHandler = 'ignore' | 'warn' | 'error' | ((message: string) => void)"
            description="Configuration for how binding conflicts are reported in development mode."
          />
        </ApiSection>

        <ApiSection title="How It Works">
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              KeyMash uses a 512-bit bigint space to represent key combinations:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>
                <strong>Bits 0-255:</strong> Hold state (modifier keys currently pressed)
              </li>
              <li>
                <strong>Bits 256-511:</strong> Press state (the key that triggered the event)
              </li>
            </ul>
            <p className="text-gray-600 mb-4">
              This design enables O(1) lookup regardless of chord complexity. When you use the{' '}
              <code className="bg-gray-100 px-1 rounded">|</code> operator for alternatives, KeyMash
              &quot;explodes&quot; the binding into separate lookup entries at registration time.
            </p>
            <CodeBlock
              code={`// This single binding:
km.bind({
  combo: hold.ctrl + (press.a | press.b | press.c),
  handler: myHandler
});

// Becomes three separate lookup entries internally:
// - Ctrl+A -> myHandler
// - Ctrl+B -> myHandler
// - Ctrl+C -> myHandler`}
            />
          </div>
        </ApiSection>
      </main>
    </div>
  );
};

export default ApiReference;
