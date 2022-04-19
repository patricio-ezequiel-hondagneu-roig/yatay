import { YatayBinaryExpression } from "./expressions/yatay-binary-expression";
import { YatayExpression } from "./expressions/yatay-expression";
import { YatayGroupingExpression } from "./expressions/yatay-grouping-expression";
import { YatayLiteralExpression } from "./expressions/yatay-literal-expression";
import { YatayUnaryExpression } from "./expressions/yatay-unary-expression";
import { YatayCli } from "./yatay-cli";
import { YatayParseError } from "./yatay-parse-error";
import { YatayToken, YatayTokenKind } from "./yatay-token";

export class YatayParser {
	/**
	 * A reference to the calling CLI.
	 */
	private readonly cli: YatayCli;
	private readonly tokens: YatayToken[];
	private currentTokenIndex = 0;

	constructor(cli: YatayCli, tokens: YatayToken[]) {
		this.cli = cli;
		this.tokens = tokens;
	}

	private get currentToken(): YatayToken {
		return this.tokens[this.currentTokenIndex];
	}

	private get previousToken(): YatayToken {
		return this.tokens[this.currentTokenIndex - 1];
	}

	private get isAtEnd(): boolean {
		return this.currentToken.kind === YatayTokenKind.EndOfFile;
	}

	parse(): YatayExpression | null {
		try {
			const expression = this.parseExpression();
			if (!this.currentTokenIsOfKind(YatayTokenKind.EndOfFile)) {
				throw this.createParseError(
					this.currentToken,
					`Se encontró un token inesperado "${this.currentToken.lexeme}."`
				);
			}
			return expression;
		} catch (error: unknown) {
			return null;
		}
	}

	private parseExpression(): YatayExpression {
		return this.parseComparison();
	}

	private parseComparison(): YatayExpression {
		let expression = this.parseTerm();

		while (this.matchAnyComparisonOperator()) {
			const leftOperand = expression;
			const operator = this.previousToken;
			const rightOperand = this.parseTerm();

			expression = new YatayBinaryExpression(
				leftOperand,
				operator,
				rightOperand
			);
		}

		return expression;
	}

	private parseTerm(): YatayExpression {
		let expression = this.parseFactor();

		while (this.matchAnyTermOperator()) {
			const leftOperand = expression;
			const operator = this.previousToken;
			const rightOperand = this.parseFactor();

			expression = new YatayBinaryExpression(
				leftOperand,
				operator,
				rightOperand
			);
		}

		return expression;
	}

	private parseFactor(): YatayExpression {
		let expression = this.parseUnary();

		while (this.matchAnyFactorOperator()) {
			const leftOperand = expression;
			const operator = this.previousToken;
			const rightOperand = this.parseUnary();

			expression = new YatayBinaryExpression(
				leftOperand,
				operator,
				rightOperand
			);
		}

		return expression;
	}

	private parseUnary(): YatayExpression {
		if (this.matchAnyUnaryOperator()) {
			const operator = this.previousToken;
			const operand = this.parseUnary();

			return new YatayUnaryExpression(operator, operand);
		} else {
			return this.parsePrimary();
		}
	}

	private parsePrimary(): YatayExpression {
		if (this.matchAny(YatayTokenKind.KeywordVerdadero)) {
			return new YatayLiteralExpression(true);
		} else if (this.matchAny(YatayTokenKind.KeywordFalso)) {
			return new YatayLiteralExpression(false);
		} else if (
			this.matchAny(YatayTokenKind.String, YatayTokenKind.Number)
		) {
			return new YatayLiteralExpression(this.previousToken.literal);
		} else if (this.matchAny(YatayTokenKind.OpeningParenthesis)) {
			const innerExpression = this.parseExpression();
			this.consume(
				YatayTokenKind.ClosingParenthesis,
				'Se esperaba un ")" tras la expresión.'
			);
			return new YatayGroupingExpression(innerExpression);
		} else {
			throw this.createParseError(
				this.currentToken,
				"Se esperaba una expresión."
			);
		}
	}

	private currentTokenIsOfKind(kind: YatayTokenKind): boolean {
		return this.currentToken.kind === kind;
	}

	private advance(): YatayToken {
		if (!this.isAtEnd) {
			this.currentTokenIndex++;
		}

		return this.previousToken;
	}

	private consume(
		tokenKind: YatayTokenKind,
		errorMessage: string
	): YatayToken {
		if (this.currentTokenIsOfKind(tokenKind)) {
			return this.advance();
		} else {
			throw this.createParseError(this.currentToken, errorMessage);
		}
	}

	private createParseError(
		token: YatayToken,
		errorMessage: string
	): YatayParseError {
		this.cli.announceParsingError(token, errorMessage);
		return new YatayParseError();
	}

	private matchAny(...tokenKinds: YatayTokenKind[]): boolean {
		for (const tokenKind of tokenKinds) {
			if (this.currentTokenIsOfKind(tokenKind)) {
				this.advance();
				return true;
			}
		}

		return false;
	}

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

	private matchAnyTermOperator(): boolean {
		return this.matchAny(YatayTokenKind.Plus, YatayTokenKind.Minus);
	}

	private matchAnyFactorOperator(): boolean {
		return this.matchAny(
			YatayTokenKind.Asterisk,
			YatayTokenKind.Slash,
			YatayTokenKind.DoubleSlash
		);
	}

	private matchAnyUnaryOperator(): boolean {
		return this.matchAny(YatayTokenKind.Minus, YatayTokenKind.KeywordNo);
	}
}
