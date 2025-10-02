import type { LanguageCode } from "@/components/common/LanguageSwitcher";

type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
};

type RequestAssistantResponseArgs = {
  prompt: string;
  language: LanguageCode;
  signal?: AbortSignal;
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

const mockHandler: ChatHandler = async ({ prompt, language, signal }) => {
  await waitFor(MOCK_RESPONSE_DELAY_MS, signal);

  const shouldTranslateToEnglish = language === "en-US";

  return {
    id: createMessageId(),
    role: "assistant",
    content: shouldTranslateToEnglish
      ? `Mocked response for "${prompt}". We will connect to the real AI model soon.`
      : `Resposta mockada para "${prompt}". Em breve, conectaremos com o modelo de IA real.`,
  };
};

const apiHandler: ChatHandler = async ({ prompt, language, signal }) => {
  const response = await fetch("/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, language }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch assistant response (status ${response.status})`);
  }

  const data: unknown = await response.json();
  const message =
    typeof data === "object" && data !== null && typeof (data as { message?: unknown }).message === "string"
      ? ((data as { message: string }).message || "").trim()
      : null;

  if (!message) {
    throw new Error("Assistant response payload is empty");
  }

  return {
    id: createMessageId(),
    role: "assistant",
    content: message,
  };
};

const activeHandler: ChatHandler = shouldUseMockAdapter ? mockHandler : apiHandler;

export const requestAssistantResponse: ChatHandler = async (args) => {
  try {
    return await activeHandler(args);
  } catch (error) {
    if (!shouldUseMockAdapter && error instanceof Error) {
      console.error("Assistant adapter failed, falling back to mock handler:", error.message);
      return mockHandler(args);
    }

    throw error;
  }
};

export type { AssistantMessage };

