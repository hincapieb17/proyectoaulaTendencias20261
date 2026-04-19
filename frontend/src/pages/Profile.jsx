import { useEffect, useState } from "react";
import api from "../services/api";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchProfile() {
      try {
        const response = await api.get("/customers/customers/profile/");
        if (!ignore) {
          setProfile(response.data);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setError("No se pudo cargar el perfil.");
        }
      }
    }

    fetchProfile();

    return () => {
      ignore = true;
    };
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!profile) return <p>Cargando perfil...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Mi perfil</h1>
        <p>Información del cliente autenticado.</p>
      </div>

      <div className="card">
        <p><strong>Usuario:</strong> {profile.username}</p>
        <p><strong>Rol:</strong> {profile.role}</p>
        <p><strong>Nombre completo:</strong> {profile.full_name}</p>
        <p><strong>Teléfono:</strong> {profile.phone}</p>
        <p><strong>Dirección:</strong> {profile.address}</p>
        <p><strong>Fecha de registro:</strong> {profile.created_at}</p>
      </div>
    </div>
  );
}

export default Profile;