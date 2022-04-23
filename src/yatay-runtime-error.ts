import { YatayToken } from "./yatay-token";

export class YatayRuntimeError extends Error {
	readonly token: YatayToken;

	constructor(token: YatayToken, errorMessage: string) {
		super(errorMessage);
		this.token = token;
	}
}