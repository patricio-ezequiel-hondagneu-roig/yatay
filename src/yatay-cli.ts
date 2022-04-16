import { existsSync, readFileSync } from "fs";
import { argv } from "process";
import { yatayFileExtension } from "./constants";
import { YatayScanner } from "./yatay-scanner";

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
	private hadScanningError: boolean = false;

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
	 * Reports that an error occurred in the provided line, using the provided message.
	 *
	 * @param line the line where the error occurred.
	 * @param message the message to display about the error that occurred.
	 */
	announceError(line: number, message: string): void {
		this.reportError(line, message);
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

		if (this.hadScanningError) {
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
		console.log("\nTokens contained in the source code file:\n");
		tokens.forEach((token) => console.log(String(token)));
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
			console.error(`[Línea ${line}] Error at ${location}: ${message}`);
		} else {
			console.error(`[Línea ${line}] Error: ${message}`);
		}

		this.hadScanningError = true;
	}
}
