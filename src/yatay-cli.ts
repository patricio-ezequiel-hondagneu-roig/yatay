import { existsSync, readFileSync } from "fs";
import { argv } from "process";
import { yatayFileExtension } from "./constants";
import { YatayParser } from "./yatay-parser";
import { YatayScanner } from "./yatay-scanner";
import { YatayToken, YatayTokenKind } from "./yatay-token";

/**
 * The command line interface used to either interpret Yatay source code files or run Yatay's interactive shell.
 */
export class YatayCli {
	/**
	 * The arguments passed when executing the command line interface.
	 */
	private commandLineArguments: string[];

	/**
	 * It's _true_ if an error occurred during the scanning and _false_ otherwise.
	 */
	private hadError: boolean = false;

	constructor() {
		// The command line arguments are stored starting from the third index.
		this.commandLineArguments = argv.slice(2);
	}

	/**
	 * Executes Yatay according to the command line arguments provided.
	 */
	run(): void {
		if (this.commandLineArguments.length > 1) {
			console.log(`Uso: yatay [archivo .${yatayFileExtension}]`);
			process.exit(64);
		} else if (this.commandLineArguments.length === 1) {
			const filePath = this.commandLineArguments[0];
			this.runFile(filePath);
		} else {
			this.runPrompt();
		}
	}

	/**
	 * Reports that a scanning error occurred in the provided line, using the provided message.
	 *
	 * @param line the line where the error occurred.
	 * @param message the message to display about the error that occurred.
	 */
	announceScanningError(line: number, message: string): void {
		this.reportError(line, message);
	}

	announceParsingError(token: YatayToken, message: string): void {
		if (token.kind === YatayTokenKind.EndOfFile) {
			this.reportError(token.line, message, "el final");
		}
		else {
			this.reportError(token.line, message, `"${token.lexeme}"`);
		}
	}

	/**
	 * Looks up the file according to the file path provided and, if found, executes its content as Yatay source code.
	 *
	 * @param filePath the path of the source code file to run
	 */
	private runFile(filePath: string): void {
		const canonicalFilePath = this.findCanonicalFilePath(filePath);
		if (canonicalFilePath === null) {
			console.log(
				`El archivo de código fuente "${filePath}" no existe o no es posible leerlo.`
			);
			return;
		}

		const sourceCode = readFileSync(canonicalFilePath, {
			encoding: "utf8",
		});
		this.runSourceCode(sourceCode);

		if (this.hadError) {
			process.exit(65);
		}
	}

	/**
	 * Starts an interactive shell to run Yatay code.
	 */
	private runPrompt(): void {
		// TODO: Replace with actual implementation
		console.log(
			"La ejecución interactiva de código Yatay estará lista próximamente."
		);
	}

	/**
	 * Attempts to parse and interpret the provided Yatay source code.
	 *
	 * @param sourceCode the Yatay source code to execute.
	 */
	private runSourceCode(sourceCode: string): void {
		const scanner = new YatayScanner(this, sourceCode);
		const tokens = scanner.scanTokens();

		// TODO: Replace with actual implementation
		console.log("\Tokens en el código fuente:\n");
		tokens.forEach((token) => console.log(String(token)));

		const parser = new YatayParser(this, tokens);
		const expression = parser.parse();

		if (this.hadError) {
			return;
		}
	}

	/**
	 * Returns the canonical file path that corresponds to the one provided, if available, or _null_ otherwise.
	 *
	 * @param filePath the file path for which to find the canonical version.
	 */
	private findCanonicalFilePath(filePath: string): string | null {
		let canonicalFilePath: string;

		if (filePath.endsWith(`.${yatayFileExtension}`)) {
			canonicalFilePath = filePath;
		} else {
			canonicalFilePath = `${filePath}.${yatayFileExtension}`;
		}

		if (existsSync(canonicalFilePath)) {
			return canonicalFilePath;
		}

		return null;
	}

	/**
	 * Reports an error in the standard error output, indicating the line number, error message, and optionally semantic
	 * location of the error.
	 *
	 * @param line the line where the error occurred.
	 * @param message the message to display about the error that occurred.
	 * @param location the semantic location where the error occurred (_null_ by default).
	 */
	private reportError(
		line: number,
		message: string,
		location: string | null = null
	): void {
		if (location !== null) {
			console.error(`[Línea ${line}] Error en ${location}: ${message}`);
		} else {
			console.error(`[Línea ${line}] Error: ${message}`);
		}

		this.hadError = true;
	}
}
