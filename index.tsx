import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ApiReference from './components/ApiReference';
import ExamplesPage from './components/ExamplesPage';
import Nav from './components/Nav';

// Simple hash-based router
function useHashRoute() {
  const [path, setPath] = useState(() => {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      setPath(hash);
      // Scroll to top on route change (unless it's a demo anchor)
      if (!hash.includes('/demo')) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return path;
}

const Router: React.FC = () => {
  const path = useHashRoute();

  // Handle demo anchor scroll
  useEffect(() => {
    if (path === '/demo') {
      // Redirect to home and scroll to demo
      window.location.hash = '#/';
      setTimeout(() => {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [path]);

  const renderPage = () => {
    if (path === '/api') {
      return <ApiReference />;
    }
    if (path === '/examples') {
      return <ExamplesPage />;
    }
    return <App />;
  };

  return (
    <>
      <Nav currentPath={path} />
      <div className="pt-16">{renderPage()}</div>
    </>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);
