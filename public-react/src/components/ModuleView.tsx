import React from 'react';
import { ModuleData } from '../types';
import { FunctionCard } from './FunctionCard';

interface ModuleViewProps {
  data: ModuleData;
  onBack: () => void;
}

export const ModuleView: React.FC<ModuleViewProps> = ({ data, onBack }) => {
  const { module, specs } = data;

  return (
    <>
      <button className="back-button" onClick={onBack}>
        ← Back to Directory
      </button>
      <div className="module-view">
        <div className="module-header">
          <h2>{module.module.name}</h2>
          {module.module.description && <p className="description">{module.module.description}</p>}
        </div>

        <div className="function-section">
          <h3>Functions</h3>
          {Object.entries(module.functions).map(([funcName, funcDef]) => {
            const tests = specs?.functions?.[funcName]?.tests || [];
            return <FunctionCard key={funcName} name={funcName} func={funcDef} tests={tests} />;
          })}
        </div>
      </div>
    </>
  );
};
