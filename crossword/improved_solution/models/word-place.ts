import type { WordCross } from './word-cross.ts';

/**
 * Место под слово.
 */
export type WordPlace = {
	row: number;
	col: number;
	length: number;
	isVertical: boolean;
	crossesTo: WordCross[]; // -> к другим
	crossesFrom: WordCross[]; // <- к себе
}
