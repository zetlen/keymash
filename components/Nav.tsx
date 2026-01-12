import type React from 'react';

interface NavProps {
  currentPath: string;
}

const ExternalLinkIcon: React.FC = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

const Nav: React.FC<NavProps> = ({ currentPath }) => {
  const isHome = currentPath === '/' || currentPath === '';
  const isApi = currentPath === '/api';

  const handleDemoClick = () => {
    if (isHome) {
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = '#/';
      setTimeout(() => {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-8 md:px-16">
        <div className="flex items-center justify-between h-16">
          <a
            href="#/"
            className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
          >
            KeyMash
          </a>
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={handleDemoClick}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Demo
            </button>
            <a
              href="#/api"
              className={`text-sm font-medium transition-colors ${
                isApi ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              API Reference
            </a>
            <a
              href="https://www.npmjs.com/package/keymash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              npm
              <span className="sr-only">(opens in new tab)</span>
              <ExternalLinkIcon />
            </a>
            <a
              href="https://github.com/zetlen/keymash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              GitHub
              <span className="sr-only">(opens in new tab)</span>
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
