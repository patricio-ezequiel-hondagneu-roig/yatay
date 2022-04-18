import { YatayExpressionVisitor } from "../visitor/expression-visitor/yatay-expression-visitor.interface";
import { YatayToken } from "../yatay-token";
import { YatayExpression } from "./yatay-expression";

/**
 * Class that represents a binary expression from Yatay's grammar.
 */
export class YatayBinaryExpression extends YatayExpression {
	constructor(
		readonly leftOperand: YatayExpression,
		readonly operator: YatayToken,
		readonly rightOperand: YatayExpression
	) {
		super();
	}

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitBinaryExpression(this);
	}
}
