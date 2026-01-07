import { DatabaseSync } from "node:sqlite";
import fs from "node:fs/promises";
import path from "node:path";

export default class CodimdContext {
	constructor(folderChar, dbLocation, outputDir) {
		this.folderChar = folderChar;
		this.dbLocation = dbLocation;
		this.outputDir = outputDir;
	}

	formatDateForSql(date) {
		// Mimic the '2026-01-02 15:10:04.406 +00:00' format
		// or standard ISO '2026-01-02T15:10:04.406Z' which SQLite usually accepts.
		// We'll use a close approximation to the observed format.
		const iso = date.toISOString();
		return iso.replace("T", " ").replace("Z", " +00:00");
	}

	async run() {
		const database = new DatabaseSync(this.dbLocation);

		try {
			// Check available columns
			const tableInfo = database.prepare("PRAGMA table_info(Notes)").all();
			const columns = new Set(tableInfo.map((col) => col.name));

			// Build Select Query
			let sql = "SELECT id, content";
			if (columns.has("title")) sql += ", title";
			if (columns.has("alias")) sql += ", alias";
			if (columns.has("shortid")) sql += ", shortid";
			if (columns.has("lastchangeAt")) sql += ", lastchangeAt";
			if (columns.has("updatedAt")) sql += ", updatedAt";

			sql += " FROM Notes";

			if (columns.has("deletedAt")) {
				sql += " WHERE deletedAt IS NULL";
			}

			const query = database.prepare(sql);
			const notes = query.all();

			// Prepare Update Statement
			// We update both lastchangeAt and updatedAt when content changes from FS
			const updateSql = `
				UPDATE Notes 
				SET content = ?, lastchangeAt = ?, updatedAt = ? 
				WHERE id = ?
			`;
			const updateStmt = database.prepare(updateSql);

			for (const note of notes) {
				if (!note.content) continue;

				// Determine File Path
				const slug = note.alias || note.shortid || note.title || "Untitled";
				const safePath = slug.split(this.folderChar).join(path.sep);
				const filePath = path.join(this.outputDir, `${safePath}.md`);
				const dirPath = path.dirname(filePath);

				try {
					const fileStats = await fs.stat(filePath);
					const fileContent = await fs.readFile(filePath, "utf8");

					// Sync Logic
					if (fileContent !== note.content) {
						const dbTime = new Date(note.lastchangeAt || note.updatedAt || 0);
						const fsTime = fileStats.mtime;

						// Add a small buffer (e.g. 2s) to treat "close enough" as "DB is source"
						// or strict > comparison.
						// If FS is strictly newer than DB, we assume FS is the authority.
						if (fsTime > dbTime) {
							console.log(`[Sync] Updating DB from File: ${safePath}`);
							const newTimeStr = this.formatDateForSql(fsTime);
							updateStmt.run(fileContent, newTimeStr, newTimeStr, note.id);
						} else {
							console.log(`[Sync] Updating File from DB: ${safePath}`);
							await fs.writeFile(filePath, note.content);
							// Note: writeFile updates mtime to NOW.
						}
					}
				} catch (error) {
					if (error.code === "ENOENT") {
						// File does not exist -> Create it (DB is source)
						// console.log(`[Sync] Creating File from DB: ${safePath}`);
						await fs.mkdir(dirPath, { recursive: true });
						await fs.writeFile(filePath, note.content);
					} else {
						console.error(`Error processing ${filePath}:`, error);
					}
				}
			}
		} finally {
			database.close();
		}
	}
}
