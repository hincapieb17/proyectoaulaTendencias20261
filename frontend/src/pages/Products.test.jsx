import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import Products from "./Products";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("Products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el panel de administración cuando el usuario es admin", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [
          { id: 1, name: "Mouse", status: "activo", stock: 10, price: 50000 },
        ],
      }) // /products/products/
      .mockResolvedValueOnce({
        data: [
          { id: 1, name: "Periféricos", is_active: true },
        ],
      }) // /products/categories/
      .mockResolvedValueOnce({
        data: { role: "admin" },
      }); // /users/profile/

    render(<Products />);

    expect(await screen.findByText(/gestión de productos/i)).toBeInTheDocument();
    expect(screen.getByText(/panel de administración/i)).toBeInTheDocument();
    expect(
      screen.getByText(/solo el administrador puede crear y editar categorías y productos/i)
    ).toBeInTheDocument();
  });

  it("oculta el panel de administración cuando el usuario no es admin", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [
          { id: 1, name: "Teclado", status: "activo", stock: 5, price: 70000 },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          { id: 1, name: "Accesorios", is_active: true },
        ],
      })
      .mockResolvedValueOnce({
        data: { role: "cliente" },
      });

    render(<Products />);

    expect(await screen.findByText(/gestión de productos/i)).toBeInTheDocument();
    expect(screen.queryByText(/panel de administración/i)).not.toBeInTheDocument();
  });

  it("muestra error cuando falla la carga inicial", async () => {
    api.get.mockRejectedValue(new Error("Error de red"));

    render(<Products />);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar los productos.")
      ).toBeInTheDocument();
    });
  });
});