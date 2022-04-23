import { YatayStatementVisitor, YatayVisitableStatement } from "../visitor";

/**
 * Base class for all of the statement productions in Yatay's grammar.
 */
export abstract class YatayStatement implements YatayVisitableStatement {

	abstract toString(): string;

	abstract accept<R>(visitor: YatayStatementVisitor<R>): R;

}