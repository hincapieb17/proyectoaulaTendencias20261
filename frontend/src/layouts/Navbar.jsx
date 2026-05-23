import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { isAuthenticated, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = userRole === "admin";
  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const linkClass = (path) =>
    `nav-link ${isActive(path) ? "nav-link--active" : ""}`;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="navbar-brand__icon">📦</span>
          <span>Gestión de Pedidos</span>
        </div>

        {isAuthenticated && (
          <nav className="navbar-links">
            <Link to="/" className={linkClass("/")}>Dashboard</Link>
            <Link to="/products" className={linkClass("/products")}>Catálogo</Link>
            <Link to="/orders" className={linkClass("/orders")}>Pedidos</Link>
            <Link to="/history" className={linkClass("/history")}>Historial</Link>

            {!isAdmin && (
              <Link to="/orders/create" className={linkClass("/orders/create")}>
                + Nuevo pedido
              </Link>
            )}

            {isAdmin && (
              <Link to="/reports" className={linkClass("/reports")}>
                Reportes
              </Link>
            )}

            <Link to="/profile" className={linkClass("/profile")}>Mi perfil</Link>

            <div className="navbar-divider" />

            <div className="navbar-role">
              <span className={`role-badge role-badge--${isAdmin ? "admin" : "cliente"}`}>
                {isAdmin ? "Admin" : "Cliente"}
              </span>
            </div>

            <button className="nav-logout" onClick={handleLogout}>
              Salir
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;
