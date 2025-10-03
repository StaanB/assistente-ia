import { FormEvent, MutableRefObject } from "react";

type PromptFormProps = {
  prompt: string;
  hasPrompt: boolean;
  isAssistantThinking: boolean;
  inputLabel: string;
  placeholder: string;
  submitLabel: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  inputRef?: MutableRefObject<HTMLInputElement | null>;
};

function PromptForm({
  prompt,
  hasPrompt,
  isAssistantThinking,
  inputLabel,
  placeholder,
  submitLabel,
  onChange,
  onSubmit,
  inputRef,
}: PromptFormProps) {
  return (
    <form
      className="w-full space-y-5"
      noValidate
      onSubmit={onSubmit}
    >
      <div className="flex w-full items-center gap-2 rounded-full border border-[rgba(255,255,255,0.05)] bg-surface px-4 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition focus-within:border-accent focus-within:shadow-[0_0_0_1px_rgba(255,106,0,0.35)]">
        <label className="sr-only" htmlFor="prompt">
          {inputLabel}
        </label>
        <input
          autoComplete="off"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:text-lg"
          id="prompt"
          name="prompt"
          placeholder={placeholder}
          ref={(element) => {
            if (inputRef) {
              inputRef.current = element;
            }
          }}
          value={prompt}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          aria-disabled={!hasPrompt || isAssistantThinking}
          className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-accent text-background shadow-[0_16px_40px_rgba(255,106,0,0.45)] transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!hasPrompt || isAssistantThinking}
          type="submit"
        >
          <span className="sr-only">{submitLabel}</span>
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
    </form>
  );
}

export default PromptForm;
