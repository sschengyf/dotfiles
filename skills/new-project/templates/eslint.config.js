import { dirname, relative, resolve, sep } from 'node:path';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const SRC = resolve(import.meta.dirname, 'src');

// Lower layers never import higher ones. A module may use any module listed before it.
const LAYERS = [
  // __LAYERS__: lowest first, e.g. 'infra', 'domain', 'app'
  'infra',
  'app',
];

/** "infra" for src/infra/config/load.ts; null for src/index.ts or files outside src. */
function moduleOf(path) {
  const parts = relative(SRC, path).split(sep);
  return parts[0] === '..' || parts.length < 2 ? null : parts[0];
}

const moduleBoundaries = {
  meta: {
    type: 'problem',
    messages: {
      deep: 'Import {{module}} only through {{module}}/index.ts, not its internal files',
      layer: '{{from}} cannot depend on {{to}}: dependencies point to lower layers only ({{order}})',
      unknown: '{{module}} is not in LAYERS in eslint.config.js',
      relative: 'Use #/{{module}}/… for cross-module imports, not a relative path',
      self: 'Files inside a module import each other with relative paths, not #/',
    },
  },
  create(context) {
    const file = context.filename;
    const from = moduleOf(file);
    // Tests may reach into other modules' files to test them directly; layering still applies.
    const isTest = file.endsWith('.test.ts');
    if (from !== null && !LAYERS.includes(from)) {
      context.report({ loc: { line: 1, column: 0 }, messageId: 'unknown', data: { module: from } });
      return {};
    }
    const check = (node) => {
      const spec = node.source?.value;
      if (typeof spec !== 'string') return;
      const viaSubpath = spec.startsWith('#/');
      if (!viaSubpath && !spec.startsWith('.')) return;
      // #/* maps to ./src/* (package.json "imports").
      const target = viaSubpath ? resolve(SRC, spec.slice(2)) : resolve(dirname(file), spec);
      const to = moduleOf(target);
      if (viaSubpath && to !== null && to === from) {
        context.report({ node: node.source, messageId: 'self' });
        return;
      }
      if (to === null || to === from) return;
      if (!viaSubpath) {
        context.report({ node: node.source, messageId: 'relative', data: { module: to } });
      }
      if (!isTest && relative(resolve(SRC, to), target) !== 'index.js') {
        context.report({ node: node.source, messageId: 'deep', data: { module: to } });
      }
      if (from !== null && LAYERS.indexOf(to) >= LAYERS.indexOf(from)) {
        context.report({
          node: node.source,
          messageId: 'layer',
          data: { from, to, order: LAYERS.join(' → ') },
        });
      }
    };
    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};

export default tseslint.config(
  { ignores: ['node_modules/', 'data/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
    },
  },
  {
    files: ['src/**/*.ts'],
    plugins: { local: { rules: { 'module-boundaries': moduleBoundaries } } },
    rules: { 'local/module-boundaries': 'error' },
  },
  {
    // The logger is the only place allowed to write to the console.
    files: ['src/infra/logger.ts'],
    rules: { 'no-console': 'off' },
  },
  prettier,
);
