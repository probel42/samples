import type { WordPlace } from '../models/word-place.ts';

/**
 * Пошагово выстраиваемое решение.
 */
export class PlacementSolution {
	private readonly height: number;
	private readonly width: number;
	private readonly placesNumber: number;
	private readonly placements: Map<WordPlace, string>;

	private readonly words: Set<string>; // для ускорения

	constructor(height: number, width: number, placesNumber: number) {
		this.height = height;
		this.width = width;
		this.placesNumber = placesNumber;
		this.placements = new Map();

		this.words = new Set();
	}

	// проверяет занято ли место
	checkPlaceAvailable(place: WordPlace): boolean {
		return !this.placements.has(place);
	}

	// проверяет занято ли слово
	checkWordAvailable(word: string): boolean {
		return !this.words.has(word);
	}

	// проверка совместимости с другими установленными словами
	checkCompatibility(place: WordPlace, word: string): boolean {
		return place.crossesTo.every(cross => {
			const toWord = this.placements.get(cross.to);
			return !toWord || toWord[cross.toWordPos] === word[cross.fromWordPos];
		});
	}

	// размещение слова (предполагается что все необходимые проверки сделаны)
	attachPlacement(place: WordPlace, word: string) {
		this.placements.set(place, word);
		this.words.add(word);
	}

	// удаление слова
	detachPlacement(place: WordPlace) {
		this.words.delete(this.placements.get(place));
		this.placements.delete(place);
	}

	// проверка готовности
	checkReadiness(): boolean {
		return this.placements.size === this.placesNumber;
	}

	toString(): string {
		// готовим канвас
		const canvas: string[][] = [];
		for (let row = 0; row < this.height; row++) {
			canvas[row] = [];
			for (let col = 0; col < this.width; col++) {
				canvas[row][col] = '*';
			}
		}
		// размещаем на нём слова
		for (const [place, word] of this.placements) {
			for (let pos = 0; pos < place.length; pos++) {
				if (place.isVertical) {
					canvas[place.row + pos][place.col] = word[pos];
				} else {
					canvas[place.row][place.col + pos] = word[pos];
				}
			}
		}
		return canvas.map(row => row.join('')).join('\n');
	}
}
