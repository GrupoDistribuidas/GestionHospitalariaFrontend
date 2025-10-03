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
import CreateAppointment from "./CreateAppointment";
import { safeFetch, getAuthHeaders } from "../../services/apiClient";

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
  const [pacienteOptions, setPacienteOptions] = useState<
    Array<{ id: number; label: string }>
  >([]);
  const [medicoOptions, setMedicoOptions] = useState<
    Array<{ id: number; label: string }>
  >([]);
  // pacientes/medicos se resuelven a través de mapas temporales en fetchData

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // fetch consultas, pacientes y medicos en paralelo
      const headers = getAuthHeaders();
      const [consRes, pacRes, medRes] = await Promise.all([
        safeFetch(`/consultas`, { method: "GET", headers }),
        safeFetch(`/pacientes`, { method: "GET", headers }),
        safeFetch(`/medicos`, { method: "GET", headers }),
      ]);

      if (!consRes.ok) {
        const t = await consRes.text();
        throw new Error(`Error cargando consultas: ${consRes.status} ${t}`);
      }

      const data = await consRes.json();
      const list = Array.isArray(data) ? data : data?.consultas ?? data;

      // parse pacientes
      let pacArray: any[] = [];
      if (pacRes && pacRes.ok) {
        const pjson = await pacRes.json();
        pacArray = Array.isArray(pjson) ? pjson : pjson?.pacientes ?? [];
      }

      // parse medicos
      let medArray: any[] = [];
      if (medRes && medRes.ok) {
        const mjson = await medRes.json();
        medArray = Array.isArray(mjson) ? mjson : mjson?.medicos ?? [];
      }

      const pacienteMap = new Map<number, string>();
      const pacienteOpts: Array<{ id: number; label: string }> = [];
      pacArray.forEach((p: any) => {
        const id = Number(
          p.idPaciente ??
            p.id_paciente ??
            p.pacienteId ??
            p.paciente_id ??
            p.id ??
            p.idEmpleado ??
            p.id_empleado ??
            0
        );
        const name = `${
          p.nombre ??
          p.nombres ??
          p.nombrePaciente ??
          p.fullName ??
          p.nombreCompleto ??
          ""
        } ${p.apellido ?? p.apellidos ?? ""}`.trim();
        if (id) pacienteMap.set(id, name || String(id));
        if (id) pacienteOpts.push({ id, label: name || String(id) });
      });

      const medicoMap = new Map<number, string>();
      const medicoOpts: Array<{ id: number; label: string }> = [];
      medArray.forEach((m: any) => {
        const id = Number(
          m.idMedico ??
            m.id_medico ??
            m.medicoId ??
            m.medico_id ??
            m.id ??
            m.idEmpleado ??
            m.id_empleado ??
            m.empleado?.idEmpleado ??
            m.empleado?.id ??
            0
        );
        const emp = m.empleado ?? m.persona ?? m.profile ?? null;
        const name = `${
          m.nombre ??
          m.nombres ??
          m.nombreMedico ??
          emp?.nombre ??
          emp?.nombres ??
          emp?.firstName ??
          m.fullName ??
          ""
        } ${
          m.apellido ??
          m.apellidos ??
          emp?.apellido ??
          emp?.apellidos ??
          emp?.lastName ??
          ""
        }`.trim();
        if (id) medicoMap.set(id, name || String(id));
        if (id) medicoOpts.push({ id, label: name || String(id) });
      });

      const normalizePersonName = (obj: any) => {
        if (!obj) return undefined;
        const name =
          obj.nombre ??
          obj.nombres ??
          obj.nombrePaciente ??
          obj.nombreCompleto ??
          obj.firstName ??
          obj.first_name;
        const last =
          obj.apellido ??
          obj.apellidos ??
          obj.apellidoPaciente ??
          obj.lastName ??
          obj.last_name;
        if (name && last) return `${name} ${last}`.trim();
        if (name) return String(name).trim();
        if (obj.fullName) return obj.fullName;
        if (obj.nombreCompleto) return obj.nombreCompleto;
        return undefined;
      };

      const extractPersonName = (obj: any) => {
        if (!obj) return undefined;
        // common direct properties
        const name =
          obj.nombre ??
          obj.nombres ??
          obj.firstName ??
          obj.fullName ??
          obj.nombreCompleto;
        const last =
          obj.apellido ?? obj.apellidos ?? obj.lastName ?? obj.last_name;
        if (name && last) return `${name} ${last}`.trim();
        if (name) return String(name).trim();

        // nested common structures
        const nested =
          obj.persona ??
          obj.usuario ??
          obj.profile ??
          obj.paciente ??
          obj.person;
        if (nested) return extractPersonName(nested);

        // other heuristics: try keys that include name fields
        for (const key of Object.keys(obj)) {
          if (
            /name|nombre|nombreCompleto|fullName/i.test(key) &&
            typeof obj[key] === "string"
          ) {
            return obj[key];
          }
        }

        return undefined;
      };

      setPacienteOptions(pacienteOpts);
      setMedicoOptions(medicoOpts);

      const detectId = (obj: any): number | undefined => {
        if (!obj) return undefined;
        const tryNumber = (v: any) => {
          if (v === null || v === undefined) return undefined;
          const n = Number(v);
          if (!Number.isFinite(n) || n <= 0) return undefined;
          return n;
        };

        // direct known fields
        const direct = [
          obj.idConsulta,
          obj.id_consulta,
          obj.id,
          obj.consultaId,
          obj.consulta_id,
          obj.Id,
          obj.IdConsulta,
          obj.Id_consulta,
        ];
        for (const d of direct) {
          const n = tryNumber(d);
          if (n) return n;
        }

        // check nested common containers
        const nestedKeys = [
          "consulta",
          "Consulta",
          "data",
          "Data",
          "result",
          "Result",
        ];
        for (const k of nestedKeys) {
          const v = obj[k];
          if (v && typeof v === "object") {
            const fromNested = detectId(v);
            if (fromNested) return fromNested;
          }
        }

        // heuristic: scan top-level keys for anything with 'id' in its name
        for (const key of Object.keys(obj)) {
          try {
            if (/id/i.test(key)) {
              const n = tryNumber((obj as any)[key]);
              if (n) return n;
            }
          } catch (e) {
            continue;
          }
        }

        return undefined;
      };

      setConsultas(
        list.map((c: any) => {
          const rawPaciente = c.paciente ?? c.Paciente ?? c.patient ?? null;
          const rawMedico = c.medico ?? c.Medico ?? c.doctor ?? null;

          // Robust paciente id extraction: handle multiple possible shapes
          const tryParseId = (v: any): number | undefined => {
            if (v === null || v === undefined) return undefined;
            if (typeof v === "number")
              return Number.isFinite(v) && v > 0 ? v : undefined;
            if (typeof v === "string") {
              const n = Number(v);
              return Number.isFinite(n) && n > 0 ? n : undefined;
            }
            return undefined;
          };

          const pacienteCandidates = [
            c.idPaciente,
            c.id_paciente,
            c.pacienteId,
            c.paciente_id,
            rawPaciente?.id,
            rawPaciente?.idPaciente,
            rawPaciente?.id_empleado,
            rawPaciente?.idEmpleado,
            rawPaciente, // could be a raw number/string representing the id
          ];
          let pacienteId: number | undefined = undefined;
          for (const cand of pacienteCandidates) {
            const n = tryParseId(cand);
            if (n) {
              pacienteId = n;
              break;
            }
          }

          const medicoCandidates = [
            c.idMedico,
            c.id_medico,
            c.medicoId,
            c.medico_id,
            rawMedico?.id,
            rawMedico?.idMedico,
            rawMedico?.id_empleado,
            rawMedico?.idEmpleado,
            rawMedico?.empleado?.idEmpleado,
            rawMedico?.empleado?.id,
            rawMedico, // could be a raw number/string
          ];
          let medicoId: number | undefined = undefined;
          for (const cand of medicoCandidates) {
            const n = tryParseId(cand);
            if (n) {
              medicoId = n;
              break;
            }
          }

          // detect idConsulta robustly
          const idFromDetect = detectId(c);
          const idConsulta =
            idFromDetect ??
            (Number(c.idConsulta ?? c.id_consulta ?? c.id) || undefined);

          let nombrePaciente =
            (pacienteId && pacienteMap.get(pacienteId as number)) ??
            c.nombrePaciente ??
            c.pacienteNombre ??
            normalizePersonName(rawPaciente) ??
            (rawPaciente?.nombre
              ? `${rawPaciente.nombre} ${rawPaciente.apellido || ""}`.trim()
              : undefined) ??
            undefined;

          // fallback: try to extract from nested shapes if still missing
          if (!nombrePaciente) {
            nombrePaciente =
              extractPersonName(rawPaciente) ??
              extractPersonName(c) ??
              undefined;
          }

          const nombreMedico =
            (medicoId && medicoMap.get(medicoId as number)) ??
            c.nombreMedico ??
            c.medicoNombre ??
            normalizePersonName(rawMedico) ??
            (rawMedico?.nombre
              ? `${rawMedico.nombre} ${rawMedico.apellido || ""}`.trim()
              : undefined) ??
            undefined;

          return {
            idConsulta: idConsulta,
            fecha: c.fecha ?? c.Fecha ?? "",
            hora: c.hora ?? c.Hora ?? c.time ?? "",
            motivo: c.motivo ?? c.Motivo ?? "",
            diagnostico: c.diagnostico ?? c.Diagnostico ?? "",
            tratamiento: c.tratamiento ?? c.Tratamiento ?? "",
            idPaciente: pacienteId,
            idMedico: medicoId,
            nombrePaciente: nombrePaciente,
            nombreMedico: nombreMedico,
          } as Consulta;
        })
      );
    } catch (err: any) {
      setError(err.message || "Error cargando consultas");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({
      fecha: "",
      hora: "",
      motivo: "",
      idPaciente: undefined,
      idMedico: undefined,
    });
    setShowModal("create");
  };

  // Creation is handled by CreateAppointment component via its onSuccess callback

  const openEdit = (c: Consulta) => {
    setSelected(c);
    setForm({
      fecha: c.fecha,
      hora: c.hora,
      motivo: c.motivo,
      diagnostico: c.diagnostico,
      tratamiento: c.tratamiento,
      idPaciente: c.idPaciente,
      idMedico: c.idMedico ?? undefined,
      id: c.idConsulta,
    });
    setShowModal("edit");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const idPacienteValid =
        typeof form.idPaciente === "number" && form.idPaciente > 0;
      if (!idPacienteValid) {
        setNotification({
          message: "Seleccione un paciente válido.",
          type: "error",
        });
        return;
      }
      const res = await appointmentsService.actualizarCita(
        selected.idConsulta,
        form as any
      );
      const updatedId =
        res?.idConsulta ?? res?.id_consulta ?? res?.id ?? selected.idConsulta;
      setNotification({
        message: `Cita actualizada${updatedId ? ` (ID: ${updatedId})` : ""}.`,
        type: "success",
      });
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

  const isValidId = (id: any) =>
    typeof id === "number" && !Number.isNaN(id) && id > 0;

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
                <th className="px-4 py-2">Diagnóstico</th>
                <th className="px-4 py-2">Tratamiento</th>

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
                  <td className="px-4 py-2 max-w-xs truncate">
                    {c.diagnostico || "-"}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">
                    {c.tratamiento || "-"}
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!isValidId(c.idConsulta)) {
                            setNotification({
                              message: "Id de consulta inválido.",
                              type: "error",
                            });
                            return;
                          }
                          setSelected(c);
                          setShowModal("view");
                        }}
                        className={`p-2 rounded text-gray-600 ${
                          isValidId(c.idConsulta)
                            ? "hover:text-blue-700 cursor-pointer"
                            : "opacity-50"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!isValidId(c.idConsulta)) {
                            setNotification({
                              message: "Id de consulta inválido.",
                              type: "error",
                            });
                            return;
                          }
                          openEdit(c);
                        }}
                        className={`p-2 rounded text-gray-600 ${
                          isValidId(c.idConsulta)
                            ? "hover:text-green-700 cursor-pointer"
                            : "opacity-50"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!isValidId(c.idConsulta)) {
                            setNotification({
                              message: "Id de consulta inválido.",
                              type: "error",
                            });
                            return;
                          }
                          setSelected(c);
                          setShowModal("delete");
                        }}
                        className={`p-2 rounded text-gray-600 ${
                          isValidId(c.idConsulta)
                            ? "hover:text-red-700 cursor-pointer"
                            : "opacity-50"
                        }`}
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
            <CreateAppointment
              onSuccess={(res) => {
                const newId =
                  res?.idConsulta ??
                  res?.id_consulta ??
                  res?.id ??
                  res?.Id ??
                  res?.IdConsulta ??
                  undefined;
                setNotification({
                  message: `Cita creada${newId ? ` (ID: ${newId})` : ""}.`,
                  type: "success",
                });
                setShowModal("none");
                fetchData();
              }}
            />
          </div>
        </div>
      )}

      {showModal === "edit" && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Editar cita</h2>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Paciente</label>
                <select
                  value={form.idPaciente ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, idPaciente: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">-- Seleccione paciente --</option>
                  {pacienteOptions.map((p) => (
                    <option key={`p-edit-${p.id}`} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Médico</label>
                <select
                  value={form.idMedico ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, idMedico: Number(e.target.value) })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Opcional: seleccione médico --</option>
                  {medicoOptions.map((m) => (
                    <option key={`m-edit-${m.id}`} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
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
              <div>
                <label className="text-sm font-medium">Diagnóstico</label>
                <textarea
                  value={(form as any).diagnostico || ""}
                  onChange={(e) =>
                    setForm({ ...form, diagnostico: e.target.value } as any)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tratamiento</label>
                <textarea
                  value={(form as any).tratamiento || ""}
                  onChange={(e) =>
                    setForm({ ...form, tratamiento: e.target.value } as any)
                  }
                  className="w-full p-2 border rounded"
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
            <h2 className="text-lg font-semibold mb-2">Ver cita</h2>
            <div className="text-sm text-gray-600 mb-3">
              ID: {selected.idConsulta}
            </div>
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
