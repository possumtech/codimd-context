import CodimdContext" from "./modules/CodimdContext.js";

const { FOLDER_CHAR, DB_LOCATION, OUTPUT_DIR } = process.env;
if (!FOLDER_CHAR) throw new Error("FOLDER_CHAR not set");
if (!DB_LOCATION) throw new Error("DB_LOCATION not set");
if (!OUTPUT_DIR) throw new Error("OUTPUT_DIR not set");

const codimdContext = new CodimdContext(FOLDER_CHAR, DB_LOCATION, OUTPUT_DIR);

await codimdContext.run();
