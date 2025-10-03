import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Mail, Phone, Building2, Clock, BadgeDollarSign,
} from "lucide-react";
import Alert from "../common/Alert";

interface Medico {
  idEmpleado: number;
  idCentroMedico: number;
  idTipo: number;
  idEspecialidad: number;
  nombre: string;
  telefono: string;
  email: string;
  salario: number;
  horario: string;
  estado: string; // "Activo" or "Inactivo"
}

interface Especialidad {
  idEspecialidad: number;
  nombre: string;
  descripcion?: string;
}

import { safeFetch, getAuthHeaders } from "../../services/apiClient";
import { isAdmin } from "../../services/auth";
const cn = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(" ");

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatCurrency = (n: number | string) => {
  const num = typeof n === "string" ? Number(n) : n;
  if (isNaN(num as number)) return n as any;
  return (num as number).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
};
const MedicosManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") === "especialidades" ? "especialidades" : "personal"
  );
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  // Tipos de empleado fijos (según la tabla de la BD)
  const [tiposEmpleado, setTiposEmpleado] = useState<
    { idTipo: number; tipo: string }[]
  >([
    { idTipo: 1, tipo: "Médico" },
    { idTipo: 2, tipo: "Enfermero" },
    { idTipo: 3, tipo: "Recepcionista" },
    { idTipo: 4, tipo: "Técnico en Sistemas" },
    { idTipo: 5, tipo: "Técnico de Laboratorio" },
  ]);
  const [centrosMedicos, setCentrosMedicos] = useState<
    { idCentroMedico: number; nombre: string }[]
  >([]);
  const [filteredMedicos, setFilteredMedicos] = useState<Medico[]>([]);
  const [filteredEspecialidades, setFilteredEspecialidades] = useState<
    Especialidad[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState<
    | "none"
    | "viewMedico"
    | "editMedico"
    | "createMedico"
    | "deleteMedico"
    | "viewEspecialidad"
    | "editEspecialidad"
    | "createEspecialidad"
    | "deleteEspecialidad"
  >("none");
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);
  const [selectedEspecialidad, setSelectedEspecialidad] =
    useState<Especialidad | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("authToken")) {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  // Cargar especialidades y medicos; derivar centros y tipos desde la lista de medicos
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const headers = getAuthHeaders();
        const [espRes, medRes] = await Promise.all([
          safeFetch("/especialidades", { headers }),
          safeFetch("/medicos", { headers }),
        ]);

        if (espRes.ok) {
          const esp = await espRes.json();
          setEspecialidades(
            Array.isArray(esp) ? esp : esp.especialidades ?? []
          );
        } else {
          setEspecialidades([]);
        }

        if (medRes.ok) {
          const med = await medRes.json();
          const medicosList = Array.isArray(med) ? med : med.medicos ?? [];
          setMedicos(
            medicosList.map((m: any) => ({
              idEmpleado: m.idEmpleado,
              idCentroMedico: m.idCentroMedico,
              idTipo: m.idTipo,
              idEspecialidad: m.idEspecialidad,
              nombre: m.nombre,
              telefono: m.telefono || "",
              email: m.email || "",
              salario: m.salario,
              horario: m.horario,
              estado: m.estado,
            }))
          );

          // derivar centros únicos desde medicos (tiposEmpleado es fijo y no se deriva)
          const centrosMap = new Map<
            number,
            { idCentroMedico: number; nombre: string }
          >();
          const tiposSet = new Set<number>();
          medicosList.forEach((md: any) => {
            if (
              md.idCentroMedico != null &&
              !centrosMap.has(md.idCentroMedico)
            ) {
              let nombre = `Centro ${md.idCentroMedico}`;
              if (md.idCentroMedico === 1) nombre = "Hospital Central";
              if (md.idCentroMedico === 2) nombre = "Clínica Norte";
              if (md.idCentroMedico === 3) nombre = "Policlínico Sur";
              centrosMap.set(md.idCentroMedico, {
                idCentroMedico: md.idCentroMedico,
                nombre,
              });
            }
            if (md.idTipo != null) tiposSet.add(md.idTipo);
          });

          setCentrosMedicos(Array.from(centrosMap.values()));
          // Nota: tiposEmpleado permanece con la lista fija definida arriba
        } else {
          setMedicos([]);
          setCentrosMedicos([]);
          setTiposEmpleado([]);
        }
      } catch (err) {
        console.error("Error loadMeta medicos/especialidades:", err);
        setEspecialidades([]);
        setMedicos([]);
        setCentrosMedicos([]);
        setTiposEmpleado([]);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (activeTab === "personal") {
      setFilteredMedicos(
        medicos.filter((medico) =>
          medico.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredEspecialidades(
        especialidades.filter((esp) =>
          esp.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, medicos, especialidades, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [medicosRes, especialidadesRes] = await Promise.all([
        safeFetch("/medicos", { headers: getAuthHeaders() }),
        safeFetch("/especialidades", { headers: getAuthHeaders() }),
      ]);

      if (!medicosRes.ok) {
        if (medicosRes.status === 401) navigate("/login");
        throw new Error("Error fetching medicos");
      }
      if (!especialidadesRes.ok) {
        if (especialidadesRes.status === 401) navigate("/login");
        throw new Error("Error fetching especialidades");
      }

      const medicosData = await medicosRes.json();
      const especialidadesData = await especialidadesRes.json();
      // Map to interface if needed
      setMedicos(
        medicosData.map((m: any) => ({
          idEmpleado: m.idEmpleado,
          idCentroMedico: m.idCentroMedico,
          idTipo: m.idTipo,
          idEspecialidad: m.idEspecialidad,
          nombre: m.nombre,
          telefono: m.telefono || "",
          email: m.email || "",
          salario: m.salario,
          horario: m.horario,
          estado: m.estado,
        }))
      );
      setEspecialidades(
        especialidadesData.map((e: any) => ({
          idEspecialidad: e.idEspecialidad,
          nombre: e.nombre,
          descripcion: e.descripcion,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedico = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await safeFetch("/medicos", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          idCentroMedico: parseInt(formData.idCentroMedico),
          idTipo: parseInt(formData.idTipo),
          idEspecialidad: parseInt(formData.idEspecialidad),
          nombre: formData.nombre,
          telefono: formData.telefono,
          email: formData.email,
          salario: parseFloat(formData.salario),
          horario: formData.horario,
          estado: formData.estado || "Activo",
        }),
      });
      if (!res.ok) throw new Error("Error creating medico");
      setNotification({
        message: "El médico ha sido creado exitosamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
      setFormData({});
    } catch (err) {
      setNotification({
        message:
          "Error creando médico: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error creating medico");
    }
  };

  const handleUpdateMedico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedico) return;

    try {
      const res = await safeFetch(`/medicos/${selectedMedico.idEmpleado}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          idEmpleado: selectedMedico.idEmpleado,
        }),
      });
      if (!res.ok) throw new Error("Error updating medico");
      setNotification({
        message: "El médico ha sido actualizado exitosamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
    } catch (err) {
      setNotification({
        message:
          "Error actualizando médico: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error updating medico");
    }
  };

  // Después (soft-delete = marcar Inactivo)
  const handleDeleteMedico = async () => {
    if (!selectedMedico) return;

    try {
      // Opción A (recomendada si tu API acepta PATCH parciales):
      let res = await safeFetch(`/medicos/${selectedMedico.idEmpleado}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: "Inactivo" }),
      });

      // Fallback Opción B: si tu backend no soporta PATCH, usa PUT
      if (!res.ok) {
        res = await safeFetch(`/medicos/${selectedMedico.idEmpleado}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...selectedMedico,
            estado: "Inactivo",
          }),
        });
      }

      if (!res.ok) throw new Error("No se pudo inactivar al médico.");

      setNotification({
        message: "El médico ha sido inactivado correctamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
    } catch (err) {
      setNotification({
        message:
          "Error inactivando médico: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error soft-delete medico");
    }
  };

  // Similar functions for Especialidades: handleCreateEspecialidad, handleUpdateEspecialidad, handleDeleteEspecialidad
  const handleCreateEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await safeFetch("/especialidades", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        }),
      });
      if (!res.ok) throw new Error("Error creating especialidad");
      setNotification({
        message: "La especialidad ha sido creada exitosamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
      setFormData({});
    } catch (err) {
      setNotification({
        message:
          "Error creando especialidad: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error creating especialidad");
    }
  };

  const handleUpdateEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEspecialidad) return;
    try {
      const res = await safeFetch(
        `/especialidades/${selectedEspecialidad.idEspecialidad}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...formData,
            idEspecialidad: selectedEspecialidad.idEspecialidad,
          }),
        }
      );
      if (!res.ok) throw new Error("Error updating especialidad");
      setNotification({
        message: "La especialidad ha sido actualizada exitosamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
    } catch (err) {
      setNotification({
        message:
          "Error actualizando especialidad: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error updating especialidad");
    }
  };

  const handleDeleteEspecialidad = async () => {
    if (!selectedEspecialidad) return;
    try {
      const res = await safeFetch(
        `/especialidades/${selectedEspecialidad.idEspecialidad}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) throw new Error("Error deleting especialidad");
      setNotification({
        message: "La especialidad ha sido eliminada exitosamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
    } catch (err) {
      setNotification({
        message:
          "Error eliminando especialidad: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error deleting especialidad");
    }
  };

  const openModal = (type: string, item?: Medico | Especialidad) => {
    if (item) {
      if (activeTab === "personal") {
        setSelectedMedico(item as Medico);
        setFormData({ ...item });
      } else {
        setSelectedEspecialidad(item as Especialidad);
        setFormData({ ...item });
      }
    } else {
      setFormData({});
    }
    setShowModal(type as any);
  };

  const closeModal = () => {
    setShowModal("none");
    setSelectedMedico(null);
    setSelectedEspecialidad(null);
    setFormData({});
  };

  const getEspecialidadName = (id: number) => {
    const esp = especialidades.find((e) => e.idEspecialidad === id);
    return esp ? esp.nombre : "Desconocida";
  };

  const getCentroMedicoName = (id: number) => {
    const centro = centrosMedicos.find((c) => c.idCentroMedico === id);
    if (centro) return centro.nombre;
    // Map known ids to readable names (from attachment)
    if (id === 1) return "Hospital Central";
    if (id === 2) return "Clínica Norte";
    if (id === 3) return "Policlínico Sur";
    if (id == null) return "N/D";
    return `Centro ${id}`;
  };

  const StatusBadge = ({ estado }: { estado: string }) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${estado === "Activo"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
        }`}
    >
      {estado === "Activo" ? (
        <CheckCircle className="w-3 h-3 inline mr-1" />
      ) : (
        <XCircle className="w-3 h-3 inline mr-1" />
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="mt-4 text-[#035397] underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {notification && (
        <Alert
          type={notification.type === "success" ? "success" : "error"}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      {/* Header */}
      <div className="bg-[#035397] text-white rounded-2xl p-6 text-center shadow-xl">
        <h1 className="text-3xl font-bold mb-2">PERSONAL MÉDICO</h1>
        <p className="opacity-90">
          Gestión de personal médico y especialidades
        </p>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={`Buscar por ${activeTab === "personal" ? "nombre" : "nombre de especialidad"
              }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397]"
          />
        </div>
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm">
          <button
            onClick={() => {
              setActiveTab("personal");
              setSearchParams({ tab: "personal" });
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === "personal"
              ? "bg-[#035397] text-white"
              : "text-gray-600 hover:text-[#035397]"
              }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Personal Médico
          </button>
          <button
            onClick={() => {
              setActiveTab("especialidades");
              setSearchParams({ tab: "especialidades" });
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === "especialidades"
              ? "bg-[#035397] text-white"
              : "text-gray-600 hover:text-[#035397]"
              }`}
          >
            <Stethoscope className="w-4 h-4 inline mr-2" />
            Gestión Especialidades
          </button>
        </div>
        {/* Only admins can add medicos; keep especialidades creation available to everyone */}
        {isAdmin() || activeTab !== "personal" ? (
          <button
            onClick={() =>
              openModal(
                activeTab === "personal" ? "createMedico" : "createEspecialidad"
              )
            }
            className="flex items-center gap-2 bg-[#035397] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar {activeTab === "personal" ? "Médico" : "Especialidad"}
          </button>
        ) : null}
      </div>

      {/* Content */}
      {activeTab === "personal" ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedicos.map((medico) => (
                  <tr key={medico.idEmpleado} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {medico.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getEspecialidadName(medico.idEspecialidad)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCentroMedicoName(medico.idCentroMedico)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {medico.horario}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge estado={medico.estado} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal("viewMedico", medico)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => openModal("editMedico", medico)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal("deleteMedico", medico)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredMedicos.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron médicos
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEspecialidades.map((esp) => (
                  <tr key={esp.idEspecialidad} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {esp.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openModal("viewEspecialidad", esp)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => openModal("editEspecialidad", esp)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal("deleteEspecialidad", esp)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEspecialidades.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron especialidades
            </div>
          )}
        </div>
      )}

      {/* Create Medico Modal - NUEVO (reemplaza el actual) */}
      {showModal === "createMedico" && isAdmin() && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={closeModal} />
          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              {/* Header */}
              <div className="relative">
                <div className="h-24 bg-gradient-to-r from-[#035397] via-[#1b66c9] to-[#4aa0ff]" />
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2 bg-white/90 hover:bg-white shadow"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <XCircle className="w-5 h-5 text-gray-700" />
                </button>
                <div className="px-6 -mt-10 pb-4 flex items-center gap-4">
                  <div className="shrink-0 rounded-2xl border-4 border-white bg-[#0b3c7d] text-white w-16 h-16 grid place-items-center shadow-lg">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow">
                      Crear Médico
                    </h3>
                    <p className="text-sm text-white/90">Registra un nuevo profesional</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleCreateMedico} className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      placeholder="Nombre completo"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Teléfono</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={formData.telefono || ""}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="+593 99 999 9999"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Email</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="correo@dominio.com"
                      />
                    </div>
                  </div>

                  {/* Salario */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Salario</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <BadgeDollarSign className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salario ?? ""}
                        onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">Se guarda en USD. Ej.: 1200.00</p>
                  </div>

                  {/* Horario */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Horario</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={formData.horario || ""}
                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="L-V 08:00-16:00"
                        required
                      />
                    </div>
                  </div>

                  {/* Centro Médico */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Centro Médico</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Building2 className="w-4 h-4" />
                      </span>
                      {centrosMedicos.length > 0 ? (
                        <select
                          value={formData.idCentroMedico || ""}
                          onChange={(e) => setFormData({ ...formData, idCentroMedico: e.target.value })}
                          className="w-full rounded-r-lg px-2 py-2 bg-white focus:outline-none"
                          required
                        >
                          <option value="" disabled>Seleccionar centro</option>
                          {centrosMedicos.map((c) => (
                            <option key={c.idCentroMedico} value={c.idCentroMedico}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          value={formData.idCentroMedico || ""}
                          onChange={(e) => setFormData({ ...formData, idCentroMedico: e.target.value })}
                          className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                          placeholder="ID centro (numérico)"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* Tipo Empleado */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Tipo de Empleado</label>
                    <select
                      value={formData.idTipo || ""}
                      onChange={(e) => setFormData({ ...formData, idTipo: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      required
                    >
                      <option value="" disabled>Seleccionar tipo</option>
                      {tiposEmpleado.map((t) => (
                        <option key={t.idTipo} value={t.idTipo}>{t.tipo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Especialidad */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Especialidad</label>
                    <select
                      value={formData.idEspecialidad || ""}
                      onChange={(e) => setFormData({ ...formData, idEspecialidad: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      required
                    >
                      <option value="" disabled>Seleccionar especialidad</option>
                      {especialidades.map((esp) => (
                        <option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                          {esp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado (por defecto Activo) */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estado</label>
                    <select
                      value={formData.estado || "Activo"}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      required
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#035397] text-white hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" /> Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medico Modal - NUEVO */}
      {showModal === "editMedico" && selectedMedico && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={closeModal} />
          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              {/* Header */}
              <div className="relative">
                <div className="h-24 bg-gradient-to-r from-[#035397] via-[#1b66c9] to-[#4aa0ff]" />
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2 bg-white/90 hover:bg-white shadow"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <XCircle className="w-5 h-5 text-gray-700" />
                </button>
                <div className="px-6 -mt-10 pb-4 flex items-center gap-4">
                  <div className="shrink-0 rounded-2xl border-4 border-white bg-[#0b3c7d] text-white w-16 h-16 grid place-items-center shadow-lg">
                    <User className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow">
                      Editar Médico
                    </h3>
                    <p className="text-sm text-white/90 truncate">
                      {selectedMedico.nombre}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleUpdateMedico} className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      placeholder="Nombre completo"
                      required
                    />
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Teléfono</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={formData.telefono || ""}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="+593 99 999 9999"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Email</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="correo@dominio.com"
                      />
                    </div>
                  </div>

                  {/* Salario */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Salario</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <BadgeDollarSign className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.salario ?? ""}
                        onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Se guarda en USD. Ej.: 1200.00
                    </p>
                  </div>

                  {/* Horario */}
                  <div className="md:col-span-1">
                    <label className="text-xs font-medium text-gray-600">Horario</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={formData.horario || ""}
                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                        className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                        placeholder="L-V 08:00-16:00"
                        required
                      />
                    </div>
                  </div>

                  {/* Centro Médico */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Centro Médico</label>
                    <div className="mt-1 flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#035397]">
                      <span className="pl-3 pr-2 text-gray-400">
                        <Building2 className="w-4 h-4" />
                      </span>
                      {centrosMedicos.length > 0 ? (
                        <select
                          value={formData.idCentroMedico || ""}
                          onChange={(e) => setFormData({ ...formData, idCentroMedico: e.target.value })}
                          className="w-full rounded-r-lg px-2 py-2 bg-white focus:outline-none"
                          required
                        >
                          <option value="" disabled>Seleccionar centro</option>
                          {centrosMedicos.map((c) => (
                            <option key={c.idCentroMedico} value={c.idCentroMedico}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          value={formData.idCentroMedico || ""}
                          onChange={(e) => setFormData({ ...formData, idCentroMedico: e.target.value })}
                          className="w-full rounded-r-lg px-2 py-2 focus:outline-none"
                          placeholder="ID centro (numérico)"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* Tipo Empleado */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Tipo de Empleado</label>
                    <select
                      value={formData.idTipo || ""}
                      onChange={(e) => setFormData({ ...formData, idTipo: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      required
                    >
                      <option value="" disabled>Seleccionar tipo</option>
                      {tiposEmpleado.map((t) => (
                        <option key={t.idTipo} value={t.idTipo}>{t.tipo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Especialidad */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Especialidad</label>
                    <select
                      value={formData.idEspecialidad || ""}
                      onChange={(e) => setFormData({ ...formData, idEspecialidad: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      required
                    >
                      <option value="" disabled>Seleccionar especialidad</option>
                      {especialidades.map((esp) => (
                        <option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                          {esp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estado</label>
                    <select
                      value={formData.estado || ""}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      required
                    >
                      <option value="" disabled>Seleccionar estado</option>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#035397] text-white hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4" /> Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Medico Modal - NUEVO */}
      {showModal === "viewMedico" && selectedMedico && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              {/* Header */}
              <div className="relative">
                <div className="h-24 bg-gradient-to-r from-[#035397] via-[#1b66c9] to-[#4aa0ff]" />
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2 bg-white/90 hover:bg-white shadow"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <XCircle className="w-5 h-5 text-gray-700" />
                </button>

                {/* Profile strip */}
                <div className="px-6 -mt-10 pb-4 flex items-center gap-4">
                  <div className="shrink-0 rounded-2xl border-4 border-white bg-[#0b3c7d] text-white w-20 h-20 grid place-items-center shadow-lg">
                    <span className="text-2xl font-bold">
                      {getInitials(selectedMedico.nombre)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                        {selectedMedico.nombre}
                      </h3>
                      {/* Estado badge grande */}
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm",
                          selectedMedico.estado === "Activo"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        )}
                      >
                        {selectedMedico.estado === "Activo" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {selectedMedico.estado}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 mt-1">
                      {getEspecialidadName(selectedMedico.idEspecialidad)} ·{" "}
                      {getCentroMedicoName(selectedMedico.idCentroMedico)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Col 1 */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <Phone className="w-5 h-5 text-[#035397] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Teléfono</p>
                        <p className="font-medium text-gray-900">
                          {selectedMedico.telefono || "No especificado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <Mail className="w-5 h-5 text-[#035397] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="font-medium text-gray-900 break-all">
                          {selectedMedico.email || "No especificado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <Clock className="w-5 h-5 text-[#035397] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Horario</p>
                        <p className="font-medium text-gray-900">
                          {selectedMedico.horario}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <User className="w-5 h-5 text-[#035397] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Tipo de Empleado</p>
                        <p className="font-medium text-gray-900">
                          {/* Si quieres mostrar el label real del idTipo: */}
                          {(() => {
                            const t = tiposEmpleado.find(t => t.idTipo === selectedMedico.idTipo);
                            return t ? t.tipo : `Tipo #${selectedMedico.idTipo}`;
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <Building2 className="w-5 h-5 text-[#035397] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Departamento</p>
                        <p className="font-medium text-gray-900">
                          {getCentroMedicoName(selectedMedico.idCentroMedico)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-200">
                      <BadgeDollarSign className="w-5 h-5 text-[#035397] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Salario</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(selectedMedico.salario)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pill list inferior */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">Especialidad:</span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    {getEspecialidadName(selectedMedico.idEspecialidad)}
                  </span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-500">Centro:</span>
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                    {getCentroMedicoName(selectedMedico.idCentroMedico)}
                  </span>
                </div>
              </div>

              {/* Footer acciones */}
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  ID Empleado: <span className="font-mono">{selectedMedico.idEmpleado}</span>
                </p>
                <div className="flex gap-2">
                  {isAdmin() && (
                    <>
                      <button
                        onClick={() => openModal("editMedico", selectedMedico)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#035397] text-white hover:bg-blue-600"
                      >
                        <Edit className="w-4 h-4" /> Editar
                      </button>
                      {selectedMedico.estado === "Activo" ? (
                        <button
                          onClick={() => openModal("deleteMedico", selectedMedico)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                        >
                          <XCircle className="w-4 h-4" /> Inactivar
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            // reactivar rápido desde aquí
                            try {
                              let res = await safeFetch(`/medicos/${selectedMedico.idEmpleado}`, {
                                method: "PATCH",
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ estado: "Activo" }),
                              });
                              if (!res.ok) {
                                res = await safeFetch(`/medicos/${selectedMedico.idEmpleado}`, {
                                  method: "PUT",
                                  headers: getAuthHeaders(),
                                  body: JSON.stringify({ ...selectedMedico, estado: "Activo" }),
                                });
                              }
                              if (!res.ok) throw new Error();
                              setNotification({ message: "Médico reactivado.", type: "success" });
                              fetchData();
                              closeModal();
                            } catch {
                              setNotification({ message: "No se pudo reactivar.", type: "error" });
                            }
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-4 h-4" /> Reactivar
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={closeModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal === "deleteMedico" && selectedMedico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Inactivar Médico</h2>
            <p>¿Estás seguro de <strong>inactivar</strong> a {selectedMedico.nombre}? Este cambio no elimina el registro.</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteMedico}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Inactivar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Especialidad Modal - NUEVO (reemplaza el actual) */}
      {showModal === "createEspecialidad" && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={closeModal} />
          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              {/* Header */}
              <div className="relative">
                <div className="h-20 bg-gradient-to-r from-[#035397] via-[#1b66c9] to-[#4aa0ff]" />
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2 bg-white/90 hover:bg-white shadow"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <XCircle className="w-5 h-5 text-gray-700" />
                </button>
                <div className="px-6 -mt-8 pb-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md ring-1 ring-black/5">
                    <Stethoscope className="w-7 h-7 text-[#035397]" />
                  </div>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleCreateEspecialidad} className="px-6 py-5">
                <div className="grid grid-cols-1 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      placeholder="Nombre de la especialidad"
                      required
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#035397] text-white hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4" /> Crear
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showModal === "viewEspecialidad" && selectedEspecialidad && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-[#035397] via-[#1b66c9] to-[#4aa0ff]" />
              <div className="px-6 -mt-8 pb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md ring-1 ring-black/5">
                  <Stethoscope className="w-7 h-7 text-[#035397]" />
                </div>
              </div>
              <div className="px-6 pb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedEspecialidad.nombre}</h3>
                {selectedEspecialidad.descripcion && (
                  <p className="mt-2 text-sm text-gray-600">{selectedEspecialidad.descripcion}</p>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t flex justify-end">
                <button
                  onClick={closeModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Especialidad Modal - NUEVO */}
      {showModal === "editEspecialidad" && selectedEspecialidad && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={closeModal} />
          {/* Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              {/* Header */}
              <div className="relative">
                <div className="h-20 bg-gradient-to-r from-[#035397] via-[#1b66c9] to-[#4aa0ff]" />
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full p-2 bg-white/90 hover:bg-white shadow"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  <XCircle className="w-5 h-5 text-gray-700" />
                </button>
                <div className="px-6 -mt-8 pb-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-md ring-1 ring-black/5">
                    <Stethoscope className="w-7 h-7 text-[#035397]" />
                  </div>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleUpdateEspecialidad} className="px-6 py-5">
                <div className="grid grid-cols-1 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="text-xs font-medium text-gray-600">Nombre</label>
                    <input
                      type="text"
                      value={formData.nombre || ""}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#035397] focus:outline-none"
                      placeholder="Nombre de la especialidad"
                      required
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#035397] text-white hover:bg-blue-600"
                  >
                    <Edit className="w-4 h-4" /> Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showModal === "deleteEspecialidad" && selectedEspecialidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Eliminar Especialidad</h2>
            <p>
              ¿Estás seguro de eliminar la especialidad "
              {selectedEspecialidad.nombre}"?
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEspecialidad}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicosManagement;
