import { screen } from "@testing-library/react";
import ProtectedRoute from "../components/ProtectedRoute";
import { renderWithProviders } from "../test/renderWithProviders";

describe("ProtectedRoute", () => {
  it("renderiza children cuando hay autenticación", () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>contenido privado</div>
      </ProtectedRoute>,
      {
        authValue: {
          token: "abc",
          isAuthenticated: true,
          login: vi.fn(),
          logout: vi.fn(),
        },
      }
    );

    expect(screen.getByText("contenido privado")).toBeInTheDocument();
  });

  it("no renderiza children cuando no hay autenticación", () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>contenido privado</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText("contenido privado")).not.toBeInTheDocument();
  });
});