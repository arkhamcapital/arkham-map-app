function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "ANTHROPIC_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.",
    });
  }

  let raw;
  try {
    if (typeof req.body === "string") {
      raw = req.body;
    } else if (req.body && typeof req.body === "object" && Object.keys(req.body).length) {
      raw = JSON.stringify(req.body);
    } else {
      raw = await getRawBody(req);
    }
  } catch {
    return res.status(400).json({ error: "Could not read request body" });
  }

  if (!raw || raw === "{}") {
    return res.status(400).json({ error: "Empty body" });
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
    return res.status(502).json({ error: e.message || String(e) });
  }

  res.status(upstream.status);
  const ct = upstream.headers.get("content-type");
  if (ct) res.setHeader("Content-Type", ct);

  if (!upstream.body) {
    const t = await upstream.text();
    res.send(t);
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
      return res.status(500).json({ error: e.message || String(e) });
    }
  }
  res.end();
};
