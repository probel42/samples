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
	checkWordAvailable(place: WordPlace, word: string): boolean {
		return !this.words.has(word);
	}

	// проверка совместимости с другими установленными словами
	checkCompatibility(place: WordPlace, word: string): boolean {
		return place.crossesTo.every(cross => {
			const toWord = this.placements.get(cross.to);
			return !toWord || toWord[cross.toWordPos] === word[cross.fromWordPos];
		});
	}

	// установка слова (предполагается что все необходимые проверки сделаны)
	applyWord(place: WordPlace, word: string) {
		this.placements.set(place, word);
		this.words.add(word);
	}

	// удаление слова
	removeWord(place: WordPlace, word: string) {
		this.placements.delete(place);
		this.words.delete(word);
	}

	// найти свободное место (из достижимых)
	getFreeReachablePlace(): WordPlace | undefined {
		for (const place of this.placements.keys()) {
			const freePlace = place.crossesTo.find(cross => !this.placements.has(cross.to));
			if (freePlace) {
				return freePlace;
			}
		}
		return undefined;
	}

	// проверка готовности
	checkReadiness(): boolean {
		let placementsCount = 0;
		for (const _ of this.placements.keys()) {
			placementsCount++;
		}
		return placementsCount === this.placesNumber;
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
		// размещаем в нём слова
		this.placements.forEach((word, place) => {
			for (let pos = 0; pos < place.length; pos++) {
				if (place.isVertical) {
					canvas[place.row + pos][place.col] = word[pos];
				} else {
					canvas[place.row][place.col + pos] = word[pos];
				}
			}
		});
		return canvas.map(row => row.join('')).join('\n');
	}
}
