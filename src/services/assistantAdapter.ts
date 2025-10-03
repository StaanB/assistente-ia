import type { LanguageCode } from "@/components/common/LanguageSwitcher";

type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
};

type ChatHistoryItem = {
  role: "user" | "assistant" | "system";
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

const shouldUseMockAdapter = process.env.NEXT_PUBLIC_ASSISTANT_USE_MOCK !== "false";

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

const backendHandler: ChatHandler = async ({
  prompt,
  language,
  history,
  signal,
  onStreamToken,
}) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

    assistantContent += chunk;
    onStreamToken?.(chunk);
  }

  assistantContent += decoder.decode();

  const finalContent = assistantContent.trim();

  if (!finalContent) {
    throw new Error("Assistant response payload is empty");
  }

  if (finalContent.includes("[STREAM_ERROR]")) {
    const message = finalContent.split("[STREAM_ERROR]").pop()?.trim();
    throw new Error(message || "Assistant streaming error");
  }

  if (finalContent.includes("[STREAM_FALLBACK]")) {
    const message = finalContent.split("[STREAM_FALLBACK]").pop()?.trim();
    const fallbackMessage =
      message && message.length > 0
        ? message
        : "Desculpe, não consegui gerar uma resposta agora. Tente novamente em instantes.";

    return {
      id: createMessageId(),
      role: "assistant",
      content: fallbackMessage,
    };
  }

  const sanitizedContent = finalContent
    .replace(/<\/?s>/gi, "")
    .replace(/\[\/?(ASS|ASSISTANT|SYS|SYSTEM|USR|USER|INST)\]/gi, "")
    .replace(/^\s+/, "")
    .trim();

  return {
    id: createMessageId(),
    role: "assistant",
    content: sanitizedContent.length > 0 ? sanitizedContent : finalContent,
  };
};

export const requestAssistantResponse: ChatHandler = async (args) => {
  try {
    return shouldUseMockAdapter ? await mockHandler(args) : await backendHandler(args);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Assistant adapter failed:", error.message);
    }

    if (!shouldUseMockAdapter) {
      return mockHandler(args);
    }

    throw error;
  }
};

export type { AssistantMessage };
