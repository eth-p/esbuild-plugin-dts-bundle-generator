import { access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { cwd } from 'node:process';

/**
 * Searches upwards for a `tsconfig.json` file.
 *
 * @param from The directory to start searching from.
 */
export function findTSConfigFile(from?: string | null): Promise<string> {
	const dir = from ?? cwd();
	const paths: string[] = [];

	let current: string;
	for (current = dir; current !== dirname(current); current = dirname(current)) {
		paths.push(join(current, 'tsconfig.json'));
	}

	paths.push(join(current, 'tsconfig.json'));

	// Race to find the closest one.
	return new Promise((resolve, reject) => {
		let finished = false;
		const completed: boolean[] = new Array(paths.length).fill(false);
		const resolved: boolean[] = new Array(paths.length).fill(false);

		function maybeComplete() {
			if (finished) return;
			for (let i = 0; i < completed.length; i++) {
				if (completed[i] === false) return;
				if (resolved[i] === false) continue;

				// Closest tsconfig.json file.
				finished = true;
				resolve(paths[i]);
				return;
			}

			// We've completed all without any resolving.
			// Reject.
			reject(new Error('could not find tsconfig.json file'));
		}

		for (let i = 0; i < paths.length; i++) {
			access(paths[i])
				.then(() => (resolved[i] = true))
				.catch(() => (resolved[i] = false))
				.finally(() => (completed[i] = true))
				.finally(maybeComplete);
		}

		if (paths.length === 0) {
			maybeComplete();
		}
	});
}

/**
 * Ensures that a directory exists.
 * @param path The path.
 */
export async function ensureDir(path: string): Promise<void> {
	await mkdir(path, { recursive: true });
}
