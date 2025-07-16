# MCP Dice Roller Server

A lightweight micro-service that provides deterministic, game-system-agnostic tabletop RPG dice rolling over HTTP and WebSocket APIs.  
Clients send roll expressions (`3d6kl2+4`, `2d20kh1-3`); the server evaluates them and returns verifiable results.

## Table of Contents
1. [Features](#features)  
2. [Quick Start (Docker)](#quick-start-docker)  
3. [API Reference](#api-reference)  
4. [Supported Dice Notation](#supported-dice-notation)  
5. [Configuration](#configuration)  
6. [Deployment Details](#deployment-details)  
7. [Roadmap](#roadmap)  
8. [Contributing](#contributing)  
9. [License](#license)

## Features

| Category | Highlights |
|----------|------------|
| Core roller | Polyhedral dice (`d4` → `d100`), additive/subtractive modifiers, keep/drop highest/lowest, exploding dice, rerolls, compound expressions, comments (`// text`). |
| API flexibility | REST (`POST /roll`) and real-time WebSocket streams (`/ws`) for bots, VTTs, or LLM agents. |
| System-agnostic | No baked-in RPG logic—just reliable dice math. |
| Lightweight | Single-binary Go build or minimal Python + Uvicorn image (< 20 MB). |

## Quick Start (Docker)

````bash
# pull and run the latest image
docker run -d --name dice \
  -p 8080:8080 \
  ghcr.io/your-org/mcp-dice-roller:latest
