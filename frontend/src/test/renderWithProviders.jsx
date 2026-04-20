import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { AuthContext } from "../context/AuthContext";
import { vi } from "vitest";

export function renderWithProviders(
  ui,
  {
    route = "/",
    authValue = {
      token: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    },
  } = {}
) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
}