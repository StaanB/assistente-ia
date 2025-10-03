"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import LanguageSwitcher, { LanguageCode } from "@/components/common/LanguageSwitcher";
import ChatConversation from "@/components/home/ChatConversation";
import PromptForm from "@/components/home/PromptForm";
import { requestAssistantResponse } from "@/services/assistantAdapter";
import {
  createMessageId,
  trimChatHistory,
  type ChatMessage,
  type HistoryMessage,
} from "@/utils/chat";
import { getHomeCopy } from "@/utils/homeCopy";

const quickPromptsByLanguage: Record<LanguageCode, string[]> = {
  "pt-BR": [
    "Como você funciona?",
    "Quem é Stanley?",
    "Onde Stanley trabalhou?",
  ],
  "en-US": [
    "How do you work?",
    "Who is Stanley?",
    "Where has Stanley worked?",
  ],
};

export const quickPrompts = quickPromptsByLanguage["pt-BR"];

const makeTranslate = (language: LanguageCode) => {
  return (pt: string, en: string) => (language === "pt-BR" ? pt : en);
};

function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("pt-BR");

  const conversationContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingResponseAbortControllerRef = useRef<AbortController | null>(null);

  const translate = useMemo(() => makeTranslate(language), [language]);
  const copy = useMemo(() => getHomeCopy(language), [language]);
  const quickPromptOptions = quickPromptsByLanguage[language];
  const hasPrompt = useMemo(() => prompt.trim().length > 0, [prompt]);
  const isConversationActive = messages.length > 0;

  useEffect(() => {
    const container = conversationContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isAssistantThinking]);

  useEffect(() => {
    return () => {
      pendingResponseAbortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasPrompt || isAssistantThinking) {
      return;
    }

    const cleanedPrompt = prompt.trim();
    const historyMessages: HistoryMessage[] = messages.map(({ role, content }) => ({ role, content }));
    const trimmedHistory = trimChatHistory(historyMessages);
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: cleanedPrompt,
    };
    const assistantMessageId = createMessageId();
    const fallbackAssistantMessage = translate(
      "Não consegui obter uma resposta agora. Tente novamente em instantes.",
      "I couldn't fetch a response right now. Please try again shortly.",
    );
    let streamStatus: "fallback" | "error" | null = null;

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);

    setPrompt("");
    pendingResponseAbortControllerRef.current?.abort();

    const abortController = new AbortController();
    pendingResponseAbortControllerRef.current = abortController;
    setIsAssistantThinking(true);

    try {
      const assistantMessage = await requestAssistantResponse({
        prompt: cleanedPrompt,
        language,
        history: trimmedHistory,
        signal: abortController.signal,
        onStreamToken: (chunk) => {
          if (!chunk) {
            return;
          }

          if (chunk.includes("[STREAM_ERROR]")) {
            streamStatus = "error";
            console.error("[assistantAdapter] stream error", chunk);
            setMessages((previousMessages) =>
              previousMessages.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: fallbackAssistantMessage }
                  : message,
              ),
            );
            return;
          }

          if (chunk.includes("[STREAM_FALLBACK]")) {
            streamStatus = "fallback";
            const sanitizedChunk = chunk.replace("[STREAM_FALLBACK]", "").trim();
            const content = sanitizedChunk.length > 0 ? sanitizedChunk : fallbackAssistantMessage;
            setMessages((previousMessages) =>
              previousMessages.map((message) =>
                message.id === assistantMessageId ? { ...message, content } : message,
              ),
            );
            return;
          }

          setMessages((previousMessages) =>
            previousMessages.map((message) =>
              message.id === assistantMessageId
                ? { ...message, content: message.content + chunk }
                : message,
            ),
          );
        },
      });

      if (streamStatus === "error") {
        return;
      }

      if (streamStatus === "fallback") {
        setMessages((previousMessages) =>
          previousMessages.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: fallbackAssistantMessage }
              : message,
          ),
        );
        return;
      }

      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          message.id === assistantMessageId
            ? { ...assistantMessage, id: assistantMessageId }
            : message,
        ),
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessages((previousMessages) =>
          previousMessages.filter((message) => message.id !== assistantMessageId),
        );
        return;
      }

      if (streamStatus !== "error") {
        setMessages((previousMessages) =>
          previousMessages.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: fallbackAssistantMessage }
              : message,
          ),
        );
      }
    } finally {
      if (pendingResponseAbortControllerRef.current === abortController) {
        pendingResponseAbortControllerRef.current = null;
        setIsAssistantThinking(false);
      }
    }
  };

  const handleQuickPrompt = (value: string) => {
    setPrompt(value);
  };

  const handleLanguageChange = (selectedLanguage: LanguageCode) => {
    setLanguage(selectedLanguage);
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-background px-4 py-16 text-foreground">
      <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
        <LanguageSwitcher onLanguageChange={handleLanguageChange} />
      </div>
      <main className="flex w-full flex-1 flex-col items-center">
        {isConversationActive ? (
          <section className="flex w-full max-w-4xl flex-1 flex-col gap-6 lg:max-w-5xl">
            <ChatConversation
              containerRef={conversationContainerRef}
              isAssistantThinking={isAssistantThinking}
              messages={messages}
              typingLabel={copy.typingLabel}
            />

            <div className="w-full space-y-5">
              <PromptForm
                hasPrompt={hasPrompt}
                inputLabel={copy.inputLabel}
                isAssistantThinking={isAssistantThinking}
                placeholder={copy.conversationPlaceholder}
                prompt={prompt}
                submitLabel={copy.submitLabel}
                onChange={setPrompt}
                onSubmit={handleSubmit}
              />

              <ul className="flex flex-wrap items-center justify-center gap-3">
                {quickPromptOptions.map((value) => (
                  <li key={value}>
                    <button
                      className="cursor-pointer rounded-full border border-[rgba(255,255,255,0.05)] bg-surface-strong px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground hover:shadow-[0_0_25px_rgba(255,106,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      onClick={() => handleQuickPrompt(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <section className="flex w-full max-w-3xl flex-col items-center gap-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[rgba(255,106,0,0.28)] blur-[90px]"
                />
                <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-[rgba(255,106,0,0.6)] bg-[radial-gradient(circle_at_top,_#1b1b1b,_#0d0d0d)] shadow-[0_0_70px_rgba(255,106,0,0.45)] sm:h-40 sm:w-40">
                  <Image
                    alt="Stanley IA"
                    className="h-full w-full object-cover"
                    height={160}
                    src="/images/eu-robo.png"
                    width={160}
                  />
                  <span className="sr-only">{copy.assistantRoleLabel}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {copy.assistantHeading}
                </h1>
                <p className="mx-auto max-w-xl text-base text-muted sm:text-lg">
                  {copy.assistantGreeting}
                </p>
              </div>
            </div>

            <div className="w-full space-y-5">
              <PromptForm
                hasPrompt={hasPrompt}
                inputLabel={copy.inputLabel}
                isAssistantThinking={isAssistantThinking}
                placeholder={copy.initialPlaceholder}
                prompt={prompt}
                submitLabel={copy.submitLabel}
                onChange={setPrompt}
                onSubmit={handleSubmit}
              />

              <ul className="flex flex-wrap items-center justify-center gap-3">
                {quickPromptOptions.map((value) => (
                  <li key={value}>
                    <button
                      className="cursor-pointer rounded-full border border-[rgba(255,255,255,0.05)] bg-surface-strong px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground hover:shadow-[0_0_25px_rgba(255,106,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      onClick={() => handleQuickPrompt(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default HomePage;
