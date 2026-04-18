import type { DataContext } from '../../models/data-context.ts';

export abstract class Solver {
	abstract solve(context: DataContext): string | undefined;
}
