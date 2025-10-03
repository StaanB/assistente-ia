export type ChatRole = "user" | "assistant";

export type HistoryRole = ChatRole | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type HistoryMessage = {
  role: HistoryRole;
  content: string;
};

export const createMessageId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
};

export const trimChatHistory = (history: HistoryMessage[]): HistoryMessage[] => {
  if (history.length === 0) {
    return [];
  }

  let systemMessage: HistoryMessage | undefined;
  const nonSystemMessages: HistoryMessage[] = [];

  for (const message of history) {
    if (!systemMessage && message.role === "system") {
      systemMessage = message;
      continue;
    }

    nonSystemMessages.push(message);
  }

  if (nonSystemMessages.length === 0) {
    return systemMessage ? [systemMessage] : [];
  }

  const trimmedMessages: HistoryMessage[] = [];
  let collectedTurns = 0;

  for (let index = nonSystemMessages.length - 1; index >= 0; index -= 1) {
    const currentMessage = nonSystemMessages[index];
    trimmedMessages.unshift(currentMessage);

    if (currentMessage.role === "user") {
      collectedTurns += 1;
      if (collectedTurns >= 6) {
        break;
      }
    }
  }

  return systemMessage ? [systemMessage, ...trimmedMessages] : trimmedMessages;
};
