import React, { useEffect, useMemo, useState } from "react";
import { appointmentsService } from "../../services/appointmentsService";
import { getAuthHeaders, safeFetch } from "../../services/apiClient";
import Alert from "../common/Alert";
import {
  User2,
  Stethoscope,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { getCurrentUserEmpleadoId } from "../../services/auth";

interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
}
interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  especialidad?: string;
  estado?: string; // "Activo" | "Inactivo" | etc.
}
type Consulta = {
  id: number;
  idPaciente: number;
  idMedico: number;
  fecha: string; // ISO o YYYY-MM-DD
  hora?: string; // HH:mm (si viene separado)
  motivo?: string;
  diagnostico?: string;
  tratamiento?: string;
  estado?: string;
};

type ModalKind = "none" | "create" | "edit" | "delete";
const idMedico = getCurrentUserEmpleadoId(); // number | null

const AppointmentsWithModals: React.FC = () => {

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsultas, setLoadingConsultas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultaError, setConsultaError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // ---------- Modal state ----------
  const [modal, setModal] = useState<ModalKind>("none");
  const [selected, setSelected] = useState<Consulta | null>(null);

  // ---------- Form (para create/edit) ----------
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    id_paciente: "",
    id_medico: "",
    fecha: "",
    hora: "",
    motivo: "",
    diagnostico: "",
    tratamiento: "",
  });

  // ======== LOADERS ========

  const fetchLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();

      const [pacResp, medResp] = await Promise.all([
        safeFetch(`/pacientes`, { method: "GET", headers }),
        safeFetch(`/medicos`, { method: "GET", headers }),
      ]);

      if (!pacResp.ok) throw new Error(`Pacientes ${pacResp.status}`);
      if (!medResp.ok) throw new Error(`Medicos ${medResp.status}`);

      const pacJson = await pacResp.json();
      const medJson = await medResp.json();

      const pacArray = Array.isArray(pacJson) ? pacJson : pacJson?.pacientes ?? [];
      const medArray = Array.isArray(medJson) ? medJson : medJson?.medicos ?? [];

      setPacientes(
        pacArray.map((p: any, idx: number) => {
          const id = Number(
            p.idPaciente ??
              p.id_paciente ??
              p.id ??
              p.idPaciente ??
              p.id ??
              idx + 1
          );
          return {
            id,
            nombre: p.nombre ?? p.nombres ?? p.nombrePaciente ?? "Paciente",
            apellido: p.apellido ?? p.apellidos ?? "",
          } as Paciente;
        })
      );

      setMedicos(
        medArray.map((m: any, idx: number) => {
          const id = Number(m.idMedico ?? m.id_medico ?? m.id ?? idx + 1);
          const rawEstado =
            m.estado ??
            m.estatus ??
            m.status ??
            (typeof m.activo === "boolean"
              ? m.activo
                ? "Activo"
                : "Inactivo"
              : undefined) ??
            (m.activo === 1
              ? "Activo"
              : m.activo === 0
              ? "Inactivo"
              : undefined);

          return {
            id,
            nombre: m.nombre ?? m.nombres ?? m.nombreMedico ?? "Médico",
            apellido: m.apellido ?? m.apellidos ?? "",
            especialidad: m.especialidad ?? m.nombreEspecialidad ?? "",
            estado: rawEstado ?? "Activo",
          } as Medico;
        })
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ||
          "No se pudieron cargar médicos o pacientes. Revise el servidor y su sesión."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultas = async () => {
    setLoadingConsultas(true);
    setConsultaError(null);
    try {
      const headers = getAuthHeaders();
      let data: any = null;

      if ((appointmentsService as any)?.listarCitas) {
        data = await (appointmentsService as any).listarCitas();
      } else if ((appointmentsService as any)?.getAll) {
        data = await (appointmentsService as any).getAll();
      } else {
        // Fallbacks comunes
        let res = await safeFetch(`/consultas/medico/${idMedico}`, { headers });
        if (!res.ok) {
          res = await safeFetch("/citas", { headers });
        }
        if (!res.ok) throw new Error("No se pudo obtener el listado de consultas.");
        data = await res.json();
      }

      const arr = Array.isArray(data) ? data : data?.consultas ?? data?.citas ?? [];
      setConsultas(
        arr.map((c: any, idx: number): Consulta => ({
          id: Number(c.idConsulta ?? c.id_cita ?? c.id ?? idx + 1),
          idPaciente: Number(
            c.idPaciente ?? c.id_paciente ?? c.pacienteId ?? c.paciente?.id ?? 0
          ),
          idMedico: Number(
            c.idMedico ?? c.id_medico ?? c.medicoId ?? c.medico?.id ?? 0
          ),
          fecha: c.fecha ?? c.fechaHora ?? c.date ?? c.createdAt ?? "",
          hora: c.hora ?? c.time ?? "",
          motivo: c.motivo ?? c.razon ?? c.motivoConsulta ?? "",
          diagnostico: c.diagnostico ?? c.diagnosis ?? "",
          tratamiento: c.tratamiento ?? c.treatment ?? "",
          estado: c.estado ?? c.estatus ?? c.status ?? "Pendiente",
        }))
      );
    } catch (e: any) {
      setConsultaError(e?.message || "Error cargando consultas.");
    } finally {
      setLoadingConsultas(false);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchConsultas();
  }, []);

  // ======== UTILS ========

  const pacientesById = useMemo(
    () => new Map(pacientes.map((p) => [p.id, p] as const)),
    [pacientes]
  );
  const medicosById = useMemo(
    () => new Map(medicos.map((m) => [m.id, m] as const)),
    [medicos]
  );

  const fmtFecha = (v?: string) => {
    if (!v) return "-";
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString();
  };
  const fmtHora = (f?: string, h?: string) => {
    if (h) return h;
    if (!f) return "-";
    const d = new Date(f);
    return isNaN(d.getTime())
      ? h || "-"
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const medicosHabilitados = useMemo<Medico[]>(() => {

    return medicos.filter((m) => {
      const normalized = String(
        typeof m.estado === "boolean"
          ? m.estado
            ? "Activo"
            : "Inactivo"
          : m.estado ?? "Activo"
      ).toLowerCase();

      return (
        normalized === "activo" ||
        normalized === "habilitado" ||
        normalized === "true" ||
        normalized === "1"
      );
    });
  }, [medicos]);

  // ======== FORMS ========

  const openCreate = () => {
    setSelected(null);
    setForm({
      id_paciente: "",
      id_medico: "",
      fecha: "",
      hora: "",
      motivo: "",
      diagnostico: "",
      tratamiento: "",
    });
    setFieldErrors({});
    setModal("create");
  };

  const openEdit = (c: Consulta) => {
    setSelected(c);
    setForm({
      id_paciente: String(c.idPaciente ?? ""),
      id_medico: String(c.idMedico ?? ""),
      fecha: (c.fecha || "").slice(0, 10), // si viene ISO, corta YYYY-MM-DD
      hora: c.hora ?? "", // si no tienes hora separada, puedes extraer de fecha si lo necesitas
      motivo: c.motivo ?? "",
      diagnostico: c.diagnostico ?? "",
      tratamiento: c.tratamiento ?? "",
    });
    setFieldErrors({});
    setModal("edit");
  };

  const openDelete = (c: Consulta) => {
    setSelected(c);
    setModal("delete");
  };

  const closeModal = () => {
    setModal("none");
    setSelected(null);
    setFieldErrors({});
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.id_paciente) errs.id_paciente = "Seleccione un paciente.";
    if (!form.id_medico) errs.id_medico = "Seleccione un médico.";
    if (!form.fecha) errs.fecha = "Seleccione una fecha.";
    if (!form.hora) errs.hora = "Seleccione una hora.";
    if (!form.motivo || String(form.motivo).trim().length < 5)
      errs.motivo = "Ingrese un motivo (mínimo 5 caracteres).";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ======== API HELPERS (defensivos) ========

  const apiCreate = async (payload: any) => {
    if ((appointmentsService as any)?.crearCita) {
      return (appointmentsService as any).crearCita(payload);
    }
    const headers = getAuthHeaders();
    let res = await safeFetch("/consultas", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      res = await safeFetch("/citas", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) throw new Error("No se pudo crear la cita.");
    return res.json?.();
  };

  const apiUpdate = async (id: number, payload: any) => {
    if ((appointmentsService as any)?.actualizarCita) {
      return (appointmentsService as any).actualizarCita(id, payload);
    }
    if ((appointmentsService as any)?.update) {
      return (appointmentsService as any).update(id, payload);
    }
    const headers = getAuthHeaders();
    // PATCH primero
    let res = await safeFetch(`/consultas/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      // PUT fallback
      res = await safeFetch(`/consultas/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) {
      // ruta alternativa /citas/:id
      res = await safeFetch(`/citas/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) {
      res = await safeFetch(`/citas/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) throw new Error("No se pudo actualizar la cita.");
    return res.json?.();
  };

  const apiDelete = async (id: number) => {
    if ((appointmentsService as any)?.eliminarCita) {
      return (appointmentsService as any).eliminarCita(id);
    }
    if ((appointmentsService as any)?.delete) {
      return (appointmentsService as any).delete(id);
    }
    const headers = getAuthHeaders();
    let res = await safeFetch(`/consultas/${id}`, { method: "DELETE", headers });
    if (!res.ok) {
      res = await safeFetch(`/citas/${id}`, { method: "DELETE", headers });
    }
    if (!res.ok) throw new Error("No se pudo eliminar la cita.");
    return res.json?.();
  };

  // ======== SUBMITS ========

  const submitCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const idPacienteNum = parseInt(String(form.id_paciente), 10);
      const idMedicoNum = parseInt(String(form.id_medico), 10);

      const pacienteExists = pacientes.some((p) => p.id === idPacienteNum);
      const medicoExists = medicosHabilitados.some((m) => m.id === idMedicoNum);

      if (!pacienteExists) {
        setNotification({
          type: "error",
          message: "El paciente seleccionado no existe.",
        });
        return;
      }
      if (!medicoExists) {
        setNotification({
          type: "error",
          message: "El médico seleccionado no está habilitado.",
        });
        return;
      }

      const payload = {
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo,
        diagnostico: form.diagnostico ?? "",
        tratamiento: form.tratamiento ?? "",
        id_paciente: idPacienteNum,
        id_medico: idMedicoNum,
      };

      if (modal === "create") {
        await apiCreate(payload);
        setNotification({ type: "success", message: "Cita creada con éxito." });
      } else if (modal === "edit" && selected) {
        await apiUpdate(selected.id, payload);
        setNotification({ type: "success", message: "Cita actualizada." });
      }

      closeModal();
      await fetchConsultas();

    } catch (err: any) {
      console.error(err);
      setNotification({
        type: "error",
        message: err?.message || "Ocurrió un error al guardar.",
      });
    }
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await apiDelete(selected.id);
      setNotification({ type: "success", message: "Cita eliminada." });
      closeModal();
      await fetchConsultas();
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: "error",
        message: err?.message || "No se pudo eliminar la cita.",
      });
    }
  };

  // ======== RENDER ========

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header + botón crear */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Gestión de Citas</h2>
          <p className="text-sm text-gray-600">
            Agenda, edita y elimina citas médicas.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#035397] text-white px-4 py-2 rounded-lg hover:bg-[#034a7a]"
        >
          <Plus className="w-4 h-4" />
          Agendar cita
        </button>
      </div>

      {notification && (
        <Alert
          type={notification.type === "success" ? "success" : "error"}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Tabla de consultas */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Consultas registradas</h3>
            <p className="text-sm text-gray-500">Historial de citas y consultas</p>
          </div>
          <span className="text-sm text-gray-500">{consultas.length} registros</span>
        </div>

        {consultaError && (
          <div className="p-4">
            <Alert
              type="error"
              message={consultaError}
              onClose={() => setConsultaError(null)}
            />
          </div>
        )}

        {loadingConsultas ? (
          <div className="p-6 text-gray-500">Cargando consultas...</div>
        ) : consultas.length === 0 ? (
          <div className="p-6 text-gray-500">No hay consultas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Médico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultas.map((c, idx) => {
                  const pac = pacientesById.get(c.idPaciente);
                  const med = medicosById.get(c.idMedico);
                  const nombrePac = pac
                    ? `${pac.nombre} ${pac.apellido}`
                    : `#${c.idPaciente}`;
                  const nombreMed = med
                    ? `${med.nombre} ${med.apellido}${
                        med.especialidad ? ` • ${med.especialidad}` : ""
                      }`
                    : `#${c.idMedico}`;

                  const estado = (c.estado ?? "").toString().toLowerCase();
                  const isOk =
                    estado === "asistida" ||
                    estado === "realizada" ||
                    estado === "confirmada" ||
                    estado === "completada";

                  return (
                    <tr key={`${c.id}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {fmtFecha(c.fecha)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {fmtHora(c.fecha, c.hora)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {nombrePac}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {nombreMed}
                      </td>
                      <td
                        className="px-6 py-3 text-sm text-gray-700 truncate max-w-[320px]"
                        title={c.motivo || ""}
                      >
                        {c.motivo || "-"}
                      </td>
                      <td className="px-6 py-3">
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(c)}
                            className="inline-flex items-center gap-1 text-green-700 hover:text-green-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== MODALES ===================== */}

      {/* Crear / Editar */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative bg-white w-full max-w-xl mx-4 rounded-2xl shadow-xl">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">
                {modal === "create" ? "Agendar nueva cita" : "Editar cita"}
              </h3>
              <p className="text-sm text-gray-500">
                Completa los datos. Los campos con * son obligatorios.
              </p>
            </div>

            <form onSubmit={submitCreateOrEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paciente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <User2 className="w-4 h-4 text-gray-500" /> Paciente{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    name="id_paciente"
                    value={form.id_paciente}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border ${
                      fieldErrors.id_paciente
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">-- Seleccione paciente --</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {`${p.nombre} ${p.apellido}`}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.id_paciente && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.id_paciente}
                    </p>
                  )}
                </div>

                {/* Médico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-gray-500" /> Médico{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <select
                    name="id_medico"
                    value={form.id_medico}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border ${
                      fieldErrors.id_medico
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">Seleccione médico </option>
                    {medicosHabilitados.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {`${m.nombre} ${m.apellido}${
                          m.especialidad ? ` - ${m.especialidad}` : ""
                        }`}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.id_medico && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.id_medico}
                    </p>
                  )}
                </div>
              </div>

              {/* Fecha / Hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" /> Fecha{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    name="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border ${
                      fieldErrors.fecha ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {fieldErrors.fecha && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.fecha}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" /> Hora{" "}
                      <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    name="hora"
                    type="time"
                    value={form.hora}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border ${
                      fieldErrors.hora ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {fieldErrors.hora && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.hora}
                    </p>
                  )}
                </div>
              </div>

              {/* Motivo / Diagnóstico / Tratamiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Motivo <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="motivo"
                  value={form.motivo}
                  onChange={handleChange}
                  rows={3}
                  className={`mt-1 block w-full rounded-md border ${
                    fieldErrors.motivo ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="Describa brevemente el motivo de la consulta"
                />
                {fieldErrors.motivo && (
                  <p className="text-xs text-red-600 mt-1">
                    {fieldErrors.motivo}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Diagnóstico
                  </label>
                  <textarea
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="(opcional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tratamiento
                  </label>
                  <textarea
                    name="tratamiento"
                    value={form.tratamiento}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300"
                    placeholder="(opcional)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#035397] text-white hover:bg-[#034a7a]"
                >
                  {modal === "create" ? "Crear cita" : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsWithModals;
