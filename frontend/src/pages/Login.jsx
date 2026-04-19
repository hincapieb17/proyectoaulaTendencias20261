import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

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
      const response = await api.post("/users/login/", {
        username,
        password,
      });

      console.log("Login response:", response.data);

      // Validar respuesta
      if (!response.data?.access || !response.data?.refresh) {
        throw new Error("El backend no devolvió tokens válidos.");
      }

      // Guardar tokens (usando el contexto)
      login(response.data.access, response.data.refresh);

      console.log("Access guardado:", localStorage.getItem("token"));
      console.log("Refresh guardado:", localStorage.getItem("refresh"));

      // Redirigir
      navigate("/");
    } catch (err) {
      console.error("Error completo en login:", err);
      console.error("Respuesta backend:", err?.response);
      console.error("Data backend:", err?.response?.data);

      // Mostrar error real del backend si existe
      const backendMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Error desconocido al iniciar sesión.";

      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-page">
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        <p>Ingresa con tu usuario para acceder al sistema.</p>

        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario"
              required
            />
          </div>

          <div>
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}

export default Login;