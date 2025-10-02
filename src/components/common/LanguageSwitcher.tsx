"use client";

import { useCallback, useEffect, useState } from "react";
import ReactCountryFlag from "react-country-flag";

type LanguageCode = "pt-BR" | "en-US";

type LanguageOption = {
  code: LanguageCode;
  label: string;
  countryCode: string;
};

type LanguageSwitcherProps = {
  defaultLanguage?: LanguageCode;
  onLanguageChange?: (language: LanguageCode) => void;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: "pt-BR",
    label: "Português",
    countryCode: "BR",
  },
  {
    code: "en-US",
    label: "English",
    countryCode: "US",
  },
];

const STORAGE_KEY = "assistente-ia:language";

const getOptionByCode = (code: LanguageCode | string | undefined) => {
  return LANGUAGE_OPTIONS.find((option) => option.code === code);
};

const readStoredLanguage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  } catch (error) {
    return null;
  }
};

const persistLanguage = (code: LanguageCode) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch (error) {
    // Ignoramos falhas de persistência para evitar quebrar a UI
  }
};

function LanguageSwitcher({ defaultLanguage = "pt-BR", onLanguageChange }: LanguageSwitcherProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(defaultLanguage);

  useEffect(() => {
    const storedLanguage = readStoredLanguage();

    if (storedLanguage && getOptionByCode(storedLanguage)) {
      setSelectedLanguage(storedLanguage);
      return;
    }

    if (getOptionByCode(defaultLanguage)) {
      setSelectedLanguage(defaultLanguage);
      return;
    }

    setSelectedLanguage("pt-BR");
  }, [defaultLanguage]);

  useEffect(() => {
    onLanguageChange?.(selectedLanguage);
  }, [selectedLanguage, onLanguageChange]);

  const handleSelectLanguage = useCallback((code: LanguageCode) => {
    setSelectedLanguage(code);
    persistLanguage(code);
  }, []);

  const baseButtonClasses = "flex items-center gap-2 rounded-full px-3 py-1 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const activeButtonClasses = "bg-accent text-background shadow-[0_10px_26px_rgba(255,106,0,0.35)]";
  const inactiveButtonClasses = "text-muted hover:text-foreground";

  return (
    <div
      aria-label="Alterar idioma"
      className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] bg-surface px-1 py-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      role="group"
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const isActive = selectedLanguage === option.code;

        return (
          <button
            key={option.code}
            aria-pressed={isActive}
            className={[baseButtonClasses, isActive ? activeButtonClasses : inactiveButtonClasses].join(" ")}
            type="button"
            onClick={() => handleSelectLanguage(option.code)}
          >
            <ReactCountryFlag
              aria-label={option.label}
              countryCode={option.countryCode}
              svg
              style={{ fontSize: "1.25rem", lineHeight: "1" }}
              title={option.label}
            />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
export type { LanguageCode };
