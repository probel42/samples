import type { DataContext } from '../models/data-context.ts';
import type { WordPlace } from '../models/word-place.ts';

export type LLP = Map<number, Map<string, Map<number, string[]>>>
export type Domains = { llp: LLP, placeDomains: Map<WordPlace, string[]> }

export abstract class Solver {
	abstract solve(context: DataContext): string | undefined;

	initDomains(fullDomain: string[], places: WordPlace[]): Domains {
		console.log('Инициализация доменов...');

		const domains = {
			llp: new Map(),
			placeDomains: new Map<WordPlace, string[]>(places.map(place => [place, []]))
		};

		const lengthMap: Map<number, string[]> = new Map();
		fullDomain.forEach(word => {
			if (!domains.llp.has(word.length)) {
				domains.llp.set(word.length, new Map());
			}
			const llp2 = domains.llp.get(word.length);
			for (let i = 0; i < word.length; i++) {
				if (!llp2.has(word[i])) {
					llp2.set(word[i], new Map());
				}
				const llp3 = llp2.get(word[i]);
				if (!llp3.has(i)) {
					llp3.set(i, []);
				}
				const domain = llp3.get(i);
				domain.push(word);
			}

			if (!lengthMap.has(word.length)) {
				lengthMap.set(word.length, []);
			}
			lengthMap.get(word.length)?.push(word);
		});

		// домены мест
		for (const place of domains.placeDomains.keys()) {
			domains.placeDomains.set(place, lengthMap.get(place.length) || []);
		}

		return domains;
	}
}
