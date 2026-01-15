# KeyMash

Keyboard shortcuts that just work. No string parsing. No modifier key bugs. No scope conflicts.

```typescript
import { keymash, ctrl, press } from 'keymash';

const km = keymash();
km.bind(ctrl + press.s, () => save());
```

## Install

```bash
npm install keymash
```

## Modules

<!-- MODULES_TABLE_START -->
| [`keymash`](https://zetlen.github.io/keymash/#usage) | Full library with sequences, introspection, and dev warnings | 2.86 KB |
| [`keymash/core`](https://zetlen.github.io/keymash/#usage) | Minimal core for basic keyboard bindings only | 1.07 KB |
| [`keymash/react`](https://zetlen.github.io/keymash/#react) | React hooks for declarative keyboard binding | 1.27 KB |
<!-- MODULES_TABLE_END -->

## Documentation

Full documentation, interactive demo, and API reference at **[zetlen.github.io/keymash](https://zetlen.github.io/keymash/)**.

## License

MIT
