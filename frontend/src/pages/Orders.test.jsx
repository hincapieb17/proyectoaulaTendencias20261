import { render, screen, waitFor } from "@testing-library/react";
import Orders from "../pages/Orders";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("Orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra loading al inicio", () => {
    api.get.mockReturnValue(new Promise(() => {}));
    render(<Orders />);
    expect(screen.getByText(/cargando pedidos/i)).toBeInTheDocument();
  });

  it("renderiza métricas y pedidos cuando la carga es exitosa", async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 1,
          status: "delivered",
          subtotal: 10000,
          discount: 0,
          total: 10000,
          customer_name: "Juan",
          items: [{ product_name: "Mouse", quantity: 2, unit_price: 5000, subtotal: 10000 }],
        },
        {
          id: 2,
          status: "cancelled",
          subtotal: 20000,
          discount: 1000,
          total: 19000,
          customer_name: "Ana",
          items: [],
        },
      ],
    });

    render(<Orders />);

    expect(await screen.findByText(/pedido #1/i)).toBeInTheDocument();
    expect(screen.getByText(/juan/i)).toBeInTheDocument();
    expect(screen.getByText(/ana/i)).toBeInTheDocument();
    expect(screen.getByText(/total pedidos/i)).toBeInTheDocument();
    expect(screen.getByText(/entregados/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelados/i)).toBeInTheDocument();
  });

  it("muestra mensaje de error si falla la carga", async () => {
    api.get.mockRejectedValue(new Error("falló"));
    render(<Orders />);

    await waitFor(() => {
      expect(
        screen.getByText("No se pudieron cargar los pedidos.")
      ).toBeInTheDocument();
    });
  });
});