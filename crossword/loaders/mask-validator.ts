/**
 * Валидатор маски.
 */
export class MaskValidator {
	static validate(mask: string[]): boolean {
		console.log('Валидация исходной маски...');
		if (mask.length === 0) {
			console.warn('Маска пуста.');
			return false;
		}
		if (mask.length === 1 && mask[0].length === 1) {
			console.warn('Маска не может содержать одну ячейку.');
			return false;
		}
		const expectedLength = mask[0].length;
		if (mask.some(line => line.length !== expectedLength)) {
			console.warn('Маска должна быть прямоугольником.');
			return false;
		}
		if (mask.every(line => line.split('').every(char => char === '*'))) {
			console.warn('В маске должны быть места для размещения.');
			return false;
		}
		// ещё одна небольшая проверка на отсутствие изолированных одиночных клеток.
		if (mask.some((line, y) => line.split('').some((char, x) => char !== '*' &&
			[mask[y - 1]?.[x], mask[y + 1]?.[x], mask[y]?.[x - 1], mask[y]?.[x + 1]].every(n => (n ?? '*') === '*')))) {
			console.warn('Маска не должна содержать изолированные одиночные клетки.');
			return false;
		}
		return true;
	}
}
