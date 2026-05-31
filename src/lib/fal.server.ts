const FAL_BASE = "https://queue.fal.run";

function falKey() {
  const k = process.env.FAL_KEY;
  if (!k) throw new Error("FAL_KEY not configured");
  return k;
}

type FalSubmitResponse = { request_id: string; status_url: string; response_url: string };

async function falSubmit(endpoint: string, input: Record<string, unknown>): Promise<FalSubmitResponse> {
  const res = await fetch(`${FAL_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`fal submit failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  return res.json();
}

async function falPoll<T>(statusUrl: string, responseUrl: string, timeoutMs = 240_000): Promise<T> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const s = await fetch(statusUrl, { headers: { Authorization: `Key ${falKey()}` } });
    if (!s.ok) throw new Error(`fal status failed (${s.status})`);
    const js = await s.json() as { status: string; logs?: unknown };
    if (js.status === "COMPLETED") {
      const r = await fetch(responseUrl, { headers: { Authorization: `Key ${falKey()}` } });
      if (!r.ok) throw new Error(`fal response failed (${r.status})`);
      return r.json();
    }
    if (js.status === "FAILED") throw new Error(`fal job failed: ${JSON.stringify(js).slice(0, 300)}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("fal job timed out");
}

export async function falRun<T>(endpoint: string, input: Record<string, unknown>, timeoutMs?: number): Promise<T> {
  const sub = await falSubmit(endpoint, input);
  return falPoll<T>(sub.status_url, sub.response_url, timeoutMs);
}

export async function fetchToBytes(url: string): Promise<{ bytes: Buffer; mime: string }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return { bytes: buf, mime: r.headers.get("content-type") || "application/octet-stream" };
}