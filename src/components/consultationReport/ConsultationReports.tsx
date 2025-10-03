import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  X,
  FileText,
  File,
} from "lucide-react";
import { consultationService } from "../../services/consultationService";
import { ExportService } from "../../services/exportService";
import StatisticsCharts from "./StatisticsCharts";
import type {
  ReporteConsultas,
  FilterFormData,
  Medico,
  StatisticsData,
} from "../../types/consultation";

const ConsultationReports: React.FC = () => {
  const [reportData, setReportData] = useState<ReporteConsultas | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null
  );
  const [medicosDisponibles, setMedicosDisponibles] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [applying, setApplying] = useState(false);
  const [expandedMedicos, setExpandedMedicos] = useState<Set<number>>(
    new Set()
  );
  const [showDoctorDetails, setShowDoctorDetails] = useState(false); // Estado para la sección colapsable
  const [showExportModal, setShowExportModal] = useState(false); // Estado para el modal de exportación
  const [isExporting, setIsExporting] = useState(false); // Estado para mostrar loading durante la exportación
  const [fileName, setFileName] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleDateString("es-ES", { month: "long" });
    return `reporte-consultas-${month}-${year}`;
  });

  // Estados para exportación individual
  const [showDoctorExportModal, setShowDoctorExportModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [doctorFileName, setDoctorFileName] = useState("");

  // Estados para el selector de médicos con búsqueda
  const [medicoSearchTerm, setMedicoSearchTerm] = useState<string>("");
  const [showMedicoDropdown, setShowMedicoDropdown] = useState<boolean>(false);
  const [filteredMedicos, setFilteredMedicos] = useState<Medico[]>([]);

  const navigate = useNavigate();

  const [filters, setFilters] = useState<FilterFormData>({
    idMedico: undefined,
    fechaInicio: "",
    fechaFin: "",
    motivo: "",
    diagnostico: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    initializeData();
  }, [navigate]);

  // Efecto para filtrar médicos según el término de búsqueda
  useEffect(() => {
    if (!medicoSearchTerm.trim()) {
      setFilteredMedicos(medicosDisponibles);
    } else {
      const filtered = medicosDisponibles.filter(
        (medico) =>
          medico.nombreMedico
            .toLowerCase()
            .includes(medicoSearchTerm.toLowerCase()) ||
          medico.especialidad
            .toLowerCase()
            .includes(medicoSearchTerm.toLowerCase())
      );
      setFilteredMedicos(filtered);
    }
  }, [medicoSearchTerm, medicosDisponibles]);

  const initializeData = async () => {
    setLoading(true);
    setStatisticsLoading(true);
    setError("");

    try {
      const medicosPromise = consultationService
        .fetchMedicosDisponibles()
        .catch((err) => {
          console.error("fetchMedicosDisponibles failed:", err);
          return [] as any[];
        });

      // If the current user is not admin, limit reports to their empleado id
      const { isAdmin: _isAdmin } = await (async () => ({ isAdmin: false }))();
      // lazy import to avoid cyclic deps
      const { isAdmin, getCurrentUserEmpleadoId } = await import(
        "../../services/auth"
      );

      const userFilters = { ...filters } as any;
      if (!isAdmin()) {
        const empleadoId = getCurrentUserEmpleadoId();
        if (empleadoId) userFilters.idMedico = empleadoId;
      }

      const reportePromise = consultationService
        .fetchConsultationReports(userFilters)
        .catch((err) => {
          console.error("fetchConsultationReports failed:", err);
          return null as any;
        });

      const estadisticasPromise = consultationService
        .fetchEstadisticasConsultas()
        .catch((err) => {
          console.error("fetchEstadisticasConsultas failed:", err);
          return null as any;
        });

      const [medicosResponse, reporteResponse, estadisticasResponse] =
        await Promise.all([
          medicosPromise,
          reportePromise,
          estadisticasPromise,
        ]);

      setMedicosDisponibles(medicosResponse);

      if (reporteResponse) {
        const enrichedReport =
          consultationService.enrichReportWithRealSpecialtyNames(
            reporteResponse,
            medicosResponse
          );
        setReportData(enrichedReport);
      } else {
        setReportData({
          resumen: {
            totalConsultas: 0,
            medicosActivos: 0,
            filtrosActivos: 0,
            fechaGeneracion: "",
          },
          medicosPorConsultas: [],
          filtrosAplicados: {},
        } as any);
      }

      if (estadisticasResponse) {
        const enrichedStatistics =
          consultationService.enrichStatisticsWithRealSpecialtyNames(
            estadisticasResponse,
            medicosResponse
          );
        setStatisticsData(enrichedStatistics);
      } else {
        setStatisticsData(null);
      }

      // Si hay un médico seleccionado, actualizar el término de búsqueda
      if (filters.idMedico && medicosResponse.length) {
        const selectedMedico = medicosResponse.find(
          (m) => m.idMedico === filters.idMedico
        );
        if (selectedMedico) {
          setMedicoSearchTerm(
            `${selectedMedico.nombreMedico} - ${selectedMedico.especialidad}`
          );
        }
      }
    } catch (err) {
      console.error("Error initializing data:", err);
      setError(err instanceof Error ? err.message : "Error cargando datos");

      if (err instanceof Error && err.message.includes("Session expired")) {
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } finally {
      setLoading(false);
      setStatisticsLoading(false);
    }
  };

  const handleFilterChange = (
    field: keyof FilterFormData,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Función para manejar la selección de un médico
  const handleMedicoSelect = (medico: Medico) => {
    handleFilterChange("idMedico", medico.idMedico);
    setMedicoSearchTerm(`${medico.nombreMedico} - ${medico.especialidad}`);
    setShowMedicoDropdown(false);
  };

  // Función para limpiar la selección de médico
  const clearMedicoSelection = () => {
    handleFilterChange("idMedico", undefined);
    setMedicoSearchTerm("");
    setShowMedicoDropdown(false);
  };

  // Función para manejar el cambio en el input de búsqueda
  const handleMedicoSearchChange = (value: string) => {
    setMedicoSearchTerm(value);
    setShowMedicoDropdown(true);

    // Si el campo está vacío, limpiar la selección
    if (!value.trim()) {
      handleFilterChange("idMedico", undefined);
    }
  };

  const applyFilters = async () => {
    setApplying(true);
    setError("");

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
        consultationService.fetchEstadisticasConsultas(cleanedFilters),
      ]);

      // Enriquecer reporte con nombres reales de especialidades
      const enrichedReport =
        consultationService.enrichReportWithRealSpecialtyNames(
          reporte,
          medicosDisponibles
        );
      setReportData(enrichedReport);

      // Enriquecer estadísticas con nombres reales de especialidades
      const enrichedStatistics =
        consultationService.enrichStatisticsWithRealSpecialtyNames(
          estadisticas,
          medicosDisponibles
        );
      setStatisticsData(enrichedStatistics);
    } catch (err) {
      console.error("Error applying filters:", err);
      setError(err instanceof Error ? err.message : "Error aplicando filtros");

      if (err instanceof Error && err.message.includes("Session expired")) {
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    } finally {
      setApplying(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      idMedico: undefined,
      fechaInicio: "",
      fechaFin: "",
      motivo: "",
      diagnostico: "",
    });

    // Limpiar también el selector de médicos
    setMedicoSearchTerm("");
    setShowMedicoDropdown(false);
  };

  const refreshData = async () => {
    await applyFilters();
  };

  const toggleMedicoExpansion = (idMedico: number) => {
    setExpandedMedicos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idMedico)) {
        newSet.delete(idMedico);
      } else {
        newSet.add(idMedico);
      }
      return newSet;
    });
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleExportFormat = async (format: "pdf" | "excel") => {
    setIsExporting(true);
    try {
      if (!reportData) {
        throw new Error("No hay datos para exportar");
      }

      const cleanFileName = fileName.trim() || "reporte-consultas";

      if (format === "pdf") {
        ExportService.exportToPDF(reportData, statisticsData, cleanFileName);
      } else {
        ExportService.exportToExcel(reportData, statisticsData, cleanFileName);
      }

      setShowExportModal(false);
    } catch (err) {
      console.error("Error exporting data:", err);
      setError("Error exportando datos");
    } finally {
      setIsExporting(false);
    }
  };

  const closeExportModal = () => {
    setShowExportModal(false);
  };

  const handleDoctorExport = (medico: any) => {
    setSelectedDoctor(medico);
    const defaultName = `reporte-${medico.nombreMedico
      .replace(/\s+/g, "-")
      .toLowerCase()}-${new Date()
      .toLocaleDateString("es-ES")
      .replace(/\//g, "-")}`;
    setDoctorFileName(defaultName);
    setShowDoctorExportModal(true);
  };

  const handleDoctorExportFormat = async (format: "pdf" | "excel") => {
    if (!selectedDoctor) return;

    setIsExporting(true);
    try {
      const cleanFileName =
        doctorFileName.trim() || `reporte-${selectedDoctor.nombreMedico}`;

      if (format === "pdf") {
        ExportService.exportDoctorToPDF(selectedDoctor, cleanFileName);
      } else {
        ExportService.exportDoctorToExcel(selectedDoctor, cleanFileName);
      }

      setShowDoctorExportModal(false);
      setSelectedDoctor(null);
    } catch (err) {
      console.error("Error al exportar reporte del médico:", err);
      setError("Error exportando reporte del médico");
    } finally {
      setIsExporting(false);
    }
  };

  const closeDoctorExportModal = () => {
    setShowDoctorExportModal(false);
    setSelectedDoctor(null);
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Reportes de Consultas Médicas
          </h1>
          <p className="text-gray-600">
            Análisis y gestión de consultas hospitalarias
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={applying}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${applying ? "animate-spin" : ""}`}
            />
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
            <h2 className="text-lg font-semibold text-gray-800">
              Filtros de Consultas
            </h2>
            {reportData.resumen.filtrosActivos > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {reportData.resumen.filtrosActivos} filtro
                {reportData.resumen.filtrosActivos > 1 ? "s" : ""} activo
                {reportData.resumen.filtrosActivos > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 text-sm hover:text-blue-800 flex items-center space-x-1"
          >
            <span>{showFilters ? "Ocultar filtros" : "Mostrar filtros"}</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
            {/* Selector de Médico con Búsqueda */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Médico
              </label>
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
                      <div className="font-medium text-gray-900">
                        Todos los médicos
                      </div>
                      <div className="text-sm text-gray-500">
                        Mostrar consultas de todos
                      </div>
                    </div>

                    {/* Lista de médicos filtrados */}
                    {filteredMedicos.length > 0 ? (
                      filteredMedicos.map((medico) => (
                        <div
                          key={medico.idMedico}
                          onClick={() => handleMedicoSelect(medico)}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer ${
                            filters.idMedico === medico.idMedico
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : ""
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {medico.nombreMedico}
                          </div>
                          <div className="text-sm text-gray-500">
                            {medico.especialidad}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-center">
                        No se encontraron médicos que coincidan con "
                        {medicoSearchTerm}"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.fechaInicio || ""}
                onChange={(e) =>
                  handleFilterChange("fechaInicio", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.fechaFin || ""}
                onChange={(e) => handleFilterChange("fechaFin", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo
              </label>
              <input
                type="text"
                placeholder="Filtrar por motivo de consulta"
                value={filters.motivo || ""}
                onChange={(e) => handleFilterChange("motivo", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnóstico
              </label>
              <input
                type="text"
                placeholder="Filtrar por diagnóstico"
                value={filters.diagnostico || ""}
                onChange={(e) =>
                  handleFilterChange("diagnostico", e.target.value)
                }
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
            consultationsByDoctor={
              reportData
                ? consultationService.transformDataForCharts(reportData)
                : []
            }
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
                {reportData?.medicosPorConsultas.length} médicos •{" "}
                {reportData?.resumen.totalConsultas} consultas totales
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
                        <h4 className="text-lg font-medium text-gray-900">
                          {medico.nombreMedico}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {medico.especialidad}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {medico.totalConsultas}
                        </div>
                        <div className="text-sm text-gray-500">consultas</div>
                        <div className="text-xs text-gray-400">
                          Total registradas
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDoctorExport(medico)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title={`Exportar reporte de ${medico.nombreMedico}`}
                        >
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
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Consultas detalladas:
                      </h5>
                      <div className="space-y-3">
                        {medico.consultas.map((consulta) => (
                          <div
                            key={consulta.idConsulta}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">
                                  Fecha:
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {consulta.fecha} {consulta.hora}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">
                                  Paciente:
                                </span>
                                <p className="text-gray-900">
                                  {consulta.nombrePaciente}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">
                                  Motivo:
                                </span>
                                <p className="text-gray-900">
                                  {consulta.motivo}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-600">
                                  Diagnóstico:
                                </span>
                                <p className="text-gray-900">
                                  {consulta.diagnostico}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">
                                  Tratamiento:
                                </span>
                                <p className="text-gray-900">
                                  {consulta.tratamiento}
                                </p>
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

      {/* Modal de Exportación */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-100">
            {/* Header del Modal */}
            <div className="px-6 pt-6 pb-4 text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Exportar Reporte
              </h3>
              <p className="text-sm text-gray-600">
                Selecciona el formato y personaliza el nombre del archivo
              </p>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-6">
              {/* Campo para nombre del archivo */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                  Nombre del archivo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-900 placeholder-gray-500 transition-colors duration-200"
                    placeholder="Nombre del archivo"
                    disabled={isExporting}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La extensión se agregará automáticamente
                </p>
              </div>

              {/* Opciones de formato */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-left">
                  Formato de exportación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Botón PDF */}
                  <button
                    onClick={() => handleExportFormat("pdf")}
                    disabled={isExporting}
                    className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">
                      PDF
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Documento portable
                    </span>
                  </button>

                  {/* Botón Excel */}
                  <button
                    onClick={() => handleExportFormat("excel")}
                    disabled={isExporting}
                    className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                      <File className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                      Excel
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Hoja de cálculo
                    </span>
                  </button>
                </div>
              </div>

              {/* Estado de carga */}
              {isExporting && (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                  <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700 font-medium">
                    Generando archivo...
                  </span>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeExportModal}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Los datos se exportarán según los filtros aplicados actualmente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportación Individual de Médico */}
      {showDoctorExportModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Exportar Reporte Individual
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedDoctor.nombreMedico} -{" "}
                    {selectedDoctor.especialidad}
                  </p>
                </div>
                <button
                  onClick={closeDoctorExportModal}
                  disabled={isExporting}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4">
              {/* Campo de nombre de archivo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del archivo
                </label>
                <input
                  type="text"
                  value={doctorFileName}
                  onChange={(e) => setDoctorFileName(e.target.value)}
                  disabled={isExporting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ingrese el nombre del archivo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se agregará automáticamente la extensión según el formato
                  seleccionado
                </p>
              </div>

              {/* Opciones de formato */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleccione el formato de exportación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Botón PDF */}
                  <button
                    onClick={() => handleDoctorExportFormat("pdf")}
                    disabled={isExporting}
                    className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">
                      PDF
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Documento
                    </span>
                  </button>

                  {/* Botón Excel */}
                  <button
                    onClick={() => handleDoctorExportFormat("excel")}
                    disabled={isExporting}
                    className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 group-hover:bg-green-200 transition-colors">
                      <File className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                      Excel
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Hoja de cálculo
                    </span>
                  </button>
                </div>
              </div>

              {/* Estado de carga */}
              {isExporting && (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                  <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-700 font-medium">
                    Generando archivo del médico...
                  </span>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDoctorExportModal}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-3">
                Se exportarán todas las consultas registradas para este médico
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationReports;
