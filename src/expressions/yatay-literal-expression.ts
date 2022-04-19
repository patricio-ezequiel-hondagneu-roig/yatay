import { YatayExpressionVisitor } from "../visitor/expression-visitor/yatay-expression-visitor.interface";
import { YatayExpression } from "./yatay-expression";

/**
 * Class that represents a literal expression from Yatay's grammar.
 */
export class YatayLiteralExpression extends YatayExpression {
	constructor(readonly value: unknown) {
		super();
	}

	toString(): string {
		if (typeof this.value === "boolean") {
			return this.value ? "verdadero" : "falso";
		} else if (typeof this.value === "number") {
			return String(this.value).replace(".", ",");
		} else {
			return String(this.value);
		}
	}

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitLiteralExpression(this);
	}
}
