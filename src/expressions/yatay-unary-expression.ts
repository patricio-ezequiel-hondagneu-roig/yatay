import { YatayExpressionVisitor } from "../visitor/expression-visitor/yatay-expression-visitor.interface";
import { YatayToken, YatayTokenKind } from "../yatay-token";
import { YatayExpression } from "./yatay-expression";

/**
 * Class that represents an unary expression from Yatay's grammar.
 */
export class YatayUnaryExpression extends YatayExpression {

	constructor(
		readonly operator: YatayToken,
		readonly operand: YatayExpression
	) {
		super();
	}

	toString(): string {
		const operator = this.operator.lexeme;
		const operand = String(this.operand);

		if (this.operator.kind === YatayTokenKind.Minus) {
			return `${operator}${operand}`;
		}
		// this.operator.kind === YatayTokenKind.KeywordNo
		else {
			return `${operator} ${operand}`;
		}
	}

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitUnaryExpression(this);
	}

}