# MCP Dice Roller Server

A lightweight micro-service that provides deterministic, game-system-agnostic tabletop RPG dice rolling over HTTP and WebSocket APIs. Clients send roll expressions (`3d6kl2+4`, `2d20kh1-3`); the server evaluates them and returns verifiable results.

## Table of Contents
1. [Features](#features)
2. [Quick Start (Docker)](#quick-start-docker)
3. [API Reference](#api-reference)
4. [Supported Dice Notation](#supported-dice-notation)
5. [Configuration](#configuration)
6. [Deployment Details](#deployment-details)
7. [Building & Testing](#building--testing)
8. [Roadmap](#roadmap)
9. [Contributing](#contributing)
10. [License](#license)

## Features

| Category | Highlights |
|----------|------------|
| Core roller | Polyhedral dice (`d4` → `d100`), additive/subtractive modifiers, keep/drop highest/lowest, exploding dice, rerolls, compound expressions, comments (`// text`). |
| API flexibility | REST (`POST /roll`) and real-time WebSocket streams (`/ws`) for bots, VTTs, or LLM agents. |
| System-agnostic | No baked-in RPG logic—just reliable dice math. |
| Lightweight | Single-binary Go build or minimal Python + Uvicorn image (< 20 MB). |

## Quick Start (Docker)

```bash
# pull and run the latest image
docker run -d --name dice \
  -p 8080:8080 \
  ghcr.io/your-org/mcp-dice-roller:latest
```

Send a roll expression:

```bash
curl -X POST http://localhost:8080/roll \
  -H 'Content-Type: application/json' \
  -d '{"expression":"2d20kh1+5","seed":"rogue-2025-07-16"}'
```

Expected response:

```json
{
  "expression": "2d20kh1+5",
  "dice": [19, 4],
  "used": [19],
  "modifier": 5,
  "total": 24,
  "seed": "rogue-2025-07-16",
  "timestamp": "2025-07-16T21:47:03Z"
}
```

## API Reference

### POST /roll

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| expression | string | ✓ | Dice string (see notation). |
| seed | string | ✗ | Optional seed for deterministic rolls. |
| tags | string[] | ✗ | Arbitrary labels (initiative, attack, etc.). |

Successful response:

```json
{
  "expression": "2d20kh1+5",
  "dice": [19, 4],
  "used": [19],
  "modifier": 5,
  "total": 24,
  "seed": "rogue-2025-07-16",
  "timestamp": "2025-07-16T21:47:03Z"
}
```

### GET /ws

WebSocket endpoint. Send plaintext expressions; receive one-line JSON results—ideal for chat bots or VTT overlays.

## Supported Dice Notation

| Syntax | Meaning | Example |
|--------|---------|--------|
| NdX | Roll N X-sided dice | `3d6` |
| +K / -K | Add / subtract constant | `2d8+3` |
| khN / klN | Keep highest / lowest N dice | `4d6kh3` |
| dhN / dlN | Drop highest / lowest N dice | `4d6dl1` |
| ! | Explode on max (roll again & add) | `d6!` |
| r< / r> | Reroll below / above threshold once | `d20r<3` |
| Parentheses | Nest expressions | `(2d6+1)d4` |
| Comments | `//` ignored to line end | `3d6 // str` |

Full grammar lives in `docs/grammar.md`.

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| MCP_PORT | 8080 | Listen port |
| MCP_BIND | 0.0.0.0 | Bind address |
| MCP_ALLOW_ORIGINS | * | CORS origins (comma-separated) |

## Deployment Details

### Build your own image

```bash
git clone https://github.com/your-org/mcp-dice-roller.git
cd mcp-dice-roller
docker build -t mcp-dice-roller .
```

### docker-compose example

```yaml
version: "3.9"
services:
  dice:
    image: ghcr.io/your-org/mcp-dice-roller:latest
    ports:
      - "8080:8080"
    environment:
      MCP_PORT: "8080"
      MCP_BIND: "0.0.0.0"
```

## Building & Testing

Clone the repo and run the following:

```bash
git clone https://github.com/your-org/mcp-dice-roller.git
cd mcp-dice-roller
# build Docker image
docker build -t mcp-dice-roller .
# run tests and linters
make test lint
```

## Roadmap

    v1.1 – Slash-command reference UI, refined CORS handling

    v1.2 – Pluggable auth (JWT / API keys)

    v2.0 – Rule-module SDK (D&D 5e crits, Fate fudge dice, Genesys)

    v2.1 – Cluster mode with Redis pub-sub, horizontal scaling

    v3.0 – WASM client-side roller fallback for offline VTTs

## Contributing

    Fork → feature branch → PR

    Run make test lint

    Ensure all checks pass; CI will reject otherwise

    One feature or fix per PR; keep commits atomic

Pull requests for dice-notation edge cases, performance tweaks, and documentation are welcome.

## License

Apache 2.0—see LICENSE.

