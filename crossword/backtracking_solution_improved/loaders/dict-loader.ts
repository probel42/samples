import fs from 'node:fs';

/**
 * Загрузчик словаря.
 */
export class DictLoader {
	static load(path: string): string[] | undefined {
		try {
			const data: string = fs.readFileSync(path, 'utf8');
			let lines = data
				.split('\n')
				.map(line => line.trim())
				.filter(line => line.length > 1);
			if (lines.length === 0) {
				console.warn('Файл словаря пуст.');
				return undefined;
			}
			return Array.from(new Set(lines));
		} catch (ignored) {
			console.warn("Не найден файл словаря.");
			return undefined;
		}
	}
}
