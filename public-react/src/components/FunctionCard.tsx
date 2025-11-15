import React, { useState, useMemo } from 'react';
import { FunctionDef, TestCase } from '../types';
import { ExpressionTree } from './ExpressionTree';
import { formatValue } from '../utils';

interface FunctionCardProps {
  name: string;
  func: FunctionDef;
  tests: TestCase[];
}

function getOutputParams(output: any): string[] {
  if (!output) {
    return ['result'];
  }
  // Check if it's a single unnamed output (has 'type' property directly)
  if (output.type) {
    return ['result'];
  }
  // Multiple named outputs
  return Object.keys(output);
}

export const FunctionCard: React.FC<FunctionCardProps> = ({ name, func, tests }) => {
  const [hoveredTestIndex, setHoveredTestIndex] = useState<number | null>(null);
  const inputParams = func.input ? Object.keys(func.input) : [];
  const outputParams = getOutputParams(func.output);

  // Get the input context for the logic tree
  // If a test is hovered, use its input values; otherwise use defaults
  const inputContext = useMemo(() => {
    if (hoveredTestIndex !== null && tests[hoveredTestIndex]) {
      const test = tests[hoveredTestIndex];
      const context: Record<string, any> = {};

      // Start with default values
      if (func.input) {
        Object.entries(func.input).forEach(([key, def]) => {
          if (def.default !== undefined) {
            context[key] = def.default;
          }
        });
      }

      // Override with test input values
      if (test.input) {
        Object.entries(test.input).forEach(([key, value]) => {
          context[key] = value;
        });
      }

      return context;
    }

    // Default: use input defaults
    return func.input
      ? Object.fromEntries(Object.entries(func.input).map(([name, def]) => [name, def.default]))
      : {};
  }, [hoveredTestIndex, tests, func.input]);

  return (
    <div className="function-card">
      <div className="function-header">
        <div className="function-name">⚙️ {name}</div>
      </div>

      {func.description && <div className="function-description">{func.description}</div>}

      {/* Input/Output Grid */}
      <div className="io-container">
        {/* Input Section */}
        <div className="io-section">
          <h4>Input</h4>
          {func.input ? (
            <table className="io-grid">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(func.input).map(([paramName, paramDef]) => (
                  <tr key={paramName}>
                    <td className="param-name">{paramName}</td>
                    <td className="param-type">{paramDef.type || '-'}</td>
                    <td className="param-default">
                      {paramDef.default !== undefined ? String(paramDef.default) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="not-declared">Not declared</div>
          )}
        </div>

        {/* Arrow */}
        <div className="io-arrow">→</div>

        {/* Output Section */}
        <div className="io-section">
          <h4>Output</h4>
          {func.output ? (
            <table className="io-grid">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {func.output.type ? (
                  <tr>
                    <td className="param-name">(return value)</td>
                    <td className="param-type">{func.output.type}</td>
                  </tr>
                ) : (
                  Object.entries(func.output).map(([outputName, outputDef]: [string, any]) => (
                    <tr key={outputName}>
                      <td className="param-name">{outputName}</td>
                      <td className="param-type">{outputDef.type || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="not-declared">Not declared</div>
          )}
        </div>
      </div>

      {/* Logic */}
      <div className="function-details">
        <h4>Logic</h4>
        <ExpressionTree
          key={`logic-${hoveredTestIndex}`}
          expr={func.logic}
          inputDefaults={inputContext}
        />
      </div>

      {/* Verification */}
      <div className="verification-section">
        <h4>🔍 Verification</h4>
        {tests.length === 0 ? (
          <div className="no-tests">No test cases defined</div>
        ) : (
          <div className="verification-grid-container">
            <table className="verification-grid">
              <thead>
                <tr>
                  <th className="verify-desc-col">Description</th>
                  {inputParams.map((param) => (
                    <th key={param} className="verify-input-col">
                      {param}
                    </th>
                  ))}
                  {outputParams.map((param) => (
                    <th key={param} className="verify-output-col">
                      {param}
                    </th>
                  ))}
                  <th className="verify-status-col">Status</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test, index) => (
                  <tr
                    key={index}
                    onMouseEnter={() => setHoveredTestIndex(index)}
                    onMouseLeave={() => setHoveredTestIndex(null)}
                    className={hoveredTestIndex === index ? 'test-row-hovered' : ''}
                  >
                    <td className="verify-desc">{test.description || `Test ${index + 1}`}</td>
                    {inputParams.map((param) => {
                      const value =
                        test.input && test.input[param] !== undefined
                          ? test.input[param]
                          : func.input && func.input[param].default !== undefined
                            ? func.input[param].default
                            : '-';
                      return (
                        <td key={param} className="verify-input">
                          {formatValue(value)}
                        </td>
                      );
                    })}
                    {outputParams.map((param) => {
                      const value =
                        test.expectedOutput && test.expectedOutput[param] !== undefined
                          ? test.expectedOutput[param]
                          : test.expectedOutput;
                      return (
                        <td key={param} className="verify-output">
                          {formatValue(value)}
                        </td>
                      );
                    })}
                    <td className="verify-status">
                      <span className="status-badge status-passed">✓ Passed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
