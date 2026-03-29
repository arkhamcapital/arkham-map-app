/**
 * Local proxy for Anthropic Messages API (keeps API key off the browser).
 * CRA dev server forwards POST /api/* here via package.json "proxy".
 * Load env from .env.local first (same as Create React App).
 */
const http = require("http");
const path = require("path");
const fs = require("fs");

function loadEnv() {
  const root = path.join(__dirname, "..");
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  }
}

loadEnv();

const PORT = parseInt(process.env.ANTHROPIC_PROXY_PORT || "3001", 10);

function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/claude/messages") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY missing. Set it in .env.local in the mapapp folder.",
      })
    );
    return;
  }

  let raw;
  try {
    raw = await collectBody(req);
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Bad body" }));
    return;
  }

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: raw,
    });
  } catch (e) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message || String(e) }));
    return;
  }

  res.statusCode = upstream.status;
  const ct = upstream.headers.get("content-type");
  if (ct) res.setHeader("Content-Type", ct);

  if (!upstream.body) {
    const t = await upstream.text();
    res.end(t);
    return;
  }

  const reader = upstream.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } catch (e) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }
  res.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    `[anthropic-proxy] listening on http://127.0.0.1:${PORT} (forward /api/claude/messages here)`
  );
});

server.on("error", (err) => {
  console.error("[anthropic-proxy]", err.message);
  process.exit(1);
});
