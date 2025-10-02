import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const STORAGE_KEY = "assistente-ia:language";

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("marca Português como ativo por padrão", () => {
    render(<LanguageSwitcher />);

    const portugueseButton = screen.getByRole("button", { name: /Português/i });
    const englishButton = screen.getByRole("button", { name: /English/i });

    expect(portugueseButton).toHaveAttribute("aria-pressed", "true");
    expect(englishButton).toHaveAttribute("aria-pressed", "false");
  });

  it("alterna para o idioma selecionado e persiste a escolha", async () => {
    const onLanguageChange = jest.fn();
    const user = userEvent.setup();

    render(<LanguageSwitcher onLanguageChange={onLanguageChange} />);

    await waitFor(() => {
      expect(onLanguageChange).toHaveBeenCalledWith("pt-BR");
    });

    const englishButton = screen.getByRole("button", { name: /English/i });
    const portugueseButton = screen.getByRole("button", { name: /Português/i });

    await user.click(englishButton);

    expect(onLanguageChange).toHaveBeenLastCalledWith("en-US");
    expect(englishButton).toHaveAttribute("aria-pressed", "true");
    expect(portugueseButton).toHaveAttribute("aria-pressed", "false");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("en-US");
  });

  it("carrega o idioma salvo do localStorage", async () => {
    window.localStorage.setItem(STORAGE_KEY, "en-US");
    const onLanguageChange = jest.fn();

    render(<LanguageSwitcher onLanguageChange={onLanguageChange} />);

    const englishButton = screen.getByRole("button", { name: /English/i });
    const portugueseButton = screen.getByRole("button", { name: /Português/i });

    await waitFor(() => {
      expect(englishButton).toHaveAttribute("aria-pressed", "true");
    });

    expect(portugueseButton).toHaveAttribute("aria-pressed", "false");
    expect(onLanguageChange).toHaveBeenCalledWith("pt-BR");
    expect(onLanguageChange).toHaveBeenLastCalledWith("en-US");
  });
});
