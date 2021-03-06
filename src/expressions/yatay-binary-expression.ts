import { YatayExpressionVisitor } from "../visitor";
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

	toString(): string {
		const leftOperand: string = String(this.leftOperand);
		const operator: string = this.operator.lexeme;
		const rightOperand: string = String(this.rightOperand);

		return `${leftOperand} ${operator} ${rightOperand}`;
	}

	accept<R>(visitor: YatayExpressionVisitor<R>): R {
		return visitor.visitBinaryExpression(this);
	}

}