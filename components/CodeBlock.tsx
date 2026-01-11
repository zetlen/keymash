
import React from 'react';
import { CodeBlock as ReactCodeBlock, dracula } from 'react-code-blocks';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  return (
    <div className="rounded-lg shadow-lg border border-gray-800 overflow-hidden" style={{ fontFamily: "IBM Plex Mono, monospace"}}>
      <ReactCodeBlock
        text={code}
        language="typescript"
        showLineNumbers={true}
        theme={dracula}
      />
    </div>
  );
};

export default CodeBlock;
