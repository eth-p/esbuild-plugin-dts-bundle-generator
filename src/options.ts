import type {
	CompilationOptions,
	LibrariesOptions,
	OutputOptions,
	EntryPointConfig as _EntryPointConfig,
} from 'dts-bundle-generator';

export type EntryPointConfig = Omit<_EntryPointConfig, 'filePath'>;

export default interface Options {
	/**
	 * Alternate entry points for generating d.ts files.
	 * This follows the same format as `esbuild`'s `entryPoints` option.
	 */
	entryPoints?: Record<string, string> | Array<{ in: string; out: string }>;

	/**
	 * The path to the project tsconfig file.
	 *
	 * If this is not specified, it will try to use the `tsconfig` option provided to `esbuild`.
	 * If neither options were specified, the nearest `tsconfig.json` file will be used.
	 */
	tsconfig?: string;

	/**
	 * If true, a message outlining how long it took to build the bundles will be printed.
	 */
	printPerformanceMessage?: boolean;

	/**
	 * A function that is called for each entry point file, creating an `EntryPointConfig` to be used by `dts-bundle-generator`.
	 * This function cannot override the `filePath` property.
	 *
	 * @param entrypoint The entrypoint file.
	 * @returns The corresponding `EntryPointConfig`.
	 */
	configureEntryPoint?: (entrypoint: string) => EntryPointConfig;

	/**
	 * The default `OutputOptions` given to `dts-bundle-generator`.
	 * If `configureEntryPoint` returns output options, that will take precedence.
	 */
	outputOptions?: OutputOptions;

	/**
	 * The default `LibrariesOptions` given to `dts-bundle-generator`.
	 * If `configureEntryPoint` returns output options, that will take precedence.
	 */
	librariesOptions?: LibrariesOptions;

	/**
	 * The `CompilationOptions` given to `dts-bundle-generator`.
	 * This cannot override the `entryPoints` property.
	 */
	compilationOptions?: Exclude<CompilationOptions, 'preferredConfigPath'>;
}
