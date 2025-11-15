import React, { useState, useMemo } from 'react';
import { TreeTable, TreeState, Row } from 'cp-react-tree-table';
import { buildLogicTree, TreeNodeData } from '../utils/treeUtils';

interface ExpressionTreeProps {
  expr: any;
  indent?: number;
  inputDefaults?: Record<string, any>;
}

export const ExpressionTree: React.FC<ExpressionTreeProps> = ({ expr, inputDefaults = {} }) => {
  // Build the tree structure from the logic expression
  const treeData = useMemo(() => {
    const tree = buildLogicTree(expr, inputDefaults);
    return TreeState.create([tree]);
  }, [expr, inputDefaults]);

  const [treeState, setTreeState] = useState(() => TreeState.expandAll(treeData));

  // Render the expression/operation column
  const renderExpressionCell = (row: Row<TreeNodeData>) => {
    const { label } = row.data;
    const { depth, hasChildren } = row.metadata;
    const { isExpanded } = row.$state;

    const indent = depth * 20;

    return (
      <div style={{ paddingLeft: `${indent}px`, display: 'flex', alignItems: 'center' }}>
        {hasChildren && (
          <span
            onClick={row.toggleChildren}
            style={{
              cursor: 'pointer',
              marginRight: '5px',
              userSelect: 'none',
              width: '16px',
              display: 'inline-block',
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span style={{ marginRight: '5px', width: '16px' }}></span>}
        <span className="tree-node-label">{label}</span>
      </div>
    );
  };

  // Render the type column
  const renderTypeCell = (row: Row<TreeNodeData>) => {
    return <span className={`type-badge type-${row.data.type}`}>{row.data.type}</span>;
  };

  // Render the value column
  const renderValueCell = (row: Row<TreeNodeData>) => {
    return <span className="value-display">{row.data.value}</span>;
  };

  return (
    <div className="expression-tree-table">
      <TreeTable value={treeState} onChange={setTreeState} height={400}>
        <TreeTable.Column
          renderCell={renderExpressionCell}
          renderHeaderCell={() => <span>Expression</span>}
          basis="50%"
          grow={0}
        />
        <TreeTable.Column
          renderCell={renderTypeCell}
          renderHeaderCell={() => <span>Type</span>}
          basis="25%"
          grow={0}
        />
        <TreeTable.Column
          renderCell={renderValueCell}
          renderHeaderCell={() => <span>Value</span>}
          basis="25%"
          grow={0}
        />
      </TreeTable>
    </div>
  );
};
