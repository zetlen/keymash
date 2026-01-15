import type React from 'react';
import { useMemo } from 'react';
import apiJson from '../docs/api.json';
import type { ParsedApiItem, ParsedApiSection, ParsedParam } from '../lib/docs-types';
import { type ProjectReflection, parseTypeDocJson } from '../lib/parse-typedoc-json';
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
  params?: ParsedParam[];
  returns?: string;
  example?: string;
  deprecated?: string;
  childItems?: ParsedApiItem[];
}

const ApiItem: React.FC<ApiItemProps> = ({
  name,
  signature,
  description,
  params,
  returns,
  example,
  deprecated,
  childItems,
}) => (
  <div className="mb-10 last:mb-0">
    <h3 className="text-lg font-semibold text-gray-900 mb-2 font-mono">{name}</h3>
    {deprecated && (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded text-sm mb-3">
        <strong>Deprecated:</strong> {deprecated}
      </div>
    )}
    {signature && (
      <pre className="bg-gray-100 px-4 py-2 rounded text-sm text-gray-700 mb-3 overflow-x-auto whitespace-pre-wrap">
        {signature}
      </pre>
    )}
    {description && <p className="text-gray-600 mb-4">{description}</p>}
    {params && params.length > 0 && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h4>
        <ul className="space-y-2">
          {params.map((param) => (
            <li key={param.name} className="text-sm">
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">{param.name}</code>
              {param.optional && <span className="text-gray-400 ml-1">(optional)</span>}
              <span className="text-gray-400 mx-2">:</span>
              <code className="text-gray-600">{param.type}</code>
              {param.description && (
                <span className="text-gray-500 ml-2">— {param.description}</span>
              )}
              {param.defaultValue && (
                <span className="text-gray-400 ml-2">(default: {param.defaultValue})</span>
              )}
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
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Example</h4>
        <CodeBlock code={example} />
      </div>
    )}
    {childItems && childItems.length > 0 && (
      <div className="ml-4 mt-4 border-l-2 border-gray-200 pl-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Members</h4>
        {childItems.map((child) => (
          <ApiItem
            key={child.id}
            name={child.name}
            signature={child.signature}
            description={child.description}
            params={child.params}
            returns={child.returns}
            example={child.example}
            deprecated={child.deprecated}
            childItems={child.childItems}
          />
        ))}
      </div>
    )}
  </div>
);

const ApiReference: React.FC = () => {
  // Parse the TypeDoc JSON into sections
  const sections = useMemo(() => {
    return parseTypeDocJson(apiJson as unknown as ProjectReflection);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <main className="max-w-4xl mx-auto px-8 md:px-16 py-16">
        <header className="mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
          <p className="text-gray-600">
            Full API reference for all KeyMash modules. For usage documentation and examples, see
            the{' '}
            <a href="#/" className="text-blue-600 hover:underline">
              Usage
            </a>{' '}
            page.
          </p>
        </header>

        {sections.map((section: ParsedApiSection) => (
          <ApiSection key={section.title} title={section.title}>
            {section.items.map((item: ParsedApiItem) => (
              <ApiItem
                key={item.id}
                name={item.name}
                signature={item.signature}
                description={item.description}
                params={item.params}
                returns={item.returns}
                example={item.example}
                deprecated={item.deprecated}
                childItems={item.childItems}
              />
            ))}
          </ApiSection>
        ))}
      </main>
    </div>
  );
};

export default ApiReference;
