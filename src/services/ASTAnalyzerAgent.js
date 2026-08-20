/**
 * ASTAnalyzerAgent.js
 * Purpose: Parses JavaScript files into Abstract Syntax Trees (AST) to provide 
 *          structural awareness and accurate type/method context to the LLM, bypassing regex limitations.
 */

const acorn = require('acorn');
const fs = require('fs');

class ASTAnalyzerAgent {
  static analyzeFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return { success: false, error: 'File not found' };
      const code = fs.readFileSync(filePath, 'utf-8');
      return this.analyzeCode(code);
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  static analyzeCode(code) {
    try {
      const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
      const summary = {
        classes: [],
        functions: [],
        imports: [],
        exports: []
      };

      const traverse = (node) => {
        if (!node) return;
        
        if (node.type === 'ClassDeclaration') {
          const className = node.id ? node.id.name : 'AnonymousClass';
          const methods = [];
          if (node.body && node.body.body) {
             node.body.body.forEach(m => {
                if (m.type === 'MethodDefinition') {
                   const methodName = m.key.name || (m.key.type === 'Identifier' ? m.key.name : 'unknown');
                   const params = m.value.params.map(p => p.name || (p.left ? p.left.name : 'p')).join(', ');
                   methods.push(`${m.static ? 'static ' : ''}${methodName}(${params})`);
                }
             });
          }
          summary.classes.push({ name: className, methods });
        }
        else if (node.type === 'FunctionDeclaration') {
          const fnName = node.id ? node.id.name : 'AnonymousFunction';
          const params = (node.params || []).map(p => p.name || 'p').join(', ');
          summary.functions.push(`${fnName}(${params})`);
        }
        else if (node.type === 'ImportDeclaration') {
          summary.imports.push(node.source.value);
        }
        else if (node.type === 'ExportNamedDeclaration') {
          if (node.declaration && node.declaration.id) {
             summary.exports.push(node.declaration.id.name);
          }
        }

        for (const key in node) {
          if (node[key] && typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              node[key].forEach(traverse);
            } else {
              traverse(node[key]);
            }
          }
        }
      };

      traverse(ast);
      return { success: true, summary };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

module.exports = ASTAnalyzerAgent;
