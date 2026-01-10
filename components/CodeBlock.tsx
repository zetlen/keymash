
import React from 'react';

interface CodeBlockProps {
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  return (
    <div className="bg-[#111] rounded-lg border border-white/10 p-4 mono text-sm overflow-x-auto">
      <pre className="text-blue-400">
        {code.split('\n').map((line, i) => (
          <div key={i} className="flex">
            <span className="text-white/20 select-none w-8 mr-4 text-right">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ 
                __html: line
                    .replace(/bind|hold|press/g, '<span class="text-purple-400">$&</span>')
                    .replace(/&|\|/g, '<span class="text-yellow-500">$&</span>')
                    .replace(/\(\)/g, '<span class="text-green-400">()</span>')
                    .replace(/'[^']*'/g, '<span class="text-orange-400">$&</span>')
            }} />
          </div>
        ))}
      </pre>
    </div>
  );
};

export default CodeBlock;
