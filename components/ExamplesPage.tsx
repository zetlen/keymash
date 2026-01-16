import React, { useCallback, useRef, useState } from 'react';
import { ctrl, press, shift, useKeymash } from '../lib/keymash-react';
import WhichKeyHud from './WhichKeyHud';

type Mode = 'Global' | 'Move' | 'Scale' | 'Rotate' | 'Color';

interface SquareState {
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const ExamplesPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('Global');
  const [square, setSquare] = useState<SquareState>({
    x: 200,
    y: 150,
    size: 80,
    rotation: 0,
    color: COLORS[0],
  });
  const [lastAction, setLastAction] = useState<string>('');
  const [colorIndex, setColorIndex] = useState(0);

  // Movement helpers
  const moveSquare = useCallback((dx: number, dy: number) => {
    setSquare((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));
  }, []);

  const scaleSquare = useCallback((delta: number) => {
    setSquare((s) => ({ ...s, size: Math.max(20, Math.min(200, s.size + delta)) }));
  }, []);

  const rotateSquare = useCallback((delta: number) => {
    setSquare((s) => ({ ...s, rotation: s.rotation + delta }));
  }, []);

  const cycleColor = useCallback(
    (direction: number) => {
      const newIndex = (colorIndex + direction + COLORS.length) % COLORS.length;
      setColorIndex(newIndex);
      setSquare((s) => ({ ...s, color: COLORS[newIndex] }));
    },
    [colorIndex],
  );

  const resetSquare = useCallback(() => {
    setSquare({ x: 200, y: 150, size: 80, rotation: 0, color: COLORS[0] });
    setColorIndex(0);
    setLastAction('Reset to defaults');
  }, []);

  // Global mode keymash - always active to enter other modes
  const { setActive: setGlobalActive } = useKeymash({
    scope: containerRef,
    label: 'Global',
    active: mode === 'Global',
    bindings: [
      {
        combo: press.m,
        label: 'Enter Move mode',
        handler: () => {
          setMode('Move');
          setLastAction('Entered Move mode');
        },
      },
      {
        combo: press.s,
        label: 'Enter Scale mode',
        handler: () => {
          setMode('Scale');
          setLastAction('Entered Scale mode');
        },
      },
      {
        combo: press.r,
        label: 'Enter Rotate mode',
        handler: () => {
          setMode('Rotate');
          setLastAction('Entered Rotate mode');
        },
      },
      {
        combo: press.c,
        label: 'Enter Color mode',
        handler: () => {
          setMode('Color');
          setLastAction('Entered Color mode');
        },
      },
      {
        combo: ctrl + press.r,
        label: 'Reset square',
        handler: () => resetSquare(),
      },
      {
        combo: press['?'],
        label: 'Show help',
        handler: () => setLastAction('Press m/s/r/c to enter modes, Esc to exit'),
      },
    ],
  });

  // Move mode keymash
  const { setActive: setMoveActive } = useKeymash({
    scope: containerRef,
    label: 'Move',
    active: mode === 'Move',
    bindings: [
      {
        combo: press.escape,
        label: 'Exit to Global',
        handler: () => {
          setMode('Global');
          setLastAction('Returned to Global mode');
        },
      },
      {
        combo: press.up,
        label: 'Move up',
        repeat: true,
        handler: () => {
          moveSquare(0, -10);
          setLastAction('Moved up');
        },
      },
      {
        combo: press.down,
        label: 'Move down',
        repeat: true,
        handler: () => {
          moveSquare(0, 10);
          setLastAction('Moved down');
        },
      },
      {
        combo: press.left,
        label: 'Move left',
        repeat: true,
        handler: () => {
          moveSquare(-10, 0);
          setLastAction('Moved left');
        },
      },
      {
        combo: press.right,
        label: 'Move right',
        repeat: true,
        handler: () => {
          moveSquare(10, 0);
          setLastAction('Moved right');
        },
      },
      {
        combo: shift + press.up,
        label: 'Move up (fast)',
        repeat: true,
        handler: () => {
          moveSquare(0, -30);
          setLastAction('Moved up (fast)');
        },
      },
      {
        combo: shift + press.down,
        label: 'Move down (fast)',
        repeat: true,
        handler: () => {
          moveSquare(0, 30);
          setLastAction('Moved down (fast)');
        },
      },
      {
        combo: shift + press.left,
        label: 'Move left (fast)',
        repeat: true,
        handler: () => {
          moveSquare(-30, 0);
          setLastAction('Moved left (fast)');
        },
      },
      {
        combo: shift + press.right,
        label: 'Move right (fast)',
        repeat: true,
        handler: () => {
          moveSquare(30, 0);
          setLastAction('Moved right (fast)');
        },
      },
      {
        combo: press.h,
        label: 'Center horizontally',
        handler: () => {
          setSquare((s) => ({ ...s, x: 200 }));
          setLastAction('Centered horizontally');
        },
      },
      {
        combo: press.v,
        label: 'Center vertically',
        handler: () => {
          setSquare((s) => ({ ...s, y: 150 }));
          setLastAction('Centered vertically');
        },
      },
    ],
  });

  // Scale mode keymash
  const { setActive: setScaleActive } = useKeymash({
    scope: containerRef,
    label: 'Scale',
    active: mode === 'Scale',
    bindings: [
      {
        combo: press.escape,
        label: 'Exit to Global',
        handler: () => {
          setMode('Global');
          setLastAction('Returned to Global mode');
        },
      },
      {
        combo: press.up,
        label: 'Scale up',
        repeat: true,
        handler: () => {
          scaleSquare(5);
          setLastAction('Scaled up');
        },
      },
      {
        combo: press.down,
        label: 'Scale down',
        repeat: true,
        handler: () => {
          scaleSquare(-5);
          setLastAction('Scaled down');
        },
      },
      {
        combo: shift + press.up,
        label: 'Scale up (fast)',
        repeat: true,
        handler: () => {
          scaleSquare(15);
          setLastAction('Scaled up (fast)');
        },
      },
      {
        combo: shift + press.down,
        label: 'Scale down (fast)',
        repeat: true,
        handler: () => {
          scaleSquare(-15);
          setLastAction('Scaled down (fast)');
        },
      },
      {
        combo: press['1'],
        label: 'Set size: small',
        handler: () => {
          setSquare((s) => ({ ...s, size: 40 }));
          setLastAction('Set size: small');
        },
      },
      {
        combo: press['2'],
        label: 'Set size: medium',
        handler: () => {
          setSquare((s) => ({ ...s, size: 80 }));
          setLastAction('Set size: medium');
        },
      },
      {
        combo: press['3'],
        label: 'Set size: large',
        handler: () => {
          setSquare((s) => ({ ...s, size: 120 }));
          setLastAction('Set size: large');
        },
      },
    ],
  });

  // Rotate mode keymash
  const { setActive: setRotateActive } = useKeymash({
    scope: containerRef,
    label: 'Rotate',
    active: mode === 'Rotate',
    bindings: [
      {
        combo: press.escape,
        label: 'Exit to Global',
        handler: () => {
          setMode('Global');
          setLastAction('Returned to Global mode');
        },
      },
      {
        combo: press.left,
        label: 'Rotate CCW',
        repeat: true,
        handler: () => {
          rotateSquare(-15);
          setLastAction('Rotated counter-clockwise');
        },
      },
      {
        combo: press.right,
        label: 'Rotate CW',
        repeat: true,
        handler: () => {
          rotateSquare(15);
          setLastAction('Rotated clockwise');
        },
      },
      {
        combo: shift + press.left,
        label: 'Rotate CCW (fast)',
        repeat: true,
        handler: () => {
          rotateSquare(-45);
          setLastAction('Rotated counter-clockwise (fast)');
        },
      },
      {
        combo: shift + press.right,
        label: 'Rotate CW (fast)',
        repeat: true,
        handler: () => {
          rotateSquare(45);
          setLastAction('Rotated clockwise (fast)');
        },
      },
      {
        combo: press['0'],
        label: 'Reset rotation',
        handler: () => {
          setSquare((s) => ({ ...s, rotation: 0 }));
          setLastAction('Reset rotation to 0');
        },
      },
      {
        combo: press['9'],
        label: 'Set 90 degrees',
        handler: () => {
          setSquare((s) => ({ ...s, rotation: 90 }));
          setLastAction('Set rotation to 90\u00b0');
        },
      },
    ],
  });

  // Color mode keymash
  const { setActive: setColorActive } = useKeymash({
    scope: containerRef,
    label: 'Color',
    active: mode === 'Color',
    bindings: [
      {
        combo: press.escape,
        label: 'Exit to Global',
        handler: () => {
          setMode('Global');
          setLastAction('Returned to Global mode');
        },
      },
      {
        combo: press.left,
        label: 'Previous color',
        handler: () => {
          cycleColor(-1);
          setLastAction('Previous color');
        },
      },
      {
        combo: press.right,
        label: 'Next color',
        handler: () => {
          cycleColor(1);
          setLastAction('Next color');
        },
      },
      {
        combo: press['1'],
        label: 'Blue',
        handler: () => {
          setColorIndex(0);
          setSquare((s) => ({ ...s, color: COLORS[0] }));
          setLastAction('Set color: Blue');
        },
      },
      {
        combo: press['2'],
        label: 'Red',
        handler: () => {
          setColorIndex(1);
          setSquare((s) => ({ ...s, color: COLORS[1] }));
          setLastAction('Set color: Red');
        },
      },
      {
        combo: press['3'],
        label: 'Green',
        handler: () => {
          setColorIndex(2);
          setSquare((s) => ({ ...s, color: COLORS[2] }));
          setLastAction('Set color: Green');
        },
      },
      {
        combo: press['4'],
        label: 'Amber',
        handler: () => {
          setColorIndex(3);
          setSquare((s) => ({ ...s, color: COLORS[3] }));
          setLastAction('Set color: Amber');
        },
      },
      {
        combo: press['5'],
        label: 'Purple',
        handler: () => {
          setColorIndex(4);
          setSquare((s) => ({ ...s, color: COLORS[4] }));
          setLastAction('Set color: Purple');
        },
      },
      {
        combo: press['6'],
        label: 'Pink',
        handler: () => {
          setColorIndex(5);
          setSquare((s) => ({ ...s, color: COLORS[5] }));
          setLastAction('Set color: Pink');
        },
      },
    ],
  });

  // Sync mode changes to keymash instances
  React.useEffect(() => {
    setGlobalActive(mode === 'Global');
    setMoveActive(mode === 'Move');
    setScaleActive(mode === 'Scale');
    setRotateActive(mode === 'Rotate');
    setColorActive(mode === 'Color');
  }, [mode, setGlobalActive, setMoveActive, setScaleActive, setRotateActive, setColorActive]);

  const getModeColor = (m: Mode) => {
    switch (m) {
      case 'Move':
        return 'bg-blue-500';
      case 'Scale':
        return 'bg-emerald-500';
      case 'Rotate':
        return 'bg-amber-500';
      case 'Color':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-8">
          <h1 className="text-3xl font-bold text-gray-900">which-key Style Demo</h1>
          <p className="mt-2 text-gray-600">
            A modal keyboard interface inspired by{' '}
            <a
              href="https://github.com/folke/which-key.nvim"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              which-key.nvim
            </a>
            . Click the canvas and use the keyboard to interact with the square.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-8 py-8 pb-48">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Canvas */}
          <div className="lg:col-span-2">
            <div
              ref={containerRef}
              tabIndex={0}
              className="relative w-full h-[400px] bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {/* Mode indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getModeColor(mode)}`} />
                <span className="text-sm font-medium text-gray-700">{mode} Mode</span>
              </div>

              {/* Click to focus hint */}
              <div className="absolute top-4 right-4 text-xs text-gray-400">Click to focus</div>

              {/* The square */}
              <div
                className="absolute transition-all duration-75 rounded-lg shadow-lg"
                style={{
                  left: square.x,
                  top: square.y,
                  width: square.size,
                  height: square.size,
                  backgroundColor: square.color,
                  transform: `translate(-50%, -50%) rotate(${square.rotation}deg)`,
                }}
              />

              {/* Coordinates display */}
              <div className="absolute bottom-4 left-4 text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                x: {square.x} | y: {square.y} | size: {square.size} | rotation: {square.rotation}
                &deg;
              </div>
            </div>

            {/* Last action display */}
            {lastAction && (
              <div className="mt-4 p-3 bg-gray-800 text-gray-100 rounded-lg text-sm font-mono">
                <span className="text-gray-400">&gt; </span>
                {lastAction}
              </div>
            )}
          </div>

          {/* Instructions panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
              <p className="text-sm text-gray-600 mb-4">
                This demo showcases keymash&apos;s modal system. The HUD at the bottom shows all
                available keybindings for the current mode.
              </p>
              <div className="space-y-3">
                <ModeCard
                  mode="Global"
                  color="gray"
                  description="Default mode. Press a key to enter a sub-mode."
                  active={mode === 'Global'}
                />
                <ModeCard
                  mode="Move"
                  color="blue"
                  description="Arrow keys move the square."
                  active={mode === 'Move'}
                  shortcut="m"
                />
                <ModeCard
                  mode="Scale"
                  color="emerald"
                  description="Up/Down arrows resize the square."
                  active={mode === 'Scale'}
                  shortcut="s"
                />
                <ModeCard
                  mode="Rotate"
                  color="amber"
                  description="Left/Right arrows rotate the square."
                  active={mode === 'Rotate'}
                  shortcut="r"
                />
                <ModeCard
                  mode="Color"
                  color="purple"
                  description="Change the square's color."
                  active={mode === 'Color'}
                  shortcut="c"
                />
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Pro tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  <kbd className="px-1 bg-blue-200 rounded text-xs">Shift</kbd> + arrow for faster
                  movement
                </li>
                <li>
                  <kbd className="px-1 bg-blue-200 rounded text-xs">Esc</kbd> returns to Global mode
                </li>
                <li>
                  <kbd className="px-1 bg-blue-200 rounded text-xs">Ctrl+R</kbd> resets the square
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* WhichKey HUD at bottom */}
      <WhichKeyHud activeMode={mode} />
    </div>
  );
};

interface ModeCardProps {
  mode: string;
  color: string;
  description: string;
  active: boolean;
  shortcut?: string;
}

const ModeCard: React.FC<ModeCardProps> = ({ mode, color, description, active, shortcut }) => {
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 border-gray-300',
    blue: 'bg-blue-100 border-blue-300',
    emerald: 'bg-emerald-100 border-emerald-300',
    amber: 'bg-amber-100 border-amber-300',
    purple: 'bg-purple-100 border-purple-300',
  };

  const activeClasses: Record<string, string> = {
    gray: 'ring-2 ring-gray-500',
    blue: 'ring-2 ring-blue-500',
    emerald: 'ring-2 ring-emerald-500',
    amber: 'ring-2 ring-amber-500',
    purple: 'ring-2 ring-purple-500',
  };

  return (
    <div
      className={`p-3 rounded-lg border ${colorClasses[color]} ${active ? activeClasses[color] : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">{mode}</span>
        {shortcut && (
          <kbd className="px-2 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
            {shortcut}
          </kbd>
        )}
      </div>
      <p className="text-xs text-gray-600 mt-1">{description}</p>
    </div>
  );
};

export default ExamplesPage;
