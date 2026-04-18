import readline from 'node:readline/promises';

/**
 * Читатель входящей маски.
 */
export class InputReader {
	static async read(): Promise<string[]> {
		const rl = readline.createInterface({ input: process.stdin });
		const lines: string[] = [];

		for await (const line of rl) {
			lines.push(line);
		}

		rl.close();
		return lines;
	}
}
