import { YatayRuntimeError } from "./yatay-runtime-error";
import { YatayToken } from "./yatay-token";

/**
 * The element that stores and provides access to the identifiers declared in a particular scope in a Yatay program.
 */
export class YatayEnvironment {

	/**
	 * Map that stores the bindings between identifiers and values in the current scope.
	 */
	private readonly bindings: Map<string, unknown> = new Map<string, unknown>();

	/**
	 * Returns the value bound to the provided identifier in the environment.
	 *
	 * An error is issued if the identifier is not defined in the environment.
	 *
	 * @param identifier the identifier for which to retrieve the bound value.
	 */
	get(identifier: YatayToken): unknown {
		this.assertIdentifierIsDefined(identifier);
		return this.bindings.get(identifier.lexeme);
	}

	/**
	 * Binds the provided value to the provided identifier in the environment.
	 *
	 * An error is issued if the identifier is not defined in the environment.
	 *
	 * @param identifier the identifier for which to set the value.
	 * @param value the value to bind to the provided identifier.
	 */
	set(identifier: YatayToken, value: unknown): void {
		this.assertIdentifierIsDefined(identifier);
		this.bindings.set(identifier.lexeme, value);
	}

	/**
	 * Defines the provided identifier in the environment, binding it to the provided value.
	 *
	 * An error is issued if the identifier is already defined in the environment.
	 *
	 * @param identifier the identifier to define.
	 * @param value the value to bind to the provided identifier.
	 */
	define(identifier: YatayToken, value: unknown): void {
		this.assertIdentifierIsNotDefined(identifier);
		this.bindings.set(identifier.lexeme, value);
	}

	/**
	 * Validates whether or not the identifier is already defined in the environment, and issues an error if it is not.
	 *
	 * @param identifier the identifier to check.
	 */
	private assertIdentifierIsDefined(identifier: YatayToken): void {
		if (!this.bindings.has(identifier.lexeme)) {
			throw new YatayRuntimeError(
				identifier,
				`El identificador "${identifier.lexeme}" no se encuentra definido en este contexto.`
			);
		}
	}

	/**
	 * Validates whether or not the identifier is already defined in the environment, and issues an error if it is.
	 *
	 * @param identifier the identifier check.
	 */
	private assertIdentifierIsNotDefined(identifier: YatayToken): void {
		if (this.bindings.has(identifier.lexeme)) {
			throw new YatayRuntimeError(
				identifier,
				`El identificador "${identifier.lexeme}" ya se encuentra definido en este contexto.`
			);
		}
	}
}