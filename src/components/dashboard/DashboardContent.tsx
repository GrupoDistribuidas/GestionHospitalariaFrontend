import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, FileText } from "lucide-react";
import { consultationService } from "../../services/consultationService";
import { appointmentsService } from "../../services/appointmentsService";
import { safeFetch, getAuthHeaders } from "../../services/apiClient";

interface Stats {
  pending: number;
  general: number;
  calendar: number;
  patients: number; // 👈 nuevo
}

const DashboardContent: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    general: 0,
    calendar: 0,
    patients: 0, // 👈 nuevo
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const storedUsername = localStorage.getItem("username");
    setUserName(storedUsername ? storedUsername : "Usuario");

    // Cargar datos reales desde los servicios (resiliente)
    const load = async () => {
      setLoading(true);
      try {
        const statsPromise = consultationService
          .fetchEstadisticasConsultas()
          .catch((err) => {
            console.error("fetchEstadisticasConsultas failed:", err);
            return null;
          });

        const consultasPromise = appointmentsService
          .fetchTodasConsultas()
          .catch((err) => {
            console.error("fetchTodasConsultas failed:", err);
            return [] as any[];
          });

        const pacientesPromise = (async () => {
          try {
            const res = await safeFetch("/pacientes", {
              headers: getAuthHeaders(),
            });
            if (!res.ok) {
              const t = await res.text();
              console.error("/pacientes returned non-ok:", res.status, t);
              return [] as any[];
            }
            const d = await res.json();
            return Array.isArray(d) ? d : d?.pacientes ?? [];
          } catch (err) {
            console.error("fetch /pacientes failed:", err);
            return [] as any[];
          }
        })();

        const [statsResp, consultasResp, pacientesResp] = await Promise.all([
          statsPromise,
          consultasPromise,
          pacientesPromise,
        ]);

        const consultas = Array.isArray(consultasResp) ? consultasResp : [];
        const pacientesList = Array.isArray(pacientesResp) ? pacientesResp : [];

        // calcular pendientes: consultas futuras (fecha >= today)
        const today = new Date();
        const upcoming = consultas.filter((c: any) => {
          try {
            const fecha = new Date(
              c.fecha ??
                c.Fecha ??
                c.fechaConsulta ??
                c.fecha_registro ??
                c.date
            );
            return (
              fecha >=
              new Date(today.getFullYear(), today.getMonth(), today.getDate())
            );
          } catch {
            return false;
          }
        });

        // calendario: próximas 7 días
        const in7days = consultas.filter((c: any) => {
          try {
            const fecha = new Date(
              c.fecha ??
                c.Fecha ??
                c.fechaConsulta ??
                c.fecha_registro ??
                c.date
            );
            const diff =
              (fecha.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
          } catch {
            return false;
          }
        });

        const everythingEmpty =
          !statsResp && consultas.length === 0 && pacientesList.length === 0;
        if (everythingEmpty) {
          setError(
            "No se pudieron cargar las métricas del panel. Verifique que el servidor esté disponible."
          );
        }

        setStats({
          pending: upcoming.length,
          general: statsResp?.totalConsultas ?? consultas.length,
          calendar: in7days.length,
          patients: pacientesList.length,
        });
      } catch (err) {
        console.error("Unexpected error loading dashboard stats:", err);
        setError(
          "No se pudieron cargar las métricas del panel. Verifique que el servidor esté disponible."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#035397]"></div>
      </div>
    );
  }

  const hour = new Date().getHours();
  let greeting = "BIENVENIDO";
  if (hour >= 6 && hour < 12) greeting = "BUEN DÍA";
  else if (hour >= 12 && hour < 20) greeting = "BUENAS TARDES";
  else greeting = "BUENAS NOCHES";

  return (
    <div className="space-y-8 p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">{error}</div>
      )}
      {/* Hero Greeting Section */}
      <div className="bg-gradient-to-r from-[#035397] to-blue-600 text-white rounded-2xl p-8 text-center shadow-xl animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          {greeting}, {userName.toUpperCase()}!
        </h1>
        <p className="text-xl opacity-90">
          Bienvenido a tu panel de Gestión Hospitalaria
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 👈 4 columnas */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full mr-4">
              <Clock className="w-6 h-6 text-[#035397]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Agenda Pendiente
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.pending}
              </p>
              <p className="text-sm text-gray-500 mt-1">Citas por confirmar</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-full mr-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Resumen General
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.general}
              </p>
              <p className="text-sm text-gray-500 mt-1">Registros totales</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-400">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-full mr-4">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Calendario
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.calendar}
              </p>
              <p className="text-sm text-gray-500 mt-1">Eventos próximos</p>
            </div>
          </div>
        </div>

        {/* 👇 Nueva tarjeta Pacientes */}
        <button
          onClick={() => navigate("/pacientes")}
          className="text-left bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in focus:outline-none"
        >
          <div className="flex items-center">
            <div className="p-3 bg-emerald-50 rounded-full mr-4">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Pacientes activos
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.patients}
              </p>
              <p className="text-sm text-gray-500 mt-1">Ir a gestión</p>
            </div>
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Acciones Rápidas
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate("/agenda")}
            className="bg-gradient-to-r from-[#035397] to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md flex-1 text-center"
          >
            📅 Agenda Cita
          </button>
          <button
            onClick={() => navigate("/calendario")}
            className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300 transform hover:scale-105 shadow-md flex-1 text-center border border-gray-300"
          >
            📋 Ver Calendario
          </button>
          <button
            onClick={() => navigate("/pacientes")}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-md flex-1 text-center"
          >
            👥 Gestionar Pacientes
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
        Datos personales con fines didácticos | © 2024 Gestión Hospitalaria
      </footer>
    </div>
  );
};

export default DashboardContent;
