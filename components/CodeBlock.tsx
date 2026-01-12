import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { dracula, CodeBlock as ReactCodeBlock } from 'react-code-blocks';

interface CodeBlockProps {
  code: string;
}

// Column breakpoints - Prettier only reformats at discrete widths
const BREAKPOINTS = [120, 100, 80, 60, 30] as const;

// Approximate character width in pixels for IBM Plex Mono at default size
const CHAR_WIDTH_PX = 8.5;

// Padding + line numbers
const CONTAINER_PADDING = 88;

// Get the appropriate breakpoint for a given container width
const getBreakpointForWidth = (containerWidth: number): number => {
  const availableCols = Math.floor((containerWidth - CONTAINER_PADDING) / CHAR_WIDTH_PX);
  for (const bp of BREAKPOINTS) {
    if (availableCols >= bp) return bp;
  }
  return BREAKPOINTS[BREAKPOINTS.length - 1];
};

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const currentColsRef = useRef<number | null>(null);
  const [formattedCode, setFormattedCode] = useState(code);
  const requestIdRef = useRef(0);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('../lib/prettier-worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (e) => {
      const { id, formatted, error } = e.data;
      if (id === requestIdRef.current && !error) {
        setFormattedCode(formatted.trim());
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // Format code via worker
  const formatCode = useCallback((codeToFormat: string, cols: number) => {
    if (!workerRef.current) return;

    requestIdRef.current += 1;
    workerRef.current.postMessage({
      id: requestIdRef.current,
      code: codeToFormat,
      printWidth: cols,
    });
  }, []);

  // Watch container width with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newCols = getBreakpointForWidth(entry.contentRect.width);

        // Only reformat when crossing a breakpoint
        if (newCols !== currentColsRef.current) {
          currentColsRef.current = newCols;
          formatCode(code, newCols);
        }
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [code, formatCode]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg shadow-lg border border-gray-800 overflow-hidden"
      style={{ fontFamily: 'IBM Plex Mono, monospace' }}
    >
      <ReactCodeBlock
        text={formattedCode}
        language="typescript"
        showLineNumbers={true}
        theme={dracula}
      />
    </div>
  );
};

export default CodeBlock;
