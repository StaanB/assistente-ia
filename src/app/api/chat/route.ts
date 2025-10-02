import type { NextRequest } from "next/server";

const resolveChatEndpoint = (baseUrl: string) => {
  const trimmed = baseUrl.trim();

  if (trimmed.endsWith("/chat/stream")) {
    return trimmed;
  }

  return trimmed.replace(/\/$/, "") + "/chat/stream";
};

const upstreamBaseUrl = process.env.HUGGING_FACE_SPACE_URL;
const upstreamApiKey = process.env.HUGGING_FACE_API_KEY;

export async function POST(request: NextRequest) {
  if (!upstreamBaseUrl) {
    return Response.json({ error: "Upstream chat endpoint is not configured" }, { status: 500 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const body = JSON.stringify(payload);
  const controller = new AbortController();
  request.signal.addEventListener("abort", () => controller.abort(), { once: true });

  const upstreamResponse = await fetch(resolveChatEndpoint(upstreamBaseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(upstreamApiKey ? { "x-api-key": upstreamApiKey } : {}),
    },
    body,
    signal: controller.signal,
  }).catch((error: unknown) => {
    if ((error as DOMException | undefined)?.name === "AbortError") {
      return new Response(null, { status: 499, statusText: "Client Closed Request" });
    }

    throw error;
  });

  if (!upstreamResponse) {
    return Response.json({ error: "Failed to reach upstream chat service" }, { status: 502 });
  }

  if (!upstreamResponse.ok) {
    const fallbackText = await upstreamResponse.text();

    return new Response(
      fallbackText || JSON.stringify({ error: "Upstream chat returned an error" }),
      {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: { "Content-Type": upstreamResponse.headers.get("Content-Type") || "text/plain" },
      },
    );
  }

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set("Cache-Control", "no-store");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const dynamic = "force-dynamic";
