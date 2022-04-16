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
	private start = 0;
	/**
	 * The index of the current character in the source code stream.
	 */
	private current = 0;
	/**
	 * The line number of the current character in the source code stream.
	 */
	private line = 1;

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
	 * The index of the next character in the source code stream.
	 */
	private get next(): number {
		return this.current + 1;
	}

	/**
	 * It's _true_ if the current character in the source code stream is at the end of file and _false_ otherwise.
	 */
	private get isAtEnd(): boolean {
		return this.current >= this.sourceCode.length;
	}

	/**
	 * It's _true_ if the next character in the source code stream is at the end of file and _false_ otherwise.
	 */
	private get isNextAtEnd(): boolean {
		return this.next >= this.sourceCode.length;
	}

	/**
	 * Scans the source code and returns the list of the tokens it represents.
	 */
	scanTokens(): YatayToken[] {
		while (!this.isAtEnd) {
			this.start = this.current;
			this.scanToken();
		}

		const endOfFileToken = new YatayToken(
			YatayTokenKind.EndOfFile,
			"",
			null,
			this.line
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
		const character = this.advance();

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
				} else {
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
				this.addToken(YatayTokenKind.Slash);
				break;
			}
			case "=": {
				if (this.match("<")) {
					this.addToken(YatayTokenKind.LessOrEqual);
				} else {
					this.addToken(YatayTokenKind.Equal);
				}
				break;
			}
			case ">": {
				if (this.match("<")) {
					this.addToken(YatayTokenKind.Unequal);
				} else if (this.match("=")) {
					this.addToken(YatayTokenKind.GreaterOrEqual);
				} else {
					this.addToken(YatayTokenKind.Greater);
				}
				break;
			}
			case "<": {
				if (this.match("=")) {
					this.addToken(YatayTokenKind.Assign);
				} else {
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
				this.line++;
				break;
			}
			case '"': {
				this.finishString();
				break;
			}
			default: {
				if (this.isDigit(character)) {
					this.finishNumber();
				} else if (this.isIdentifierStarter(character)) {
					this.finishIdentifier();
				} else {
					this.announceError(
						`Se encontró un carácter inesperado: "${character}".`
					);
				}
				break;
			}
		}
	}

	/**
	 * Returns the current character in the source code stream.
	 *
	 * @returns The current character in the source code stream.
	 */
	private peek(): string {
		if (this.isAtEnd) {
			return "\0";
		} else {
			return this.sourceCode.charAt(this.current);
		}
	}

	/**
	 * Returns the next character in the source code stream.
	 */
	private peekNext(): string {
		if (this.isNextAtEnd) {
			return "\0";
		} else {
			return this.sourceCode.charAt(this.next);
		}
	}

	/**
	 * Unconditionally consumes a character from the source code stream and returns it.
	 */
	private advance(): string {
		return this.sourceCode[this.current++];
	}

	/**
	 * Returns _true_ and conditionally consumes a character from the source code stream if it matches the expected one,
	 * or just returns _false_ otherwise.
	 *
	 * @param expected the character to compare with.
	 */
	private match(expected: string): boolean {
		if (this.isAtEnd || this.sourceCode.charAt(this.current) !== expected) {
			return false;
		}

		this.current++;
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
		const lexeme = this.sourceCode.substring(this.start, this.current);
		const newToken = new YatayToken(kind, lexeme, literal, this.line);
		this.tokens.push(newToken);
	}

	/**
	 * Announces a scanning error to the CLI with the provided message.
	 *
	 * @param message the message to include in the announced error.
	 */
	private announceError(message: string): void {
		this.cli.announceError(this.line, message);
	}

	/**
	 * Consumes a line comment form the source code stream and discards it.
	 */
	private consumeLineComment(): void {
		while (this.peek() !== "\n" && !this.isAtEnd) {
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
		while (this.peek() !== '"' && this.peek() !== "\n" && !this.isAtEnd) {
			this.advance();
		}

		if (this.peek() === "\n" || this.isAtEnd) {
			this.announceError("No se encontró la comilla de cierre del texto.");
			return;
		}

		// Consume the closing quotation mark.
		this.advance();

		const value: string = this.sourceCode.substring(
			this.start + 1,
			this.current - 1
		);
		this.addToken(YatayTokenKind.String, value);
	}

	/**
	 * Consumes a number from the source code stream (after having consumed the first digit) and adds the corresponding
	 * token to the result.
	 */
	private finishNumber(): void {
		while (this.isDigit(this.peek())) {
			this.advance();
		}

		if (this.peek() == "," && this.isDigit(this.peekNext())) {
			// Consume the decimal separator ",".
			this.advance();

			while (this.isDigit(this.peek())) {
				this.advance();
			}
		}

		const value: number = Number.parseFloat(
			this.sourceCode
				.substring(this.start, this.current)
				.replace(",", ".")
		);
		this.addToken(YatayTokenKind.Number, value);
	}

	/**
	 * Consumes an identifier from the source code stream (after having consumed the first character) and adds the
	 * corresponding token to the result.
	 */
	private finishIdentifier(): void {
		while (this.isIdentifierNonStarter(this.peek())) {
			this.advance();
		}

		const lexeme = this.sourceCode.substring(this.start, this.current);
		const kind = this.keywordMap.get(lexeme) ?? YatayTokenKind.Identifier;

		this.addToken(kind);
	}

	/**
	 * Returns _true_ if the character passed is a numeric digit.
	 *
	 * @param character the character being checked.
	 */
	private isDigit(character: string): boolean {
		const digitRegex = /^[0-9]$/;
		return digitRegex.test(character);
	}

	/**
	 * Returns _true_ if the character passed is alphabetic.
	 *
	 * @param character the character being checked.
	 */
	private isAlphabetic(character: string): boolean {
		const identifierStartRegex = /^[a-záéíóúüñ]$/i;
		return identifierStartRegex.test(character);
	}

	/**
	 * Returns _true_ if the character passed is a separator allowed in an identifier.
	 *
	 * @param character the character being checked.
	 */
	private isSeparator(character: string): boolean {
		const separatorRegex = /^_$/;
		return separatorRegex.test(character);
	}

	/**
	 * Returns _true_ if the character passed is alphanumeric.
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
		return this.isAlphabetic(character) || this.isSeparator(character);
	}

	/**
	 * Returns _true_ if the character passed is allowed in any part of an identifier other than the start, and _false_
	 * otherwise.
	 *
	 * @param character the character being checked.
	 */
	private isIdentifierNonStarter(character: string): boolean {
		return this.isAlphanumeric(character) || this.isSeparator(character);
	}
}
