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
    { idTipo: 3, tipo: "Administrador" },
    { idTipo: 4, tipo: "Recepcionista" },
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

  const handleDeleteMedico = async () => {
    if (!selectedMedico) return;

    try {
      const res = await safeFetch(`/medicos/${selectedMedico.idEmpleado}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error deleting medico");
      setNotification({
        message: "El médico ha sido eliminado correctamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
    } catch (err) {
      setNotification({
        message:
          "Error eliminando médico: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error deleting medico");
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
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        estado === "Activo"
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
            placeholder={`Buscar por ${
              activeTab === "personal" ? "nombre" : "nombre de especialidad"
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
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "personal"
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
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === "especialidades"
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

      {/* Modals - Example for Medico Create/Edit; similar for others */}
      {showModal === "createMedico" && isAdmin() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Crear Médico</h2>
            <form onSubmit={handleCreateMedico}>
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={formData.telefono || ""}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="number"
                placeholder="Salario"
                value={formData.salario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, salario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              <input
                type="text"
                placeholder="Horario"
                value={formData.horario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              {centrosMedicos.length > 0 ? (
                <select
                  value={formData.idCentroMedico || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, idCentroMedico: e.target.value })
                  }
                  className="w-full p-2 border rounded mb-2"
                  required
                >
                  <option value="">Seleccionar Centro Médico</option>
                  {centrosMedicos.map((centro) => (
                    <option
                      key={centro.idCentroMedico}
                      value={centro.idCentroMedico}
                    >
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="number"
                    placeholder="Ingrese id de Centro Médico"
                    value={formData.idCentroMedico || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idCentroMedico: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded mb-2"
                    required
                  />
                  <p className="text-sm text-yellow-600 mt-1">
                    No se encontraron centros desde la API. Introduzca
                    manualmente el identificador numérico del centro.
                  </p>
                </div>
              )}
              <select
                value={formData.idTipo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idTipo: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Tipo de Empleado</option>
                {tiposEmpleado.map((tipo) => (
                  <option key={tipo.idTipo} value={tipo.idTipo}>
                    {tipo.tipo}
                  </option>
                ))}
              </select>
              <select
                value={formData.idEspecialidad || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idEspecialidad: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Especialidad</option>
                {especialidades.map((esp) => (
                  <option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
              <select
                value={formData.estado || ""}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Estado</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#035397] text-white rounded hover:bg-blue-600"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === "editMedico" && selectedMedico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Editar Médico</h2>
            <form onSubmit={handleUpdateMedico}>
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              <input
                type="text"
                placeholder="Teléfono"
                value={formData.telefono || ""}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="number"
                placeholder="Salario"
                value={formData.salario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, salario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              <input
                type="text"
                placeholder="Horario"
                value={formData.horario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              {centrosMedicos.length > 0 ? (
                <select
                  value={formData.idCentroMedico || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, idCentroMedico: e.target.value })
                  }
                  className="w-full p-2 border rounded mb-2"
                  required
                >
                  <option value="">Seleccionar Centro Médico</option>
                  {centrosMedicos.map((centro) => (
                    <option
                      key={centro.idCentroMedico}
                      value={centro.idCentroMedico}
                    >
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="number"
                    placeholder="Ingrese id de Centro Médico"
                    value={formData.idCentroMedico || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        idCentroMedico: e.target.value,
                      })
                    }
                    className="w-full p-2 border rounded mb-2"
                    required
                  />
                  <p className="text-sm text-yellow-600 mt-1">
                    No se encontraron centros desde la API. Introduzca
                    manualmente el identificador numérico del centro.
                  </p>
                </div>
              )}
              <select
                value={formData.idTipo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idTipo: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Tipo de Empleado</option>
                {tiposEmpleado.map((tipo) => (
                  <option key={tipo.idTipo} value={tipo.idTipo}>
                    {tipo.tipo}
                  </option>
                ))}
              </select>
              <select
                value={formData.idEspecialidad || ""}
                onChange={(e) =>
                  setFormData({ ...formData, idEspecialidad: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Especialidad</option>
                {especialidades.map((esp) => (
                  <option key={esp.idEspecialidad} value={esp.idEspecialidad}>
                    {esp.nombre}
                  </option>
                ))}
              </select>
              <select
                value={formData.estado || ""}
                onChange={(e) =>
                  setFormData({ ...formData, estado: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Estado</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#035397] text-white rounded hover:bg-blue-600"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Medico Modal */}
      {showModal === "viewMedico" && selectedMedico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Ver Médico</h2>
            <div className="space-y-2">
              <p>
                <strong>Nombre:</strong> {selectedMedico.nombre}
              </p>
              <p>
                <strong>Teléfono:</strong>{" "}
                {selectedMedico.telefono || "No especificado"}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {selectedMedico.email || "No especificado"}
              </p>
              <p>
                <strong>Especialidad:</strong>{" "}
                {getEspecialidadName(selectedMedico.idEspecialidad)}
              </p>
              <p>
                <strong>Departamento:</strong>{" "}
                {getCentroMedicoName(selectedMedico.idCentroMedico)}
              </p>
              <p>
                <strong>Salario:</strong> ${selectedMedico.salario}
              </p>
              <p>
                <strong>Horario:</strong> {selectedMedico.horario}
              </p>
              <p>
                <strong>Estado:</strong> {selectedMedico.estado}
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-[#035397] text-white rounded hover:bg-blue-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "deleteMedico" && selectedMedico && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Eliminar Médico</h2>
            <p>¿Estás seguro de eliminar a {selectedMedico.nombre}?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteMedico}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Especialidades Modals */}
      {showModal === "createEspecialidad" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Crear Especialidad</h2>
            <form onSubmit={handleCreateEspecialidad}>
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              <textarea
                placeholder="Descripción"
                value={formData.descripcion || ""}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#035397] text-white rounded hover:bg-blue-600"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === "viewEspecialidad" && selectedEspecialidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Ver Especialidad</h2>
            <div className="space-y-2">
              <p>
                <strong>Nombre:</strong> {selectedEspecialidad.nombre}
              </p>
              <p>
                <strong>Descripción:</strong>{" "}
                {selectedEspecialidad.descripcion || "Sin descripción"}
              </p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-[#035397] text-white rounded hover:bg-blue-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "editEspecialidad" && selectedEspecialidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Editar Especialidad</h2>
            <form onSubmit={handleUpdateEspecialidad}>
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              />
              <textarea
                placeholder="Descripción"
                value={formData.descripcion || ""}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#035397] text-white rounded hover:bg-blue-600"
                >
                  Actualizar
                </button>
              </div>
            </form>
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
