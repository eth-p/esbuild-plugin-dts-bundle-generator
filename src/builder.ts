import { writeFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';

import type { CompilationOptions, EntryPointConfig, LibrariesOptions, OutputOptions } from 'dts-bundle-generator';
import { generateDtsBundle } from 'dts-bundle-generator';
import type { BuildOptions, OnEndResult, OnStartResult, PartialMessage } from 'esbuild';

import { EntryPointMap } from './mapping';
import type Options from './options';

/**
 * Create ESBuild plugin callbacks for generating TypeScript definition bundles.
 *
 * @param options The plugin options.
 * @param esbuildOptions The esbuild options.
 * @param tsconfig The path to the tsconfig file.
 * @param mappings A map of entry points and their corresponding output file.
 *
 * @returns The onStart and onEnd callbacks.
 * @internal
 */
export default function createBundleBuilder(
	options: Options,
	esbuildOptions: BuildOptions,
	tsconfig: string,
	mappings: EntryPointMap,
): { onStart: () => Promise<OnStartResult>; onEnd: () => Promise<OnEndResult> } {
	const LOCK: { instance: Promise<OnEndResult> | null } = { instance: null };

	const externals = esbuildOptions.external ?? [];
	const compilationOptions: CompilationOptions = {
		...(options?.compilationOptions ?? {}),
		preferredConfigPath: tsconfig,
	};

	const entryPoints: EntryPointConfig[] = Array.from(mappings.keys()).map((file) =>
		generateEntryPointConfig(options, externals, file),
	);

	async function work(): Promise<OnEndResult> {
		const started = performance.now();
		const { errors, warnings, generated } = await generateBundle(entryPoints, compilationOptions);
		const duration = performance.now() - started;
		if (errors.length > 0) return { errors, warnings };

		// Print the performance message.
		if (options?.printPerformanceMessage) {
			console.error(
				`\x1B[34m[dts-bundle-generator] Took ${Math.ceil(duration)} ms to generate dts bundles.\x1B[m`,
			);
		}

		// Save the bundles.
		return {
			warnings,
			errors: (await saveBundles(mappings, esbuildOptions, generated)).error,
		};
	}

	async function onStart(): Promise<OnStartResult> {
		const warnings: Array<PartialMessage> = [];
		const errors: Array<PartialMessage> = [];

		// If we already have an instance running, we have to wait for it.
		if (LOCK.instance != null) {
			await LOCK.instance;
		}

		// Run all the processing in parallel to esbuild.
		// We will reconcile at the onEnd hook.
		LOCK.instance = work();
		return { warnings, errors };
	}

	async function onEnd(): Promise<OnEndResult> {
		return (await LOCK.instance)!;
	}

	return { onStart, onEnd };
}

/**
 * Generates a {@link EntryPointConfig} for a file.
 *
 * @param options The plugin options.
 * @param externals A list of external modules.
 * @param file The entrypoint file path.
 *
 * @returns The config for dts-bundle-generator.
 */
function generateEntryPointConfig(options: Options, externals: string[], file: string): EntryPointConfig {
	const user = options.configureEntryPoint?.(file) ?? {};
	const output: OutputOptions | undefined = options.outputOptions;
	const libraries: LibrariesOptions = {
		...(options.librariesOptions ?? {}),
		allowedTypesLibraries: [...externals],
	};

	return {
		output,
		libraries,
		...user,
		filePath: file,
	};
}

/**
 * Uses `dts-bundle-generator`'s API to generate `d.ts` bundles.
 *
 * @param entryPoints The entry points.
 * @param options The compilation options.
 *
 * @returns The generated bundles and messages.
 */
async function generateBundle(
	entryPoints: EntryPointConfig[],
	options: CompilationOptions,
): Promise<{ generated: Set<{ in: string; outText: string }>; warnings: PartialMessage[]; errors: PartialMessage[] }> {
	try {
		const bundles = generateDtsBundle(entryPoints, options);
		return {
			warnings: [],
			errors: [],
			generated: new Set(
				bundles.map((outText, i) => ({
					in: entryPoints[i].filePath,
					outText,
				})),
			),
		};
	} catch (ex) {
		return {
			generated: new Set(),
			warnings: [],
			errors: [
				{
					pluginName: 'dts-bundle-generator',
					id: 'internal-dts-bundle-generator',
					text: `${ex}`,
					detail: ex,
				},
			],
		};
	}
}

/**
 * Saves a multiple bundle files.
 * @param mapping The map from entry points to output files.
 * @param generated The generated bundles to save.
 * @returns Any errors.
 */
async function saveBundles(
	mapping: EntryPointMap,
	esbuildOptions: BuildOptions,
	generated: Set<{ in: string; outText: string }>,
): Promise<{ error: PartialMessage[] }> {
	const results = await Promise.all(
		Array.from(generated.values())
			.map(({ in: source, outText }) => ({ out: mapping.get(source)!, outText }))
			.map(({ out, outText }) => ({ outText, out: normalize(join(esbuildOptions.outdir ?? '.', out)) }))
			.map(({ out, outText }) => saveBundle(out, outText)),
	);

	return {
		error: results.map(({ error }) => error).flat(),
	};
}

/**
 * Saves a single bundle file.
 * @param path The destination path.
 * @param data The data to write.
 * @returns Any errors.
 */
async function saveBundle(path: string, data: string): Promise<{ error: PartialMessage[] }> {
	try {
		await writeFile(`${path}.d.ts`, data, 'utf-8');
		return { error: [] };
	} catch (ex) {
		const code = typeof ex === 'object' && ex != null && 'code' in ex ? (ex.code as string) : undefined;
		return {
			error: [
				{
					id: code,
					text: `failed to write file: ${ex}`,
				},
			],
		};
	}
}
