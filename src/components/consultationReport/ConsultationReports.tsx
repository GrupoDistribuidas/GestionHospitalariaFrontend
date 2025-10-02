import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  RefreshCw, 
  Users, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Loader2,
  Calendar,
  X
} from 'lucide-react';
import { consultationService } from '../../services/consultationService';
import StatisticsCharts from './StatisticsCharts';
import type { 
  ReporteConsultas, 
  FilterFormData, 
  Medico,
  StatisticsData
} from '../../types/consultation';

const ConsultationReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReporteConsultas | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [medicosDisponibles, setMedicosDisponibles] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [applying, setApplying] = useState(false);
  const [expandedMedicos, setExpandedMedicos] = useState<Set<number>>(new Set());
  const [showDoctorDetails, setShowDoctorDetails] = useState(false); // Estado para la sección colapsable
  
  // Estados para el selector de médicos con búsqueda
  const [medicoSearchTerm, setMedicoSearchTerm] = useState<string>('');
  const [showMedicoDropdown, setShowMedicoDropdown] = useState<boolean>(false);
  const [filteredMedicos, setFilteredMedicos] = useState<Medico[]>([]);
  
  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterFormData>({
    idMedico: undefined,
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    diagnostico: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    initializeData();
  }, [navigate]);

  // Efecto para filtrar médicos según el término de búsqueda
  useEffect(() => {
    if (!medicoSearchTerm.trim()) {
      setFilteredMedicos(medicosDisponibles);
    } else {
      const filtered = medicosDisponibles.filter(medico =>
        medico.nombreMedico.toLowerCase().includes(medicoSearchTerm.toLowerCase()) ||
        medico.especialidad.toLowerCase().includes(medicoSearchTerm.toLowerCase())
      );
      setFilteredMedicos(filtered);
    }
  }, [medicoSearchTerm, medicosDisponibles]);

  const initializeData = async () => {
    setLoading(true);
    setStatisticsLoading(true);
    setError('');
    
    try {
      // Cargar médicos disponibles, reporte inicial y estadísticas
      const [medicosResponse, reporteResponse, estadisticasResponse] = await Promise.all([
        consultationService.fetchMedicosDisponibles(),
        consultationService.fetchConsultationReports(),
        consultationService.fetchEstadisticasConsultas()
      ]);
      
      setMedicosDisponibles(medicosResponse);
      
      // Enriquecer reporte con nombres reales de especialidades
      const enrichedReport = consultationService.enrichReportWithRealSpecialtyNames(
        reporteResponse, 
        medicosResponse
      );
      setReportData(enrichedReport);
      
      // Enriquecer estadísticas con nombres reales de especialidades
      const enrichedStatistics = consultationService.enrichStatisticsWithRealSpecialtyNames(
        estadisticasResponse, 
        medicosResponse
      );
      setStatisticsData(enrichedStatistics);
      
      // Si hay un médico seleccionado, actualizar el término de búsqueda
      if (filters.idMedico) {
        const selectedMedico = medicosResponse.find(m => m.idMedico === filters.idMedico);
        if (selectedMedico) {
          setMedicoSearchTerm(`${selectedMedico.nombreMedico} - ${selectedMedico.especialidad}`);
        }
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos');
      
      if (err instanceof Error && err.message.includes('Session expired')) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setStatisticsLoading(false);
    }
  };

  const handleFilterChange = (field: keyof FilterFormData, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para manejar la selección de un médico
  const handleMedicoSelect = (medico: Medico) => {
    handleFilterChange('idMedico', medico.idMedico);
    setMedicoSearchTerm(`${medico.nombreMedico} - ${medico.especialidad}`);
    setShowMedicoDropdown(false);
  };

  // Función para limpiar la selección de médico
  const clearMedicoSelection = () => {
    handleFilterChange('idMedico', undefined);
    setMedicoSearchTerm('');
    setShowMedicoDropdown(false);
  };

  // Función para manejar el cambio en el input de búsqueda
  const handleMedicoSearchChange = (value: string) => {
    setMedicoSearchTerm(value);
    setShowMedicoDropdown(true);
    
    // Si el campo está vacío, limpiar la selección
    if (!value.trim()) {
      handleFilterChange('idMedico', undefined);
    }
  };

  const applyFilters = async () => {
    setApplying(true);
    setError('');
    
    try {
      const cleanedFilters: FilterFormData = {};
      
      if (filters.idMedico && filters.idMedico > 0) {
        cleanedFilters.idMedico = filters.idMedico;
      }
      
      if (filters.fechaInicio) {
        cleanedFilters.fechaInicio = filters.fechaInicio;
      }
      
      if (filters.fechaFin) {
        cleanedFilters.fechaFin = filters.fechaFin;
      }
      
      if (filters.motivo && filters.motivo.trim()) {
        cleanedFilters.motivo = filters.motivo.trim();
      }
      
      if (filters.diagnostico && filters.diagnostico.trim()) {
        cleanedFilters.diagnostico = filters.diagnostico.trim();
      }

      // Cargar reporte y estadísticas con filtros aplicados
      const [reporte, estadisticas] = await Promise.all([
        consultationService.fetchConsultationReports(cleanedFilters),
        consultationService.fetchEstadisticasConsultas(cleanedFilters)
      ]);
      
      // Enriquecer reporte con nombres reales de especialidades
      const enrichedReport = consultationService.enrichReportWithRealSpecialtyNames(
        reporte, 
        medicosDisponibles
      );
      setReportData(enrichedReport);
      
      // Enriquecer estadísticas con nombres reales de especialidades
      const enrichedStatistics = consultationService.enrichStatisticsWithRealSpecialtyNames(
        estadisticas, 
        medicosDisponibles
      );
      setStatisticsData(enrichedStatistics);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError(err instanceof Error ? err.message : 'Error aplicando filtros');
      
      if (err instanceof Error && err.message.includes('Session expired')) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    } finally {
      setApplying(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      idMedico: undefined,
      fechaInicio: '',
      fechaFin: '',
      motivo: '',
      diagnostico: ''
    });
    
    // Limpiar también el selector de médicos
    setMedicoSearchTerm('');
    setShowMedicoDropdown(false);
  };

  const refreshData = async () => {
    await applyFilters();
  };

  const toggleMedicoExpansion = (idMedico: number) => {
    setExpandedMedicos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idMedico)) {
        newSet.delete(idMedico);
      } else {
        newSet.add(idMedico);
      }
      return newSet;
    });
  };

  const handleExport = async () => {
    try {
      const blob = await consultationService.exportConsultationData({ format: 'csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-consultas-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Error exportando datos');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando reportes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={initializeData} 
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reportes de Consultas Médicas</h1>
          <p className="text-gray-600">Análisis y gestión de consultas hospitalarias</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={refreshData}
            disabled={applying}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${applying ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Todo</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filtros de Consultas</h2>
            {reportData.resumen.filtrosActivos > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {reportData.resumen.filtrosActivos} filtro{reportData.resumen.filtrosActivos > 1 ? 's' : ''} activo{reportData.resumen.filtrosActivos > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 text-sm hover:text-blue-800 flex items-center space-x-1"
          >
            <span>{showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            {/* Selector de Médico con Búsqueda */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Médico</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar médico por nombre o especialidad..."
                  value={medicoSearchTerm}
                  onChange={(e) => handleMedicoSearchChange(e.target.value)}
                  onFocus={() => setShowMedicoDropdown(true)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Botón para limpiar */}
                {medicoSearchTerm && (
                  <button
                    type="button"
                    onClick={clearMedicoSelection}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Ícono de búsqueda */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Users className="w-4 h-4" />
                </div>
                
                {/* Dropdown con opciones */}
                {showMedicoDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Opción "Todos los médicos" */}
                    <div
                      onClick={() => {
                        clearMedicoSelection();
                        setShowMedicoDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    >
                      <div className="font-medium text-gray-900">Todos los médicos</div>
                      <div className="text-sm text-gray-500">Mostrar consultas de todos</div>
                    </div>
                    
                    {/* Lista de médicos filtrados */}
                    {filteredMedicos.length > 0 ? (
                      filteredMedicos.map((medico) => (
                        <div
                          key={medico.idMedico}
                          onClick={() => handleMedicoSelect(medico)}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                            filters.idMedico === medico.idMedico ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-900">{medico.nombreMedico}</div>
                          <div className="text-sm text-gray-500">{medico.especialidad}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        No se encontraron médicos que coincidan con "{medicoSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Overlay para cerrar el dropdown al hacer clic fuera */}
              {showMedicoDropdown && (
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowMedicoDropdown(false)}
                />
              )}
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={filters.fechaInicio || ''}
                onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={filters.fechaFin || ''}
                onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo</label>
              <input
                type="text"
                placeholder="Filtrar por motivo de consulta"
                value={filters.motivo || ''}
                onChange={(e) => handleFilterChange('motivo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico</label>
              <input
                type="text"
                placeholder="Filtrar por diagnóstico"
                value={filters.diagnostico || ''}
                onChange={(e) => handleFilterChange('diagnostico', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Botones */}
            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                disabled={applying}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {applying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
                <span>Aplicar</span>
              </button>
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        )}
      </div>

     

      {/* Dashboard de Estadísticas */}
      {statisticsData && (
        <div className="mb-6">
        
          
          <StatisticsCharts 
            statistics={statisticsData}
            consultationsByDoctor={reportData ? consultationService.transformDataForCharts(reportData) : []}
            isLoading={statisticsLoading}
          />
        </div>
      )}

      {/* Doctors and Consultations Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setShowDoctorDetails(!showDoctorDetails)}
              className="flex items-center space-x-2 text-lg font-semibold text-gray-800 hover:text-gray-600 transition-colors"
            >
              <span>Consultas Detalladas por Médico</span>
              {showDoctorDetails ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {reportData?.medicosPorConsultas.length} médicos • {reportData?.resumen.totalConsultas} consultas totales
              </span>
              <button 
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Generado: {reportData?.resumen.fechaGeneracion} • 0 filtros activos
          </p>
        </div>

        {showDoctorDetails && (
          <div className="divide-y divide-gray-200">
          {reportData.medicosPorConsultas.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No se encontraron consultas con los filtros aplicados
            </div>
          ) : (
            reportData.medicosPorConsultas.map((medico) => (
              <div key={medico.idMedico} className="px-6 py-4">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => toggleMedicoExpansion(medico.idMedico)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{medico.nombreMedico}</h4>
                      <p className="text-sm text-gray-500">{medico.especialidad}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{medico.totalConsultas}</div>
                      <div className="text-sm text-gray-500">consultas</div>
                      <div className="text-xs text-gray-400">Total registradas</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                        <Download className="w-4 h-4" />
                      </button>
                      {expandedMedicos.has(medico.idMedico) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Consultations */}
                {expandedMedicos.has(medico.idMedico) && (
                  <div className="mt-4 ml-13 border-l-2 border-gray-200 pl-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Consultas detalladas:</h5>
                    <div className="space-y-3">
                      {medico.consultas.map((consulta) => (
                        <div key={consulta.idConsulta} className="bg-gray-50 p-3 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Fecha:</span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>{consulta.fecha} {consulta.hora}</span>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Paciente:</span>
                              <p className="text-gray-900">{consulta.nombrePaciente}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Motivo:</span>
                              <p className="text-gray-900">{consulta.motivo}</p>
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-600">Diagnóstico:</span>
                              <p className="text-gray-900">{consulta.diagnostico}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Tratamiento:</span>
                              <p className="text-gray-900">{consulta.tratamiento}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationReports;
