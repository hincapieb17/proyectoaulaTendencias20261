import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">Gestión de Pedidos</div>

        {isAuthenticated && (
          <nav className="navbar-links">
            <Link to="/">Dashboard</Link>
            <Link to="/products">Productos</Link>
            <Link to="/orders">Pedidos</Link>
            <Link to="/orders/create">Nuevo pedido</Link>
            <Link to="/profile">Mi perfil</Link>
            <button className="btn btn-danger" onClick={handleLogout}>
              Salir
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;