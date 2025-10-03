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
  Briefcase,
} from "lucide-react";
import { safeFetch, getAuthHeaders } from "../../services/apiClient";

interface Perfil {
  nombre: string;
  rol: string;
  estado: string;
  op: string;
  horario: string;
  email: string;
  telefono: string;
}

const PerfilPersonal: React.FC = () => {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      navigate("/login");
      return;
    }
    fetchPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPerfil = async () => {
    setLoading(true);
    setError("");
    try {
      const userInfoRes = await safeFetch("/auth/user-info", {
        headers: getAuthHeaders(),
      });
      if (!userInfoRes.ok) {
        if (userInfoRes.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("No se pudo validar la sesión");
      }
      const userInfo = await userInfoRes.json();
      const username: string =
        userInfo?.username || localStorage.getItem("username") || "";
      if (!username) throw new Error("Usuario no identificado");

      // Try user endpoint first
      const usuarioRes = await safeFetch(
        `/usuarios/buscar/${encodeURIComponent(username)}`,
        { headers: getAuthHeaders() }
      );
      if (usuarioRes.ok) {
        const usuarioData = await usuarioRes.json();
        if (usuarioData && usuarioData.usuario) {
          const u = usuarioData.usuario;
          const empleado = u.empleado;
          if (empleado && empleado.idEmpleado)
            setEmpleadoId(empleado.idEmpleado);
          setPerfil({
            nombre: empleado?.nombre || u.nombreUsuario || username,
            rol: u.rol || "Usuario",
            estado: "Activo",
            op:
              empleado?.centroMedico ??
              (empleado
                ? empleado.idCentroMedico == null
                  ? "N/D"
                  : empleado.idCentroMedico === 1
                  ? "Hospital Central"
                  : empleado.idCentroMedico === 2
                  ? "Clínica Norte"
                  : empleado.idCentroMedico === 3
                  ? "Policlínico Sur"
                  : `Centro ${empleado.idCentroMedico}`
                : "-"),
            horario: empleado?.horario || "No especificado",
            email: empleado?.email || "",
            telefono: empleado?.telefono || "No especificado",
          });
          return;
        }
      }

      // Fallback: search in medicos
      const medRes = await safeFetch("/medicos", { headers: getAuthHeaders() });
      if (!medRes.ok) throw new Error("No se pudo obtener datos del perfil");
      const medicos = await medRes.json();
      const med = (
        Array.isArray(medicos) ? medicos : medicos.medicos ?? []
      ).find((m: any) => m.email === username);
      if (med) {
        if (med.idEmpleado) setEmpleadoId(med.idEmpleado);
        setPerfil({
          nombre: med.nombre,
          rol: "Médico",
          estado: med.estado === "Activo" ? "Activo" : "Inactivo",
          op:
            med.idCentroMedico == null
              ? "N/D"
              : med.idCentroMedico === 1
              ? "Hospital Central"
              : med.idCentroMedico === 2
              ? "Clínica Norte"
              : med.idCentroMedico === 3
              ? "Policlínico Sur"
              : `Centro ${med.idCentroMedico}`,
          horario: med.horario || "No especificado",
          email: med.email || "",
          telefono: med.telefono || "No especificado",
        });
        return;
      }

      throw new Error("Perfil no encontrado");
    } catch (err) {
      setPerfil(null);
      setError(err instanceof Error ? err.message : "Error cargando perfil");
    } finally {
      setLoading(false);
    }
  };

  const getRoleDescription = (role: string) => {
    const r = (role || "").toLowerCase();
    if (r.includes("admin"))
      return "Acceso completo al sistema y administración de usuarios.";
    if (r.includes("médico") || r.includes("medico"))
      return "Gestión clínica, consultas y creación de citas.";
    if (r.includes("enfermero"))
      return "Soporte clínico y administración de cuidados.";
    if (r.includes("recepcionista"))
      return "Gestión de agendas y atención al paciente.";
    return "Acceso y responsabilidades según el rol asignado.";
  };

  // logout handled elsewhere in the app; removed from profile card

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

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#035397]" />
      </div>
    );

  if (error || !perfil)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600">{error || "No se pudo cargar el perfil"}</p>
        <button onClick={fetchPerfil} className="mt-4 text-[#035397] underline">
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="bg-[#035397] text-white rounded-2xl p-6 text-center shadow-xl">
        <h1 className="text-3xl font-bold mb-2">PERFIL DE PERSONAL</h1>
        <p className="opacity-90">Información personal y laboral</p>
      </div>

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
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge estado={perfil.estado} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#035397]">
            <User className="w-5 h-5" /> Información Personal
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

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#035397]">
            <Briefcase className="w-5 h-5" /> Resumen Profesional
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-800">
                  {perfil.rol}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {getRoleDescription(perfil.rol)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Permisos y responsabilidades asociados al rol.
                </div>
              </div>
            </div>

            {/* Ubicación y horario ocultados para una presentación más limpia */}

            {/* Actions removed: kept the card focused on professional summary */}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#035397]">
            <Mail className="w-5 h-5" /> Información de Contacto
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
          <div className="mt-4 text-xs text-gray-500">
            <p className="font-medium text-gray-700 mb-2">Metadatos</p>
            <ul className="list-disc list-inside">
              <li>
                Usuario conectado: {localStorage.getItem("username") ?? "-"}
              </li>
              {empleadoId && <li>Empleado ID: {empleadoId}</li>}
              <li>Última sincronización: {new Date().toLocaleString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilPersonal;
