import { NextResponse } from "next/server";

type AssistantRequestBody = {
  prompt?: unknown;
  language?: unknown;
};

const { HUGGING_FACE_SPACE_URL, HUGGING_FACE_API_KEY } = process.env;

const extractGeneratedText = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    return payload.trim() || null;
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const text = extractGeneratedText(item);
      if (text) {
        return text;
      }
    }
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.generated_text === "string") {
    return record.generated_text.trim() || null;
  }

  if (typeof record.text === "string") {
    return record.text.trim() || null;
  }

  if (typeof record.message === "string") {
    return record.message.trim() || null;
  }

  return null;
};

export async function POST(request: Request) {
  if (!HUGGING_FACE_SPACE_URL || !HUGGING_FACE_API_KEY) {
    return NextResponse.json({ error: "Assistant service is not configured" }, { status: 503 });
  }

  let body: AssistantRequestBody;

  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const huggingFaceResponse = await fetch(HUGGING_FACE_SPACE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!huggingFaceResponse.ok) {
      const errorText = await huggingFaceResponse.text().catch(() => "");
      throw new Error(`Hugging Face request failed (${huggingFaceResponse.status}): ${errorText}`);
    }

    const payload = await huggingFaceResponse.json();
    const message = extractGeneratedText(payload);

    if (!message) {
      throw new Error("Assistant response payload is empty");
    }

    return NextResponse.json({ message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Assistant route failed:", errorMessage);
    return NextResponse.json({ error: "Failed to fetch assistant response" }, { status: 502 });
  }
}
