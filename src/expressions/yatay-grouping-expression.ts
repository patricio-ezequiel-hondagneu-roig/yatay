import { YatayExpressionVisitor } from "../visitor/expression-visitor/yatay-expression-visitor.interface";
import { YatayExpression } from "./yatay-expression";

/**
 * Class that represents a grouping expression from Yatay's grammar.
 */
export class YatayGroupingExpression extends YatayExpression {
	constructor(readonly innerExpression: YatayExpression) {
		super();
	}

	toString(): string {
		const innerExpression = String(this.innerExpression);

		return `(${innerExpression})`;
	}

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitGroupingExpression(this);
	}
}
