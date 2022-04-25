import { YatayExpressionStatement } from "../statements";
import { YatayVariableDeclarationStatement } from "../statements/yatay-varaible-declaration-statement";

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

	/**
	 * Operates on a Yatay variable declaration statement and returns the result.
	 *
	 * @param statement The variable declaration statement to operate on.
	 */
	visitVariableDeclarationStatement(statement: YatayVariableDeclarationStatement): R;

}