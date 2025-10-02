// src/components/dashboard/PacientesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
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
  User2,
  Phone,
  Mail,
  MapPin,
  Shield,
  Calendar,
  Clock,
  Paperclip,
  CreditCard,
  Lock, CheckCircle2,
} from "lucide-react";
interface Paciente {
  idPaciente: number;
  nombre: string;
  cedula: string;
  fechaNacimiento: string;
  telefono?: string;
  direccion?: string;
}

type Estado = "Activo" | "Pendiente" | "Inactivo" | null;

interface PacienteDetalle {
  idPaciente: number;
  nombre: string;
  cedula: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  seguro?: "Privado" | "Público" | "Otro" | null;
  estado?: Estado;
  avatarUrl?: string | null;
}

interface ConsultaLite {
  idConsulta: number;
  fecha: string; // ISO
  hora?: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  idPaciente: number;
  idMedico?: number;
  nombreMedico?: string;
  estado?: "Programada" | "Completada" | "Cancelada";
}

const API_BASE = "http://localhost:5088/api";
const mapPaciente = (raw: any): Paciente => ({
  idPaciente: raw.idPaciente ?? raw.id_paciente ?? raw.id ?? 0,
  nombre: raw.nombre,
  cedula: raw.cedula,
  fechaNacimiento: raw.fechaNacimiento ?? raw.fecha_nacimiento,
  telefono: raw.telefono ?? "",
  direccion: raw.direccion ?? "",
});
const PacientesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [filtered, setFiltered] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState<
    "none" | "view" | "edit" | "create" | "delete"
  >("none");
  const [selected, setSelected] = useState<Paciente | null>(null);
  const [formData, setFormData] = useState<Partial<Paciente>>({});
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(
    null
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const navigate = useNavigate();
  const checkCedulaExists = async (ced: string): Promise<boolean> => {
    const cedNorm = (ced || "").trim();
    if (!cedNorm) return false;

    if (pacientes.some((p) => p.cedula === cedNorm)) return true;

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(
        `${API_BASE}/pacientes?cedula=${encodeURIComponent(cedNorm)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) return false;

      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.pacientes ?? [];

      return list.some((r: any) => (r.cedula ?? r.dni ?? "") === cedNorm);
    } catch {
      return false;
    }
  };
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageRows = filtered.slice(start, end);
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData(); // 👈 solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    // se auto cierra en 3s
    window.setTimeout(() => setToast(null), 3000);
  };
  // Cuando cambie la lista, corrige la selección si hace falta
  useEffect(() => {
    if (pacientes.length === 0) {
      setSelectedPacienteId(null);
      return;
    }
    const exists = selectedPacienteId
      ? pacientes.some(p => p.idPaciente === selectedPacienteId)
      : false;

    if (!selectedPacienteId || !exists) {
      setSelectedPacienteId(pacientes[0].idPaciente);
    }
  }, [pacientes]); // 👈 SOLO depende de pacientes

  // Mantén este para el filtro de búsqueda
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
      setSelectedPacienteId(item.idPaciente);
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
    const ced = (formData.cedula || "").trim();
    if (!ced) {
      showToast("error", "Ingresa una cédula válida");
      return;
    }
    if (await checkCedulaExists(ced)) {
      showToast("error", "Cédula ya registrada");
      return;
    }
    try {
      const body = {
        nombre: formData.nombre,
        cedula: formData.cedula,
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
      if (!res.ok) {
        // Si el backend devuelve conflicto o un mensaje de duplicado
        const msg = await res.text().catch(() => "");
        if (res.status === 409 || /cedul|dni|duplic/i.test(msg)) {
          showToast("error", "Cédula ya registrada");
        } else {
          showToast("error", "No se pudo crear el paciente");
        }
        throw new Error("Error creando paciente");
      }

      await fetchData();
      closeModal();
      showToast("success", "Paciente agregado con éxito 👍");
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
        cedula: formData.cedula, // se envía igual, pero el campo está bloqueado
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

      {/* Grid: Tabla + Tarjeta lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla */}
        {/* Tabla */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-gray-950/5 overflow-hidden">
            {/* Encabezado de la tarjeta (contador, opcional) */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/70 border-b">
              <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
                Pacientes
              </h3>
              <span className="text-xs text-gray-500">
                {filtered.length} registro{filtered.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                {/* Thead pegajoso y con blur suave */}
                <thead className="bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:sticky top-0 z-10">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-3 font-medium">Cédula</th>
                    <th className="px-6 py-3 font-medium">Nombre</th>
                    <th className="px-6 py-3 font-medium">Nacimiento</th>
                    <th className="px-6 py-3 font-medium">Teléfono</th>
                    <th className="px-6 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {pageRows.map((p) => {
                    const isSelected = selectedPacienteId === p.idPaciente;
                    const initials = (p.nombre || "")
                      .trim()
                      .split(/\s+/)
                      .map((s) => s[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={p.idPaciente}
                        onClick={() => setSelectedPacienteId(p.idPaciente)}
                        title="Seleccionar para ver detalle"
                        className={[
                          "group cursor-pointer transition-colors",
                          "hover:bg-gray-50",
                          "border-l-4",
                          isSelected ? "bg-blue-50/60 border-[#035397]" : "border-transparent",
                        ].join(" ")}
                      >
                        <td className="px-6 py-3 whitespace-nowrap font-mono tabular-nums text-gray-900">
                          {p.cedula}
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#035397] to-blue-500 text-white grid place-items-center text-xs font-semibold shadow-sm">
                              {initials || "?"}
                            </div>
                            <span className="font-medium text-gray-900">{p.nombre}</span>
                          </div>
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap text-gray-600 tabular-nums">
                          {p.fechaNacimiento}
                        </td>

                        <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                          {p.telefono || "—"}
                        </td>

                        <td
                          className="px-6 py-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openModal("view", p)}
                              title="Ver"
                              className="inline-flex items-center rounded-md p-2 text-gray-600 hover:text-[#035397] hover:bg-[#035397]/10 focus:outline-none focus:ring-2 focus:ring-[#035397]/30"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal("edit", p)}
                              title="Editar"
                              className="inline-flex items-center rounded-md p-2 text-gray-600 hover:text-green-700 hover:bg-green-600/10 focus:outline-none focus:ring-2 focus:ring-green-600/30"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openModal("delete", p)}
                              title="Eliminar"
                              className="inline-flex items-center rounded-md p-2 text-gray-600 hover:text-red-700 hover:bg-red-600/10 focus:outline-none focus:ring-2 focus:ring-red-600/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        Sin resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {total ? start + 1 : 0}–{Math.min(end, total)} de {total}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600 flex items-center gap-2">
                    Filas:
                    <select
                      value={pageSize}
                      onChange={(e) => setPage(Number(e.target.value))}
                      className="hidden" // mantiene compatibilidad si no quieres cambiar el setPage accidentalmente
                    />
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#035397]"
                    >
                      {[5, 10, 20, 50].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="p-2 rounded-md border text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                      title="Primera"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-md border text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="px-2 text-sm text-gray-700">
                      Página <strong>{page}</strong> de <strong>{totalPages}</strong>
                    </span>

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-md border text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                      title="Siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="p-2 rounded-md border text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                      title="Última"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Tarjeta lateral */}
        <div className="lg:col-span-1">
          <PatientSidebar pacienteId={selectedPacienteId} />
        </div>
      </div>

      {/* Modals */}
      {showModal === "create" && (
        <AddPatientModal
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          onCancel={closeModal}
        />
      )}

      {showModal === "edit" && selected && (
        <EditPatientModal
          paciente={selected}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
          onCancel={closeModal}
        />
      )}

      {showModal === "view" && selected && (
        <PatientDetailModal paciente={selected} onClose={closeModal} />
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
              onClick={handleDeleteConfirmFactory(selected.idPaciente)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

    </div>

  );

  function handleDeleteConfirmFactory(id: number) {
    return async () => {
      const token = localStorage.getItem("authToken");
      try {
        const res = await fetch(`${API_BASE}/pacientes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error eliminando paciente");

        setSelectedPacienteId(prev => (prev === id ? null : prev));

        await fetchData();
        closeModal();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error eliminando paciente");
      }
    };
  }

};

export default PacientesPage;
const Toast: React.FC<{
  type: "success" | "error";
  message: string;
  onClose: () => void;
}> = ({ type, message, onClose }) => {
  const styles =
    type === "success"
      ? { ring: "ring-green-200", title: "text-green-700", icon: <CheckCircle2 className="w-5 h-5 text-green-600" /> }
      : { ring: "ring-red-200", title: "text-red-700", icon: <AlertCircle className="w-5 h-5 text-red-600" /> };

  return (
    <div className="fixed top-20 right-6 z-[60]">
      <div className={`flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-2xl ring-1 ${styles.ring}`}>
        <div className="mt-0.5">{styles.icon}</div>
        <div className="text-sm">
          <div className={`font-semibold ${styles.title}`}>{type === "success" ? "Éxito" : "Error"}</div>
          <div className="text-gray-700">{message}</div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded hover:bg-gray-100 text-gray-500"
          aria-label="Cerrar notificación"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl max-w-md w-full mx-4 shadow-2xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
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
  mode: "create" | "edit";
  formData: Partial<Paciente>;
  setFormData: (f: Partial<Paciente>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ mode, formData, setFormData, onSubmit, onCancel }) => {
  const isEdit = mode === "edit";
  return (
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
            placeholder="Nombre y Apellido"
            autoComplete="name"
            value={formData.nombre || ""}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] placeholder:text-gray-400"
            required
          />
        </div>

        {/* Cédula (bloqueada en edición) */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label htmlFor="cedula" className="text-sm font-medium text-gray-700">
              Cédula <span className="text-red-500">*</span>
            </label>
            {isEdit && (
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <Lock className="w-3.5 h-3.5" /> Bloqueada en edición
              </span>
            )}
          </div>
          <input
            id="cedula"
            name="cedula"
            type="text"
            placeholder="Cedula"
            inputMode="numeric"
            pattern="\d{10}"
            title="10 dígitos"
            value={formData.cedula || ""}
            onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
            disabled={isEdit}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] placeholder:text-gray-400 ${isEdit ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""
              }`}
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
            value={formData.fechaNacimiento || ""}
            onChange={(e) =>
              setFormData({ ...formData, fechaNacimiento: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397]"
            required
            aria-describedby="hint-fecha"
          />
          <span id="hint-fecha" className="text-xs text-gray-400">
            Formato: DD-MM-YYYY
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
            placeholder="Ingrese su telefono"
            inputMode="tel"
            value={formData.telefono || ""}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] placeholder:text-gray-400"
          />
        </div>

        {/* Dirección */}
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
};
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
    <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value || "—"}</div>
    </div>
  </div>
);

const PatientDetailModal: React.FC<{
  paciente: Paciente;
  onClose: () => void;
}> = ({ paciente, onClose }) => {
  const initials = paciente.nombre
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#035397] to-blue-700 text-white p-5">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1 hover:bg-white/15 focus:outline-none"
            aria-label="Cerrar"
          >
            <XCircle className="h-5 w-5 text-white/90" />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/30">
              <span className="font-semibold">{initials}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">
                {paciente.nombre}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
                  <CreditCard className="h-3.5 w-3.5" />
                  DNI: <strong className="ml-1">{paciente.cedula}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow
              icon={<Calendar className="h-4 w-4 text-gray-600" />}
              label="Nacimiento"
              value={paciente.fechaNacimiento}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4 text-gray-600" />}
              label="Teléfono"
              value={paciente.telefono || ""}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4 text-gray-600" />}
              label="Dirección"
              value={paciente.direccion || ""}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="inline-flex items-center rounded-lg bg-[#035397] px-4 py-2 text-white hover:bg-blue-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const EditPatientModal: React.FC<{
  paciente: Paciente;
  formData: Partial<Paciente>;
  setFormData: (f: Partial<Paciente>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ paciente, formData, setFormData, onSubmit, onCancel }) => {
  const initials = paciente.nombre
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
        {/* Header con degradado */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5">
          <button
            onClick={onCancel}
            className="absolute right-3 top-3 rounded-full p-1 hover:bg-white/15 focus:outline-none"
            aria-label="Cerrar"
          >
            <XCircle className="h-5 w-5 text-white/90" />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/30">
              <span className="font-semibold">{initials}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">
                Editar paciente
              </h3>
              <div className="mt-1 text-xs opacity-90">
                {paciente.nombre} • DNI {paciente.cedula}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <PacienteForm
            mode="edit"
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
};
const AddPatientModal: React.FC<{
  formData: Partial<Paciente>;
  setFormData: (f: Partial<Paciente>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}> = ({ formData, setFormData, onSubmit, onCancel }) => {
  const initials = (formData.nombre ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100">
        {/* Header con degradado */}
        <div className="relative bg-gradient-to-r from-[#035397] to-blue-700 text-white p-5">
          <button
            onClick={onCancel}
            className="absolute right-3 top-3 rounded-full p-1 hover:bg-white/15 focus:outline-none"
            aria-label="Cerrar"
          >
            <XCircle className="h-5 w-5 text-white/90" />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/30">
              {initials ? (
                <span className="font-semibold">{initials}</span>
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">
                Nuevo paciente
              </h3>
              <div className="mt-1 text-xs opacity-90">
                Completa los datos obligatorios para registrar.
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="p-6">
          <PacienteForm
            mode="create"
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
};
/* ----------------- Tarjeta lateral ----------------- */

function BadgeEstado({ estado }: { estado: Estado }) {
  if (!estado) return null;
  const map: Record<string, string> = {
    Activo: "bg-green-100 text-green-700",
    Pendiente: "bg-yellow-100 text-yellow-800",
    Inactivo: "bg-gray-200 text-gray-700",
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${map[estado]}`}>
      {estado}
    </span>
  );
}
const PatientSidebar: React.FC<{
  pacienteId: number | null;
}> = ({ pacienteId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [paciente, setPaciente] = useState<PacienteDetalle | null>(null);
  const [consultas, setConsultas] = useState<ConsultaLite[]>([]);
  const [nota, setNota] = useState<string>("");
  const [guardando, setGuardando] = useState(false);

  const token = useMemo(() => localStorage.getItem("authToken"), []);

  useEffect(() => {
    if (!pacienteId) {
      setPaciente(null);
      setConsultas([]);
      return;
    }
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const resP = await fetch(`${API_BASE}/pacientes/${pacienteId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Si el paciente fue eliminado o no existe:
        if (!resP.ok) {
          if (resP.status === 404) {
            setPaciente(null);
            setConsultas([]);
            setError("Seleccione un paciente para ver la información");
            setLoading(false);
            return; // detenemos el flujo
          }
          throw new Error("No se pudo cargar el paciente");
        }

        const p = await resP.json();

        const detalle: PacienteDetalle = {
          idPaciente: p.idPaciente ?? p.id ?? pacienteId,
          nombre: p.nombre ?? `${p.nombres ?? ""} ${p.apellidos ?? ""}`.trim(),
          cedula: p.cedula ?? p.dni ?? "—",
          telefono: p.telefono ?? null,
          email: p.email ?? null,
          direccion: p.direccion ?? null,
          seguro: p.seguro ?? null,
          estado: p.estado ?? null,
          avatarUrl: p.avatarUrl ?? null,
        };
        setPaciente(detalle);

        const urlConsultas = `${API_BASE}/consultas${detalle.idPaciente ? `?pacienteId=${detalle.idPaciente}` : ""
          }`;
        const resC = await fetch(urlConsultas, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resC.ok) {
          // Si falla el historial, no rompas la UI: deja vacío y muestra un mensaje suave
          setConsultas([]);
        } else {
          const list = await resC.json();
          const arr = Array.isArray(list) ? list : [];
          const soloPaciente = arr.filter(
            (c: any) => (c.idPaciente ?? c.pacienteId) === detalle.idPaciente
          );

          const mapped: ConsultaLite[] = soloPaciente.map((c: any) => ({
            idConsulta: c.idConsulta ?? c.id ?? 0,
            fecha: c.fecha,
            hora: c.hora ?? undefined,
            motivo: c.motivo ?? undefined,
            diagnostico: c.diagnostico ?? undefined,
            tratamiento: c.tratamiento ?? undefined,
            idPaciente: c.idPaciente ?? detalle.idPaciente,
            idMedico: c.idMedico ?? undefined,
            nombreMedico: c.nombreMedico ?? undefined,
            estado: c.estado ?? undefined,
          }));
          setConsultas(mapped);
        }
      } catch (e: any) {
        setError(e?.message || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [pacienteId, token]);

  const now = new Date();
  const { proximas, historial } = useMemo(() => {
    const toDate = (c: ConsultaLite) => {
      try {
        const base = c.fecha ? new Date(c.fecha) : new Date();
        if (c.hora) {
          const [hh, mm] = c.hora.split(":");
          base.setHours(Number(hh || 0), Number(mm || 0), 0, 0);
        }
        return base;
      } catch {
        return new Date();
      }
    };
    const ord = (a: ConsultaLite, b: ConsultaLite) => +toDate(a) - +toDate(b);
    const future = consultas
      .filter((c) => +toDate(c) >= +now)
      .sort(ord)
      .slice(0, 2);
    const past = consultas
      .filter((c) => +toDate(c) < +now)
      .sort((a, b) => +toDate(b) - +toDate(a))
      .slice(0, 2);
    return { proximas: future, historial: past };
  }, [consultas]);

  const initials = useMemo(() => {
    if (!paciente?.nombre) return "PA";
    return paciente.nombre
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [paciente]);

  if (!pacienteId) {
    return (
      <div className="hidden lg:flex flex-col border rounded-2xl p-6 bg-white text-gray-500 items-center justify-center min-h-[520px]">
        <User2 className="w-10 h-10 mb-2" />
        Selecciona un paciente
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border rounded-2xl p-6 bg-white flex items-center justify-center min-h-[520px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#035397]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-2xl p-6 bg-white text-red-600 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" /> {error}
      </div>
    );
  }

  if (!paciente) return null;
  // Estilo del pill según estado de la consulta
  const pillClass = (s?: string) => {
    if (s === "Completada") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    if (s === "Cancelada") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    return "bg-blue-50 text-blue-700 ring-1 ring-blue-200"; // Programada / Próxima
  };

  return (
    <aside className="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
      {/* Cover / perfil */}
      {/* Cover / perfil (mejorado) */}
      <div className="relative">
        <div className="h-28 bg-gradient-to-r from-[#035397] via-[#018ede] to-blue-600" />
        <div className="px-5 pb-5 border-b">
          <div className="flex items-start gap-4">
            {/* Avatar flotando sobre el cover */}
            {paciente.avatarUrl ? (
              <img
                src={paciente.avatarUrl}
                alt={paciente.nombre}
                className="-mt-8 w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-lg"
              />
            ) : (
              <div className="-mt-8 w-16 h-16 rounded-full bg-white ring-4 ring-white shadow-lg flex items-center justify-center">
                <span className="text-[#035397] font-semibold text-lg">{initials}</span>
              </div>
            )}

            {/* Texto en zona blanca (legible) */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {paciente.nombre}
                </h3>
                <BadgeEstado estado={(paciente.estado as Estado) ?? null} />
              </div>

              {/* Línea de DNI (alto contraste) + Seguro solo si existe */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-800 ring-1 ring-gray-200">
                  <CreditCard className="w-3.5 h-3.5 text-gray-600" />
                  <span className="font-medium">DNI:</span>
                  <span className="font-semibold tracking-wide tabular-nums">{paciente.cedula}</span>
                </span>

                {paciente.seguro && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 ring-1 ring-indigo-200">
                    <Shield className="w-3.5 h-3.5" />
                    {paciente.seguro}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Contenido */}
      <div className="p-5 space-y-6">
        {/* Información de contacto */}
        <section>
          <h4 className="text-sm font-semibold text-gray-800">Información de Contacto</h4>
          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 hover:bg-gray-50 transition">
              <span className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" /> Teléfono
              </span>
              <span className="font-medium text-gray-900">{paciente.telefono ?? "—"}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 hover:bg-gray-50 transition">
              <span className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" /> Dirección
              </span>
              <span className="font-medium text-gray-900 text-right">
                {paciente.direccion ?? "—"}
              </span>
            </div>
          </div>
        </section>
        {/* Historial reciente */}
        <section>
          <h4 className="text-sm font-semibold text-gray-800">Historial Reciente</h4>
          {historial.length === 0 ? (
            <div className="mt-3 text-sm text-gray-500 rounded-xl border bg-white px-3 py-3">
              Sin registros.
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {historial.map((c) => {
                const fecha = new Date(c.fecha);
                const fechaStr = fecha.toLocaleDateString();
                const hora = c.hora ? `• ${c.hora}` : "";
                const doctor = c.nombreMedico ? `• Dr./Dra. ${c.nombreMedico}` : "";
                return (
                  <div
                    key={c.idConsulta}
                    className="flex items-start gap-3 rounded-xl border bg-white p-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center ring-1 ring-gray-200">
                      <Clock className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900">{c.motivo || "Consulta"}</div>
                      <div className="text-xs text-gray-500">
                        {fechaStr} {hora} <span className="hidden sm:inline">{doctor}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${pillClass(c.estado)}`}>
                      {c.estado ?? "Completada"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
};
