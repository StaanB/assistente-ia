import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import HomePage, { quickPrompts } from "@/components/home/HomePage";

describe("HomePage", () => {
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
});
