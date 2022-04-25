/**
 * Enumeration that contains all of the kinds of Yatay lexical tokens.
 */
export enum YatayTokenKind {
	OpeningParenthesis = "Opening parenthesis", // (
	ClosingParenthesis = "Closing parenthesis", // )
	OpeningSquareBracket = "Opening square bracket", // [
	ClosingSquareBracket = "Closing square bracket", // ]
	OpeningCurlyBrace = "Opening curly brace", // {
	ClosingCurlyBrace = "Closing curly brace", // }
	Dot = "Dot", // .
	Comma = "Comma", // ,
	Colon = "Colon", // :
	Semicolon = "Semicolon", // ;
	Assign = "Assign", // <-
	Plus = "Plus", // +
	Minus = "Minus", // -
	Asterisk = "Asterisk", // *
	Slash = "Slash", // /
	DoubleSlash = "Double slash", // //
	Equal = "Equal", // =
	Unequal = "Unequal", // ><
	Less = "Less", // <
	LessOrEqual = "Less or equal", // =<
	Greater = "Greater", // >
	GreaterOrEqual = "Greater or equal", // >=
	Hash = "Hash", // #
	Identifier = "Identifier", // myVariable
	String = "String", // "myString"
	Number = "Number", // 123
	KeywordY = "Keyword y", // y
	KeywordO = "Keyword o", // o
	KeywordNo = "Keyword no", // no
	KeywordDefinir = "Keyword definir", // definir
	KeywordClase = "Keyword clase", // clase
	KeywordInstancia = "Keyword instancia", // instancia
	KeywordBase = "Keyword base", // base
	KeywordVerdadero = "Keyword verdadero", // verdadero
	KeywordFalso = "Keyword falso", // falso
	KeywordSi = "Keyword si", // si
	KeywordSino = "Keyword sino", // sino
	KeywordRepetir = "Keyword repetir", // repetir
	KeywordMientras = "Keyword mientras", // mientras
	KeywordDevolver = "Keyword devolver", //devolver
	EndOfFile = "End of file",
}

/**
 * A lexical token returned from scanning a Yatay source file.
 */
export class YatayToken extends Object {

	/**
	 * The kind of token.
	 */
	readonly kind: YatayTokenKind;

	/**
	 * The lexeme from the source code that the token represents.
	 */
	readonly lexeme: string;

	/**
	 * The literal value of the token in the source code, if applicable.
	 */
	readonly literal: string | number | null;

	/**
	 * The line number of the token in the source code.
	 */
	readonly line: number;

	constructor(
		kind: YatayTokenKind,
		lexeme: string,
		literal: string | number | null,
		line: number
	) {
		super();
		this.kind = kind;
		this.lexeme = lexeme;
		this.literal = literal;
		this.line = line;
	}

	/**
	 * Returns a textual representation of the token.
	 */
	toString(): string {
		switch (this.kind) {
			case YatayTokenKind.String: {
				return `[ ${this.kind}: "${this.literal}" ]`;
			}
			case YatayTokenKind.Number: {
				return `[ ${this.kind}: ${this.literal} ]`;
			}
			case YatayTokenKind.Identifier: {
				return `[ ${this.kind}: ${this.lexeme} ]`;
			}
			default: {
				return `[ ${this.kind} ]`;
			}
		}
	}

}