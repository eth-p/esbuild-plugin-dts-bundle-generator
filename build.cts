import * as builtins from 'builtin-modules';
import * as esbuild from 'esbuild';

import * as packageJson from './package.json';
import esbuildPluginDtsBundleGenerator from './src/plugin';

const config: esbuild.BuildOptions = {
	entryPoints: { index: 'src/plugin.ts' },
	bundle: true,
	outdir: 'dist',
	platform: 'node',
	target: 'es2017',

	external: [...builtins, ...Object.keys(packageJson.dependencies), './node_modules/*'],
};

(async () => {
	// ESModules + Types
	await esbuild.build({
		...config,
		format: 'esm',
		outExtension: { '.js': '.mjs' },
		plugins: [esbuildPluginDtsBundleGenerator({ printPerformanceMessage: true })],
	});

	// CommonJS
	await esbuild.build({
		...config,
		outExtension: { '.js': '.cjs' },
		format: 'cjs',
	});
})();
