import React from 'react';
import { DirectoryData } from '../types';

interface DirectoryViewProps {
  data: DirectoryData;
  onNavigate: (path: string) => void;
  onOpenModule: (path: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ data, onNavigate, onOpenModule }) => {
  const pathParts = data.currentPath ? data.currentPath.split('/').filter(Boolean) : [];

  return (
    <>
      <div className="breadcrumb">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('');
          }}
        >
          🏠 Home
        </a>
        {pathParts.map((part, index) => {
          const path = pathParts.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={path}>
              <span>/</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(path);
                }}
              >
                {part}
              </a>
            </React.Fragment>
          );
        })}
      </div>

      <div className="directory-list">
        {data.entries.length === 0 ? (
          <div className="directory-item disabled">
            <span className="item-name">No modules or directories found</span>
          </div>
        ) : (
          data.entries.map((item) => (
            <div
              key={item.path}
              className="directory-item"
              onClick={() => {
                if (item.type === 'directory') {
                  onNavigate(item.path);
                } else {
                  onOpenModule(item.path);
                }
              }}
            >
              <span className="item-icon">{item.type === 'directory' ? '📁' : '📄'}</span>
              <span className="item-name">{item.name}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
};
