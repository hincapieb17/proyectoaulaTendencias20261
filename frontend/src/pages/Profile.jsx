import { useEffect, useState } from "react";
import api from "../services/api";

function Profile() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    full_name: "",
    phone: "",
    address: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const response = await api.get("/users/profile/");
        if (!ignore) {
          setForm({
            username: response.data.username || "",
            email: response.data.email || "",
            first_name: response.data.first_name || "",
            last_name: response.data.last_name || "",
            full_name: response.data.full_name || "",
            phone: response.data.phone || "",
            address: response.data.address || "",
            role: response.data.role || "",
          });
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("No se pudo cargar el perfil.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await api.put("/users/profile/", {
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
      });

      setForm((prev) => ({
        ...prev,
        ...response.data,
      }));

      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      const data = err?.response?.data;

      if (data?.username?.[0]) {
        setError(data.username[0]);
      } else if (data?.email?.[0]) {
        setError(data.email[0]);
      } else {
        setError("No se pudo actualizar el perfil.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Cargando perfil...</p>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "30px auto" }}>
      <h1>Mi perfil</h1>
      <p>Administra tu información personal desde un solo lugar.</p>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "12px" }}>
          <label>Usuario</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Correo</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Nombres</label>
          <input
            type="text"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label>Apellidos</label>
          <input
            type="text"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        {form.role === "cliente" && (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label>Nombre completo</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px" }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label>Teléfono</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px" }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label>Dirección</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                style={{ width: "100%", padding: "10px" }}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

export default Profile;