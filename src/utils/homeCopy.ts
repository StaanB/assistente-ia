import type { LanguageCode } from "@/components/common/LanguageSwitcher";

type HomeCopy = {
  inputLabel: string;
  conversationPlaceholder: string;
  initialPlaceholder: string;
  submitLabel: string;
  typingLabel: string;
  assistantGreeting: string;
  assistantHeading: string;
  assistantRoleLabel: string;
};

const DEFAULT_LANGUAGE: LanguageCode = "pt-BR";

const HOME_COPY: Record<LanguageCode, HomeCopy> = {
  "pt-BR": {
    inputLabel: "Digite sua pergunta",
    conversationPlaceholder: "Pergunte algo para a Stanley IA...",
    initialPlaceholder: "Digite sua pergunta aqui...",
    submitLabel: "Enviar pergunta",
    typingLabel: "Stanley IA está digitando",
    assistantGreeting:
      "Olá! Sou a Stanley IA, assistente pessoal do Stanley. Estou aqui para te ajudar a conhecer o Stanley, responder perguntas sobre ele.",
    assistantHeading: "Stanley IA",
    assistantRoleLabel: "Assistente de IA",
  },
  "en-US": {
    inputLabel: "Type your question",
    conversationPlaceholder: "Ask something to Stanley AI...",
    initialPlaceholder: "Type your question here...",
    submitLabel: "Send question",
    typingLabel: "Stanley AI is typing",
    assistantGreeting:
      "Hi! I'm Stanley AI, Stanley's personal assistant. I'm here to help you get to know Stanley and answer questions about him.",
    assistantHeading: "Stanley AI",
    assistantRoleLabel: "AI assistant",
  },
};

const getHomeCopy = (language: LanguageCode): HomeCopy => {
  return HOME_COPY[language] ?? HOME_COPY[DEFAULT_LANGUAGE];
};

export type { HomeCopy };
export { getHomeCopy };
