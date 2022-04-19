import { YatayBinaryExpression } from "../../expressions/yatay-binary-expression";
import { YatayGroupingExpression } from "../../expressions/yatay-grouping-expression";
import { YatayLiteralExpression } from "../../expressions/yatay-literal-expression";
import { YatayUnaryExpression } from "../../expressions/yatay-unary-expression";

/**
 * Interface that defines the common behavior for visitor classes that operate on Yatay's Expression instances.
 */
export interface YatayExpressionVisitor<R> {

	/**
	 * Operates on a Yatay binary expression and returns the result.
	 *
	 * @param expression The binary expression to operate on.
	 */
	visitBinaryExpression(expression: YatayBinaryExpression): R;

	/**
	 * Operates on a Yatay grouping expression and returns the result.
	 *
	 * @param expression The grouping expression to operate on.
	 */
	visitGroupingExpression(expression: YatayGroupingExpression): R;

	/**
	 * Operates on a Yatay literal expression and returns the result.
	 *
	 * @param expression The literal expression to operate on.
	 */
	visitLiteralExpression(expression: YatayLiteralExpression): R;

	/**
	 * Operates on a Yatay unary expression and returns the result.
	 *
	 * @param expression The unary expression to operate on.
	 */
	visitUnaryExpression(expression: YatayUnaryExpression): R;

}