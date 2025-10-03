import type {
  ReporteConsultas,
  FilterFormData,
  ExportOptions,
  Medico,
  StatisticsData,
  ConsultationsByDoctor,
} from "../types/consultation";

import { getAuthHeaders, safeFetch } from "./apiClient";

export class ConsultationService {
  private getAuthHeaders(): HeadersInit {
    return getAuthHeaders("application/json");
  }

  /**
   * Obtiene la lista de médicos disponibles
   * @returns Promise<Medico[]>
   */
  async fetchMedicosDisponibles(): Promise<Medico[]> {
    try {
      const response = await safeFetch(`/reportes/medicos-disponibles`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        const txt = await response.text().catch(() => "");
        throw new Error(`Error fetching doctors: ${response.status} ${txt}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching doctors:", error);
      // Try to extract message from error object
      const message =
        (error as any)?.message ?? "No se pudo consultar la lista de médicos.";
      throw new Error(`${message} Verifique que el servidor esté disponible.`);
    }
  }

  /**
   * Obtiene reportes de consultas por médico con filtros opcionales
   * @param filters - Filtros opcionales para las consultas
   * @returns Promise<ReporteConsultas>
   */
  async fetchConsultationReports(
    filters: FilterFormData = {}
  ): Promise<ReporteConsultas> {
    try {
      const response = await safeFetch(`/reportes/consultas-por-medico`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        const txt = await response.text().catch(() => "");
        throw new Error(
          `Error fetching consultation reports: ${response.status} ${txt}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching consultation reports:", error);
      const message =
        (error as any)?.message ??
        "No se pudo consultar los reportes de consultas.";
      throw new Error(`${message} Verifique que el servidor esté disponible.`);
    }
  }

  /**
   * Obtiene estadísticas detalladas para el dashboard
   * @param filters - Filtros opcionales para las estadísticas
   * @returns Promise<StatisticsData>
   */
  async fetchEstadisticasConsultas(
    filters: FilterFormData = {}
  ): Promise<StatisticsData> {
    try {
      const response = await safeFetch(`/reportes/estadisticas-consultas`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        const txt = await response.text().catch(() => "");
        throw new Error(`Error fetching statistics: ${response.status} ${txt}`);
      }

      const data = await response.json();

      // Debug: Mostrar los datos de especialidades que llegan de la API
      console.log("📊 Datos de estadísticas recibidos de la API:", data);
      console.log("🏥 Especialidades específicamente:", data.especialidades);

      // Validar y limpiar datos de especialidades
      if (data.especialidades && Array.isArray(data.especialidades)) {
        data.especialidades = data.especialidades.map((esp: any) => ({
          ...esp,
          nombreEspecialidad:
            esp.nombreEspecialidad ||
            `Especialidad ${esp.idEspecialidad}` ||
            "Especialidad Desconocida",
        }));
      }

      return data;
    } catch (error) {
      console.error("Error fetching statistics:", error);
      const message =
        (error as any)?.message ?? "No se pudo consultar las estadísticas.";
      // If the server returned a Response-like error with body text, attempt to include it
      if (error instanceof Error && (error as any).response) {
        try {
          const resp = (error as any).response as Response;
          const text = await resp.text();
          throw new Error(`${message} Detalle del servidor: ${text}`);
        } catch (e) {
          // Fall through
        }
      }

      throw new Error(`${message} Verifique que el servidor esté disponible.`);
    }
  }

  /**
   * Enriquece los datos de estadísticas con nombres de especialidades desde los médicos disponibles
   * @param statisticsData - Datos de estadísticas de la API
   * @param medicosDisponibles - Lista de médicos con sus especialidades
   * @returns StatisticsData con nombres de especialidades corregidos
   */
  enrichStatisticsWithSpecialtyNames(
    statisticsData: StatisticsData,
    medicosDisponibles: Medico[]
  ): StatisticsData {
    // Crear un mapa de especialidades únicas desde los médicos
    const especialidadesMap = new Map<string, string>();
    medicosDisponibles.forEach((medico) => {
      if (medico.especialidad && medico.especialidad.trim()) {
        especialidadesMap.set(
          medico.especialidad.toLowerCase(),
          medico.especialidad
        );
      }
    });

    // Crear un array de especialidades basado en los médicos disponibles
    const especialidadesPorMedicos = Array.from(
      especialidadesMap.entries()
    ).map(([key, nombreEspecialidad], index) => {
      // Buscar si hay estadísticas para esta especialidad
      const statsEspecialidad = statisticsData.especialidades.find(
        (esp) =>
          esp.nombreEspecialidad?.toLowerCase().includes(key) ||
          esp.idEspecialidad === index + 1
      );

      return {
        idEspecialidad: index + 1,
        nombreEspecialidad: nombreEspecialidad,
        totalMedicos: medicosDisponibles.filter(
          (m) => m.especialidad.toLowerCase() === key
        ).length,
        totalConsultas: statsEspecialidad?.totalConsultas || 0,
      };
    });

    console.log("🔄 Especialidades enriquecidas:", especialidadesPorMedicos);

    return {
      ...statisticsData,
      especialidades: especialidadesPorMedicos,
    };
  }

  /**
   * Convierte datos de consultas por médico para gráficos
   * @param reportData - Datos del reporte de consultas
   * @returns ConsultationsByDoctor[]
   */
  transformDataForCharts(
    reportData: ReporteConsultas
  ): ConsultationsByDoctor[] {
    return reportData.medicosPorConsultas.map((medico) => ({
      nombreMedico: medico.nombreMedico,
      totalConsultas: medico.totalConsultas,
      especialidad: medico.especialidad,
    }));
  }

  /**
   * Enriquece los datos de estadísticas con nombres reales de especialidades
   * usando los datos de médicos disponibles
   * @param statisticsData - Datos de estadísticas de la API
   * @param medicosData - Datos de médicos disponibles con especialidades
   * @returns StatisticsData con nombres de especialidades corregidos
   */
  enrichStatisticsWithRealSpecialtyNames(
    statisticsData: StatisticsData,
    medicosData: Medico[]
  ): StatisticsData {
    // Crear un mapa de especialidades únicas desde los médicos
    const especialidadesReales = new Map<string, string>();

    medicosData.forEach((medico) => {
      if (
        medico.especialidad &&
        !especialidadesReales.has(medico.especialidad)
      ) {
        especialidadesReales.set(medico.especialidad, medico.especialidad);
      }
    });

    // Enriquecer las especialidades en statisticsData
    const especialidadesEnriquecidas = statisticsData.especialidades.map(
      (esp) => {
        // Si el nombreEspecialidad parece ser un ID (contiene "ID:" o es solo números)
        if (
          esp.nombreEspecialidad.includes("ID:") ||
          /^especialidad\s*id\s*:\s*\d+$/i.test(esp.nombreEspecialidad)
        ) {
          // Intentar encontrar una especialidad real correspondiente
          const especialidadesArray = Array.from(especialidadesReales.keys());

          // Si tenemos especialidades disponibles, usar la que corresponda al índice
          if (especialidadesArray.length > 0) {
            const index = (esp.idEspecialidad - 1) % especialidadesArray.length;
            return {
              ...esp,
              nombreEspecialidad:
                especialidadesArray[index] ||
                `Especialidad ${esp.idEspecialidad}`,
            };
          }
        }

        return esp;
      }
    );

    return {
      ...statisticsData,
      especialidades: especialidadesEnriquecidas,
    };
  }

  /**
   * Enriquece los datos de reporte con nombres reales de especialidades
   * @param reportData - Datos del reporte de consultas
   * @param medicosData - Datos de médicos disponibles
   * @returns ReporteConsultas con especialidades corregidas
   */
  enrichReportWithRealSpecialtyNames(
    reportData: ReporteConsultas,
    medicosData: Medico[]
  ): ReporteConsultas {
    // Crear mapa de médicos por ID para lookup rápido
    const medicosMap = new Map<number, Medico>();
    medicosData.forEach((medico) => {
      medicosMap.set(medico.idMedico, medico);
    });

    // Enriquecer los datos de médicos en el reporte
    const medicosPorConsultasEnriquecidos = reportData.medicosPorConsultas.map(
      (medico) => {
        const medicoCompleto = medicosMap.get(medico.idMedico);

        return {
          ...medico,
          especialidad: medicoCompleto?.especialidad || medico.especialidad,
        };
      }
    );

    return {
      ...reportData,
      medicosPorConsultas: medicosPorConsultasEnriquecidos,
    };
  }

  /**
   * Exporta datos de consultas en formato especificado
   * @param options - Opciones de exportación
   * @returns Promise<Blob>
   */
  async exportConsultationData(options: ExportOptions): Promise<Blob> {
    try {
      const response = await safeFetch(`/reportes/export`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`Error exporting data: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error("Error exporting data:", error);
      throw new Error(
        "No se pudo exportar los datos. Verifique que el servidor esté disponible."
      );
    }
  }

  /**
   * Valida el rango de fechas
   * @param startDate - Fecha de inicio
   * @param endDate - Fecha de fin
   * @returns boolean
   */
  validateDateRange(startDate: string, endDate: string): boolean {
    if (!startDate || !endDate) return true;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return start <= end;
  }

  /**
   * Construye parámetros de consulta desde los filtros
   * @param filters - Filtros del formulario
   * @returns string
   */
  private buildQueryParams(filters: FilterFormData): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }

  /**
   * Obtiene el header de Accept apropiado para el formato de exportación
   * @param format - Formato de exportación
   * @returns string
   */
  private getAcceptHeader(format: string): string {
    switch (format) {
      case "csv":
        return "text/csv";
      case "excel":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "pdf":
        return "application/pdf";
      default:
        return "application/octet-stream";
    }
  }
}

// Singleton instance
export const consultationService = new ConsultationService();
