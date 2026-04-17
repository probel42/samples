/**
 * 1. Будем считать, что под словом всегда подразумевается последовательность букв, всегда больше одной буквы.
 * 2. В маске не может быть "дырки". Отдельной ячейки не соприкасающейся с остальными. Это валидируется.
 * 3. С голым полем 7x7 справляется не очень, но это и не удивительно.
 * 4. node crossword.js < input.txt
 *
 *
 * Описание решения:
 *
 * 1. Выстраивание графа, где вершины это размещения слов (позиции для слов), а рёбра - пересечения.
 * В данном случае граф направленный (для удобства). Так же в вершинах-размещениях хранятся соотв. домены слов (под размер).
 *
 * 2. Записываем словарь из файла. Для быстрого поиска формируем мапу по трём ключам: длина слова, буква, позиция буквы.
 *
 * 3. Данные между функциями передаются в контексте (DataContext), а также в состоянии специального объекта для вывода (StepsCanvas),
 * который хранит в себе текущее состояние со стеком диффов (для удобства отката).
 *
 * 4. Также в рекурсивной функции обхода графа предусмотрены прыжки в случае тупика, что также решает проблему разрывов в графе.
 * Т.е. если позиции под слова в маске объединяются в более чем 1 граф.
 *
 *
 * P.S. В теории, конечно, можно подумать над ускорением. Например, варианты типа AC-3 для сокращения доменов расположений или, например,
 * сортировка в домене по каким-нибудь признакам типа кол-ва допустимых пересекающихся слов.
 * Однако, они не давали каких-либо преимуществ по скорости.
 *
 */


const fs = require('fs');
const readline = require('readline');

// выключим логирование
console.debug = () => {};
console.log = () => {};

function main() {
	const rl = readline.createInterface({
		input: process.stdin,
		terminal: true
	});

	const mask = [];

	rl.on('line', (input) => mask.push(input));
	rl.on('close', () => {
		if (!validate(mask)) {
			return;
		}

		// init
		const context = new DataContext(); // будем хранить используемые константы и структуры данных в контексте
		initMaskData(mask, context);
		const dict = loadDictionary('words.txt');
		if (!dict) {
			return;
		}
		initDictData(dict, context);

		// поиск
		let result = createCrossword(context);
		if (result) {
			process.stdout.write(result);
		} else {
			console.warn('Решение не найдено.');
		}
	});
}

// Первичная валидация маски
function validate(mask) {
	console.log('Валидация исходной маски...');
	if (mask.length === 0) {
		console.warn('Маска пуста.');
		return false;
	}
	if (mask.length === 1 && mask[0].length === 1) {
		console.warn('Маска не может содержать одну ячейку.');
		return false;
	}
	const expectedLength = mask[0].length;
	if (mask.some(line => line.length !== expectedLength)) {
		console.warn('Маска должна быть прямоугольником.');
		return false;
	}
	// ещё одна небольшая проверка на отсутствие изолированных одиночных клеток.
	if (mask.some((row, y) => [...row].some((val, x) => val !== '*' &&
		[mask[y - 1]?.[x], mask[y + 1]?.[x], mask[y]?.[x - 1], mask[y]?.[x + 1]].every(n => (n ?? '*') === '*')))) {
		console.warn('Маска не должна содержать изолированные одиночные клетки.');
		return false;
	}
	return true;
}

// Инициализация данных из маски
function initMaskData(mask, context) {
	console.log('Инициализация данных маски...');
	context.height = mask.length;
	context.width = mask[0].length;
	initPlaces(mask, context);
	initCrosses(context);
}

// Размещения (места под слова)
function initPlaces(mask, context) {
	context.places = [];

	// логика для горизонтального и вертикального сканирования идентична, поэтому DRY
	let isWordStarted, wordLength, wordStartRow, wordStartCol;
	let processCell = (row, col, isVertical) => {
		let isFieldAvailable = row < context.height && col < context.width && mask[row][col] !== '*';
		if (isFieldAvailable) {
			wordLength++;
		}
		if (isFieldAvailable && !isWordStarted) {
			wordStartRow = row;
			wordStartCol = col;
			isWordStarted = true;
		} else if (!isFieldAvailable && isWordStarted) {
			if (wordLength > 1) {
				context.places.push(new WordPlace(wordStartRow, wordStartCol, wordLength, isVertical));
			}
			wordLength = 0;
			isWordStarted = false;
		}
	}

	// скан маски по строкам
	isWordStarted = false;
	wordLength = 0;
	for (let row = 0; row <= context.height; row++) {
		for (let col = 0; col <= context.width; col++) {
			processCell(row, col, false);
		}
	}

	// скан маски по столбцам
	isWordStarted = false;
	wordLength = 0;
	for (let col = 0; col <= context.width; col++) {
		for (let row = 0; row <= context.height; row++) {
			processCell(row, col, true);
		}
	}
}

// Пересечения слов
function initCrosses(context) {
	let crossMatrix = []; // матрица для выявления пересечений
	for (let row = 0; row < context.height; row++) {
		crossMatrix[row] = [];
	}

	context.places.filter(place => !place.isVertical).forEach(place => {
		for (let pos = 0; pos < place.length; pos++) {
			crossMatrix[place.row][place.col + pos] = { place: place, pos: pos };
		}
	});
	context.places.filter(place => place.isVertical).forEach(place => {
		for (let pos = 0; pos < place.length; pos++) {
			let crossingPlace = crossMatrix[place.row + pos][place.col];
			if (crossingPlace) {
				let toAdjacent = new WordCross(place, crossingPlace.place, pos, crossingPlace.pos);
				let fromAdjacent = new WordCross(crossingPlace.place, place, crossingPlace.pos, pos);
				place.crossesTo.push(toAdjacent);
				place.crossesFrom.push(fromAdjacent);
				crossingPlace.place.crossesTo.push(fromAdjacent);
				crossingPlace.place.crossesFrom.push(toAdjacent);
			}
		}
	});
}

// Загрузка словаря
function loadDictionary(name) {
	try {
		const data = fs.readFileSync(name, 'utf8');
		let lines = data
			.split('\n')
			.map(line => line.trim())
			.filter(line => line.length > 1);
		if (lines.length === 0) {
			console.warn('Файл словаря пуст.');
			return undefined;
		}
		return [...new Set(lines)];
	} catch (err) {
		console.warn("Не найден файл словаря.");
		return undefined;
	}
}

// Инициализация данных из словаря
function initDictData(dict, context) {
	console.log('Инициализация данных LLP-словаря...');
	context.llp = new Map(); // домены по длине, букве, позиции (length, letter, position) (тройная мапа).

	let lengthMap = new Map();
	dict.forEach(word => {
		if (!context.llp.has(word.length)) {
			context.llp.set(word.length, new Map());
		}
		let llp2 = context.llp.get(word.length);
		for (let i = 0; i < word.length; i++) {
			if (!llp2.has(word[i])) {
				llp2.set(word[i], new Map());
			}
			let llp3 = llp2.get(word[i]);
			if (!llp3.has(i)) {
				llp3.set(i, []);
			}
			let domain = llp3.get(i);
			domain.push(word);
		}

		if (!lengthMap.has(word.length)) {
			lengthMap.set(word.length, []);
		}
		lengthMap.get(word.length).push(word);
	});

	// домены размещений
	context.places.forEach(place => {
		place.domain = lengthMap.get(place.length);
	});
}

// Запуск решения
function createCrossword(context) {
	console.log('Начало алгоритма...');
	if (context.places.some(place => place.domain.length === 0)) {
		console.warn('Решение не найдено.');
		return undefined;
	}

	// класс для записи результата с хранением шагов заполнения (и возможностью отката шагов)
	const resultCanvas = new StepsCanvas(context.height, context.width);

	// начнём с размещения с самым небольшим доменом
	const firstPlace = context.places.reduce((min, curr) => curr.domain.length < min.domain.length ? curr : min);

	for (const word of firstPlace.domain) {
		let result = digIn(firstPlace, word, context, resultCanvas);
		if (result === 'ok') {
			return resultCanvas.toString();
		}
	}
	return undefined;
}

// Перебор (рекурсивный)
function digIn(place, word, context, resultCanvas) {
	// устанавливаем слово в позицию
	resultCanvas.applyWord(place, word);
	if (resultCanvas.checkReadiness(context.places.length)) {
		return 'ok';
	}

	// куда можно идти дальше
	let availableCrosses = place.crossesTo.filter(cross => resultCanvas.checkPlaceAvailable(cross.to));

	// если некуда, то обрабатываем тупик (нужно найти размещение для прыжка и продолжить рекурсию оттуда)
	if (availableCrosses.length === 0) {
		// берём свободное место для установки
		place = resultCanvas.getFreePlace();
		if (!place) {
			// если не нашли, то попробуем взять из всех мест (возможно в графе "разрывы")
			place = context.places.find(p => resultCanvas.checkPlaceAvailable(p));
		}
		if (!place) {
			return 'end';
		}

		for (const nextWord of place.domain) {
			if (resultCanvas.checkApplyPossibility(place, nextWord)) {
				let digInResult = digIn(place, nextWord, context, resultCanvas);
				if (digInResult === 'ok') {
					return digInResult;
				}
				resultCanvas.reverseLast();
			}
		}
		return 'end';
	}

	// по всем доступным переходам
	while (availableCrosses.length > 0) {
		let cross = availableCrosses.pop();
		// домен по llp
		let domain = context.llp.get(cross.to.length)?.get(word[cross.fromWordPos])?.get(cross.toWordPos) ?? [];

		// по всем словам полученного домена
		for (const nextWord of domain) {
			if (resultCanvas.checkApplyPossibility(cross.to, nextWord)) {
				let digInResult = digIn(cross.to, nextWord, context, resultCanvas);
				if (digInResult === 'ok') {
					return digInResult;
				}
				resultCanvas.reverseLast();
			}
		}
	}
	return 'end';
}

class WordPlace {
	row;
	col;
	length;
	isVertical;
	crossesTo; // -> к другим
	crossesFrom; // <- к себе
	domain;

	constructor(row, col, length, isVertical) {
		this.row = row;
		this.col = col;
		this.length = length;
		this.isVertical = isVertical;
		this.crossesTo = [];
		this.crossesFrom = [];
	}
}

/**
 * Пересечение позиций.
 */
class WordCross {
	from;
	to;
	fromWordPos;
	toWordPos;

	constructor(from, to, fromWordPos, toWordPos) {
		this.from = from;
		this.to = to;
		this.fromWordPos = fromWordPos;
		this.toWordPos = toWordPos;
	}
}

/**
 * Динамически формируемый (по шагам) объект результата.
 * Включает в себя также стэк диффов для удобной отмены заполнения.
 */
class StepsCanvas {
	height;
	width;
	elems;
	stepsStack;

	constructor(height, width) {
		this.height = height;
		this.width = width;
		this.elems = [];
		this.stepsStack = [];
		for (let row = 0; row < height; row++) {
			this.elems[row] = [];
		}
	}

	checkPlaceAvailable(place) {
		return this.stepsStack.every(s => s.place !== place);
	}

	checkApplyPossibility(place, word) {
		if (this.stepsStack.some(s => s.word === word)) {
			return false;
		}
		let row = place.row;
		let col = place.col;
		for (let i = 0; i < place.length; i++) {
			if (this.elems[row][col] && this.elems[row][col] !== word[i]) {
				return false;
			}
			if (place.isVertical) {
				row++;
			} else {
				col++;
			}
		}
		return true;
	}

	applyWord(place, word) {
		let diff = [];
		let row = place.row;
		let col = place.col;
		for (let i = 0; i < place.length; i++) {
			if (!this.elems[row][col]) {
				diff.push({ row: row, col: col, letter: word[i] });
				this.elems[row][col] = word[i];
			}
			if (place.isVertical) {
				row++;
			} else {
				col++;
			}
		}
		this.stepsStack.push(new StepItem(place, word, diff));
	}

	reverseLast() {
		let stackItem = this.stepsStack.pop();
		stackItem.diff.forEach(d => this.elems[d.row][d.col] = undefined);
	}

	getFreePlace() {
		return this.stepsStack.map(step => step.place.crossesTo).flatMap(crosses => crosses.map(c => c.to))
			.find(place => this.stepsStack.every(step => step.place !== place));
	}

	checkReadiness(placesNumber) {
		return this.stepsStack.length === placesNumber;
	}

	toString() {
		let result = '';
		for (let row = 0; row < this.height; row++) {
			for (let col = 0; col < this.width; col++) {
				result += this.elems[row][col] || '*';
			}
			result += '\n';
		}
		return result;
	}
}

class StepItem {
	place;
	word;
	diff; // массив { row, col, letter }, устанавливается при наложении на матрицу

	constructor(place, word, diff) {
		this.place = place;
		this.word = word;
		this.diff = diff;
	}
}

class DataContext {
	height;
	width;
	places;
	llp;
}

main();