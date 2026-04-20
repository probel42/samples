import type { WordPlace } from './word-place.ts';

/**
 * Пересечение двух мест под слова (направленное для удобства использования графа).
 */
export type WordCross = {
	from: WordPlace;
	to: WordPlace;
	fromWordPos: number;
	toWordPos: number;
}
