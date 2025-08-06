const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: 'node',
	transform: {
		...tsJestTransformCfg,
	},
	verbose: true,
	collectCoverage: true,
	coverageProvider: "v8",
	collectCoverageFrom: [
		"src/**/*.ts",
		"tests/**",
		"!**node_modules/**",
		"!**/*.d.ts",
	]
};
