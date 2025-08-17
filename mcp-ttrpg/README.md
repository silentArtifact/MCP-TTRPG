# MCP TTRPG Server

A Node 20+ Model Context Protocol server for tabletop RPG campaigns. It provides:

- `roll_dice` tool for rolling dice with optional advantage/disadvantage
- `campaign://` resources for session notes and lore stored as Markdown with YAML front matter

## Setup

```bash
npm install
npm run build
```

### Running

```bash
npm start   # run compiled server over stdio
npm run dev # run directly with tsx
```

### Testing

```bash
npm test
```

## Example MCP Client Config

### Claude Desktop

```json
{
  "name": "ttrpg",
  "command": "node",
  "args": ["dist/index.js"],
  "cwd": "/path/to/mcp-ttrpg"
}
```

### ChatGPT Desktop

```json
{
  "mcpServers": {
    "ttrpg": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/mcp-ttrpg"
    }
  }
}
```
