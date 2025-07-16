from mcp_dice import app

if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.getenv("MCP_PORT", "8080"))
    host = os.getenv("MCP_BIND", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
