import { YatayCli } from "./yatay-cli";
import { YatayToken, YatayTokenKind } from "./yatay-token";

/**
 * Scanner that can extract the tokens contained in the character stream of a Yatay source code file.
 */
export class YatayScanner {

	/**
	 * A reference to the calling CLI.
	 */
	private readonly cli: YatayCli;

	/**
	 * The source code stream to scan.
	 */
	private readonly sourceCode: string;

	/**
	 * The list of tokens successfully scanned from the source code stream.
	 */
	private readonly tokens: YatayToken[];

	/**
	 * A collection that matches lexemes with keyword kinds.
	 */
	private readonly keywordMap: Map<string, YatayTokenKind>;

	/**
	 * The index of the first character of the currently processed token in the source code stream.
	 */
	private tokenStart: number = 0;

	/**
	 * The index of the current character in the source code stream.
	 */
	private currentIndex: number = 0;

	/**
	 * The line number of the current character in the source code stream.
	 */
	private currentLine: number = 1;

	constructor(cli: YatayCli, sourceCode: string) {
		this.cli = cli;
		this.sourceCode = sourceCode;
		this.tokens = [];
		this.keywordMap = new Map([
			["base", YatayTokenKind.KeywordBase],
			["clase", YatayTokenKind.KeywordClase],
			["definir", YatayTokenKind.KeywordDefinir],
			["devolver", YatayTokenKind.KeywordDevolver],
			["falso", YatayTokenKind.KeywordFalso],
			["instancia", YatayTokenKind.KeywordInstancia],
			["mientras", YatayTokenKind.KeywordMientras],
			["no", YatayTokenKind.KeywordNo],
			["o", YatayTokenKind.KeywordO],
			["repetir", YatayTokenKind.KeywordRepetir],
			["si", YatayTokenKind.KeywordSi],
			["sino", YatayTokenKind.KeywordSino],
			["verdadero", YatayTokenKind.KeywordVerdadero],
			["y", YatayTokenKind.KeywordY],
		]);
	}

	/**
	 * The index of the previous character in the source code stream.
	 */
	private get previousIndex(): number {
		return this.currentIndex - 1;
	}

	/**
	 * The index of the next character in the source code stream.
	 */
	private get nextIndex(): number {
		return this.currentIndex + 1;
	}

	/**
	 * The previous character in the source code stream.
	 */
	private get previousCharacter(): string {
		if (this.isAtStart) {
			return "\0";
		}
		else {
			return this.sourceCode.charAt(this.previousIndex);
		}
	}

	/**
	 * The current character in the source code stream.
	 */
	private get currentCharacter(): string {
		if (this.isAtEnd) {
			return "\0";
		}
		else {
			return this.sourceCode.charAt(this.currentIndex);
		}
	}

	/**
	 * The next character in the source code stream.
	 */
	private get nextCharacter(): string {
		if (this.isNextAtEnd) {
			return "\0";
		}
		else {
			return this.sourceCode.charAt(this.nextIndex);
		}
	}

	/**
	 * It's _true_ if the current character in the source code stream is at the start of file and _false_ otherwise.
	 */
	private get isAtStart(): boolean {
		return this.currentIndex <= 0;
	}

	/**
	 * It's _true_ if the current character in the source code stream is at the end of file and _false_ otherwise.
	 */
	private get isAtEnd(): boolean {
		return this.currentIndex >= this.sourceCode.length;
	}

	/**
	 * It's _true_ if the next character in the source code stream is at the end of file and _false_ otherwise.
	 */
	private get isNextAtEnd(): boolean {
		return this.nextIndex >= this.sourceCode.length;
	}

	/**
	 * Scans the source code and returns the list of the tokens it represents.
	 */
	scanTokens(): YatayToken[] {
		while (!this.isAtEnd) {
			this.tokenStart = this.currentIndex;
			this.scanToken();
		}

		const endOfFileToken: YatayToken = new YatayToken(
			YatayTokenKind.EndOfFile,
			"",
			null,
			this.currentLine
		);
		this.tokens.push(endOfFileToken);

		return this.tokens;
	}

	/**
	 * Consumes a token from the source code stream and, if valid, adds it to the result.
	 *
	 * Lexically invalid tokens are discarded and issued as errors.
	 */
	private scanToken(): void {
		const character: string = this.advance();

		switch (character) {
			case "(": {
				this.addToken(YatayTokenKind.OpeningParenthesis);
				break;
			}
			case ")": {
				this.addToken(YatayTokenKind.ClosingParenthesis);
				break;
			}
			case "[": {
				this.addToken(YatayTokenKind.OpeningSquareBracket);
				break;
			}
			case "]": {
				this.addToken(YatayTokenKind.ClosingSquareBracket);
				break;
			}
			case "{": {
				this.addToken(YatayTokenKind.OpeningCurlyBrace);
				break;
			}
			case "}": {
				this.addToken(YatayTokenKind.ClosingCurlyBrace);
				break;
			}
			case ".": {
				this.addToken(YatayTokenKind.Dot);
				break;
			}
			case ",": {
				this.addToken(YatayTokenKind.Comma);
				break;
			}
			case ":": {
				if (this.match(":")) {
					this.consumeLineComment();
				}
				else {
					this.addToken(YatayTokenKind.Colon);
				}
				break;
			}
			case ";": {
				this.addToken(YatayTokenKind.Semicolon);
				break;
			}
			case "#": {
				this.addToken(YatayTokenKind.Hash);
				break;
			}
			case "+": {
				this.addToken(YatayTokenKind.Plus);
				break;
			}
			case "-": {
				this.addToken(YatayTokenKind.Minus);
				break;
			}
			case "*": {
				this.addToken(YatayTokenKind.Asterisk);
				break;
			}
			case "/": {
				if (this.match("/")) {
					this.addToken(YatayTokenKind.DoubleSlash);
				}
				else {
					this.addToken(YatayTokenKind.Slash);
				}
				break;
			}
			case "=": {
				if (this.match("<")) {
					this.addToken(YatayTokenKind.LessOrEqual);
				}
				else {
					this.addToken(YatayTokenKind.Equal);
				}
				break;
			}
			case ">": {
				if (this.match("<")) {
					this.addToken(YatayTokenKind.Unequal);
				}
				else if (this.match("=")) {
					this.addToken(YatayTokenKind.GreaterOrEqual);
				}
				else {
					this.addToken(YatayTokenKind.Greater);
				}
				break;
			}
			case "<": {
				if (this.match("=")) {
					this.addToken(YatayTokenKind.Assign);
				}
				else {
					this.addToken(YatayTokenKind.Less);
				}
				break;
			}
			case " ":
			case "\r":
			case "\t": {
				// Ignore whitespace.
				break;
			}
			case "\n": {
				this.currentLine++;
				break;
			}
			case '"': {
				this.finishString();
				break;
			}
			default: {
				if (this.isDigit(character)) {
					this.finishNumber();
				}
				else if (this.isIdentifierStarter(character)) {
					this.finishIdentifier();
				}
				else {
					this.announceError(
						`Se encontró un carácter inesperado: "${character}".`
					);
				}
				break;
			}
		}
	}

	/**
	 * Unconditionally consumes a character from the source code stream and returns it.
	 */
	private advance(): string {
		return this.sourceCode[this.currentIndex++];
	}

	/**
	 * Returns _true_ and conditionally consumes a character from the source code stream if it matches the expected one,
	 * or just returns _false_ otherwise.
	 *
	 * @param expected the character to compare with.
	 */
	private match(expected: string): boolean {
		if (this.isAtEnd || this.sourceCode.charAt(this.currentIndex) !== expected) {
			return false;
		}

		this.currentIndex++;
		return true;
	}

	/**
	 * Creates a token of the provided kind, with a specific literal value if passed, and adds it to the result.
	 *
	 * @param kind the kind of token to add to the result.
	 * @param literal the literal value of the token, if appropiate (it is _null_ by default).
	 */
	private addToken(
		kind: YatayTokenKind,
		literal: string | number | null = null
	): void {
		const lexeme: string = this.sourceCode.substring(this.tokenStart, this.currentIndex);
		const newToken: YatayToken = new YatayToken(
			kind,
			lexeme,
			literal,
			this.currentLine
		);

		this.tokens.push(newToken);
	}

	/**
	 * Announces a scanning error to the CLI with the provided message.
	 *
	 * @param message the message to include in the announced error.
	 */
	private announceError(message: string): void {
		this.cli.announceScanningError(this.currentLine, message);
	}

	/**
	 * Consumes a line comment form the source code stream and discards it.
	 */
	private consumeLineComment(): void {
		while (this.currentCharacter !== "\n" && !this.isAtEnd) {
			this.advance();
		}
	}

	/**
	 * Consumes a string from the source code stream (after having consumed the opening quotation mark) and adds the
	 * corresponding token to the result.
	 *
	 * If a new line or the end of the file is reached before finding a closing quotation mark, an error will be issued.
	 */
	private finishString(): void {
		while (this.currentCharacter !== '"' && this.currentCharacter !== "\n" && !this.isAtEnd) {
			this.advance();
		}

		if (this.currentCharacter === "\n" || this.isAtEnd) {
			this.announceError("No se encontró la comilla de cierre del texto.");
			return;
		}

		// Consume the closing quotation mark.
		this.advance();

		const value: string = this.sourceCode.substring(
			this.tokenStart + 1,
			this.currentIndex - 1
		);
		this.addToken(YatayTokenKind.String, value);
	}

	/**
	 * Consumes a number from the source code stream (after having consumed the first digit) and adds the corresponding
	 * token to the result.
	 *
	 * If a number separator is found in an inappropiate place, an error will be issued.
	 */
	private finishNumber(): void {
		this.consumeInteger();

		if (this.isDecimalSeparator(this.currentCharacter) && this.isIntegerNonStarter(this.nextCharacter)) {
			this.consumeDecimalSeparator();
			this.consumeInteger();
		}

		// Issue an error if the last character in the number was a number separator.
		if (this.isNumberSeparator(this.previousCharacter)) {
			this.announceError("Un número no puede terminar en guión bajo.");
		}

		const value: number = Number.parseFloat(
			this.sourceCode
				.substring(this.tokenStart, this.currentIndex)
				.replace(/,/g, ".")
				.replace(/_/g, "")
		);

		this.validateNumberIsRepresentable(value);

		this.addToken(YatayTokenKind.Number, value);
	}

	/**
	 * Consumes an integer number from the source code stream.
	 *
	 * If two or more number separators are found together, an error will be issued.
	 */
	private consumeInteger(): void {
		while (this.isIntegerNonStarter(this.currentCharacter)) {
			if (this.isNumberSeparator(this.previousCharacter) && this.isNumberSeparator(this.currentCharacter)) {
				this.announceError("No pueden haber dos guiones bajos consecutivos en un número.");
			}
			this.advance();
		}
	}

	/**
	 * Consumes a decimal separator from the source code stream.
	 *
	 * If there are number separators either before or after the decimal separator, and error will be issued.
	 */
	private consumeDecimalSeparator(): void {
		if (this.isNumberSeparator(this.previousCharacter)) {
			this.announceError(
				"No puede haber un guión bajo inmediatamente antes del separador decimal en un número."
			);
		}
		if (this.isNumberSeparator(this.nextCharacter)) {
			this.announceError(
				"No puede haber un guión bajo inmediatamente después del separador decimal en un número."
			);
		}

		// Consume the decimal separator ",".
		this.advance();
	}

	/**
	 * Asserts whether or not the number provided is accurately representable in memory, and issues an error if it is not.
	 *
	 * @param number the number being validated.
	 */
	private validateNumberIsRepresentable(number: number): void {
		if (number < Number.MIN_SAFE_INTEGER || number > Number.MAX_SAFE_INTEGER) {
			this.announceError("La magnitud del número es demasiado grande para ser representada en memoria.");
		}
	}

	/**
	 * Consumes an identifier from the source code stream (after having consumed the first character) and adds the
	 * corresponding token to the result.
	 */
	private finishIdentifier(): void {
		while (this.isIdentifierNonStarter(this.currentCharacter)) {
			this.advance();
		}

		const lexeme: string = this.sourceCode.substring(this.tokenStart, this.currentIndex);
		const kind: YatayTokenKind = this.keywordMap.get(lexeme) ?? YatayTokenKind.Identifier;

		this.addToken(kind);
	}

	/**
	 * Returns _true_ if the character passed is a separator allowed in an number literal, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isNumberSeparator(character: string): boolean {
		return character === "_";
	}

	/**
	 * Returns _true_ if the character passed is a decimal separator, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isDecimalSeparator(character: string): boolean {
		return character === ",";
	}

	/**
	 * Returns _true_ if the character passed is a numeric digit, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isDigit(character: string): boolean {
		const digitRegex: RegExp = /^[0-9]$/;
		return digitRegex.test(character);
	}

	/**
	 * Returns _true_ if the character passed is alphabetic, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isAlphabetic(character: string): boolean {
		const identifierStartRegex: RegExp = /^[a-záéíóúüñ]$/i;
		return identifierStartRegex.test(character);
	}

	/**
	 * Returns _true_ if the character passed is a separator allowed in an identifier, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isIdentifierSeparator(character: string): boolean {
		return character === "_";
	}

	/**
	 * Returns _true_ if the character passed is either a digit or a number separator, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isIntegerNonStarter(character: string): boolean {
		return this.isDigit(character) || this.isNumberSeparator(character);
	}

	/**
	 * Returns _true_ if the character passed is alphanumeric, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isAlphanumeric(character: string): boolean {
		return this.isDigit(character) || this.isAlphabetic(character);
	}

	/**
	 * Returns _true_ if the character passed is allowed at the start of an identifier, and _false_ otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isIdentifierStarter(character: string): boolean {
		return this.isAlphabetic(character) || this.isIdentifierSeparator(character);
	}

	/**
	 * Returns _true_ if the character passed is allowed in any part of an identifier other than the start, and _false_
	 * otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isIdentifierNonStarter(character: string): boolean {
		return this.isAlphanumeric(character) || this.isIdentifierSeparator(character);
	}

}