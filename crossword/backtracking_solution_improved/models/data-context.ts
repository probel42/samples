import type { WordPlace } from './word-place.ts';

/**
 * Контекст. Хранит данные необходимые для вычисления.
 */
export type DataContext = {
	// высота
	height: number;

	// ширина
	width: number;

	// места под слова
	places: WordPlace[];

	// полный домен (все слова)
	domain: string[];
}
