// eslint.config.mjs
// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	eslint.configs.recommended,
	tseslint.configs.recommendedTypeChecked,
	{
		ignores: [
			'node_modules',
			'dist',
			'eslint.config.mjs',
			'jest.config.js',
			'**/*.spec.ts',
			'coverage',
		],
	},
	{
		languageOptions: {
			parserOptions: {
				tsconfigRootDir: import.meta.dirname,
				project: './tsconfig.json',
			},
		},

		rules: {
			'no-console': 'warn',
			'no-unused-vars': 'off',
			'prefer-const': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
		},
	},
	{
		files: ['*.js', '*.cjs', '*.mjs'],
		languageOptions: {
			parser: undefined,
		},
		rules: {},
	}
);
