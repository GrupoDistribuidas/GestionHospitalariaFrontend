// Filtros para consultas
export interface FilterFormData {
  idMedico?: number;
  fechaInicio?: string;
  fechaFin?: string;
  motivo?: string;
  diagnostico?: string;
}

// Datos básicos de un médico
export interface Medico {
  idMedico: number;
  nombreMedico: string;
  especialidad: string;
}

// Detalle de una consulta individual
export interface ConsultaDetalle {
  idConsulta: number;
  fecha: string;
  hora: string;
  nombrePaciente: string;
  motivo: string;
  diagnostico: string;
  tratamiento: string;
  idPaciente: number;
}

// Médico con sus consultas asociadas
export interface MedicoPorConsultas {
  idMedico: number;
  nombreMedico: string;
  especialidad: string;
  totalConsultas: number;
  totalRegistradas: string;
  consultas: ConsultaDetalle[];
  expandido: boolean;
}

// Resumen del reporte de consultas
export interface ResumenReporte {
  totalConsultas: number;
  medicosActivos: number;
  filtrosActivos: number;
  fechaGeneracion: string;
}

// Filtros aplicados en el reporte
export interface FiltrosAplicados {
  medicoId: number;
  nombreMedico: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  diagnostico: string;
}

// Reporte completo de consultas (respuesta principal de la API)
export interface ReporteConsultas {
  resumen: ResumenReporte;
  medicosPorConsultas: MedicoPorConsultas[];
  filtrosAplicados: FiltrosAplicados;
}

// Especialidad para estadísticas
export interface Especialidad {
  idEspecialidad: number;
  nombreEspecialidad: string;
  totalMedicos: number;
  totalConsultas: number;
}

// Datos estadísticos para el dashboard
export interface StatisticsData {
  totalConsultas: number;
  totalMedicos: number;
  fechaGeneracion: string;
  promedioConsultasPorMedico: number;
  medicoConMasConsultas: string;
  maxConsultasPorMedico: number;
  especialidades: Especialidad[];
}

// Opciones para exportación de datos
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeFilters?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Tipos para los datos de gráficos
export interface ChartData {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  borderColor?: string[];
}

export interface ConsultationsByDoctor {
  nombreMedico: string;
  totalConsultas: number;
  especialidad: string;
}

// Interfaces para compatibilidad con código existente (pueden ser deprecadas)
export interface ConsultationFilter {
  medicoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  motivo?: string;
  diagnostico?: string;
}

export interface ConsultationSummary {
  totalConsultasGeneral: number;
  totalMedicos: number;
  fechaGeneracion: string;
  filtros: ConsultationFilter;
}

export interface Doctor {
  id: number;
  nombre: string;
  especialidad: string;
  totalConsultas: number;
  consultasDetalle: Consultation[];
}

export interface Consultation {
  id: number;
  fecha: string;
  paciente: string;
  motivo: string;
  diagnostico: string;
  tratamiento?: string;
  observaciones?: string;
}

export interface ConsultationReport {
  resumen: ConsultationSummary;
  medicos: Doctor[];
}

export interface DetailedConsultationReport {
  resumen: {
    totalConsultas: number;
    medicosActivos: number;
    filtrosActivos: number;
    fechaGeneracion: string;
  };
  medicosPorConsultas: Array<{
    idMedico: number;
    nombreMedico: string;
    especialidad: string;
    totalConsultas: number;
    totalRegistradas: string;
    consultas: Array<{
      idConsulta: number;
      fecha: string;
      hora: string;
      nombrePaciente: string;
      motivo: string;
      diagnostico: string;
      tratamiento: string;
      idPaciente: number;
    }>;
    expandido: boolean;
  }>;
  filtrosAplicados: {
    medicoId: number;
    nombreMedico: string;
    fechaInicio: string;
    fechaFin: string;
    motivo: string;
    diagnostico: string;
  };
}