import type { LanguageCode } from "@/components/common/LanguageSwitcher";

type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
};

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type RequestAssistantResponseArgs = {
  prompt: string;
  language: LanguageCode;
  history: ChatHistoryItem[];
  signal?: AbortSignal;
  onStreamToken?: (chunk: string) => void;
};

type ChatHandler = (args: RequestAssistantResponseArgs) => Promise<AssistantMessage>;

const MOCK_RESPONSE_DELAY_MS = 1200;

const huggingFaceConfig = {
  spaceUrl:
    process.env.NEXT_PUBLIC_HUGGING_FACE_SPACE_URL ?? process.env.HUGGING_FACE_SPACE_URL,
  apiKey:
    process.env.NEXT_PUBLIC_HUGGING_FACE_API_KEY ?? process.env.HUGGING_FACE_API_KEY,
};

const shouldUseMockAdapter =
  !huggingFaceConfig.spaceUrl || process.env.NEXT_PUBLIC_ASSISTANT_USE_MOCK === "true";

const logDebug = (...args: unknown[]) => {
    console.log(...args);
};

const waitFor = (delay: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (delay <= 0) {
      resolve();
      return;
    }

    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, delay);

    const handleAbort = () => {
      clearTimeout(timeoutId);
      reject(createAbortError());
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
  });

const createAbortError = () => {
  if (typeof DOMException !== "undefined") {
    return new DOMException("Aborted", "AbortError");
  }

  const abortError = new Error("Aborted");
  abortError.name = "AbortError";
  return abortError;
};

const createMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};

const mockHandler: ChatHandler = async ({ prompt, language, signal, onStreamToken }) => {
  await waitFor(MOCK_RESPONSE_DELAY_MS, signal);

  const shouldTranslateToEnglish = language === "en-US";
  const translatedMessage = shouldTranslateToEnglish
    ? 'Mocked response for "' + prompt + '". We will connect to the real AI model soon.'
    : 'Resposta mockada para "' + prompt + '". Em breve, conectaremos com o modelo de IA real.';

  if (onStreamToken) {
    onStreamToken(translatedMessage);
  }

  return {
    id: createMessageId(),
    role: "assistant",
    content: translatedMessage,
  };
};

const resolveChatEndpoint = (baseUrl: string) => {
  const trimmed = baseUrl.trim();

  if (trimmed.endsWith("/chat/stream")) {
    return trimmed;
  }

  return trimmed.replace(/\/$/, "") + "/chat/stream";
};

const backendHandler: ChatHandler = async ({
  prompt,
  language,
  history,
  signal,
  onStreamToken,
}) => {
  if (!huggingFaceConfig.spaceUrl) {
    return mockHandler({ prompt, language, history, signal, onStreamToken });
  }

  logDebug("[assistantAdapter] sending chat request", {
    language,
    historySize: history.length,
    hasSignal: Boolean(signal),
  });

  const response = await fetch(resolveChatEndpoint(huggingFaceConfig.spaceUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(huggingFaceConfig.apiKey ? { "x-api-key": huggingFaceConfig.apiKey } : {}),
    },
    body: JSON.stringify({
      message: prompt,
      lang: language,
      history,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch assistant response (status " + response.status + ")");
  }

  logDebug("[assistantAdapter] chat request accepted", response.status);

  if (!response.body) {
    const fallbackText = await response.text();
    throw new Error(
      "Assistant response stream is not available" + (fallbackText ? ": " + fallbackText : ""),
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantContent = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    const chunk = decoder.decode(value, { stream: true });

    if (!chunk) {
      continue;
    }

    const markerIndex = chunk.indexOf("[STREAM_ERROR]");

    if (markerIndex !== -1) {
      const message = chunk.slice(markerIndex + "[STREAM_ERROR]".length).trim();
      throw new Error(message || "Assistant streaming error");
    }

    assistantContent += chunk;
    onStreamToken?.(chunk);
  }

  assistantContent += decoder.decode();

  const finalContent = assistantContent.trim();

  if (!finalContent) {
    throw new Error("Assistant response payload is empty");
  }

  return {
    id: createMessageId(),
    role: "assistant",
    content: finalContent,
  };
};

const activeHandler: ChatHandler = shouldUseMockAdapter ? mockHandler : backendHandler;

export const requestAssistantResponse: ChatHandler = async (args) => {
  try {
    return await activeHandler(args);
  } catch (error) {
    logDebug("[assistantAdapter] chat request failed", error);
    if (!shouldUseMockAdapter && error instanceof Error) {
      console.error("Assistant adapter failed, falling back to mock handler:", error.message);
      return mockHandler(args);
    }

    throw error;
  }
};

export type { AssistantMessage };
