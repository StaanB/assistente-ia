import { RefObject, useEffect, useRef } from "react";

import type { ChatMessage } from "@/utils/chat";

type UseConversationLifecycleArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  messages: ChatMessage[];
  isAssistantThinking: boolean;
};

type UseConversationLifecycleResult = {
  beginStreaming: () => AbortController;
  finalizeStreaming: (controller: AbortController) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
};

const useConversationLifecycle = ({
  containerRef,
  messages,
  isAssistantThinking,
}: UseConversationLifecycleArgs): UseConversationLifecycleResult => {
  const pendingResponseAbortControllerRef = useRef<AbortController | null>(null);

  const performScroll = (behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  useEffect(() => {
    performScroll();
  }, [messages, isAssistantThinking]);

  useEffect(() => {
    return () => {
      pendingResponseAbortControllerRef.current?.abort();
    };
  }, []);

  const beginStreaming = () => {
    pendingResponseAbortControllerRef.current?.abort();

    const abortController = new AbortController();
    pendingResponseAbortControllerRef.current = abortController;
    return abortController;
  };

  const finalizeStreaming = (controller: AbortController) => {
    if (pendingResponseAbortControllerRef.current === controller) {
      pendingResponseAbortControllerRef.current = null;
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") {
      return;
    }

    window.requestAnimationFrame(() => performScroll(behavior));
  };

  return { beginStreaming, finalizeStreaming, scrollToBottom };
};

export { useConversationLifecycle };
