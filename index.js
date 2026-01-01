import { setTimeout } from "node:timers/promises";
import CodimdContext from "./modules/codimd-context.js";

const { FOLDER_CHAR, DB_LOCATION, OUTPUT_DIR, REFRESH_INTERVAL } = process.env;
if (!FOLDER_CHAR) throw new Error("FOLDER_CHAR not set");
if (!DB_LOCATION) throw new Error("DB_LOCATION not set");
if (!OUTPUT_DIR) throw new Error("OUTPUT_DIR not set");

const codimdContext = new CodimdContext(FOLDER_CHAR, DB_LOCATION, OUTPUT_DIR);

const interval = Number.parseInt(REFRESH_INTERVAL, 10);

if (!Number.isNaN(interval) && interval > 0) {
	console.log(`Starting service with refresh interval: ${interval}ms`);
	while (true) {
		try {
			await codimdContext.run();
		} catch (error) {
			console.error("Error during run:", error);
		}
		await setTimeout(interval);
	}
} else {
	await codimdContext.run();
}
