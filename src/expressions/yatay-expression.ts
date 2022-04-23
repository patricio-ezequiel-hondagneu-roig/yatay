import { YatayExpressionVisitor, YatayVisitableExpression } from "../visitor";

/**
 * Base class for all of the expression productions in Yatay's grammar.
 */
export abstract class YatayExpression implements YatayVisitableExpression {

	abstract toString(): string;

	abstract accept<R>(visitor: YatayExpressionVisitor<R>): R;

}