import { basename, dirname, extname, join, normalize } from 'node:path';

import type { BuildOptions } from 'esbuild';

import type Options from './options';

type InputFile = string;
type OutputFile = string;

/**
 * @internal
 */
export type EntryPointMap = Map<InputFile, OutputFile>;

/**
 * Strips the file extension from a file path.
 * @param path The path to strip.
 * @returns The stripped path.
 */
function stripExtname(path: string): string {
	return normalize(join(dirname(path), basename(path, extname(path))));
}

/**
 * Converts esbuild build options into entry points for `esbuild-plugin-dts-bundle-generator`.
 * @param esbuildOptions The esbuild options.
 * @returns The entry point mappings.
 * @internal
 */
export function getMappingFromEsbuildOptions(esbuildOptions: BuildOptions): EntryPointMap {
	const map: EntryPointMap = new Map();

	// ["file.ts", ...]
	if (esbuildOptions.entryPoints instanceof Array && typeof esbuildOptions.entryPoints[0] === 'string') {
		for (const file of esbuildOptions.entryPoints as string[]) {
			map.set(normalize(file), normalize(stripExtname(file)));
		}

		return map;
	}

	// [{in: "file.ts", out: "dist/file"}]
	if (esbuildOptions.entryPoints instanceof Array) {
		for (const { in: entry, out } of esbuildOptions.entryPoints as Array<{ in: string; out: string }>) {
			map.set(normalize(entry), normalize(out));
		}

		return map;
	}

	// {"dist/file": "file.ts", ...}
	for (const [out, entry] of Object.entries(esbuildOptions.entryPoints as Record<string, string>)) {
		map.set(normalize(entry), normalize(out));
	}

	return map;
}

/**
 * Converts plugin options into entry points for `esbuild-plugin-dts-bundle-generator`.
 * @param esbuildOptions The esbuild options.
 * @returns The entry point mappings.
 * @internal
 */
export function getMappingFromPluginOptions(pluginOptions: Options | undefined): EntryPointMap {
	return getMappingFromEsbuildOptions({
		entryPoints: pluginOptions?.entryPoints ?? {},
	});
}
