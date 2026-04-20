type IntDomainBuilder = { push: (value: number) => void, build: () => IntDomain };

/**
 * Это самое эффективное решение по компромиссу скорости и памяти, которое я нашёл.
 */
export class IntDomain implements Iterable<number> {
	private readonly array: Uint32Array;

	private constructor(array: Uint32Array) {
		this.array = array;
	}

	static EMPTY = new IntDomain(new Uint32Array(0));

	static createBuilder(initSize: number, maxSize: number): IntDomainBuilder {
		const buffer = new ArrayBuffer(initSize * 4, { maxByteLength: maxSize * 4 });
		const view = new Uint32Array(buffer);
		let count = 0;

		return {
			push: (value: number) => {
				if (count >= view.length) {
					buffer.resize((Math.floor(view.length * 1.5) + 1) * 4);
				}
				view[count++] = value;
			},
			build: () => {
				buffer.resize(count * 4);
				return new IntDomain(view.subarray(0, count));
			}
		};
	}

	*[Symbol.iterator](): Iterator<number> {
		for (let i = 0; i < this.array.length; i++) {
			yield this.array[i];
		}
	}

	intersect(other: IntDomain): IntDomain {
		let i = 0, j = 0, k = 0;
		const result = new Uint32Array(Math.min(this.array.length, other.array.length));
		while (i < this.array.length && j < other.array.length) {
			if (this.array[i] === other.array[j]) {
				result[k++] = this.array[i++];
				j++;
			} else if (this.array[i] < other.array[j]) {
				i++;
			} else {
				j++;
			}
		}
		return new IntDomain(result.subarray(0, k));
	}

	difference(other: IntDomain): IntDomain {
		let i = 0, j = 0, k = 0;
		const result = new Uint32Array(this.array.length);
		while (i < this.array.length) {
			if (j >= other.array.length) {
				result[k++] = this.array[i++];
			} else if (this.array[i] === other.array[j]) {
				i++;
				j++;
			} else if (this.array[i] < other.array[j]) {
				result[k++] = this.array[i++];
			} else {
				j++;
			}
		}
		return new IntDomain(result.subarray(0, k));
	}

	union(other: IntDomain): IntDomain {
		let i = 0, j = 0, k = 0;
		const result = new Uint32Array(this.array.length + other.array.length);
		while (i < this.array.length || j < other.array.length) {
			if (i >= this.array.length) {
				result[k++] = other.array[j++];
			} else if (j >= other.array.length) {
				result[k++] = this.array[i++];
			} else if (this.array[i] === other.array[j]) {
				result[k++] = this.array[i++];
				j++;
			} else if (this.array[i] < other.array[j]) {
				result[k++] = this.array[i++];
			} else {
				result[k++] = other.array[j++];
			}
		}
		return new IntDomain(result.subarray(0, k));
	}

	size(): number {
		return this.array.length;
	}
}
