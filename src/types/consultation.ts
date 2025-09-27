// Interfaces para el módulo de reportes de consultas - Compatible con Backend API

export interface FilterFormData {
  idMedico?: number;
  fechaInicio?: string;
  fechaFin?: string;
  motivo?: string;
  diagnostico?: string;
}

export interface Medico {
  idMedico: number;
  nombreMedico: string;
  especialidad: string;
}

export interface Consulta {
  idConsulta: number;
  fecha: string;
  hora: string;
  nombrePaciente: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  idPaciente: number;
}

export interface MedicoPorConsultas {
  idMedico: number;
  nombreMedico: string;
  especialidad: string;
  totalConsultas: number;
  totalRegistradas: string;
  expandido: boolean;
  consultas: Consulta[];
}

export interface ResumenConsultas {
  totalConsultas: number;
  medicosActivos: number;
  filtrosActivos: number;
  fechaGeneracion: string;
}

export interface FiltrosAplicados {
  medicoId: number | null;
  nombreMedico: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  motivo: string | null;
  diagnostico: string | null;
}

export interface ReporteConsultas {
  resumen: ResumenConsultas;
  filtrosAplicados: FiltrosAplicados;
  medicosPorConsultas: MedicoPorConsultas[];
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  doctorId?: number;
}