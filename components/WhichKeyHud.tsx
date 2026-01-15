import type React from 'react';
import { useKeymashBindings } from '../lib/keymash-react';

interface WhichKeyHudProps {
  /** Filter to only show bindings from instances with this label */
  activeMode?: string;
  /** Whether the HUD is visible */
  visible?: boolean;
}

/**
 * A which-key.nvim style heads-up display that shows all currently active keybindings.
 * Displays at the bottom of the screen with the current mode's keybindings.
 */
const WhichKeyHud: React.FC<WhichKeyHudProps> = ({ activeMode, visible = true }) => {
  const allBindings = useKeymashBindings();

  // Filter bindings to only show active ones and optionally filter by mode
  const filteredBindings = allBindings.filter((b) => {
    if (!b.isActive) return false;
    if (activeMode && b.instanceLabel !== activeMode) return false;
    // Skip catch-all bindings (press.any)
    if (b.comboText === '' || b.comboText.includes('Key255')) return false;
    return true;
  });

  if (!visible || filteredBindings.length === 0) {
    return null;
  }

  // Group bindings by their modifier prefix for better organization
  const groupedBindings = filteredBindings.reduce(
    (acc, binding) => {
      const parts = binding.comboText.split('+');
      const modifier = parts.length > 1 ? parts.slice(0, -1).join('+') : 'none';
      if (!acc[modifier]) {
        acc[modifier] = [];
      }
      acc[modifier].push(binding);
      return acc;
    },
    {} as Record<string, typeof filteredBindings>,
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Mode indicator */}
        {activeMode && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mode</span>
            <span className="px-2 py-0.5 text-sm font-bold text-emerald-400 bg-emerald-900/50 rounded">
              {activeMode}
            </span>
          </div>
        )}

        {/* Keybindings grid */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {Object.entries(groupedBindings).map(([modifier, bindings]) => (
            <div key={modifier} className="flex flex-wrap gap-x-4 gap-y-1">
              {bindings.map((binding, idx) => (
                <div key={`${binding.comboText}-${idx}`} className="flex items-center gap-2">
                  <kbd className="px-2 py-1 text-xs font-mono font-bold text-amber-300 bg-gray-800 border border-gray-600 rounded shadow-sm min-w-[2rem] text-center">
                    {formatComboText(binding.comboText)}
                  </kbd>
                  <span className="text-sm text-gray-300">{binding.label || 'unnamed'}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Help hint */}
        <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-500">
          Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">?</kbd> for help
          {activeMode !== 'Global' && (
            <>
              {' '}
              | <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Esc</kbd> to exit
              mode
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Formats combo text for display (e.g., "ctrl+shift+a" -> "Ctrl+Shift+A")
 */
function formatComboText(text: string): string {
  return text
    .split('+')
    .map((part) => {
      // Handle special key names
      const keyName = part.toLowerCase();
      switch (keyName) {
        case 'ctrl':
          return 'Ctrl';
        case 'shift':
          return 'Shift';
        case 'alt':
          return 'Alt';
        case 'meta':
          return 'Cmd';
        case 'arrowup':
          return '\u2191';
        case 'arrowdown':
          return '\u2193';
        case 'arrowleft':
          return '\u2190';
        case 'arrowright':
          return '\u2192';
        case ' ':
          return 'Space';
        case 'escape':
          return 'Esc';
        default:
          return part.length === 1 ? part.toUpperCase() : part;
      }
    })
    .join('+');
}

export default WhichKeyHud;
