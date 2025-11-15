import React, { useState, useMemo, useEffect } from 'react';
import { TreeTable, TreeState, Row } from 'cp-react-tree-table';
import { buildLogicTree, TreeNodeData, CoverageTracker, tryEvaluate } from '../utils/treeUtils';

interface ExpressionTreeProps {
  expr: any;
  indent?: number;
  inputDefaults?: Record<string, any>;
}

export const ExpressionTree: React.FC<ExpressionTreeProps> = ({ expr, inputDefaults = {} }) => {
  // Build the tree structure from the logic expression with coverage tracking
  const { treeData, coveragePercentage } = useMemo(() => {
    const tracker = new CoverageTracker();
    // Run evaluation to track coverage
    tryEvaluate(expr, inputDefaults, tracker, 'root');
    // Build tree with coverage information
    const tree = buildLogicTree(expr, inputDefaults, 'root', tracker, 'root');

    // Calculate coverage percentage
    const countNodes = (node: any): { total: number; covered: number } => {
      let total = 1;
      let covered = node.data.covered ? 1 : 0;
      if (node.children) {
        for (const child of node.children) {
          const childCounts = countNodes(child);
          total += childCounts.total;
          covered += childCounts.covered;
        }
      }
      return { total, covered };
    };

    const counts = countNodes(tree);
    const percentage = counts.total > 0 ? Math.round((counts.covered / counts.total) * 100) : 0;

    return {
      treeData: TreeState.create([tree]),
      coveragePercentage: percentage,
    };
  }, [expr, inputDefaults]);

  const [treeState, setTreeState] = useState(() => TreeState.expandAll(treeData));

  // Update tree state when tree data changes
  useEffect(() => {
    setTreeState(TreeState.expandAll(treeData));
  }, [treeData]);

  // Render the expression/operation column
  const renderExpressionCell = (row: Row<TreeNodeData>) => {
    const { label, covered } = row.data;
    const { depth, hasChildren } = row.metadata;
    const { isExpanded } = row.$state;

    const indent = depth * 20;

    // Determine row background color based on coverage
    let backgroundColor = 'transparent';
    if (covered === true) {
      backgroundColor = '#d4edda'; // light green
    } else if (covered === false) {
      backgroundColor = '#f8d7da'; // light red
    }

    return (
      <div
        style={{
          paddingLeft: `${indent + 15}px`,
          paddingRight: '15px',
          paddingTop: '10px',
          paddingBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor,
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
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
    const { covered } = row.data;
    let backgroundColor = 'transparent';
    if (covered === true) {
      backgroundColor = '#d4edda'; // light green
    } else if (covered === false) {
      backgroundColor = '#f8d7da'; // light red
    }

    return (
      <div
        style={{
          backgroundColor,
          height: '100%',
          padding: '10px 15px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span className={`type-badge type-${row.data.type}`}>{row.data.type}</span>
      </div>
    );
  };

  // Render the value column
  const renderValueCell = (row: Row<TreeNodeData>) => {
    const { covered } = row.data;
    let backgroundColor = 'transparent';
    if (covered === true) {
      backgroundColor = '#d4edda'; // light green
    } else if (covered === false) {
      backgroundColor = '#f8d7da'; // light red
    }

    return (
      <div
        style={{
          backgroundColor,
          height: '100%',
          padding: '10px 15px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span className="value-display">{row.data.value}</span>
      </div>
    );
  };

  // Render the coverage column
  const renderCoverageCell = (row: Row<TreeNodeData>) => {
    const { covered } = row.data;
    let backgroundColor = '#6c757d'; // gray for undefined
    let symbol = '?';

    if (covered === true) {
      backgroundColor = '#28a745'; // darker green
      symbol = '✓';
    } else if (covered === false) {
      backgroundColor = '#dc3545'; // darker red
      symbol = '✗';
    }

    return (
      <div
        style={{
          backgroundColor,
          height: '100%',
          padding: '10px 15px',
          color: 'white',
          textAlign: 'center',
          fontWeight: 'bold',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {symbol}
      </div>
    );
  };

  return (
    <div className="expression-tree-table">
      <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
        Coverage: {coveragePercentage}%
      </div>
      <TreeTable value={treeState} onChange={setTreeState} height={400}>
        <TreeTable.Column
          renderCell={renderExpressionCell}
          renderHeaderCell={() => <span>Expression</span>}
          basis="40%"
          grow={0}
        />
        <TreeTable.Column
          renderCell={renderTypeCell}
          renderHeaderCell={() => <span>Type</span>}
          basis="20%"
          grow={0}
        />
        <TreeTable.Column
          renderCell={renderValueCell}
          renderHeaderCell={() => <span>Value</span>}
          basis="30%"
          grow={0}
        />
        <TreeTable.Column
          renderCell={renderCoverageCell}
          renderHeaderCell={() => <span>Covered</span>}
          basis="10%"
          grow={0}
        />
      </TreeTable>
    </div>
  );
};
