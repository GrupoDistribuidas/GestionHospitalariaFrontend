import React, { useEffect, useMemo, useState } from "react";
import { appointmentsService } from "../../services/appointmentsService";
import { getAuthHeaders, safeFetch } from "../../services/apiClient";
import Alert from "../common/Alert";
import { User2, Stethoscope, Calendar, Clock } from "lucide-react";

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
  estado?: string;
}

const CreateAppointment: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // keep select values as strings to avoid React NaN warnings; convert on submit
  const [form, setForm] = useState({
    id_paciente: "",
    id_medico: "",
    fecha: "",
    hora: "",
    motivo: "",
    diagnostico: "",
    tratamiento: "",
  });

  useEffect(() => {
    
    const fetchLists = async () => {
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

        console.debug(
          "/pacientes raw response sample:",
          Array.isArray(pacJson)
            ? pacJson.slice(0, 3)
            : pacJson?.pacientes?.slice(0, 3)
        );
        console.debug(
          "/medicos raw response sample:",
          Array.isArray(medJson)
            ? medJson.slice(0, 3)
            : medJson?.medicos?.slice(0, 3)
        );

        // pacJson could be an array or an object with pacientes field
        const pacArray = Array.isArray(pacJson)
          ? pacJson
          : pacJson?.pacientes ?? [];

        const medArray = Array.isArray(medJson)
          ? medJson
          : medJson?.medicos ?? [];

        // normalize shape defensively and coerce ids to numbers
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
            // normalizamos el estado con varios posibles nombres/códigos
            const rawEstado =
              m.estado ??
              m.estatus ??
              m.status ??
              (typeof m.activo === "boolean" ? (m.activo ? "Activo" : "Inactivo") : undefined) ??
              (m.activo === 1 ? "Activo" : m.activo === 0 ? "Inactivo" : undefined);

            return {
              id,
              nombre: m.nombre ?? m.nombres ?? m.nombreMedico ?? "Médico",
              apellido: m.apellido ?? m.apellidos ?? "",
              especialidad: m.especialidad ?? m.nombreEspecialidad ?? "",
              estado: rawEstado ?? "Activo",
            } as Medico;
          })
        );

        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(
          "No se pudieron cargar médicos o pacientes. Revise el servidor y su sesión."
        );
        setLoading(false);
      }
    };

    fetchLists();
  }, []);
  

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // keep as string for selects to avoid NaN React warnings
    setForm((s) => ({ ...s, [name]: value }));
    // clear field error while typing
    setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  const selectedPaciente = useMemo(
    () => pacientes.find((p) => String(p.id) === String(form.id_paciente)),
    [pacientes, form.id_paciente]
  );

  const selectedMedico = useMemo(
    () => medicos.find((m) => String(m.id) === String(form.id_medico)),
    [medicos, form.id_medico]
  );
  const medicosHabilitados = useMemo<Medico[]>(() => {
    return medicos.filter((m) => {
      const normalized = String(
        typeof m.estado === "boolean"
          ? m.estado ? "Activo" : "Inactivo"
          : m.estado ?? "Activo"
      ).toLowerCase();

      // acepta varias convenciones de backend
      return (
        normalized === "activo" ||
        normalized === "habilitado" ||
        normalized === "true" ||
        normalized === "1"
      );
    });
  }, [medicos]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // client-side validations
    const errs: Record<string, string> = {};
    if (!form.id_paciente) errs.id_paciente = "Seleccione un paciente.";
    if (!form.id_medico) errs.id_medico = "Seleccione un médico.";
    if (!form.fecha) errs.fecha = "Seleccione una fecha.";
    if (!form.hora) errs.hora = "Seleccione una hora.";
    if (!form.motivo || String(form.motivo).trim().length < 5)
      errs.motivo = "Ingrese un motivo (mínimo 5 caracteres).";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError("Por favor corrija los campos marcados.");
      return;
    }

    try {
      // validate and convert ids
      const idPacienteNum = parseInt(String(form.id_paciente), 10);
      const idMedicoNum = parseInt(String(form.id_medico), 10);

      if (!idPacienteNum || !idMedicoNum) {
        setError("Debe seleccionar un paciente y un médico válidos.");
        return;
      }

      // verify selected ids exist in loaded lists to avoid sending wrong ids
      const pacienteExists = pacientes.some((p) => p.id === idPacienteNum);
      const medicoExists = medicos.some((m) => m.id === idMedicoNum);

      if (!pacienteExists) {
        setError(
          "El paciente seleccionado no existe en la lista. Revise la selección."
        );
        console.debug("Paciente no encontrado localmente:", {
          idPacienteNum,
          pacientes,
        });
        return;
      }

      if (!medicoExists) {
        setError(
          "El médico seleccionado no existe en la lista. Revise la selección."
        );
        console.debug("Médico no encontrado localmente:", {
          idMedicoNum,
          medicos,
        });
        return;
      }

      const pacienteSeleccionado = pacientes.find(
        (p) => p.id === idPacienteNum
      );
      const medicoSeleccionado = medicos.find((m) => m.id === idMedicoNum);

      const payload = {
        fecha: form.fecha,
        hora: form.hora,
        motivo: form.motivo,
        diagnostico: form.diagnostico ?? "",
        tratamiento: form.tratamiento ?? "",
        idPaciente: idPacienteNum,
        idMedico: idMedicoNum,
      };

      console.debug("Creando cita - payload:", payload, {
        pacienteSeleccionado,
        medicoSeleccionado,
      });

      // No hacemos pre-checks al servidor (evita llamar endpoints individuales que producen 500).
      // Enviamos el POST y delegamos la validación final al backend.
      await appointmentsService.crearCita(payload);

      setNotification({ message: "Cita creada con éxito.", type: "success" });
      // reset form
      setForm({
        id_paciente: "",
        id_medico: "",
        fecha: "",
        hora: "",
        motivo: "",
        diagnostico: "",
        tratamiento: "",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error creando la cita");
      setNotification({
        message: err.message || "Error creando la cita",
        type: "error",
      });
    }
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-[#035397] text-white p-2">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Agendar nueva cita</h2>
            <p className="text-sm text-gray-600 mt-1">
              Completa los datos de la cita. Los campos marcados con * son
              obligatorios.
            </p>
          </div>
        </div>

        {notification && (
          <div className="mt-4">
            <Alert
              type={notification.type === "success" ? "success" : "error"}
              message={notification.message}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {error && (
          <div className="mt-2">
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`mt-1 block w-full rounded-md border ${fieldErrors.id_paciente ? "border-red-300" : "border-gray-300"
                  }`}
                aria-invalid={!!fieldErrors.id_paciente}
              >
                <option value="">-- Seleccione paciente --</option>
                {pacientes.map((p) => (
                  <option
                    key={p.id ?? `pac-${p.nombre}`}
                    value={String(p.id)}
                  >{`${p.nombre} ${p.apellido}`}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Si el paciente no aparece, regístrelo primero en Pacientes.
              </p>
              {fieldErrors.id_paciente && (
                <p className="text-xs text-red-600 mt-1">
                  {fieldErrors.id_paciente}
                </p>
              )}
            </div>

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
                className={`mt-1 block w-full rounded-md border ${fieldErrors.id_medico ? "border-red-300" : "border-gray-300"
                  }`}
                aria-invalid={!!fieldErrors.id_medico}
              >
                <option value="">-- Seleccione médico --</option>
                {medicosHabilitados.map((m) => (
                  <option key={m.id ?? `med-${m.nombre}`} value={String(m.id)}>
                    {`${m.nombre} ${m.apellido}${m.especialidad ? ` - ${m.especialidad}` : ""}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Solo se muestran médicos habilitados.
              </p>
              {fieldErrors.id_medico && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.id_medico}</p>
              )}
            </div>
          </div>

          {/* Selected preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200">
                  <User2 className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Paciente seleccionado
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedPaciente
                      ? `${selectedPaciente.nombre} ${selectedPaciente.apellido}`
                      : "Ninguno"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center ring-1 ring-gray-200">
                  <Stethoscope className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Médico seleccionado
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedMedico
                      ? `${selectedMedico.nombre} ${selectedMedico.apellido}${selectedMedico.especialidad
                        ? ` • ${selectedMedico.especialidad}`
                        : ""
                      }`
                      : "Ninguno"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className={`mt-1 block w-full rounded-md border ${fieldErrors.fecha ? "border-red-300" : "border-gray-300"
                  }`}
              />
              {fieldErrors.fecha && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.fecha}</p>
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
                className={`mt-1 block w-full rounded-md border ${fieldErrors.hora ? "border-red-300" : "border-gray-300"
                  }`}
              />
              {fieldErrors.hora && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.hora}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              rows={3}
              className={`mt-1 block w-full rounded-md border ${fieldErrors.motivo ? "border-red-300" : "border-gray-300"
                }`}
              placeholder="Describa brevemente el motivo de la consulta"
            />
            {fieldErrors.motivo && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.motivo}</p>
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

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() =>
                setForm({
                  id_paciente: "",
                  id_medico: "",
                  fecha: "",
                  hora: "",
                  motivo: "",
                  diagnostico: "",
                  tratamiento: "",
                })
              }
              className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="bg-[#035397] text-white px-4 py-2 rounded hover:bg-[#034a7a]"
              disabled={loading}
            >
              Crear cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAppointment;
