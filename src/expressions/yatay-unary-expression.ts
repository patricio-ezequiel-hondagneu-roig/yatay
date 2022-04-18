import { YatayExpressionVisitor } from "../visitor/expression-visitor/yatay-expression-visitor.interface";
import { YatayToken } from "../yatay-token";
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

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitUnaryExpression(this);
	}
}
