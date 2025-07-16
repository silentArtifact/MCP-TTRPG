FROM python:3.12-alpine AS base
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV MCP_PORT=8080 MCP_BIND=0.0.0.0
EXPOSE ${MCP_PORT}
CMD ["python", "main.py"]

