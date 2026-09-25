# threads-mcp: public Threads reader (read-only, no login). Pinned to the audited commit.
FROM golang:1.27 AS mcp
RUN git clone https://github.com/granitebps/threads-mcp /src \
 && cd /src && git checkout 6a10a48c614fae22dedba8feef8e088c5e2697c3 \
 && CGO_ENABLED=0 go build -o /threads-mcp ./cmd/threads-mcp

FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    CONFIG_DIR=/config \
    DATA_DIR=/data \
    THREADS_MCP_BIN=/usr/local/bin/threads-mcp \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
 && playwright install --with-deps --only-shell chromium \
 && rm -rf /var/lib/apt/lists/*
COPY --from=mcp /threads-mcp /usr/local/bin/threads-mcp
COPY *.py accounts.json ./
CMD ["python", "bot.py"]
