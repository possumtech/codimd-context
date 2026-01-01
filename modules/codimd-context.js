import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export default class CodimdContext {
	constructor(folderChar, dbLocation, outputDir) {
		this.folderChar = folderChar;
		this.dbLocation = dbLocation;
		this.outputDir = outputDir;
	}

	async run() {
		const database = new DatabaseSync(this.dbLocation);

		try {
			// Check available columns to make the query robust against schema variations
			const tableInfo = database.prepare("PRAGMA table_info(Notes)").all();
			const columns = new Set(tableInfo.map((col) => col.name));

			let sql = "SELECT content";
			if (columns.has("title")) sql += ", title";
			if (columns.has("alias")) sql += ", alias";
			if (columns.has("shortid")) sql += ", shortid";

			sql += " FROM Notes";

			if (columns.has("deletedAt")) sql += " WHERE deletedAt IS NULL";

			const query = database.prepare(sql);
			const notes = query.all();

			for (const note of notes) {
				if (!note.content) continue;

				// Use alias or shortid for the filename to match URL structure
				// Fallback to title if neither exists (unlikely in CodiMD)
				const slug = note.alias || note.shortid || note.title || "Untitled";
				const safePath = slug.split(this.folderChar).join(path.sep);
				const filePath = path.join(this.outputDir, `${safePath}.md`);
				const dirPath = path.dirname(filePath);

				await fs.mkdir(dirPath, { recursive: true });
				await fs.writeFile(filePath, note.content);
			}
		} finally {
			database.close();
		}
	}
}
