import type { 
  ReporteConsultas, 
  FilterFormData, 
  ExportOptions, 
  Medico
} from '../types/consultation';

const API_BASE_URL = 'http://localhost:5088/api';

export class ConsultationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async fetchMedicosDisponibles(): Promise<Medico[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/medicos-disponibles`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Error fetching doctors: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw new Error('No se pudo consultar la lista de médicos. Verifique que el servidor esté disponible.');
    }
  }

  async fetchConsultationReports(filters: FilterFormData = {}): Promise<ReporteConsultas> {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/consultas-por-medico`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Error fetching consultation reports: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching consultation reports:', error);
      throw new Error('No se pudo consultar los reportes de consultas. Verifique que el servidor esté disponible.');
    }
  }

  async fetchEstadisticasConsultas(filters: FilterFormData = {}): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/estadisticas-consultas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(filters)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Error fetching statistics: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  async exportConsultationData(options: ExportOptions): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE_URL}/reportes/export`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Error exporting data: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('No se pudo exportar los datos. Verifique que el servidor esté disponible.');
    }
  }
}

// Singleton instance
export const consultationService = new ConsultationService();
