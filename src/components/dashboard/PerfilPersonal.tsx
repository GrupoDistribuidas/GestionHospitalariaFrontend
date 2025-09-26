import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Clock,
  Building,
} from "lucide-react";

interface Perfil {
  nombre: string;
  rol: string;
  estado: string; // "Activo" or "Inactivo"
  op: string; // e.g., "Op #3"
  horario: string; // e.g., "08:00-18:00"
  email: string;
  telefono: string;
}

const API_BASE = "http://localhost:5088/api";

const PerfilPersonal: React.FC = () => {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchPerfil();
  }, []);

  const decodeJWT = (token: string) => {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    } catch (err) {
      return null;
    }
  };

  const fetchPerfil = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("authToken");
    const username = localStorage.getItem("username");
    if (!token || !username) {
      navigate("/login");
      return;
    }

    const decoded = decodeJWT(token);
    const basicPerfil: Perfil = {
      nombre: decoded?.name || username.split("@")[0] || "Usuario",
      rol: decoded?.role || "Usuario",
      estado: "Activo",
      op: "No especificado",
      horario: "No especificado",
      email: username,
      telefono: "No especificado",
    };

    try {
      // Try to fetch additional data from medicos
      const res = await fetch(`${API_BASE}/medicos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) navigate("/login");
        // If error, use basic perfil
        setPerfil(basicPerfil);
        return;
      }

      const medicosData = await res.json();
      const medicoData = medicosData.find((m: any) => m.email === username);

      if (medicoData) {
        // Map roles based on idTipo
        const roles: { [key: number]: string } = {
          1: "Administrador",
          2: "Médico",
          3: "Enfermera",
          4: "Recepcionista",
        };

        setPerfil({
          nombre: medicoData.nombre || basicPerfil.nombre,
          rol: roles[medicoData.idTipo] || basicPerfil.rol,
          estado: medicoData.estado === "Activo" ? "Activo" : "Inactivo",
          op: `Centro ${medicoData.idCentroMedico}`,
          horario: medicoData.horario || "No especificado",
          email: medicoData.email || basicPerfil.email,
          telefono: medicoData.telefono || "No especificado",
        });
      } else {
        // Not a medico, use basic perfil
        setPerfil(basicPerfil);
      }
    } catch (err) {
      // On error, use basic perfil
      setPerfil(basicPerfil);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ estado }: { estado: string }) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
        estado === "Activo"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {estado === "Activo" ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {estado}
    </span>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#035397]" />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600">{error || "No se pudo cargar el perfil"}</p>
        <button onClick={fetchPerfil} className="mt-4 text-[#035397] underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#035397] text-white rounded-2xl p-6 text-center shadow-xl">
        <h1 className="text-3xl font-bold mb-2">PERFIL DE PERSONAL</h1>
        <p className="opacity-90">Información personal y laboral</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            {perfil.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {perfil.nombre}
            </h2>
            <p className="text-gray-600">{perfil.rol}</p>
            <StatusBadge estado={perfil.estado} />
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Información Personal */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#035397]">
            <User className="w-5 h-5" />
            Información Personal
          </h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Rol:</span> {perfil.rol}
            </p>
            <p className="flex items-center gap-2">
              <StatusBadge estado={perfil.estado} />
              <span className="font-medium">Estado:</span> {perfil.estado}
            </p>
          </div>
        </div>

        {/* Información Laboral */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#035397]">
            <Building className="w-5 h-5" />
            Información Laboral
          </h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Op:</span> {perfil.op}
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Horario:</span> {perfil.horario}
            </p>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#035397]">
            <Mail className="w-5 h-5" />
            Información de Contacto
          </h3>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Email:</span> {perfil.email}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Teléfono:</span> {perfil.telefono}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilPersonal;
