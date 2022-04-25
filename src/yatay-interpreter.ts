import {
	YatayBinaryExpression,
	YatayExpression,
	YatayGroupingExpression,
	YatayLiteralExpression,
	YatayUnaryExpression
} from "./expressions";
import { YatayVariableAccessExpression } from "./expressions/yatay-variable-access-expression";
import { YatayExpressionStatement, YatayStatement } from "./statements";
import { YatayVariableDeclarationStatement } from "./statements/yatay-varaible-declaration-statement";
import { YatayExpressionVisitor, YatayStatementVisitor } from "./visitor";
import { YatayCli } from "./yatay-cli";
import { YatayEnvironment } from "./yatay-environment";
import { YatayRuntimeError } from "./yatay-runtime-error";
import { YatayToken, YatayTokenKind } from "./yatay-token";

export class YatayInterpreter implements YatayExpressionVisitor, YatayStatementVisitor<void> {

	/**
	 * A reference to the calling CLI.
	 */
	private readonly cli: YatayCli;

	/**
	 * The environment that corresponds to the current scope in the execution.
	 */
	private environment: YatayEnvironment;

	constructor(cli: YatayCli) {
		this.cli = cli;
		this.environment = new YatayEnvironment();
	}

	interpret(statements: YatayStatement[]): void {
		try {
			for (const statement of statements) {
				this.executeStatement(statement);
			}
		}
		catch (error) {
			if (error instanceof YatayRuntimeError) {
				this.cli.announceRuntimeError(error);
			}
			else {
				throw error;
			}
		}
	}

	visitVariableDeclarationStatement(statement: YatayVariableDeclarationStatement): void {
		let value: unknown | null = null;

		if (statement.initializer !== null) {
			value = this.evaluateExpression(statement.initializer);
		}

		this.environment.define(statement.name, value);
	}

	visitExpressionStatement(statement: YatayExpressionStatement): void {
		// this.evaluateExpression(statement.expression); // TODO: Remove the rest once printing is available
		const value: unknown = this.evaluateExpression(statement.expression);
		console.log(`Expresión [ ${statement.expression} ] evaluada como [ ${this.stringify(value)} ].`);
	}

	visitBinaryExpression(expression: YatayBinaryExpression): unknown {
		const leftOperand: unknown = this.evaluateExpression(expression.leftOperand);
		const rightOperand: unknown = this.evaluateExpression(expression.rightOperand);

		switch (expression.operator.kind) {
			case YatayTokenKind.Equal: {
				return this.areEqual(leftOperand, rightOperand);
			}
			case YatayTokenKind.Unequal: {
				return !this.areEqual(leftOperand, rightOperand);
			}
			case YatayTokenKind.Greater: {
				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				return Number(leftOperand) > Number(rightOperand);
			}
			case YatayTokenKind.GreaterOrEqual: {
				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				return Number(leftOperand) >= Number(rightOperand);
			}
			case YatayTokenKind.Less: {
				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				return Number(leftOperand) < Number(rightOperand);
			}
			case YatayTokenKind.LessOrEqual: {
				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				return Number(leftOperand) <= Number(rightOperand);
			}
			case YatayTokenKind.Plus: {
				if (this.isNumber(leftOperand) && this.isNumber(rightOperand)) {
					return leftOperand + rightOperand;
				}
				else if (this.isString(leftOperand) && this.isString(rightOperand)) {
					return leftOperand + rightOperand;
				}

				throw new YatayRuntimeError(
					expression.operator,
					"Se esperaba que los operandos fueran ambos números o ambos textos."
				);
			}
			case YatayTokenKind.Minus: {
				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				return Number(leftOperand) - Number(rightOperand);
			}
			case YatayTokenKind.Asterisk: {
				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				return Number(leftOperand) * Number(rightOperand);
			}
			case YatayTokenKind.Slash: {

				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				if (rightOperand === 0) {
					throw new YatayRuntimeError(
						expression.operator,
						"Se esperaba que el divisor fuera distinto de cero."
					);
				}

				return Number(leftOperand) / Number(rightOperand);
			}
			case YatayTokenKind.DoubleSlash: {
				this.assertOperandsAreNumbers(leftOperand, rightOperand, expression.operator);
				return Number(leftOperand) % Number(rightOperand);
			}
		}

		// Unreachable code.
		return null;
	}

	visitGroupingExpression(expression: YatayGroupingExpression): unknown {
		return this.evaluateExpression(expression.innerExpression);
	}

	visitLiteralExpression(expression: YatayLiteralExpression): boolean | string | number {
		return expression.value;
	}

	visitUnaryExpression(expression: YatayUnaryExpression): unknown {
		const operand: unknown = this.evaluateExpression(expression.operand);

		switch (expression.operator.kind) {
			case YatayTokenKind.KeywordNo: {
				return !Boolean(operand);
			}
			case YatayTokenKind.Minus: {
				this.assertOperandIsNumber(operand, expression.operator);
				return -Number(operand);
			}
		}

		// Unreachable code.
		return null;
	}

	visitVariableAccessExpression(expression: YatayVariableAccessExpression): unknown {
		return this.environment.get(expression.name);
	}

	private executeStatement(statement: YatayStatement): void {
		statement.accept(this);
	}

	private evaluateExpression(expression: YatayExpression): unknown {
		return expression.accept(this);
	}

	private areEqual(first: unknown, second: unknown): boolean {
		return first === second;
	}

	private isNumber(value: unknown): value is number {
		return typeof value === "number";
	}

	private isString(value: unknown): value is string {
		return typeof value === "string";
	}

	private isBoolean(value: unknown): value is boolean {
		return typeof value === "boolean";
	}

	private assertOperandIsNumber(operand: unknown, operator: YatayToken): void {
		const operandIsNumber: boolean = this.isNumber(operand);

		if (!operandIsNumber) {
			throw new YatayRuntimeError(operator, "Se esperaba que el operando fuera un número.");
		}
	}

	private assertOperandsAreNumbers(leftOperand: unknown, rightOperand: unknown, operator: YatayToken): void {
		const leftOperandIsNumber: boolean = this.isNumber(leftOperand);
		const rightOperandIsNumber: boolean = this.isNumber(rightOperand);

		if (!leftOperandIsNumber) {
			if (!rightOperandIsNumber) {
				throw new YatayRuntimeError(operator, "Se esperaba que ambos operandos fueran números.");
			}
			else {
				throw new YatayRuntimeError(operator, "Se esperaba que el operando izquierdo fuera un número.");
			}
		}
		else if (!rightOperandIsNumber) {
			throw new YatayRuntimeError(operator, "Se esperaba que el operando derecho fuera un número.");
		}
	}

	/**
	 * Returns the textual representation of a native ECMAScript value as it is expected in Yatay.
	 *
	 * @param value the value to represent as a Yatay text.
	 */
	private stringify(value: unknown): string {
		if (value === true) {
			return "verdadero";
		}
		else if (value === false) {
			return "falso";
		}
		else if (typeof value === "number") {
			return value.toLocaleString(undefined, <any>{
				notation: "standard",
				signDisplay: "auto",
				style: "decimal",
				trailingZeroDisplay: "stripIfInteger",
				roundingMode: "trunc",
				useGrouping: false,
				maximumSignificantDigits: 21
			});
		}
		else {
			return `"${String(value)}"`;
		}
	}

}