import React from 'react';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

interface ExpressionTreeProps {
  expr: any;
  indent?: number;
}

export const ExpressionTree: React.FC<ExpressionTreeProps> = ({ expr, indent = 0 }) => {
  const renderTree = (expr: any, indent: number = 0): JSX.Element | string => {
    if (expr === null || expr === undefined) {
      return <span className="literal">null</span>;
    }

    // Handle primitives (strings, numbers, booleans)
    if (typeof expr === 'string') {
      return <span className="literal string-literal">"{expr}"</span>;
    }
    if (typeof expr === 'number') {
      return <span className="literal number-literal">{expr}</span>;
    }
    if (typeof expr === 'boolean') {
      return <span className="literal bool-literal">{String(expr)}</span>;
    }

    // Handle arrays
    if (Array.isArray(expr)) {
      if (expr.length === 0) {
        return <span className="literal">[]</span>;
      }
      return (
        <>
          {expr.map((item, index) => (
            <div key={index} className="tree-node">
              <span className="tree-connector">{index === expr.length - 1 ? '└─' : '├─'}</span>
              {renderTree(item, indent + 1)}
            </div>
          ))}
        </>
      );
    }

    // Handle objects
    if (typeof expr === 'object') {
      const keys = Object.keys(expr);
      if (keys.length === 0) {
        return <span className="literal">{'{}'}</span>;
      }

      // Special handling for specific operations
      if (keys.length === 1) {
        const key = keys[0];
        const value = expr[key];

        // Handle 'get' operation
        if (key === 'get') {
          return (
            <>
              <span className="keyword">get</span> <span className="variable">{value}</span>
            </>
          );
        }

        // Handle 'let/in' structure
        if (key === 'let' && typeof value === 'object' && !Array.isArray(value)) {
          return (
            <>
              <div className="tree-node">
                <span className="keyword">let</span>
              </div>
              <div className="nested-structure">
                {Object.entries(value).map(([bindName, bindValue], index, arr) => (
                  <div key={bindName} className="tree-line">
                    <span className="tree-connector">{index === arr.length - 1 ? '└─' : '├─'}</span>
                    <span className="variable">{bindName}</span> ={' '}
                    {renderTree(bindValue, indent + 1)}
                  </div>
                ))}
              </div>
            </>
          );
        }

        if (key === 'in') {
          return (
            <>
              <div className="tree-node">
                <span className="keyword">in</span>
              </div>
              <div className="nested-structure">{renderTree(value, indent + 1)}</div>
            </>
          );
        }

        // Handle 'if/then/else' structure
        if (key === 'if') {
          return (
            <div className="tree-node">
              <span className="tree-icon">🔀</span>
              <span className="keyword">if</span> {renderTree(value, indent + 1)}
            </div>
          );
        }

        if (key === 'then') {
          return (
            <>
              <div className="tree-node">
                <span className="tree-connector">├─</span>
                <span className="tree-icon">✓</span>
                <span className="keyword">then:</span>
              </div>
              <div className="nested-structure">{renderTree(value, indent + 1)}</div>
            </>
          );
        }

        if (key === 'else') {
          return (
            <>
              <div className="tree-node">
                <span className="tree-connector">└─</span>
                <span className="tree-icon">✗</span>
                <span className="keyword">else:</span>
              </div>
              <div className="nested-structure">{renderTree(value, indent + 1)}</div>
            </>
          );
        }

        // Handle operations with single arguments
        if (['uppercase', 'lowercase', 'not'].includes(key)) {
          return (
            <>
              <span className="operation">{key}</span>({renderTree(value, indent)})
            </>
          );
        }
      }

      // Handle binary operations
      if (keys.includes('left') && keys.includes('right')) {
        const operation = keys.find((k) => k !== 'left' && k !== 'right');
        if (operation) {
          return (
            <>
              <div className="tree-node">
                <span className="tree-icon">⚡</span>
                <span className="operation">{operation}</span>
              </div>
              <div className="nested-structure">
                <div className="tree-line">
                  <span className="tree-connector">├─</span>
                  <span className="tree-label">left:</span> {renderTree(expr.left, indent + 1)}
                </div>
                <div className="tree-line">
                  <span className="tree-connector">└─</span>
                  <span className="tree-label">right:</span> {renderTree(expr.right, indent + 1)}
                </div>
              </div>
            </>
          );
        }
      }

      // Handle concat operation
      if (keys.length === 1 && keys[0] === 'concat' && Array.isArray(expr.concat)) {
        return (
          <>
            <div className="tree-node">
              <span className="tree-icon">🔗</span>
              <span className="operation">concat</span>
            </div>
            <div className="nested-structure">
              {expr.concat.map((item: any, index: number) => (
                <div key={index} className="tree-line">
                  <span className="tree-connector">
                    {index === expr.concat.length - 1 ? '└─' : '├─'}
                  </span>
                  {renderTree(item, indent + 1)}
                </div>
              ))}
            </div>
          </>
        );
      }

      // Generic object rendering
      return (
        <div className="tree-children">
          {keys.map((key, index) => (
            <div key={key} className="tree-line">
              <span className="tree-connector">{index === keys.length - 1 ? '└─' : '├─'}</span>
              <span className="tree-label">{key}:</span> {renderTree(expr[key], indent + 1)}
            </div>
          ))}
        </div>
      );
    }

    return String(expr);
  };

  return <div className="expression-tree">{renderTree(expr, indent)}</div>;
};
