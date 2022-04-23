import {
	YatayBinaryExpression,
	YatayExpression,
	YatayGroupingExpression,
	YatayLiteralExpression,
	YatayUnaryExpression
} from "./expressions";
import { YatayCli } from "./yatay-cli";
import { YatayParseError } from "./yatay-parse-error";
import { YatayToken, YatayTokenKind } from "./yatay-token";

export class YatayParser {

	/**
	 * A reference to the calling CLI.
	 */
	private readonly cli: YatayCli;

	/**
	 * The list of tokens to parse.
	 */
	private readonly tokens: YatayToken[];

	/**
	 * The index of the token currently being pointed at.
	 */
	private currentTokenIndex = 0;

	constructor(cli: YatayCli, tokens: YatayToken[]) {
		this.cli = cli;
		this.tokens = tokens;
	}

	/**
	 * The token currently being pointed at.
	 */
	private get currentToken(): YatayToken {
		return this.tokens[this.currentTokenIndex];
	}

	/**
	 * The token that was last read, previous to the one currently being pointed at.
	 */
	private get previousToken(): YatayToken {
		return this.tokens[this.currentTokenIndex - 1];
	}

	/**
	 * It's _true_ if the token currently pointed at is the special End Of File token, and _false_ otherwise.
	 */
	private get isAtEnd(): boolean {
		return this.currentToken.kind === YatayTokenKind.EndOfFile;
	}

	/**
	 * Parses the provided list of tokens and returns the corresponding Expression, if applicable, or _null_ otherwise.
	 */
	parse(): YatayExpression | null {
		try {
			const expression = this.parseExpression();
			if (!this.currentTokenIsOfKind(YatayTokenKind.EndOfFile)) {
				throw this.createParseError(
					this.currentToken,
					`Se encontró un token inesperado "${this.currentToken.lexeme}".`
				);
			}
			return expression;
		}
		catch (error: unknown) {
			return null;
		}
	}

	/**
	 * Attempts to parse an expression (or any grammar rule of higher precedense) and returns it.
	 */
	private parseExpression(): YatayExpression {
		return this.parseComparison();
	}

	/**
	 * Attempts to parse a comparison expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseComparison(): YatayExpression {
		let expression = this.parseTerm();

		while (this.matchAnyComparisonOperator()) {
			const leftOperand = expression;
			const operator = this.previousToken;
			const rightOperand = this.parseTerm();

			expression = new YatayBinaryExpression(leftOperand, operator, rightOperand);
		}

		return expression;
	}

	/**
	 * Attempts to parse a term expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseTerm(): YatayExpression {
		let expression = this.parseFactor();

		while (this.matchAnyTermOperator()) {
			const leftOperand = expression;
			const operator = this.previousToken;
			const rightOperand = this.parseFactor();

			expression = new YatayBinaryExpression(leftOperand, operator, rightOperand);
		}

		return expression;
	}

	/**
	 * Attempts to parse a factor expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseFactor(): YatayExpression {
		let expression = this.parseUnary();

		while (this.matchAnyFactorOperator()) {
			const leftOperand = expression;
			const operator = this.previousToken;
			const rightOperand = this.parseUnary();

			expression = new YatayBinaryExpression(leftOperand, operator, rightOperand);
		}

		return expression;
	}

	/**
	 * Attempts to parse an unary expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseUnary(): YatayExpression {
		if (this.matchAnyUnaryOperator()) {
			const operator = this.previousToken;
			const operand = this.parseUnary();

			return new YatayUnaryExpression(operator, operand);
		}
		else {
			return this.parsePrimary();
		}
	}

	/**
	 * Attempts to parse a primary expression and returns it.
	 */
	private parsePrimary(): YatayExpression {
		if (this.matchAny(YatayTokenKind.KeywordVerdadero)) {
			return new YatayLiteralExpression(true);
		}
		else if (this.matchAny(YatayTokenKind.KeywordFalso)) {
			return new YatayLiteralExpression(false);
		}
		else if (this.matchAny(YatayTokenKind.String, YatayTokenKind.Number)) {
			return new YatayLiteralExpression(this.previousToken.literal as string | number);
		}
		else if (this.matchAny(YatayTokenKind.OpeningParenthesis)) {
			const innerExpression = this.parseExpression();
			this.consume(
				YatayTokenKind.ClosingParenthesis,
				'Se esperaba un ")" tras la expresión.'
			);
			return new YatayGroupingExpression(innerExpression);
		}
		else {
			throw this.createParseError(
				this.currentToken,
				"Se esperaba una expresión."
			);
		}
	}

	/**
	 * Returns _true_ if the token currently pointed at has the provided kind, and _false_ otherwise.
	 */
	private currentTokenIsOfKind(kind: YatayTokenKind): boolean {
		return this.currentToken.kind === kind;
	}

	/**
	 * Moves the pointer to the next token (unless already pointing to the End Of File token) and returns the previous one.
	 */
	private advance(): YatayToken {
		if (!this.isAtEnd) {
			this.currentTokenIndex++;
		}

		return this.previousToken;
	}

	/**
	 * Moves the pointer to the next token if the current one has the expected kind, or throws a parsing error otherwise.
	 *
	 * @param tokenKind the expected kind of the currently pointed at token.
	 * @param errorMessage the error message to use if the currently pointed at token has a kind different from the expected.
	 */
	private consume(tokenKind: YatayTokenKind, errorMessage: string): YatayToken {
		if (this.currentTokenIsOfKind(tokenKind)) {
			return this.advance();
		}
		else {
			throw this.createParseError(this.currentToken, errorMessage);
		}
	}

	/**
	 * Returns a new parsing error instance and announces it in the CLI.
	 *
	 * @param token the token where the parsing error was found.
	 * @param errorMessage the error message to include in the parsing error.
	 */
	private createParseError(token: YatayToken, errorMessage: string): YatayParseError {
		this.cli.announceParsingError(token, errorMessage);
		return new YatayParseError();
	}

	/**
	 * Moves the pointer to the next token and returns _true_ if the currently pointed at token matches any of the provided
	 * token kinds, or returns _false_ otherwise.
	 *
	 * @param tokenKinds the list of token kinds of which the currently pointed at token is expected to match any.
	 */
	private matchAny(...tokenKinds: YatayTokenKind[]): boolean {
		for (const tokenKind of tokenKinds) {
			if (this.currentTokenIsOfKind(tokenKind)) {
				this.advance();
				return true;
			}
		}

		return false;
	}

	/**
	 * Moves the pointer to the next token and returns _true_ if the currently pointed at token matches any comparison
	 * operator, or returns _false_ otherwise.
	 */
	private matchAnyComparisonOperator(): boolean {
		return this.matchAny(
			YatayTokenKind.Equal,
			YatayTokenKind.Unequal,
			YatayTokenKind.Less,
			YatayTokenKind.LessOrEqual,
			YatayTokenKind.Greater,
			YatayTokenKind.GreaterOrEqual
		);
	}

	/**
	 * Moves the pointer to the next token and returns _true_ if the currently pointed at token matches any term operator,
	 * or returns _false_ otherwise.
	 */
	private matchAnyTermOperator(): boolean {
		return this.matchAny(
			YatayTokenKind.Plus,
			YatayTokenKind.Minus
		);
	}

	/**
	 * Moves the pointer to the next token and returns _true_ if the currently pointed at token matches any factor operator,
	 * or returns _false_ otherwise.
	 */
	private matchAnyFactorOperator(): boolean {
		return this.matchAny(
			YatayTokenKind.Asterisk,
			YatayTokenKind.Slash,
			YatayTokenKind.DoubleSlash
		);
	}

	/**
	 * Moves the pointer to the next token and returns _true_ if the currently pointed at token matches any unary operator, or
	 * returns _false_ otherwise.
	 */
	private matchAnyUnaryOperator(): boolean {
		return this.matchAny(
			YatayTokenKind.Minus,
			YatayTokenKind.KeywordNo
		);
	}

}