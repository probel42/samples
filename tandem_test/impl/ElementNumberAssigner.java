package ru.tandemservice.test.task2.impl;

import ru.tandemservice.test.task2.IElement;
import ru.tandemservice.test.task2.IElementNumberAssigner;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

/**
 * <h1>Задание №2</h1>
 * Реализуйте интерфейс {@link IElementNumberAssigner}.
 *
 * <p>Помимо качества кода, мы будем обращать внимание на оптимальность предложенного алгоритма по времени работы
 * с учетом скорости выполнения операции присвоения номера:
 * большим плюсом (хотя это и не обязательно) будет оценка числа операций, доказательство оптимальности
 * или указание области, в которой алгоритм будет оптимальным.</p>
 */
public class ElementNumberAssigner implements IElementNumberAssigner {
	@Override
	public void assignNumbers(final List<IElement> elements) {
		// честно говоря, я не помню таких алгоритмов, соответственно, возможно, получится велосипед

		// сначала перегоним в массив
		// (т.к. в методе есть взятие элемента из середины, а нам могут передать LinkedList)
		final IElement[] elementsArray = elements.toArray(new IElement[0]);

		// основная идея: будем сортировать не сам массив, а индексы позиций,
		// таким образом мы найдём нужную информацию для сортировки за O(N), не трогая сам массив.
		// после сортировки у нас будет массив, в котором в каждой позиции будет индекс элемента
		// (из оригинального массива), номер которого должен находится на этой позиции (от 0)
		// пример:
		// исходный массив:         8 7 3 6 2 1 4
		// отсортированный массив:  1 2 3 4 6 7 8
		// fromPos:                 5 4 2 6 3 1 0 (из какой позиции брать номер (от 0))
		// toPos:                   6 5 2 4 1 0 3 (в какую позицию ставить номер (от 0))
		Integer[] fromPos = new Integer[elementsArray.length];
		for (int i = 0; i < fromPos.length; ++i) {
			fromPos[i] = i;
		}
		Arrays.sort(fromPos, Comparator.comparingInt(pos -> elementsArray[pos].getNumber()));
		// нам нужен массив индексов, которые указывают где должен находится номер элемента из оригинального массива
		Integer[] toPos = new Integer[fromPos.length];
		for (int i = 0; i < fromPos.length; ++i) {
			toPos[fromPos[i]] = i;
		}

		// далее найдём номер, который не присвоен ни одному элементу
		int tmpNumber = elementsArray.length;
		for (int i = elementsArray.length - 1; i >= 0; --i) {
			int number = elementsArray[fromPos[i]].getNumber();
			if (number < tmpNumber) {
				break;
			}
			if (number == tmpNumber) {
				--tmpNumber;
			}
		}

		// пройдёмся по массиву в поисках номеров, которые находятся не в своей позиции
		for (int i = 0; i < elementsArray.length; ++i) {
			// если номер находится не в своей позиции, то поменяем номера по цепочке
			if (i != toPos[i]) {
				int nextIndex = i;
				int nextNumber = tmpNumber;
				do {
					// поставим число в нужную позицию, предварительно взяв оттуда то, что там было
					int tmp = elementsArray[nextIndex].getNumber();
					elementsArray[nextIndex].setupNumber(nextNumber);
					nextNumber = tmp;

					// отметим, что тут массив упорядочен, и сдвинем индекс дальше по цепочке
					tmp = toPos[nextIndex];
					// в этой позиции массив упорядочен, только если мы поставили нужное число, а не tmpNumber
					if (elementsArray[nextIndex].getNumber() != tmpNumber) {
						toPos[nextIndex] = nextIndex;
					}
					nextIndex = tmp;
				}
				while (toPos[nextIndex] != nextIndex);
			}
		}

		/*
		Итого получилось не более 3*N/2 вызовов setupNumber (а так же 3N дополнительной памяти и O(N*log(N)) времени).

		Примерное объяснение почему 3*N/2:
		После получения всех нужных данных, алгоритм проходит по массиву
		в поиске элементов, номера которых стоят не на нужном месте.
		Далее в это место ставится tmpNumber (элементов с таким номером гарантированно в списке нет).
		То, что там было до этого, нужно поставить в другую позицию, переходим в эту позицию и ставим,
		взяв то, что там было до этого, и т.д. Таким образом инициируется цепочка замен, которая всегда заканчивается
		на исходном индексе (т.к. в любом случае есть номер, который должен стоять на исходном индексе).
		В лучшем случае эта цепочка будет охватывать все элементы, номера которых стоят не на нужном месте,
		(пример {8, 7, 3, 6, 2, 1, 4}) и в итоге получим <= N + 1 вызовов setupNumber
		(в этом примере получится 7, а не 8 вызовов, т.к. тройка уже стоит там где нужно, и в цепочку замен она не войдёт)
		Но в худшем случае цепочка вернётся на изначальный индекс сразу же,
		таким образом при установке двух элементов setupNumber вызовется 3 раза:
			1). Ставим tmpNumber в первую позицию, беря из неё number
			2). Ставим этот number в нужную позицию, беря из неё number
			3). Ставим этот number в начальную позицию убирая оттуда tmpNumber
		И если весь массив состоит из таких коротких цепочек
		(например отсортированный в обратном порядке массив (элементы: первый-последний, второй-предпоследний, и т.д.)),
		то получим 3*N/2 вызовов. И это потолок скорости. Похоже быстрее никак.
		*/
	}
}
