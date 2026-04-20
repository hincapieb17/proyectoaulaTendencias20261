import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../pages/Profile";
import api from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga perfil y muestra campos extra para cliente", async () => {
    api.get.mockResolvedValue({
      data: {
        username: "brayan",
        email: "b@test.com",
        first_name: "Brayan",
        last_name: "Hincapie",
        full_name: "Brayan Hincapie",
        phone: "3001234567",
        address: "Medellín",
        role: "cliente",
      },
    });

    render(<Profile />);

    expect(await screen.findByDisplayValue("brayan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("b@test.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Brayan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hincapie")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Brayan Hincapie")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3001234567")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Medellín")).toBeInTheDocument();
  });

  it("envía actualización del perfil", async () => {
    api.get.mockResolvedValue({
      data: {
        username: "brayan",
        email: "b@test.com",
        first_name: "Brayan",
        last_name: "Hincapie",
        full_name: "Brayan Hincapie",
        phone: "3001234567",
        address: "Medellín",
        role: "cliente",
      },
    });

    api.put.mockResolvedValue({
      data: {
        username: "brayan",
        email: "nuevo@test.com",
      },
    });

    render(<Profile />);

    const user = userEvent.setup();

    const emailInput = await screen.findByDisplayValue("b@test.com");
    await user.clear(emailInput);
    await user.type(emailInput, "nuevo@test.com");
    await user.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/users/profile/", {
        username: "brayan",
        email: "nuevo@test.com",
        first_name: "Brayan",
        last_name: "Hincapie",
        full_name: "Brayan Hincapie",
        phone: "3001234567",
        address: "Medellín",
      });
    });

    expect(
      await screen.findByText("Perfil actualizado correctamente.")
    ).toBeInTheDocument();
  });
});