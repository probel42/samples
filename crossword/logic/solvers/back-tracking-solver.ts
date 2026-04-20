import { Solver } from './solver.ts';
import { PlacementSolution } from '../placement-solution.ts';
import { DomainsManager } from '../domains/domains-manager.ts';
import type { DataContext } from '../../models/data-context.ts';
import type { WordPlace } from '../../models/word-place.ts';

/**
 * Решение с back-tracking.
 */
export class BackTrackingSolver extends Solver {
	solve(context: DataContext): string | undefined {
		console.log('Начало алгоритма...');

		// класс для записи результата
		const placementSolution = new PlacementSolution(context.height, context.width, context.places.length);

		// подготовка доменов
		const domainManager = new DomainsManager(context.domain);
		domainManager.init(context.places);

		// обход
		const result = this.digIn(context, domainManager, placementSolution);
		if (result === 'ok') {
			return placementSolution.toString();
		}
		return undefined;
	}

	// перебор (рекурсивный)
	private digIn(context: DataContext, domainManager: DomainsManager, placementSolution: PlacementSolution): string {
		if (context.places.every(place => domainManager.getPlaceDomainSize(place) > 0)) {
			const place = this.getNextPlace(context, domainManager, placementSolution);
			if (place) {
				for (const word of domainManager.getPlaceDomain(place)) {
					if (!placementSolution.checkWordAvailable(word) ||
						!placementSolution.checkCompatibility(place, word)) {
						continue;
					}
					placementSolution.attachPlacement(place, word);
					if (placementSolution.checkReadiness()) {
						return 'ok';
					}
					domainManager.attachPlacement(place, word);
					const digInResult = this.digIn(context, domainManager, placementSolution);
					if (digInResult === 'ok') {
						return digInResult;
					}
					domainManager.detachPlacement(place);
					placementSolution.detachPlacement(place);
				}
			}
		}
		return 'end';
	}

	private getNextPlace(context: DataContext, domainManager: DomainsManager, placementSolution: PlacementSolution): WordPlace | undefined {
		const availablePlaces = context.places.filter(place => placementSolution.checkPlaceAvailable(place));
		return availablePlaces.length > 0
			? availablePlaces.reduce((min, curr) => domainManager.getPlaceDomainSize(curr) < domainManager.getPlaceDomainSize(min) ? curr : min)
			: undefined;
	}
}
