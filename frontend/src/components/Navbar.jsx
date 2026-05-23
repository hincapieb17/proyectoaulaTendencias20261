import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = userRole === "admin";

  return (
    <nav className="navbar">
      <div className="navbar-brand">Gestión de Pedidos</div>

      {isAuthenticated && (
        <div className="navbar-links">
          <Link to="/">Dashboard</Link>
          <Link to="/products">Productos</Link>
          <Link to="/orders">Pedidos</Link>
          <Link to="/orders/create">Crear Pedido</Link>
          <Link to="/history">Historial</Link>
          {isAdmin && <Link to="/reports">Reportes</Link>}
          <button className="btn btn-danger" onClick={handleLogout}>
            Salir
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
