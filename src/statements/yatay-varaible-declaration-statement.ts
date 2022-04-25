import { YatayExpression } from "../expressions";
import { YatayStatementVisitor } from "../visitor";
import { YatayToken } from "../yatay-token";
import { YatayStatement } from "./yatay-statement";

/**
 * Class that represents an variable declaration statement from Yatay's grammar.
 */
export class YatayVariableDeclarationStatement extends YatayStatement {

	constructor(
		readonly name: YatayToken,
		readonly initializer: YatayExpression | null,
	) {
		super();
	}

	toString(): string {
		if (this.initializer === null ) {
			return `definir ${this.name.lexeme}.\n`;
		}
		else {
			return `definir ${this.name.lexeme} <= ${this.initializer}`;
		}
	}

	accept<R>(visitor: YatayStatementVisitor<R>): R {
		return visitor.visitVariableDeclarationStatement(this);
	}

}