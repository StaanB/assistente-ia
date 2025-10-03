import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import HomePage, { quickPrompts } from "@/components/home/HomePage";

const originalScrollTo = window.HTMLElement.prototype.scrollTo;
const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
const originalFetch = global.fetch;
const mockHealthResponse = (payload: unknown) =>
  ({
    ok: true,
    json: async () => payload,
  }) as Response;

describe("HomePage", () => {
  beforeAll(() => {
    window.HTMLElement.prototype.scrollTo = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        mockHealthResponse({
          secured: true,
          has_hf_token: true,
          model: "Qwen/Qwen2.5-7B-Instruct",
        }),
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  afterAll(() => {
    window.HTMLElement.prototype.scrollTo = originalScrollTo;
    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    global.fetch = originalFetch;
  });

  it("exibe status online quando o backend está seguro e autenticado", async () => {
    render(<HomePage />);

    expect(await screen.findByText("Online")).toBeInTheDocument();
    expect(
      screen.getByText("Modelo: Qwen/Qwen2.5-7B-Instruct"),
    ).toBeInTheDocument();
  });

  it(
    "exibe status offline e mensagem padrão quando o backend não está seguro ou autenticado",
    async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        mockHealthResponse({ secured: false, has_hf_token: false, model: "" }),
      );

      render(<HomePage />);

      expect(await screen.findByText("Offline")).toBeInTheDocument();
      expect(
        screen.getByText("Modelo indisponível no momento."),
      ).toBeInTheDocument();
    },
  );

  it("exibe os prompts rápidos e permite preenchê-los", async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    expect(
      screen.getByRole("img", {
        name: "Stanley IA",
      }),
    ).toBeInTheDocument();

    quickPrompts.forEach((prompt) => {
      expect(
        screen.getByRole("button", {
          name: prompt,
        }),
      ).toBeInTheDocument();
    });

    const quickPromptButton = screen.getByRole("button", {
      name: quickPrompts[0],
    });

    await user.click(quickPromptButton);

    expect(
      screen.getByLabelText("Digite sua pergunta"),
    ).toHaveValue(quickPrompts[0]);
  });

  it("mantém o botão de envio desabilitado sem texto", () => {
    render(<HomePage />);

    const submitButton = screen.getByRole("button", {
      name: "Enviar pergunta",
    });

    expect(submitButton).toBeDisabled();
  });

  it("inicia uma conversa, mostra loader e exibe a resposta mockada", async () => {
    jest.useFakeTimers();

    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    try {
      render(<HomePage />);

      await screen.findByText("Online");

      const input = screen.getByLabelText("Digite sua pergunta");
      const submitButton = screen.getByRole("button", {
        name: "Enviar pergunta",
      });

      await user.type(input, "Olá");
      await user.click(submitButton);

      expect(
        screen.queryByRole("img", {
          name: "Stanley IA",
        }),
      ).not.toBeInTheDocument();

      expect(
        screen.getByText("Stanley IA está digitando"),
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      expect(
        screen.queryByText("Stanley IA está digitando"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          'Resposta mockada para "Olá". Em breve, conectaremos com o modelo de IA real.',
        ),
      ).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await user.type(input, "Tudo bem?");
      expect(submitButton).not.toBeDisabled();
    } finally {
      jest.useRealTimers();
    }
  });
});
