import { getAuthHeaders, safeFetch } from "./apiClient";

export interface CreateAppointmentPayload {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:mm
  motivo: string;
  diagnostico?: string;
  tratamiento?: string;
  idPaciente: number;
  idMedico: number;
}

class AppointmentsService {
  private headers() {
    return getAuthHeaders("application/json");
  }

  async crearCita(payload: CreateAppointmentPayload) {
    console.debug(
      "appointmentsService.crearCita: POST /consultas payload=",
      payload
    );
    // Build a defensive body including multiple naming variants so the API Gateway
    // (which binds to generated gRPC/Protobuf request types) receives the ids
    // regardless of whether it expects snake_case, camelCase or PascalCase.
    const bodyToSend = {
      // original fields as expected by proto (some backends/libraries use snake_case)
      id_paciente: (payload as any).idPaciente ?? (payload as any).id_paciente,
      id_medico: (payload as any).idMedico ?? (payload as any).id_medico,

      // camelCase (common for JS -> .NET binding)
      idPaciente: (payload as any).idPaciente ?? (payload as any).id_paciente,
      idMedico: (payload as any).idMedico ?? (payload as any).id_medico,

      // PascalCase (how C# properties are named)
      IdPaciente: (payload as any).idPaciente ?? (payload as any).id_paciente,
      IdMedico: (payload as any).idMedico ?? (payload as any).id_medico,

      // include the rest of the fields
      fecha: payload.fecha,
      hora: payload.hora,
      motivo: payload.motivo,
      diagnostico: (payload as any).diagnostico ?? "",
      tratamiento: (payload as any).tratamiento ?? "",
    };

    const res = await safeFetch(`/consultas`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(bodyToSend),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error creando cita: ${res.status} ${text}`);
    }

    return res.json();
  }

  async fetchTodasConsultas() {
    const res = await safeFetch(`/consultas`, {
      method: "GET",
      headers: this.headers(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error cargando consultas: ${res.status} ${text}`);
    }

    return res.json();
  }

  async fetchConsultaById(id: number) {
    if (!id || id <= 0) throw new Error(`Consulta id inválido: ${id}`);
    const res = await safeFetch(`/consultas/${id}`, {
      method: "GET",
      headers: this.headers(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error cargando consulta ${id}: ${res.status} ${text}`);
    }

    return res.json();
  }

  async actualizarCita(id: number, payload: Partial<CreateAppointmentPayload>) {
    if (!id || id <= 0) throw new Error(`Consulta id inválido: ${id}`);
    const bodyToSend: any = {
      fecha: payload.fecha,
      hora: payload.hora,
      motivo: payload.motivo,
      diagnostico: payload.diagnostico ?? "",
      tratamiento: payload.tratamiento ?? "",
      idPaciente: payload.idPaciente,
      idMedico: payload.idMedico,
    };

    const res = await safeFetch(`/consultas/${id}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(bodyToSend),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error actualizando cita ${id}: ${res.status} ${text}`);
    }

    return res.json();
  }

  async eliminarCita(id: number) {
    if (!id || id <= 0) throw new Error(`Consulta id inválido: ${id}`);
    const res = await safeFetch(`/consultas/${id}`, {
      method: "DELETE",
      headers: this.headers(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error eliminando cita ${id}: ${res.status} ${text}`);
    }

    return res.json();
  }
}

export const appointmentsService = new AppointmentsService();
