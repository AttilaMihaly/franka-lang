/**
 * Utility functions for transforming logic expressions into tree table format
 */

import { TreeNode } from 'cp-react-tree-table';

export interface TreeNodeData {
  label: string;
  type: string;
  value: string;
  raw?: any;
}

/**
 * Infer the type of a value
 */
export function inferType(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return 'string';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (typeof value === 'object') {
    return 'operation';
  }
  return 'unknown';
}

/**
 * Format a value for display
 */
export function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === 'object') {
    return '{...}';
  }
  return String(value);
}

/**
 * Attempt to evaluate a simple expression to get its value
 * This is a simplified evaluator for display purposes only
 */
export function tryEvaluate(expr: any, context: Record<string, any> = {}): any {
  try {
    // Handle primitives
    if (expr === null || expr === undefined) {
      return expr;
    }
    if (typeof expr !== 'object') {
      return expr;
    }

    // Handle arrays
    if (Array.isArray(expr)) {
      return expr.map((item) => tryEvaluate(item, context));
    }

    // Handle operations
    const keys = Object.keys(expr);
    if (keys.length === 0) {
      return null;
    }

    const key = keys[0];
    const value = expr[key];

    // Handle get operation
    if (key === 'get' && typeof value === 'string') {
      return context[value] !== undefined ? context[value] : `<${value}>`;
    }

    // Handle concat operation
    if (key === 'concat' && Array.isArray(value)) {
      const parts = value.map((item) => tryEvaluate(item, context));
      return parts.map((p) => (typeof p === 'string' ? p : String(p))).join('');
    }

    // Handle uppercase
    if (key === 'uppercase') {
      const evaluated = tryEvaluate(value, context);
      return typeof evaluated === 'string' ? evaluated.toUpperCase() : evaluated;
    }

    // Handle lowercase
    if (key === 'lowercase') {
      const evaluated = tryEvaluate(value, context);
      return typeof evaluated === 'string' ? evaluated.toLowerCase() : evaluated;
    }

    // Handle let/in
    if (keys.includes('let') && keys.includes('in')) {
      const letValue = expr.let;
      const inValue = expr.in;

      // Build new context with let bindings
      const newContext = { ...context };
      if (typeof letValue === 'object' && !Array.isArray(letValue)) {
        for (const [bindName, bindValue] of Object.entries(letValue)) {
          newContext[bindName] = tryEvaluate(bindValue, context);
        }
      }

      // Evaluate the in expression with the new context
      return tryEvaluate(inValue, newContext);
    }

    // For other operations, return placeholder
    return `<${key}>`;
  } catch (e) {
    return '<error>';
  }
}

/**
 * Convert a logic expression into a tree structure for the tree table
 */
export function buildLogicTree(
  expr: any,
  context: Record<string, any> = {},
  label: string = 'root'
): TreeNode<TreeNodeData> {
  // Handle primitives
  if (expr === null || expr === undefined) {
    return {
      data: {
        label: label || 'null',
        type: 'null',
        value: 'null',
        raw: expr,
      },
    };
  }

  if (typeof expr === 'string') {
    return {
      data: {
        label: label || `"${expr}"`,
        type: 'string',
        value: `"${expr}"`,
        raw: expr,
      },
    };
  }

  if (typeof expr === 'number') {
    return {
      data: {
        label: label || String(expr),
        type: 'number',
        value: String(expr),
        raw: expr,
      },
    };
  }

  if (typeof expr === 'boolean') {
    return {
      data: {
        label: label || String(expr),
        type: 'boolean',
        value: String(expr),
        raw: expr,
      },
    };
  }

  // Handle arrays
  if (Array.isArray(expr)) {
    const children = expr.map((item, index) => buildLogicTree(item, context, `[${index}]`));
    return {
      data: {
        label: label || 'array',
        type: 'array',
        value: `[${expr.length} items]`,
        raw: expr,
      },
      children,
    };
  }

  // Handle objects (operations)
  if (typeof expr === 'object') {
    const keys = Object.keys(expr);
    if (keys.length === 0) {
      return {
        data: {
          label: label || '{}',
          type: 'object',
          value: '{}',
          raw: expr,
        },
      };
    }

    // Special handling for specific operations
    if (keys.length === 1) {
      const key = keys[0];
      const value = expr[key];

      // Handle 'get' operation
      if (key === 'get') {
        const contextValue = context[value as string];
        return {
          data: {
            label: `get ${value}`,
            type: inferType(contextValue),
            value: contextValue !== undefined ? formatDisplayValue(contextValue) : `<${value}>`,
            raw: expr,
          },
        };
      }

      // Handle 'let/in' structure
      if (key === 'let' && typeof value === 'object' && !Array.isArray(value)) {
        const bindings = Object.entries(value).map(([bindName, bindValue]) => {
          const evaluated = tryEvaluate(bindValue, context);
          const newContext = { ...context, [bindName]: evaluated };
          return buildLogicTree(bindValue, newContext, bindName);
        });

        return {
          data: {
            label: 'let',
            type: 'let-binding',
            value: `${Object.keys(value).length} bindings`,
            raw: expr,
          },
          children: bindings,
        };
      }

      if (key === 'in') {
        return {
          data: {
            label: 'in',
            type: 'expression',
            value: formatDisplayValue(tryEvaluate(value, context)),
            raw: expr,
          },
          children: [buildLogicTree(value, context, 'result')],
        };
      }

      // Handle 'if/then/else' structure
      if (key === 'if') {
        return {
          data: {
            label: 'if',
            type: 'conditional',
            value: formatDisplayValue(tryEvaluate(value, context)),
            raw: expr,
          },
          children: [buildLogicTree(value, context, 'condition')],
        };
      }

      if (key === 'then') {
        return {
          data: {
            label: 'then',
            type: 'expression',
            value: formatDisplayValue(tryEvaluate(value, context)),
            raw: expr,
          },
          children: [buildLogicTree(value, context, 'result')],
        };
      }

      if (key === 'else') {
        return {
          data: {
            label: 'else',
            type: 'expression',
            value: formatDisplayValue(tryEvaluate(value, context)),
            raw: expr,
          },
          children: [buildLogicTree(value, context, 'result')],
        };
      }

      // Handle operations with single arguments
      if (['uppercase', 'lowercase', 'not', 'length'].includes(key)) {
        const evaluated = tryEvaluate(expr, context);
        return {
          data: {
            label: key,
            type: 'operation',
            value: formatDisplayValue(evaluated),
            raw: expr,
          },
          children: [buildLogicTree(value, context, 'argument')],
        };
      }

      // Handle concat operation
      if (key === 'concat' && Array.isArray(value)) {
        const evaluated = tryEvaluate(expr, context);
        const children = value.map((item, index) => buildLogicTree(item, context, `item ${index}`));
        return {
          data: {
            label: 'concat',
            type: 'operation',
            value: formatDisplayValue(evaluated),
            raw: expr,
          },
          children,
        };
      }
    }

    // Handle binary operations
    if (keys.includes('left') && keys.includes('right')) {
      const operation = keys.find((k) => k !== 'left' && k !== 'right');
      if (operation) {
        const evaluated = tryEvaluate(expr, context);
        return {
          data: {
            label: operation,
            type: 'operation',
            value: formatDisplayValue(evaluated),
            raw: expr,
          },
          children: [
            buildLogicTree(expr.left, context, 'left'),
            buildLogicTree(expr.right, context, 'right'),
          ],
        };
      }
    }

    // Handle flat let/in structure
    if (keys.includes('let') && keys.includes('in')) {
      const letValue = expr.let;
      const inValue = expr.in;

      // Build context with all bindings step by step
      const newContext = { ...context };
      const bindings: TreeNode<TreeNodeData>[] = [];

      if (typeof letValue === 'object' && !Array.isArray(letValue)) {
        for (const [bindName, bindValue] of Object.entries(letValue)) {
          // Evaluate this binding with the current accumulated context
          const evaluated = tryEvaluate(bindValue, newContext);
          // Add it to the context for subsequent bindings
          newContext[bindName] = evaluated;

          // Create tree node for this binding using the accumulated context
          const bindingNode = buildLogicTree(bindValue, newContext, bindName);
          // Update the evaluated value in the binding node
          bindingNode.data.value = formatDisplayValue(evaluated);
          bindings.push(bindingNode);
        }
      }

      // Now evaluate the 'in' expression with the complete context
      const finalValue = tryEvaluate(inValue, newContext);
      const inNode = buildLogicTree(inValue, newContext, 'in');
      // Update the in node's value with the final evaluated result
      inNode.data.value = formatDisplayValue(finalValue);

      return {
        data: {
          label: 'let/in',
          type: 'let-in',
          value: formatDisplayValue(finalValue),
          raw: expr,
        },
        children: [...bindings, inNode],
      };
    }

    // Generic object rendering
    const children = keys.map((key) => buildLogicTree(expr[key], context, key));
    return {
      data: {
        label: label || 'object',
        type: 'object',
        value: `{${keys.length} keys}`,
        raw: expr,
      },
      children,
    };
  }

  return {
    data: {
      label: String(expr),
      type: 'unknown',
      value: String(expr),
      raw: expr,
    },
  };
}
