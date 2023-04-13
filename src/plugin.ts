import { Plugin } from 'esbuild';

import createBundleBuilder from './builder';
import { getMappingFromEsbuildOptions, getMappingFromPluginOptions } from './mapping';
import type Options from './options';
import { findTSConfigFile } from './util';

/**
 * Creates the esbuild plugin for generating d.ts files.
 */
export default function dtsBundleGeneratorPlugin(options?: Options): Plugin {
	return {
		name: 'dts-bundle-generator',
		async setup(build) {
			const { initialOptions } = build;

			const tsconfig = options?.tsconfig ?? initialOptions.tsconfig ?? (await findTSConfigFile());
			const mappings =
				options?.entryPoints == null
					? getMappingFromEsbuildOptions(initialOptions)
					: getMappingFromPluginOptions(options);

			const { onStart, onEnd } = createBundleBuilder(options ?? {}, initialOptions, tsconfig, mappings);

			build.onStart(onStart);
			build.onEnd(onEnd);
		},
	};
}
