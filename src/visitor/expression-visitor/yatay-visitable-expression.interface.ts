import { YatayExpressionVisitor } from "./yatay-expression-visitor.interface";

/**
 * Interface that defines the required protocol for Yatay's Expression instances to be operated on by visitor classes.
 */
export interface YatayVisitableExpression {
	/**
	 * Allows a visitor to operate, calling the method corresponding to the type of this Expression instance.
	 *
	 * @param visitor the visitor that will operate on this Expression instance.
	 */
	accept<R>(visitor: YatayExpressionVisitor<R>): R;
}
