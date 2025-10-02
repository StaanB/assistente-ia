"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

export const quickPrompts = [
  "Como você funciona?",
  "Quem é Stanley?",
  "Onde Stanley trabalhou?",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const ASSISTANT_RESPONSE_DELAY_MS = 1200;

const createMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};

function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  const conversationContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingResponseTimeoutRef = useRef<number | null>(null);

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
      if (pendingResponseTimeoutRef.current !== null) {
        window.clearTimeout(pendingResponseTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasPrompt || isAssistantThinking) {
      return;
    }

    const cleanedPrompt = prompt.trim();

    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: createMessageId(),
        role: "user",
        content: cleanedPrompt,
      },
    ]);

    setPrompt("");
    setIsAssistantThinking(true);

    if (pendingResponseTimeoutRef.current !== null) {
      window.clearTimeout(pendingResponseTimeoutRef.current);
    }

    pendingResponseTimeoutRef.current = window.setTimeout(() => {
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          id: createMessageId(),
          role: "assistant",
          content: `Resposta mockada para "${cleanedPrompt}". Em breve, conectaremos com o modelo de IA real.`,
        },
      ]);

      setIsAssistantThinking(false);
      pendingResponseTimeoutRef.current = null;
    }, ASSISTANT_RESPONSE_DELAY_MS);
  };

  const handleQuickPrompt = (value: string) => {
    setPrompt(value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-16 text-foreground">
      <main className="flex w-full flex-1 flex-col items-center">
        {isConversationActive ? (
          <section className="flex w-full max-w-4xl flex-1 flex-col gap-6 lg:max-w-5xl">
            <div className="flex-1 overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.05)] bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <div
                ref={conversationContainerRef}
                aria-live="polite"
                className="flex h-full min-h-[460px] flex-col gap-4 overflow-y-auto px-6 py-6 sm:min-h-[520px]"
                role="log"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm sm:text-base ${
                        message.role === "user"
                          ? "bg-accent text-background shadow-[0_12px_30px_rgba(255,106,0,0.35)]"
                          : "border border-[rgba(255,255,255,0.05)] bg-surface-strong text-foreground"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {isAssistantThinking && (
                  <div className="flex w-full justify-start">
                    <div className="inline-flex items-center gap-3 rounded-3xl border border-[rgba(255,255,255,0.05)] bg-surface-strong px-4 py-3 text-sm text-muted">
                      <span className="sr-only">Stanley IA está digitando</span>
                      <span aria-hidden className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form
              className="w-full space-y-5"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="flex w-full items-center gap-2 rounded-full border border-[rgba(255,255,255,0.05)] bg-surface px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition focus-within:border-accent focus-within:shadow-[0_0_0_1px_rgba(255,106,0,0.35)]">
                <label className="sr-only" htmlFor="prompt">
                  Digite sua pergunta
                </label>
                <input
                  autoComplete="off"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:text-lg"
                  id="prompt"
                  name="prompt"
                  placeholder="Pergunte algo para a Stanley IA..."
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
                <button
                  aria-disabled={!hasPrompt || isAssistantThinking}
                  className="grid h-12 w-12 place-items-center rounded-full bg-accent text-background shadow-[0_16px_40px_rgba(255,106,0,0.45)] transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasPrompt || isAssistantThinking}
                  type="submit"
                >
                  <span className="sr-only">Enviar pergunta</span>
                  <svg
                    aria-hidden
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12h16m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>

              <ul className="flex flex-wrap items-center justify-center gap-3">
                {quickPrompts.map((value) => (
                  <li key={value}>
                    <button
                      className="rounded-full border border-[rgba(255,255,255,0.05)] bg-surface-strong px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground hover:shadow-[0_0_25px_rgba(255,106,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      onClick={() => handleQuickPrompt(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  </li>
                ))}
              </ul>
            </form>
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
                  <span className="sr-only">Assistente de IA</span>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  Stanley IA
                </h1>
                <p className="mx-auto max-w-xl text-base text-muted sm:text-lg">
                  Olá! Sou a Stanley IA, assistente pessoal do Stanley. Estou aqui para te ajudar a conhecer o Stanley, responder perguntas sobre ele.
                </p>
              </div>
            </div>

            <form
              className="w-full space-y-5"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="flex w-full items-center gap-2 rounded-full border border-[rgba(255,255,255,0.05)] bg-surface px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition focus-within:border-accent focus-within:shadow-[0_0_0_1px_rgba(255,106,0,0.35)]">
                <label className="sr-only" htmlFor="prompt">
                  Digite sua pergunta
                </label>
                <input
                  autoComplete="off"
                  className="flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:text-lg"
                  id="prompt"
                  name="prompt"
                  placeholder="Digite sua pergunta aqui..."
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                />
                <button
                  aria-disabled={!hasPrompt || isAssistantThinking}
                  className="grid h-12 w-12 place-items-center rounded-full bg-accent text-background shadow-[0_16px_40px_rgba(255,106,0,0.45)] transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!hasPrompt || isAssistantThinking}
                  type="submit"
                >
                  <span className="sr-only">Enviar pergunta</span>
                  <svg
                    aria-hidden
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12h16m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>

              <ul className="flex flex-wrap items-center justify-center gap-3">
                {quickPrompts.map((value) => (
                  <li key={value}>
                    <button
                      className="rounded-full border border-[rgba(255,255,255,0.05)] bg-surface-strong px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground hover:shadow-[0_0_25px_rgba(255,106,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      onClick={() => handleQuickPrompt(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  </li>
                ))}
              </ul>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

export default HomePage;
