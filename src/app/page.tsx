"use client";

import { FormEvent, useMemo, useState } from "react";

const quickPrompts = [
  "Como você funciona?",
  "Quem é Stanley?",
  "Onde Stanley trabalhou?",
];

export default function Home() {
  const [prompt, setPrompt] = useState("");

  const hasPrompt = useMemo(() => prompt.trim().length > 0, [prompt]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasPrompt) {
      return;
    }

    // Placeholder: integração com backend/chat virá depois.
    console.log("Pergunta enviada:", prompt.trim());
    setPrompt("");
  };

  const handleQuickPrompt = (value: string) => {
    setPrompt(value);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-foreground">
      <main className="flex w-full max-w-3xl flex-col items-center gap-12 text-center">
        <section className="flex flex-col items-center gap-6">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 rounded-full bg-[rgba(255,106,0,0.28)] blur-[90px]"
            />
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-[rgba(255,106,0,0.6)] bg-[radial-gradient(circle_at_top,_#1b1b1b,_#0d0d0d)] shadow-[0_0_70px_rgba(255,106,0,0.45)] sm:h-40 sm:w-40">
              <span aria-hidden className="text-5xl sm:text-6xl">
                🤖
              </span>
              <span className="sr-only">Assistente de IA</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Stanley IA
            </h1>
            <p className="mx-auto max-w-xl text-base text-muted sm:text-lg">
              Olá! Sou a Stanley IA, assistente pessoal do Stanley. Estou aqui para
              te ajudar a conhecer o Stanley, responder perguntas sobre ele.
            </p>
          </div>
        </section>

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
              aria-disabled={!hasPrompt}
              className="grid h-12 w-12 place-items-center rounded-full bg-accent text-background shadow-[0_16px_40px_rgba(255,106,0,0.45)] transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasPrompt}
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
      </main>
    </div>
  );
}