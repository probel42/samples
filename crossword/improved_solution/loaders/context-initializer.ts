import type { DataContext } from '../models/data-context.ts';
import type { WordPlace } from '../models/word-place.ts';
import type { WordCross } from '../models/word-cross.ts';

export class ContextInitializer {
	static createContext(mask: string[], dict: string[]): DataContext {
		console.log('Инициализация контекста...');

		const height = mask.length;
		const width = mask[0].length;
		const places = this.createPlaces(mask, height, width);
		const domain = dict;

		return { height, width, places, domain };
	}

	private static createPlaces(mask: string[], height: number, width: number): WordPlace[] {
		console.log('Создание мест под слова...');

		const places: WordPlace[] = [];

		// логика для горизонтального и вертикального сканирования идентична, поэтому DRY
		let isWordStarted: boolean, wordLength: number, wordStartRow: number, wordStartCol: number;
		let processCell = (row: number, col: number, isVertical: boolean) => {
			let isFieldAvailable = row < height && col < width && mask[row][col] !== '*';
			if (isFieldAvailable) {
				wordLength++;
			}
			if (isFieldAvailable && !isWordStarted) {
				wordStartRow = row;
				wordStartCol = col;
				isWordStarted = true;
			} else if (!isFieldAvailable && isWordStarted) {
				if (wordLength > 1) {
					places.push({ row: wordStartRow, col: wordStartCol, length: wordLength, isVertical: isVertical, crossesTo: [], crossesFrom: [] });
				}
				wordLength = 0;
				isWordStarted = false;
			}
		}

		// скан маски по строкам
		isWordStarted = false;
		wordLength = 0;
		for (let row = 0; row <= height; row++) {
			for (let col = 0; col <= width; col++) {
				processCell(row, col, false);
			}
		}

		// скан маски по столбцам
		isWordStarted = false;
		wordLength = 0;
		for (let col = 0; col <= width; col++) {
			for (let row = 0; row <= height; row++) {
				processCell(row, col, true);
			}
		}

		this.addCrosses(places, height);
		return places;
	}

	private static addCrosses(places: WordPlace[], height: number) {
		console.log('Создание пересечений...');

		const crossMatrix: { place: WordPlace, pos: number }[][] = []; // матрица для выявления пересечений
		for (let row = 0; row < height; row++) {
			crossMatrix[row] = [];
		}

		for (const place of places.filter(place => !place.isVertical)) {
			for (let pos = 0; pos < place.length; pos++) {
				crossMatrix[place.row][place.col + pos] = { place: place, pos: pos };
			}
		}
		for (const place of places.filter(place => place.isVertical)) {
			for (let pos = 0; pos < place.length; pos++) {
				let crossingPlace = crossMatrix[place.row + pos][place.col];
				if (crossingPlace) {
					let toAdjacent: WordCross = { from: place, to: crossingPlace.place, fromWordPos: pos, toWordPos: crossingPlace.pos };
					let fromAdjacent: WordCross = { from: crossingPlace.place, to: place, fromWordPos: crossingPlace.pos, toWordPos: pos };
					place.crossesTo.push(toAdjacent);
					place.crossesFrom.push(fromAdjacent);
					crossingPlace.place.crossesTo.push(fromAdjacent);
					crossingPlace.place.crossesFrom.push(toAdjacent);
				}
			}
		}
	}
}
