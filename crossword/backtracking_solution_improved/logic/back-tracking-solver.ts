import { Solver } from './solver.ts';
import { PlacementSolution } from './placement-solution.ts';
import type { Domains } from './solver.ts';
import type { DataContext } from '../models/data-context.ts';
import type { WordPlace } from '../models/word-place.ts';

/**
 * Решение с простым back-tracking.
 */
export class BackTrackingSolver extends Solver {
	solve(context: DataContext): string | undefined {
		console.log('Начало алгоритма...');

		// подготовка доменов
		const domains = super.initDomains(context.domain, context.places);
		for (const domain of domains.placeDomains.values()) {
			if (domain.length === 0) {
				console.warn('Решение не найдено.');
				return undefined;
			}
		}

		// класс для записи результата
		const placementSolution = new PlacementSolution(context.height, context.width, context.places.length);

		// начнём с мест с самым небольшим доменом todo
		const firstPlace = domains.placeDomains.keys().next().value;

		for (const word of domains.placeDomains.get(firstPlace)) {
			const result = this.digIn(firstPlace, word, context, domains, placementSolution);
			if (result === 'ok') {
				return placementSolution.toString();
			}
		}
		return undefined;
	}

	// перебор (рекурсивный)
	private digIn(place: WordPlace, word: string, context: DataContext, domains: Domains, placementSolution: PlacementSolution): string {
		placementSolution.applyWord(place, word);
		if (placementSolution.checkReadiness()) {
			return 'ok';
		}

		// куда можно идти дальше
		const availableCrosses = place.crossesTo.filter(cross => placementSolution.checkPlaceAvailable(cross.to));

		// если некуда, то обрабатываем тупик (нужно найти место для прыжка и продолжить рекурсию оттуда)
		if (availableCrosses.length === 0) {
			// берём свободное место для установки
			let nextPlace = placementSolution.getFreeReachablePlace();
			if (!nextPlace) {
				// если не нашли, то попробуем взять из всех мест (возможно в графе "разрывы")
				nextPlace = context.places.find(p => placementSolution.checkPlaceAvailable(p));
			}
			if (!nextPlace) {
				placementSolution.removeWord(place, word);
				return 'end';
			}

			// домен по месту
			const domain = domains.placeDomains.get(nextPlace);

			for (const nextWord of domain) {
				if (placementSolution.checkWordAvailable(nextPlace, nextWord) && placementSolution.checkCompatibility(nextPlace, nextWord)) {
					const digInResult = this.digIn(nextPlace, nextWord, context, domains, placementSolution);
					if (digInResult === 'ok') {
						return digInResult;
					}
				}
			}
			placementSolution.removeWord(place, word);
			return 'end';
		}

		// по всем доступным переходам
		while (availableCrosses.length > 0) {
			const cross = availableCrosses.pop();
			const nextPlace = cross.to;

			// домен по llp
			const domain = domains.llp.get(cross.to.length)?.get(word[cross.fromWordPos])?.get(cross.toWordPos) ?? [];

			for (const nextWord of domain) {
				if (placementSolution.checkWordAvailable(nextPlace, nextWord) && placementSolution.checkCompatibility(nextPlace, nextWord)) {
					const digInResult = this.digIn(nextPlace, nextWord, context, domains, placementSolution);
					if (digInResult === 'ok') {
						return digInResult;
					}
				}
			}
		}
		placementSolution.removeWord(place, word);
		return 'end';
	}
}
