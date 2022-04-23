import { YatayStatementVisitor } from "./yatay-statement.visitor.interface";

/**
 * Interface that defines the required protocol for Yatay's Statement instances to be operated on by visitor classes.
 */
export interface YatayVisitableStatement {

	/**
	 * Allows a visitor to operate, calling the method corresponding to the type of this Statement instance.
	 *
	 * @param visitor the visitor that will operate on this Statement instance.
	 */
	accept<R>(visitor: YatayStatementVisitor<R>): R;

}