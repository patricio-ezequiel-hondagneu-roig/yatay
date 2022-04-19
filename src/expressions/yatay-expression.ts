import { YatayExpressionVisitor } from "../visitor/expression-visitor/yatay-expression-visitor.interface";
import { YatayVisitableExpression } from "../visitor/expression-visitor/yatay-visitable-expression.interface";

/**
 * Base class for all of the expression productions in Yatay's grammar.
 */
export abstract class YatayExpression implements YatayVisitableExpression {

	abstract toString(): string;

	abstract accept<R>(visitor: YatayExpressionVisitor<R>): R;

}