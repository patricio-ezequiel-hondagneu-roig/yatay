import { YatayExpressionStatement } from "../statements";

/**
 * Interface that defines the common behavior for visitor classes that operate on Yatay's Statement instances.
 */
export interface YatayStatementVisitor<R = unknown> {

	/**
	 * Operates on a Yatay expression statement and returns the result.
	 *
	 * @param statement The expression statement to operate on.
	 */
	visitExpressionStatement(statement: YatayExpressionStatement): R;

}