#!/bin/node
import { DictLoader } from './loaders/dict-loader.ts';
import { InputReader } from './loaders/input-reader.ts';
import { MaskValidator } from './loaders/mask-validator.ts';
import { ContextInitializer } from './loaders/context-initializer.ts';
import { BackTrackingSolver } from './logic/solvers/back-tracking-solver.ts';
import type { Solver } from './logic/solvers/solver.ts';

const DICT_PATH = 'words.txt';

// выключим логирование
console.log = (ignored: string) => {};

async function main() {
	console.log('Чтение словаря...');
	const dict = DictLoader.load(DICT_PATH);
	if (!dict) {
		return;
	}

	console.log('Введите маску:'); // для ввода из конвейера этот лог не нужен, поэтому выключен выше
	const mask = await InputReader.read();
	if (!MaskValidator.validate(mask)) {
		return;
	}

	// init context
	const context = ContextInitializer.createContext(mask, dict);

	const solver: Solver = new BackTrackingSolver();
	const result = solver.solve(context);
	if (result) {
		process.stdout.write(result + '\n');
	} else {
		console.warn('Решение не найдено.');
	}
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
