/**
 * Dev-only proxy: forwards POST /api/claude/messages → Anthropic with the server-side API key.
 * Add ANTHROPIC_API_KEY to .env.local (never commit). `npm run build` static output has no proxy;
 * deploy a serverless function or small backend for production.
 */
function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

module.exports = function (app) {
  app.post("/api/claude/messages", async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error:
          "ANTHROPIC_API_KEY is not set. Create .env.local in the mapapp folder with ANTHROPIC_API_KEY=your_key",
      });
      return;
    }

    let raw;
    try {
      raw = await collectBody(req);
    } catch {
      res.status(400).json({ error: "Could not read request body" });
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
      res.status(502).json({ error: e.message || String(e) });
      return;
    }

    res.status(upstream.status);
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
      if (!res.headersSent) res.status(500).json({ error: e.message });
    }
    res.end();
  });
};
