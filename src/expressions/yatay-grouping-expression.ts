import { YatayExpressionVisitor } from "../visitor/expression-visitor/yatay-expression-visitor.interface";
import { YatayExpression } from "./yatay-expression";

/**
 * Class that represents a grouping expression from Yatay's grammar.
 */
export class YatayGroupingExpression extends YatayExpression {
	constructor(readonly innerExpression: YatayExpression) {
		super();
	}

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitGroupingExpression(this);
	}
}
