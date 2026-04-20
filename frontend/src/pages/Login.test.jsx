import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

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

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inicia sesión correctamente y navega al home", async () => {
    api.post.mockResolvedValue({
      data: { access: "token1", refresh: "refresh1" },
    });

    const loginMock = vi.fn();

    render(
      <AuthContext.Provider
        value={{
          token: null,
          isAuthenticated: false,
          login: loginMock,
          logout: vi.fn(),
        }}
      >
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Tu usuario"), "brayan");
    await user.type(screen.getByPlaceholderText("Tu contraseña"), "12345678");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/users/login/", {
        username: "brayan",
        password: "12345678",
      });
    });

    expect(loginMock).toHaveBeenCalledWith("token1", "refresh1");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("muestra error del backend cuando falla el login", async () => {
    api.post.mockRejectedValue({
      response: { data: { detail: "Credenciales inválidas" } },
    });

    render(
      <AuthContext.Provider
        value={{
          token: null,
          isAuthenticated: false,
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText("Tu usuario"), "brayan");
    await user.type(screen.getByPlaceholderText("Tu contraseña"), "mal");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(
      await screen.findByText("Credenciales inválidas")
    ).toBeInTheDocument();
  });
});