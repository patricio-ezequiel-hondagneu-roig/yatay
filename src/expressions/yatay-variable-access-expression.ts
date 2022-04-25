import { YatayExpressionVisitor } from "../visitor";
import { YatayToken, YatayTokenKind } from "../yatay-token";
import { YatayExpression } from "./yatay-expression";

/**
 * Class that represents a variable access expression from Yatay's grammar.
 */
export class YatayVariableAccessExpression extends YatayExpression {

	constructor(
		readonly name: YatayToken,
	) {
		super();
	}

	toString(): string {
		return this.name.lexeme;
	}

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitVariableAccessExpression(this);
	}

}