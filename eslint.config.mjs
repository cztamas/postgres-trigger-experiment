import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintNode from 'eslint-plugin-node';

export default tseslint.config({
  files: ['**/*.ts'],
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  plugins: {
    eslintNode
  }
});
