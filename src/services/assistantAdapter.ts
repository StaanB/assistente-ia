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

const huggingFaceConfig = {
  spaceUrl: process.env.NEXT_PUBLIC_HUGGING_FACE_SPACE_URL,
  apiKey: process.env.NEXT_PUBLIC_HUGGING_FACE_API_KEY,
};

const shouldUseMockAdapter =
  !huggingFaceConfig.spaceUrl || !huggingFaceConfig.apiKey || process.env.NEXT_PUBLIC_ASSISTANT_USE_MOCK === "true";

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
  const translatedMessage = shouldTranslateToEnglish
    ? 'Mocked response for "' + prompt + '". We will connect to the real AI model soon.'
    : 'Resposta mockada para "' + prompt + '". Em breve, conectaremos com o modelo de IA real.';

  return {
    id: createMessageId(),
    role: "assistant",
    content: translatedMessage,
  };
};

const huggingFaceHandler: ChatHandler = async ({ prompt, signal }) => {
  if (!huggingFaceConfig.spaceUrl || !huggingFaceConfig.apiKey) {
    return mockHandler({ prompt, language: "pt-BR", signal });
  }

  const response = await fetch(huggingFaceConfig.spaceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + huggingFaceConfig.apiKey,
    },
    body: JSON.stringify({ inputs: prompt }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch assistant response (status " + response.status + ")");
  }

  const data = await response.json();
  const generatedText = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text ?? data?.text;

  if (typeof generatedText !== "string" || generatedText.trim().length === 0) {
    throw new Error("Assistant response payload is empty");
  }

  return {
    id: createMessageId(),
    role: "assistant",
    content: generatedText.trim(),
  };
};

const activeHandler: ChatHandler = shouldUseMockAdapter ? mockHandler : huggingFaceHandler;

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
