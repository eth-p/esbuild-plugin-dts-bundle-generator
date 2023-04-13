import { expect, test } from '@jest/globals';

import { dirname, join } from 'node:path';

import { findTSConfigFile } from './util';

test('findTSConfigFile', async () => {
	expect(findTSConfigFile()).resolves.toBe(join(dirname(__dirname), 'tsconfig.json'));
	await expect(findTSConfigFile('/')).rejects.toThrow();
});
