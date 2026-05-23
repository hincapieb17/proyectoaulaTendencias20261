import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/users/register/", { username, password });
      setMessage("Cuenta creada correctamente. Redirigiendo al login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const data = err?.response?.data;
      setError(
        data?.username?.[0] ||
          data?.password?.[0] ||
          data?.detail ||
          "No se pudo crear la cuenta."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Panel izquierdo */}
      <div className="auth-brand">
        <span className="auth-brand__icon">🚀</span>
        <span className="auth-brand__label">Únete hoy</span>
        <h1>Crea tu cuenta</h1>
        <p>
          Regístrate como cliente y empieza a realizar pedidos de forma rápida,
          simple y segura.
        </p>
        <ul className="auth-brand__features">
          <li>Acceso al catálogo completo</li>
          <li>Gestiona tus pedidos fácilmente</li>
          <li>Consulta tu historial en cualquier momento</li>
          <li>Solicita devoluciones sin complicaciones</li>
        </ul>
      </div>

      {/* Panel derecho — formulario */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Nueva cuenta</h2>
            <p>Completa los datos para registrarte como cliente.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Elige un nombre de usuario"
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
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            {error && (
              <div className="auth-alert auth-alert--error">{error}</div>
            )}
            {message && (
              <div className="auth-alert auth-alert--success">{message}</div>
            )}
          </form>

          <div className="auth-card__footer">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login">Inicia sesión</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
