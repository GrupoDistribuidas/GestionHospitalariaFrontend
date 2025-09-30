// src/components/dashboard/PacientesPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";

interface Paciente {
  idPaciente: number;
  nombre: string;
  cedula: string;
  fechaNacimiento: string; // yyyy-MM-dd
  telefono?: string;
  direccion?: string;
}

const API_BASE = "http://localhost:5088/api"; // 👈 igual que UsuariosManagement

// mapea snake_case o camelCase -> Paciente
const mapPaciente = (raw: any): Paciente => ({
  idPaciente: raw.idPaciente ?? raw.id_paciente ?? raw.id ?? 0,
  nombre: raw.nombre,
  cedula: raw.cedula,
  fechaNacimiento: raw.fechaNacimiento ?? raw.fecha_nacimiento,
  telefono: raw.telefono ?? "",
  direccion: raw.direccion ?? "",
});

const PacientesPage: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [filtered, setFiltered] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState<
    "none" | "view" | "edit" | "create" | "delete"
  >("none");
  const [selected, setSelected] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState<Partial<Paciente>>({});
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
    const term = searchTerm.toLowerCase();
    setFiltered(
      pacientes.filter(
        (p) =>
          p.nombre.toLowerCase().includes(term) ||
          p.cedula.includes(term) ||
          (p.telefono ?? "").includes(term)
      )
    );
  }, [searchTerm, pacientes]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE}/pacientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) navigate("/login");
        throw new Error("Error fetching pacientes");
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.pacientes ?? [];
      setPacientes(list.map(mapPaciente));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (
    type: "view" | "edit" | "create" | "delete",
    item?: Paciente
  ) => {
    setShowModal(type);
    if (item) {
      setSelected(item);
      setFormData({ ...item });
    } else {
      setSelected(null);
      setFormData({});
    }
  };

  const closeModal = () => {
    setShowModal("none");
    setSelected(null);
    setFormData({});
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    try {
      const body = {
        nombre: formData.nombre,
        cedula: formData.cedula,
        // si tu API espera snake_case usa 'fecha_nacimiento'
        fechaNacimiento: formData.fechaNacimiento,
        telefono: formData.telefono ?? "",
        direccion: formData.direccion ?? "",
      };
      const res = await fetch(`${API_BASE}/pacientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error creando paciente");
      await fetchData();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando paciente");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const token = localStorage.getItem("authToken");
    try {
      const body = {
        nombre: formData.nombre,
        cedula: formData.cedula,
        fechaNacimiento: formData.fechaNacimiento,
        telefono: formData.telefono ?? "",
        direccion: formData.direccion ?? "",
      };
      const res = await fetch(`${API_BASE}/pacientes/${selected.idPaciente}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error actualizando paciente");
      await fetchData();
      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error actualizando paciente"
      );
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE}/pacientes/${selected.idPaciente}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error eliminando paciente");
      await fetchData();
      closeModal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error eliminando paciente"
      );
    }
  };

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
        <h1 className="text-3xl font-bold mb-2">GESTIÓN DE PACIENTES</h1>
        <p className="opacity-90">Administración de pacientes de la clínica</p>
      </div>

      {/* Search & Add */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o teléfono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397]"
          />
        </div>
        <button
          onClick={() => openModal("create")}
          className="flex items-center gap-2 bg-[#035397] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo paciente
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cédula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nacimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((p) => (
                <tr key={p.idPaciente} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {p.cedula}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {p.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.fechaNacimiento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.telefono || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.direccion || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openModal("view", p)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal("edit", p)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal("delete", p)}
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
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">Sin resultados</div>
        )}
      </div>

      {/* Modals */}
      {showModal === "create" && (
        <Modal title="Crear Paciente" onClose={closeModal}>
          <PacienteForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {showModal === "edit" && selected && (
        <Modal title="Editar Paciente" onClose={closeModal}>
          <PacienteForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {showModal === "view" && selected && (
        <Modal title="Detalle de Paciente" onClose={closeModal}>
          <div className="space-y-2">
            <p>
              <strong>Nombre:</strong> {selected.nombre}
            </p>
            <p>
              <strong>Cédula:</strong> {selected.cedula}
            </p>
            <p>
              <strong>Nacimiento:</strong> {selected.fechaNacimiento}
            </p>
            <p>
              <strong>Teléfono:</strong> {selected.telefono || "-"}
            </p>
            <p>
              <strong>Dirección:</strong> {selected.direccion || "-"}
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
        </Modal>
      )}

      {showModal === "delete" && selected && (
        <Modal title="Eliminar Paciente" onClose={closeModal}>
          <p>
            ¿Estás seguro de eliminar a <strong>{selected.nombre}</strong>?
          </p>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PacientesPage;

/* ----------------- Subcomponentes ----------------- */

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <XCircle className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const PacienteForm: React.FC<{
  formData: Partial<Paciente>;
  setFormData: (f: Partial<Paciente>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ formData, setFormData, onSubmit, onCancel }) => (
  <form onSubmit={onSubmit}>
    <p className="text-xs text-gray-500 mb-3">
      Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Nombre */}
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          placeholder="Ej. Gabriela Sánchez"
          autoComplete="name"
          value={formData.nombre || ""}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] placeholder:text-gray-400"
          required
        />
      </div>

      {/* Cédula */}
      <div className="flex flex-col gap-1">
        <label htmlFor="cedula" className="text-sm font-medium text-gray-700">
          Cédula <span className="text-red-500">*</span>
        </label>
        <input
          id="cedula"
          name="cedula"
          type="text"
          placeholder="Ej. 0951234567"
          inputMode="numeric"
          pattern="\d{10}"
          title="10 dígitos"
          value={formData.cedula || ""}
          onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] placeholder:text-gray-400"
          required
        />
      </div>

      {/* Fecha de nacimiento */}
      <div className="flex flex-col gap-1">
        <label htmlFor="fechaNacimiento" className="text-sm font-medium text-gray-700">
          Fecha de nacimiento <span className="text-red-500">*</span>
        </label>
        <input
          id="fechaNacimiento"
          name="fechaNacimiento"
          type="date"
          // Nota: el placeholder en inputs type="date" no siempre se muestra; dejamos una ayuda debajo.
          value={formData.fechaNacimiento || ""}
          onChange={(e) =>
            setFormData({ ...formData, fechaNacimiento: e.target.value })
          }
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397]"
          required
          aria-describedby="hint-fecha"
        />
        <span id="hint-fecha" className="text-xs text-gray-400">
          Formato: AAAA-MM-DD (ej. 1995-09-05)
        </span>
      </div>

      {/* Teléfono */}
      <div className="flex flex-col gap-1">
        <label htmlFor="telefono" className="text-sm font-medium text-gray-700">
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          placeholder="Ej. 0987654321"
          inputMode="tel"
          value={formData.telefono || ""}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] placeholder:text-gray-400"
        />
      </div>

      {/* Dirección (ocupa 2 columnas en desktop) */}
      <div className="flex flex-col gap-1 md:col-span-2">
        <label htmlFor="direccion" className="text-sm font-medium text-gray-700">
          Dirección
        </label>
        <input
          id="direccion"
          name="direccion"
          type="text"
          placeholder="Ej. Av. Siempre Viva 742, Ambato"
          autoComplete="street-address"
          value={formData.direccion || ""}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] placeholder:text-gray-400"
        />
      </div>
    </div>

    <div className="flex justify-end gap-2 mt-5">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-[#035397] text-white hover:bg-blue-600"
      >
        Guardar
      </button>
    </div>
  </form>
);
