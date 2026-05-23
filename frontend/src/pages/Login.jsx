import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import "../styles/auth.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/users/login/", { username, password });

      if (!response.data?.access || !response.data?.refresh) {
        throw new Error("El backend no devolvió tokens válidos.");
      }

      localStorage.setItem("token", response.data.access);

      const profileRes = await api.get("/users/profile/");
      const role = profileRes.data?.role || null;

      login(response.data.access, response.data.refresh, role);
      navigate("/");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Error desconocido al iniciar sesión.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Panel izquierdo */}
      <div className="auth-brand">
        <span className="auth-brand__icon">📦</span>
        <span className="auth-brand__label">Sistema de gestión</span>
        <h1>Gestión de Pedidos</h1>
        <p>
          Plataforma integral para administrar pedidos, productos y clientes de
          forma eficiente y segura.
        </p>
        <ul className="auth-brand__features">
          <li>Catálogo de productos en tiempo real</li>
          <li>Seguimiento del estado de pedidos</li>
          <li>Historial y reportes de ventas</li>
          <li>Gestión de devoluciones</li>
        </ul>
      </div>

      {/* Panel derecho — formulario */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Bienvenido de nuevo</h2>
            <p>Ingresa tus credenciales para acceder al sistema.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario"
                required
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>

            {error && (
              <div className="auth-alert auth-alert--error">{error}</div>
            )}
          </form>

          <div className="auth-card__footer">
            ¿No tienes cuenta?{" "}
            <Link to="/register">Regístrate aquí</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
