/** Anthropic Messages API — streaming via dev proxy (see src/setupProxy.js). */

export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export const SYSTEM_PROMPT =
  "You are a transit planning assistant helping schedulers at Canadian transit agencies " +
  "evaluate whether a bus stop needs a service change. Be specific, concise, and actionable. " +
  "Always end with a clear recommendation: one of [No change needed, Monitor closely, " +
  "Recommend adding tripper, Recommend frequency increase, Escalate to full route review].";

export function buildAnalysisUserPrompt({
  stop_name,
  stop_id,
  routesStr,
  frequencyStr,
  selected_period,
  poi_list,
  is_interchange,
  gap_score,
}) {
  return `Analyze this stop for potential service gaps:
Stop: ${stop_name} (ID: ${stop_id})
Routes serving this stop: ${routesStr}
Scheduled frequency by time period (trips/hour): ${frequencyStr}
Selected time period for analysis: ${selected_period}
Nearby points of interest within 400m: ${poi_list}
Near major interchange: ${is_interchange}
Gap score: ${gap_score}/100

Based on this data, should a scheduler investigate a service change at this stop?`;
}

function routesToString(routes) {
  if (!routes?.length) return "(none listed)";
  return routes
    .map((r) => {
      const id = r.route_short_name || r.route_id || "";
      const name = r.route_long_name ? ` — ${r.route_long_name}` : "";
      return `${id}${name}`.trim();
    })
    .join("; ");
}

function frequencyToString(frequency) {
  if (!frequency || typeof frequency !== "object") return "{}";
  return JSON.stringify(frequency);
}

export function buildPromptPayload({
  stop_name,
  stop_id,
  routes,
  frequency,
  selected_period_label,
  poi_list,
  is_interchange,
  gap_score,
}) {
  const userText = buildAnalysisUserPrompt({
    stop_name: stop_name || "Unknown",
    stop_id: stop_id ?? "",
    routesStr: routesToString(routes),
    frequencyStr: frequencyToString(frequency),
    selected_period: selected_period_label,
    poi_list: poi_list || "—",
    is_interchange: is_interchange ? "Yes" : "No",
    gap_score,
  });

  return {
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    stream: true,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userText }],
  };
}

/**
 * Streams assistant text via POST /api/claude/messages (dev proxy).
 * @param {object} body - Anthropic Messages API JSON body
 * @param {{ onDelta: (t:string)=>void, onError?: (m:string)=>void, onDone?: ()=>void, signal?: AbortSignal }} handlers
 */
export async function streamAnthropicMessages(body, { onDelta, onError, onDone, signal }) {
  let res;
  try {
    res = await fetch("/api/claude/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e.name === "AbortError") return;
    onError?.(
      e.message ||
        "Network error. Use `npm start` (dev server) with ANTHROPIC_API_KEY in .env.local, or add a production proxy."
    );
    return;
  }

  if (!res.ok) {
    const t = await res.text();
    let msg = t;
    try {
      const j = JSON.parse(t);
      msg = j.error || j.message || t;
    } catch {
      /* plain text */
    }
    onError?.(msg || `HTTP ${res.status}`);
    return;
  }

  if (!res.body) {
    onError?.("Empty response body");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      carry += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = carry.indexOf("\n")) >= 0) {
        const line = carry.slice(0, nl).trimEnd();
        carry = carry.slice(nl + 1);

        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;

        let evt;
        try {
          evt = JSON.parse(data);
        } catch {
          continue;
        }

        if (evt.type === "error" && evt.error) {
          onError?.(
            typeof evt.error === "string"
              ? evt.error
              : evt.error.message || JSON.stringify(evt.error)
          );
          return;
        }

        if (
          evt.type === "content_block_delta" &&
          evt.delta?.type === "text_delta" &&
          typeof evt.delta.text === "string"
        ) {
          onDelta(evt.delta.text);
        }
      }
    }
  } catch (e) {
    if (e.name !== "AbortError") onError?.(e.message || String(e));
    return;
  }

  onDone?.();
}
