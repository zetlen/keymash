
import React from 'react';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-6 mono text-sm overflow-x-auto">
      <pre className="text-gray-300">
        {code.split('\n').map((line, i) => (
          <div key={i} className="flex">
            <span className="text-gray-600 select-none w-8 mr-4 text-right">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ 
                __html: line
                    .replace(/bind|hold|press/g, '<span class="text-blue-400">$&</span>')
                    .replace(/&|\||\+/g, '<span class="text-purple-400">$&</span>')
                    .replace(/\(\)/g, '<span class="text-yellow-400">()</span>')
                    .replace(/'[^']*'/g, '<span class="text-green-400">$&</span>')
            }} />
          </div>
        ))}
      </pre>
    </div>
  );
};

export default CodeBlock;
