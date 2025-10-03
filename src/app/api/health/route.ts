const upstreamBaseUrl = process.env.HUGGING_FACE_SPACE_URL;
const upstreamApiKey = process.env.HUGGING_FACE_API_KEY;

const resolveHealthEndpoint = (baseUrl: string) => {
  const trimmed = baseUrl.trim();

  if (trimmed.endsWith("/health")) {
    return trimmed;
  }

  if (/(\/chat(?:\/stream)?)$/.test(trimmed)) {
    return trimmed.replace(/\/chat(?:\/stream)?$/, "/health");
  }

  return trimmed.replace(/\/$/, "") + "/health";
};

export async function GET() {
  if (!upstreamBaseUrl) {
    return Response.json({ error: "Upstream health endpoint is not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(resolveHealthEndpoint(upstreamBaseUrl), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(upstreamApiKey ? { "x-api-key": upstreamApiKey } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const fallbackText = await response.text();

      return new Response(
        fallbackText || JSON.stringify({ error: "Upstream health returned an error" }),
        {
          status: response.status,
          statusText: response.statusText,
          headers: { "Content-Type": response.headers.get("Content-Type") || "text/plain" },
        },
      );
    }

    const payload = await response.json().catch(() => null);

    if (!payload || typeof payload !== "object") {
      return Response.json({ error: "Invalid upstream health payload" }, { status: 502 });
    }

    return Response.json(payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if ((error as DOMException | undefined)?.name === "AbortError") {
      return new Response(null, { status: 499, statusText: "Client Closed Request" });
    }

    console.error("[health] upstream fetch failed", error);
    return Response.json({ error: "Failed to reach upstream health service" }, { status: 502 });
  }
}

export const dynamic = "force-dynamic";
