import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DirectoryView } from './components/DirectoryView';
import { ModuleView } from './components/ModuleView';
import { DirectoryData, ModuleData } from './types';

type ViewState = { type: 'directory'; path: string } | { type: 'module'; path: string };

function parseHash(): ViewState {
  const hash = window.location.hash.slice(1); // Remove leading #

  if (!hash || hash === '/') {
    return { type: 'directory', path: '' };
  }

  if (hash.startsWith('/browse/')) {
    const path = hash.slice(8); // Remove '/browse/'
    return { type: 'directory', path };
  }

  if (hash.startsWith('/module/')) {
    const path = hash.slice(8); // Remove '/module/'
    return { type: 'module', path };
  }

  // Default to home if hash is unrecognized
  return { type: 'directory', path: '' };
}

function App() {
  const [viewState, setViewState] = useState<ViewState>(parseHash());
  const [directoryData, setDirectoryData] = useState<DirectoryData | null>(null);
  const [moduleData, setModuleData] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      setViewState(parseHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load data based on view state
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (viewState.type === 'directory') {
          const response = await fetch(`/api/browse?path=${encodeURIComponent(viewState.path)}`);
          if (!response.ok) {
            throw new Error('Failed to load directory');
          }
          const data = await response.json();
          setDirectoryData(data);
          setModuleData(null);
        } else if (viewState.type === 'module') {
          const response = await fetch(`/api/module?path=${encodeURIComponent(viewState.path)}`);
          if (!response.ok) {
            throw new Error('Failed to load module');
          }
          const data = await response.json();
          setModuleData(data);
          setDirectoryData(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [viewState]);

  const navigateToDirectory = (path: string) => {
    window.location.hash = path ? `#/browse/${path}` : '#/';
  };

  const openModule = (path: string) => {
    window.location.hash = `#/module/${path}`;
  };

  const backToDirectory = () => {
    // Get current path from module path
    const currentPath =
      viewState.type === 'module' ? viewState.path.split('/').slice(0, -1).join('/') : '';
    window.location.hash = currentPath ? `#/browse/${currentPath}` : '#/';
  };

  return (
    <div className="app">
      <Header />
      <div id="content">
        {loading && <div className="loading">Loading...</div>}

        {error && viewState.type === 'module' && (
          <>
            <button className="back-button" onClick={backToDirectory}>
              ← Back to Directory
            </button>
            <div className="error">Error: {error}</div>
          </>
        )}

        {error && viewState.type === 'directory' && <div className="error">Error: {error}</div>}

        {!loading && !error && viewState.type === 'directory' && directoryData && (
          <DirectoryView
            data={directoryData}
            onNavigate={navigateToDirectory}
            onOpenModule={openModule}
          />
        )}

        {!loading && !error && viewState.type === 'module' && moduleData && (
          <ModuleView data={moduleData} onBack={backToDirectory} />
        )}
      </div>
    </div>
  );
}

export default App;
