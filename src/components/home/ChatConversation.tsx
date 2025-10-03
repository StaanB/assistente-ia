import { RefObject } from "react";

import type { ChatMessage } from "@/utils/chat";

type ChatConversationProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  typingLabel: string;
  isAssistantThinking: boolean;
};

function ChatConversation({
  containerRef,
  messages,
  typingLabel,
  isAssistantThinking,
}: ChatConversationProps) {
  return (
    <div className="flex-1 overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.05)] bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
      <div
        ref={containerRef}
        aria-live="polite"
        className="flex h-full min-h-[460px] flex-col gap-4 overflow-y-auto px-6 py-6 sm:min-h-[520px]"
        role="log"
      >
        {messages.map((message) => {
          const isUserMessage = message.role === "user";
          const isTypingMessage = message.role === "assistant" && message.content.length === 0;

          return (
            <div
              key={message.id}
              className={`flex w-full ${isUserMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm sm:text-base ${
                  isUserMessage
                    ? "bg-accent text-background shadow-[0_12px_30px_rgba(255,106,0,0.35)]"
                    : isTypingMessage
                      ? "inline-flex items-center gap-3 border border-[rgba(255,255,255,0.05)] bg-surface-strong text-muted"
                      : "border border-[rgba(255,255,255,0.05)] bg-surface-strong text-foreground"
                }`}
              >
                {isTypingMessage ? (
                  <>
                    <span className="sr-only">{typingLabel}</span>
                    <span aria-hidden className="typing-indicator">
                      <span />
                      <span />
                      <span />
                    </span>
                  </>
                ) : (
                  message.content
                )}
              </div>
            </div>
          );
        })}

        {isAssistantThinking && !messages.some((message) => message.role === "assistant" && message.content.length === 0) && (
          <div className="flex w-full justify-start">
            <div className="inline-flex items-center gap-3 rounded-3xl border border-[rgba(255,255,255,0.05)] bg-surface-strong px-4 py-3 text-sm text-muted">
              <span className="sr-only">{typingLabel}</span>
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
  );
}

export default ChatConversation;
