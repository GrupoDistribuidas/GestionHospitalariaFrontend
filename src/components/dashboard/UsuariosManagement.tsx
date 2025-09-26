import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  rol: string; // "Admin" or "Usuario"
  estado: string; // "Activo" or "Inactivo"
}

const API_BASE = "http://localhost:5088/api";

const roles: { [key: number]: string } = {
  1: "Administrador",
  2: "Médico",
  3: "Enfermera",
  4: "Recepcionista",
};

const UsuariosManagement: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState<
    "none" | "viewUsuario" | "editUsuario" | "createUsuario" | "deleteUsuario"
  >("none");
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [centrosMedicos, setCentrosMedicos] = useState<
    { idCentroMedico: number; nombre: string }[]
  >([]);
  const [especialidades, setEspecialidades] = useState<
    { idEspecialidad: number; nombre: string }[]
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, []);

  useEffect(() => {
    // Hardcode for demo; in real, fetch from API if available
    setCentrosMedicos([
      { idCentroMedico: 1, nombre: "UC" },
      { idCentroMedico: 2, nombre: "Cardiología" },
    ]);
    setEspecialidades([
      { idEspecialidad: 1, nombre: "Medicina General" },
      { idEspecialidad: 2, nombre: "Cardiología" },
    ]);
  }, []);

  useEffect(() => {
    setFilteredUsuarios(
      usuarios.filter(
        (usuario) =>
          usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, usuarios]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE}/medicos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) navigate("/login");
        throw new Error("Error fetching usuarios");
      }

      const medicosData = await res.json();
      setUsuarios(
        medicosData.map((m: any) => ({
          idUsuario: m.idEmpleado,
          nombre: m.nombre,
          email: m.email,
          rol: roles[m.idTipo] || "Usuario",
          estado: m.estado,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    try {
      const idTipo =
        Object.keys(roles).find(
          (key) => roles[parseInt(key)] === formData.rol
        ) || "2";
      const res = await fetch(`${API_BASE}/medicos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idCentroMedico: parseInt(formData.idCentroMedico) || 1,
          idTipo: parseInt(idTipo),
          idEspecialidad: parseInt(formData.idEspecialidad) || 1,
          nombre: formData.nombre,
          telefono: formData.telefono || "",
          email: formData.email,
          salario: parseFloat(formData.salario) || 0,
          horario: formData.horario || "",
          estado: formData.estado || "Activo",
        }),
      });
      if (!res.ok) throw new Error("Error creating usuario");
      fetchData();
      setShowModal("none");
      setFormData({});
      setNotification({
        message: "Usuario creado exitosamente",
        type: "success",
      });
    } catch (err) {
      setNotification({ message: "Error creando usuario", type: "error" });
      setError("Error creating usuario");
    }
  };

  const handleUpdateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUsuario) return;
    const token = localStorage.getItem("authToken");
    try {
      const idTipo =
        Object.keys(roles).find(
          (key) => roles[parseInt(key)] === formData.rol
        ) || "2";
      const res = await fetch(
        `${API_BASE}/medicos/${selectedUsuario.idUsuario}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            idCentroMedico: parseInt(formData.idCentroMedico) || 1,
            idTipo: parseInt(idTipo),
            idEspecialidad: parseInt(formData.idEspecialidad) || 1,
            nombre: formData.nombre,
            telefono: formData.telefono || "",
            email: formData.email,
            salario: parseFloat(formData.salario) || 0,
            horario: formData.horario || "",
            estado: formData.estado || "Activo",
          }),
        }
      );
      if (!res.ok) throw new Error("Error updating usuario");
      setNotification({
        message: "El usuario ha sido actualizado exitosamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
    } catch (err) {
      setNotification({
        message:
          "Error actualizando usuario: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error updating usuario");
    }
  };

  const handleDeleteUsuario = async () => {
    if (!selectedUsuario) return;
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(
        `${API_BASE}/medicos/${selectedUsuario.idUsuario}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Error deleting usuario");
      setNotification({
        message: "El usuario ha sido eliminado exitosamente.",
        type: "success",
      });
      fetchData();
      setShowModal("none");
    } catch (err) {
      setNotification({
        message:
          "Error eliminando usuario: " +
          (err instanceof Error ? err.message : "Error desconocido"),
        type: "error",
      });
      setError("Error deleting usuario");
    }
  };

  const openModal = (type: string, item?: Usuario) => {
    if (item) {
      setSelectedUsuario(item);
      setFormData({ ...item });
    } else {
      setFormData({});
    }
    setShowModal(type as any);
  };

  const closeModal = () => {
    setShowModal("none");
    setSelectedUsuario(null);
    setFormData({});
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
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-[#035397] text-white rounded-2xl p-6 text-center shadow-xl">
        <h1 className="text-3xl font-bold mb-2">GESTIÓN DE USUARIOS</h1>
        <p className="opacity-90">Administración de usuarios del sistema</p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg border ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border-green-300"
              : "bg-red-100 text-red-800 border-red-300"
          }`}
        >
          {notification.message}
          <button
            onClick={() => setNotification(null)}
            className="float-right ml-4 text-lg"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search and Add Button */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre o email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397]"
          />
        </div>
        <button
          onClick={() => openModal("createUsuario")}
          className="flex items-center gap-2 bg-[#035397] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar Usuario
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
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
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.idUsuario} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {usuario.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usuario.rol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge estado={usuario.estado} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal("viewUsuario", usuario)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal("editUsuario", usuario)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal("deleteUsuario", usuario)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsuarios.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron usuarios
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal === "createUsuario" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Crear Usuario</h2>
            <form onSubmit={handleCreateUsuario}>
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
                type="email"
                placeholder="Email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
              <input
                type="number"
                placeholder="Salario"
                value={formData.salario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, salario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Horario"
                value={formData.horario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <select
                value={formData.rol || ""}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Médico">Médico</option>
                <option value="Enfermera">Enfermera</option>
                <option value="Recepcionista">Recepcionista</option>
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

      {showModal === "editUsuario" && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Editar Usuario</h2>
            <form onSubmit={handleUpdateUsuario}>
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
                type="email"
                placeholder="Email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
              <input
                type="number"
                placeholder="Salario"
                value={formData.salario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, salario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Horario"
                value={formData.horario || ""}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
              />
              <select
                value={formData.rol || ""}
                onChange={(e) =>
                  setFormData({ ...formData, rol: e.target.value })
                }
                className="w-full p-2 border rounded mb-2"
                required
              >
                <option value="">Seleccionar Rol</option>
                <option value="Administrador">Administrador</option>
                <option value="Médico">Médico</option>
                <option value="Enfermera">Enfermera</option>
                <option value="Recepcionista">Recepcionista</option>
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

      {showModal === "viewUsuario" && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Ver Usuario</h2>
            <div className="space-y-2">
              <p>
                <strong>Nombre:</strong> {selectedUsuario.nombre}
              </p>
              <p>
                <strong>Email:</strong> {selectedUsuario.email}
              </p>
              <p>
                <strong>Rol:</strong> {selectedUsuario.rol}
              </p>
              <p>
                <strong>Estado:</strong> {selectedUsuario.estado}
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

      {showModal === "deleteUsuario" && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Eliminar Usuario</h2>
            <p>¿Estás seguro de eliminar a {selectedUsuario.nombre}?</p>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUsuario}
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

export default UsuariosManagement;
