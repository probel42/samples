import { IntDomain } from './int-domain.ts';
import type { IntDomainBuilder } from './int-domain.ts';
import type { WordPlace } from '../../models/word-place.ts';
import type { WordCross } from '../../models/word-cross.ts';

type LCP<T> = Map<number, Map<string, Map<number, T>>>
type PlaceToDomain<T> = Map<WordPlace, T>;

/**
 * Менеджер доменов.
 */
export class DomainsManager {
	private readonly fullDomain: string[];

	// домены по длине, букве, позиции (length, letter, position) (тройная мапа)
	private lcp: LCP<IntDomain> = new Map();

	// текущий домен на месте
	private placeToDomain: PlaceToDomain<IntDomain> = new Map();

	// удалённые домены (для восстановления)
	// ключ - пересечение от места наложившего ограничение к месту, на которое наложено ограничение
	private deletedDomain: Map<WordCross, IntDomain> = new Map();

	// также будем хранить тут уже заполненные места, чтобы не анализировать их повторно
	private places: Set<WordPlace> = new Set()

	constructor(fullDomain: string[]) {
		this.fullDomain = fullDomain;
	}

	init(places: WordPlace[]) {
		console.log('Инициализация доменов...');

		const lcpBuilders: LCP<IntDomainBuilder> = new Map();
		const lengthDomainsBuilders: Map<number, IntDomainBuilder> = new Map();
		for (let i = 0; i < this.fullDomain.length; i++) {
			const word = this.fullDomain[i];
			if (!lcpBuilders.has(word.length)) {
				lcpBuilders.set(word.length, new Map());
			}
			const lcpBuilders2 = lcpBuilders.get(word.length)!;
			for (let j = 0; j < word.length; j++) {
				if (!lcpBuilders2.has(word[j])) {
					lcpBuilders2.set(word[j], new Map());
				}
				const lcpBuilders3 = lcpBuilders2.get(word[j])!;
				if (!lcpBuilders3.has(j)) {
					lcpBuilders3.set(j, IntDomain.createBuilder(Math.floor(this.fullDomain.length / (10 * 25)), this.fullDomain.length));
				}
				lcpBuilders3.get(j)!.push(i);
			}

			if (!lengthDomainsBuilders.has(word.length)) {
				lengthDomainsBuilders.set(word.length, IntDomain.createBuilder(Math.floor(this.fullDomain.length / 10), this.fullDomain.length));
			}
			lengthDomainsBuilders.get(word.length)!.push(i);
		}
		// копируем в готовую мапу с построением из билдеров
		for (const [length, lcpBuilders2] of lcpBuilders) {
			this.lcp.set(length, new Map());
			const lcp2 = this.lcp.get(length)!;
			for (const [char, lcpBuilder3] of lcpBuilders2) {
				lcp2.set(char, new Map());
				const lcp3 = lcp2.get(char)!;
				for (const [pos, builder] of lcpBuilder3) {
					lcp3.set(pos, builder.build());
				}
			}
		}

		// домены мест
		const lengthDomains: Map<number, IntDomain> = new Map();
		for (const [length, builder] of lengthDomainsBuilders) {
			lengthDomains.set(length, builder.build());
		}
		for (const place of places) {
			this.placeToDomain.set(place, lengthDomains.get(place.length));
		}
	}

	getPlaceDomain(place: WordPlace): IterableIterator<string> {
		return this.getPlaceDomainGenerator(this.placeToDomain.get(place));
	}

	getPlaceDomainSize(place: WordPlace): number {
		return this.placeToDomain.get(place).size();
	}

	private *getPlaceDomainGenerator(intDomain: IntDomain): IterableIterator<string> {
		for (const index of intDomain) {
			yield this.fullDomain[index];
		}
	}

	attachPlacement(place: WordPlace, word: string) {
		this.places.add(place);
		for (const cross of place.crossesTo.filter(cross => !this.places.has(cross.to))) {
			const currentDomain = this.placeToDomain.get(cross.to);
			const lcpDomain = this.lcp.get(cross.to.length)?.get(word[cross.fromWordPos])?.get(cross.toWordPos) ?? IntDomain.EMTPY;
			this.deletedDomain.set(cross, currentDomain.difference(lcpDomain));
			this.placeToDomain.set(cross.to, currentDomain.intersect(lcpDomain));
		}
	}

	detachPlacement(place: WordPlace) {
		this.places.delete(place);
		for (const cross of place.crossesTo.filter(cross => !this.places.has(cross.to))) {
			const currentDomain = this.placeToDomain.get(cross.to);
			const deletedDomain = this.deletedDomain.get(cross) ?? IntDomain.EMPTY;
			this.placeToDomain.set(cross.to, currentDomain.union(deletedDomain));
			this.deletedDomain.delete(cross);
		}
	}
}
