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
	 */
	entryPoints?: Record<string, string> | Array<{ in: string; out: string }>;

	/**
	 * The path to the project tsconfig file.
	 */
	tsconfig?: string;

	/**
	 * If true, a message outlining how long it took to build the bundles will be printed.
	 */
	printPerformanceMessage?: boolean;

	/**
	 * Called to create a {@link EntryPointConfig} for the given file.
	 * @param entrypoint The entrypoint file.
	 * @returns The config.
	 */
	configureEntryPoint?: (entrypoint: string) => EntryPointConfig;

	/**
	 * Default options for the `dts-bundle-generator`'s {@link OutputOptions}.
	 */
	outputOptions?: OutputOptions;

	/**
	 * Default options for the `dts-bundle-generator`'s {@link LibrariesOptions}.
	 */
	librariesOptions?: LibrariesOptions;

	/**
	 * Compilation options for the `dts-bundle-generator`'s {@link LibrariesOptions}.
	 */
	compilationOptions?: Exclude<CompilationOptions, 'preferredConfigPath'>;
}
