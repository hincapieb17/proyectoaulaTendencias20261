import { render, screen, fireEvent } from "@testing-library/react";
import { AuthProvider } from "../context/AuthProvider";
import { useAuth } from "../context/useAuth";

function Consumer() {
  const { token, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="token">{token || "sin-token"}</span>
      <span data-testid="auth">
        {isAuthenticated ? "autenticado" : "anonimo"}
      </span>
      <button onClick={() => login("access123", "refresh123")}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("inicia autenticado si existe token en localStorage", () => {
    localStorage.setItem("token", "abc");

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("token")).toHaveTextContent("abc");
    expect(screen.getByTestId("auth")).toHaveTextContent("autenticado");
  });

  it("guarda access y refresh al hacer login", () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("login"));

    expect(localStorage.getItem("token")).toBe("access123");
    expect(localStorage.getItem("refresh")).toBe("refresh123");
    expect(screen.getByTestId("auth")).toHaveTextContent("autenticado");
  });

  it("limpia storage al hacer logout", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("refresh", "ref");

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("logout"));

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(screen.getByTestId("auth")).toHaveTextContent("anonimo");
  });
});