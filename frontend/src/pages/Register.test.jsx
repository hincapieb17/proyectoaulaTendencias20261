import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Register from "./Register";
import api from "../services/api";

const mockNavigate = vi.fn();

vi.mock("../services/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("muestra error si las contraseñas no coinciden", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Tu usuario"), "nuevo");
    await user.type(
      screen.getByPlaceholderText("Mínimo 8 caracteres"),
      "12345678"
    );
    await user.type(
      screen.getByPlaceholderText("Repite la contraseña"),
      "87654321"
    );
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      screen.getByText("Las contraseñas no coinciden.")
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("envía el formulario cuando los datos son válidos", async () => {
    api.post.mockResolvedValue({ data: {} });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Tu usuario"), "nuevo");
    await user.type(
      screen.getByPlaceholderText("Mínimo 8 caracteres"),
      "12345678"
    );
    await user.type(
      screen.getByPlaceholderText("Repite la contraseña"),
      "12345678"
    );
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/users/register/", {
        username: "nuevo",
        password: "12345678",
      });
    });

    expect(
      await screen.findByText(/cuenta creada correctamente/i)
    ).toBeInTheDocument();
  });
});