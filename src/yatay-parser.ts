import {
	YatayBinaryExpression,
	YatayExpression,
	YatayGroupingExpression,
	YatayLiteralExpression,
	YatayUnaryExpression
} from "./expressions";
import { YatayVariableAccessExpression } from "./expressions/yatay-variable-access-expression";
import { YatayExpressionStatement, YatayStatement } from "./statements";
import { YatayVariableDeclarationStatement } from "./statements/yatay-varaible-declaration-statement";
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
	private currentTokenIndex: number = 0;

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
	 * Parses the provided list of tokens and returns the corresponding list of statements.
	 */
	parse(): YatayStatement[] {
		const statements: YatayStatement[] = [];

		while (!this.isAtEnd) {
			const declaration: YatayStatement | null = this.parseDeclaration();
			if (declaration !== null) {
				statements.push(declaration);
			}
		}

		return statements;
	}

	/**
	 * Attempts to parse a deckaration (or any grammar rule of higher precedence) and returns it.
	 */
	private parseDeclaration(): YatayStatement | null {
		try {
			if (this.matchAny(YatayTokenKind.KeywordDefinir)) {
				return this.parseVariableDeclaration();
			}
			else {
				return this.parseStatement();
			}
		}
		catch (error) {
			if (error instanceof YatayParseError) {
				this.synchronize();
				return null;
			}
			throw error;
		}
	}

	/**
	 * Attempts to parse a variable declaration (or any grammar rule of higher precedence) and returns it.
	 */
	private parseVariableDeclaration(): YatayStatement {
		const name: YatayToken = this.consume(
			YatayTokenKind.Identifier,
			`Se esperaba un identificador.`
		);

		let initializer: YatayExpression | null = null;
		if (this.matchAny(YatayTokenKind.Assign)) {
			initializer = this.parseExpression();
		}

		this.consume(
			YatayTokenKind.Dot,
			'Se esperaba un "." tras la sentencia.'
		);

		return new YatayVariableDeclarationStatement(name, initializer);
	}

	/**
	 * Attempts to parse an statement (or any grammar rule of higher precedence) and returns it.
	 */
	private parseStatement(): YatayStatement {
		return this.parseExpressionStatement();
	}

	/**
	 * Attempts to parse an expression statement (or any grammar rule of higher precedence) and returns it.
	 */
	private parseExpressionStatement(): YatayStatement {
		const expression: YatayExpression = this.parseExpression();
		this.consume(YatayTokenKind.Dot, 'Se esperaba un "." tras la sentencia.');

		return new YatayExpressionStatement(expression);
	}

	/**
	 * Attempts to parse an expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseExpression(): YatayExpression {
		return this.parseComparison();
	}

	/**
	 * Attempts to parse a comparison expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseComparison(): YatayExpression {
		let expression: YatayExpression = this.parseTerm();

		while (this.matchAnyComparisonOperator()) {
			const leftOperand: YatayExpression = expression;
			const operator: YatayToken = this.previousToken;
			const rightOperand: YatayExpression = this.parseTerm();

			expression = new YatayBinaryExpression(leftOperand, operator, rightOperand);
		}

		return expression;
	}

	/**
	 * Attempts to parse a term expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseTerm(): YatayExpression {
		let expression: YatayExpression = this.parseFactor();

		while (this.matchAnyTermOperator()) {
			const leftOperand: YatayExpression = expression;
			const operator: YatayToken = this.previousToken;
			const rightOperand: YatayExpression = this.parseFactor();

			expression = new YatayBinaryExpression(leftOperand, operator, rightOperand);
		}

		return expression;
	}

	/**
	 * Attempts to parse a factor expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseFactor(): YatayExpression {
		let expression: YatayExpression = this.parseUnary();

		while (this.matchAnyFactorOperator()) {
			const leftOperand: YatayExpression = expression;
			const operator: YatayToken = this.previousToken;
			const rightOperand: YatayExpression = this.parseUnary();

			expression = new YatayBinaryExpression(leftOperand, operator, rightOperand);
		}

		return expression;
	}

	/**
	 * Attempts to parse an unary expression (or any grammar rule of higher precedence) and returns it.
	 */
	private parseUnary(): YatayExpression {
		if (this.matchAnyUnaryOperator()) {
			const operator: YatayToken = this.previousToken;
			const operand: YatayExpression = this.parseUnary();

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
		else if (this.matchAny(YatayTokenKind.Identifier)) {
			return new YatayVariableAccessExpression(this.previousToken);
		}
		else if (this.matchAny(YatayTokenKind.OpeningParenthesis)) {
			const innerExpression: YatayExpression = this.parseExpression();
			this.consume(
				YatayTokenKind.ClosingParenthesis,
				'Se esperaba un ")" tras la expresi??n.'
			);
			return new YatayGroupingExpression(innerExpression);
		}
		else {
			throw this.createParseError(
				this.currentToken,
				"Se esperaba una expresi??n."
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
	 * Attempts to synchronize the parser to a known state when it enters panic mode due to a parsing error.
	 */
	private synchronize(): void {
		this.advance();

		while (!this.isAtEnd) {

			if (this.previousToken.kind === YatayTokenKind.Dot) {
				return;
			}

			switch (this.currentToken.kind) {
				case YatayTokenKind.KeywordClase:
				case YatayTokenKind.KeywordDefinir:
				case YatayTokenKind.KeywordDevolver:
				case YatayTokenKind.KeywordMientras:
				case YatayTokenKind.KeywordRepetir:
				case YatayTokenKind.KeywordSi: {
					return;
				}
			}

			this.advance();
		}
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