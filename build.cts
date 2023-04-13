import * as builtins from 'builtin-modules';
import * as esbuild from 'esbuild';

import esbuildPluginDtsBundleGenerator from './src/plugin';

(async () => {
	await esbuild.build({
		entryPoints: { index: 'src/plugin.ts' },
		bundle: true,
		outdir: '.',
		format: 'cjs',
		target: 'es2017',
		platform: 'node',
		external: [...builtins, './node_modules/*'],
		plugins: [esbuildPluginDtsBundleGenerator({ printPerformanceMessage: true })],
	});
})();
