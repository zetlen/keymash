// @ts-expect-error URL imports work in browser module workers
import * as prettierPluginBabel from 'https://unpkg.com/prettier@3.6.2/plugins/babel.mjs';
// @ts-expect-error URL imports work in browser module workers
import * as prettierPluginEstree from 'https://unpkg.com/prettier@3.6.2/plugins/estree.mjs';
// @ts-expect-error URL imports work in browser module workers
import * as prettierPluginTypescript from 'https://unpkg.com/prettier@3.6.2/plugins/typescript.mjs';
// @ts-expect-error URL imports work in browser module workers
import { format } from 'https://unpkg.com/prettier@3.6.2/standalone.mjs';

self.onmessage = async (e: MessageEvent) => {
  const { id, code, printWidth } = e.data;

  try {
    const formatted = await format(code, {
      parser: 'typescript',
      plugins: [prettierPluginBabel, prettierPluginEstree, prettierPluginTypescript],
      printWidth: printWidth,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
    });

    self.postMessage({ id, formatted, error: null });
  } catch (error) {
    self.postMessage({ id, formatted: code, error: (error as Error).message });
  }
};
