import { YatayExpression } from "../expressions";
import { YatayStatementVisitor } from "../visitor";
import { YatayStatement } from "./yatay-statement";

/**
 * Class that represents an expression statement from Yatay's grammar.
 */
export class YatayExpressionStatement extends YatayStatement {

	constructor(readonly expression: YatayExpression) {
		super();
	}

	toString(): string {
		return `${this.expression}.\n`;
	}

	accept<R>(visitor: YatayStatementVisitor<R>): R {
		return visitor.visitExpressionStatement(this);
	}

}