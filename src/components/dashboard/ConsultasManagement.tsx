import React, { useEffect, useState } from "react";
import { appointmentsService } from "../../services/appointmentsService";
import type { CreateAppointmentPayload } from "../../services/appointmentsService";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Alert from "../common/Alert";

interface Consulta {
  idConsulta: number;
  fecha: string;
  hora?: string;
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  idPaciente: number;
  idMedico?: number;
  nombrePaciente?: string;
  nombreMedico?: string;
  estado?: string;
}

const ConsultasManagement: React.FC = () => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState<
    "none" | "view" | "edit" | "create" | "delete"
  >("none");
  const [selected, setSelected] = useState<Consulta | null>(null);
  const [form, setForm] = useState<
    Partial<CreateAppointmentPayload & { id?: number }>
  >({});
  const [notification, setNotification] = useState<null | {
    message: string;
    type: "success" | "error";
  }>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentsService.fetchTodasConsultas();
      const list = Array.isArray(data) ? data : data?.consultas ?? data;
      setConsultas(
        list.map((c: any) => ({
          idConsulta: c.idConsulta ?? c.id_consulta ?? c.id ?? 0,
          fecha: c.fecha ?? c.Fecha ?? "",
          hora: c.hora ?? c.Hora ?? c.time ?? "",
          motivo: c.motivo ?? c.Motivo ?? "",
          diagnostico: c.diagnostico ?? c.Diagnostico ?? "",
          tratamiento: c.tratamiento ?? c.Tratamiento ?? "",
          idPaciente: c.idPaciente ?? c.id_paciente ?? c.id_paciente ?? 0,
          idMedico: c.idMedico ?? c.id_medico ?? null,
          nombrePaciente:
            c.nombrePaciente ?? c.nombrePaciente ?? c.paciente?.nombre ?? "",
          nombreMedico:
            c.nombreMedico ?? c.nombreMedico ?? c.medico?.nombre ?? "",
          estado: c.estado ?? c.Estado ?? undefined,
        }))
      );
    } catch (err: any) {
      setError(err.message || "Error cargando consultas");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ fecha: "", hora: "", motivo: "", idPaciente: 0, idMedico: 0 });
    setShowModal("create");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.idPaciente || !form.fecha || !form.hora || !form.motivo) {
        setNotification({
          message: "Complete los campos obligatorios.",
          type: "error",
        });
        return;
      }
      await appointmentsService.crearCita(form as CreateAppointmentPayload);
      setNotification({ message: "Cita creada.", type: "success" });
      setShowModal("none");
      fetchData();
    } catch (err: any) {
      setNotification({
        message: err.message || "Error creando cita",
        type: "error",
      });
    }
  };

  const openEdit = (c: Consulta) => {
    setSelected(c);
    setForm({
      fecha: c.fecha,
      hora: c.hora,
      motivo: c.motivo,
      diagnostico: c.diagnostico,
      tratamiento: c.tratamiento,
      idPaciente: c.idPaciente,
      idMedico: c.idMedico ?? 0,
      id: c.idConsulta,
    });
    setShowModal("edit");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await appointmentsService.actualizarCita(
        selected.idConsulta,
        form as any
      );
      setNotification({ message: "Cita actualizada.", type: "success" });
      setShowModal("none");
      fetchData();
    } catch (err: any) {
      setNotification({
        message: err.message || "Error actualizando cita",
        type: "error",
      });
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await appointmentsService.eliminarCita(id);
      setNotification({ message: "Cita eliminada.", type: "success" });
      setShowModal("none");
      fetchData();
    } catch (err: any) {
      setNotification({
        message: err.message || "Error eliminando cita",
        type: "error",
      });
    }
  };

  const filtered = consultas.filter((c) => {
    const s = search.toLowerCase();
    return (
      String(c.idConsulta).includes(s) ||
      (c.nombrePaciente || "").toLowerCase().includes(s) ||
      (c.nombreMedico || "").toLowerCase().includes(s) ||
      (c.motivo || "").toLowerCase().includes(s)
    );
  });

  if (loading)
    return (
      <div className="p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#035397]" />
      </div>
    );
  if (error)
    return (
      <div className="p-6 text-center text-red-600">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <div>{error}</div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {notification && (
        <Alert
          type={notification.type === "success" ? "success" : "error"}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="bg-[#035397] text-white rounded-2xl p-6 text-center shadow-xl">
        <h1 className="text-3xl font-bold">GESTIÓN DE CITAS</h1>
        <p className="opacity-90">Crear, editar, ver y eliminar citas</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-3 py-2 border rounded w-full"
            placeholder="Buscar por paciente, médico o motivo"
          />
        </div>
        <button
          onClick={openCreate}
          className="bg-[#035397] text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Cita
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Paciente</th>
                <th className="px-4 py-2">Médico</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Hora</th>
                <th className="px-4 py-2">Motivo</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr
                  key={c.idConsulta || `c-${c.fecha}-${c.idPaciente}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-2 font-mono">{c.idConsulta}</td>
                  <td className="px-4 py-2">
                    {c.nombrePaciente || c.idPaciente}
                  </td>
                  <td className="px-4 py-2">
                    {c.nombreMedico || c.idMedico || "-"}
                  </td>
                  <td className="px-4 py-2">{c.fecha}</td>
                  <td className="px-4 py-2">{c.hora}</td>
                  <td className="px-4 py-2">{c.motivo}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setSelected(c);
                          setShowModal("view");
                        }}
                        className="p-2 rounded text-gray-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 rounded text-gray-600 hover:text-green-700"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(c);
                          setShowModal("delete");
                        }}
                        className="p-2 rounded text-gray-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals: create / edit / view / delete */}
      {showModal === "create" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Crear cita</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Paciente (id)</label>
                <input
                  type="number"
                  value={form.idPaciente || 0}
                  onChange={(e) =>
                    setForm({ ...form, idPaciente: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Médico (id)</label>
                <input
                  type="number"
                  value={form.idMedico || 0}
                  onChange={(e) =>
                    setForm({ ...form, idMedico: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha || ""}
                    onChange={(e) =>
                      setForm({ ...form, fecha: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora</label>
                  <input
                    type="time"
                    value={form.hora || ""}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Motivo</label>
                <textarea
                  value={form.motivo || ""}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal("none")}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#035397] text-white rounded"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === "edit" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Editar cita</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Paciente (id)</label>
                <input
                  type="number"
                  value={form.idPaciente || 0}
                  onChange={(e) =>
                    setForm({ ...form, idPaciente: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Médico (id)</label>
                <input
                  type="number"
                  value={form.idMedico || 0}
                  onChange={(e) =>
                    setForm({ ...form, idMedico: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    value={form.fecha || ""}
                    onChange={(e) =>
                      setForm({ ...form, fecha: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hora</label>
                  <input
                    type="time"
                    value={form.hora || ""}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Motivo</label>
                <textarea
                  value={form.motivo || ""}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal("none")}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#035397] text-white rounded"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === "view" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Ver cita</h2>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Paciente:</strong>{" "}
                {selected.nombrePaciente || selected.idPaciente}
              </div>
              <div>
                <strong>Médico:</strong>{" "}
                {selected.nombreMedico || selected.idMedico || "-"}
              </div>
              <div>
                <strong>Fecha:</strong> {selected.fecha}
              </div>
              <div>
                <strong>Hora:</strong> {selected.hora}
              </div>
              <div>
                <strong>Motivo:</strong> {selected.motivo}
              </div>
              <div>
                <strong>Diagnóstico:</strong> {selected.diagnostico}
              </div>
              <div>
                <strong>Tratamiento:</strong> {selected.tratamiento}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal("none")}
                className="px-4 py-2 bg-[#035397] text-white rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "delete" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Eliminar cita</h2>
            <p>
              ¿Seguro que desea eliminar la cita de{" "}
              <strong>{selected.nombrePaciente}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowModal("none")}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(selected.idConsulta)}
                className="px-4 py-2 bg-red-600 text-white rounded"
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

export default ConsultasManagement;
