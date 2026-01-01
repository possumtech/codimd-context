# codimd-context

Service that reads a codimd sqlite file and generates all the documents as files for LLM context inclusion

## Use Case

This tool is designed to extract notes from a CodiMD SQLite database and convert them into individual markdown files. This is particularly useful for users who want to leverage their notes as context for Large Language Models (LLMs) or other applications that require file-based input.

## Prerequisites
- Node.js (v24 or higher)
- npm (v11 or higher)
- SQLite3 database file from CodiMD

## Installation

1. Clone the repository:

```bash
git clone git@github.com:possumtech/codimd-context.git
```

2. Navigate to the project directory and create your `.env` file:

```bash
cd codimd-context

cp .env.example .env

vim .env
```

3. Run the app
```bash
npm run start
```

## Configuration

```cfg
FOLDER_CHAR="_"
DB_LOCATION="~/codimd/db.sqlite3"
OUTPUT_DIR="context/"
```

- `FOLDER_CHAR`: Character in note titles that will be replaced with folder structure.

- `DB_LOCATION`: Path to your CodiMD SQLite database file.

- `OUTPUT_DIR`: Directory where the generated files will be saved.


## Notes

I don't know or care about Hedgedoc. Good luck getting this to work with that.
Let me know if it works or there's an easy fix.

## License

MIT License. See `LICENSE` file for details.
