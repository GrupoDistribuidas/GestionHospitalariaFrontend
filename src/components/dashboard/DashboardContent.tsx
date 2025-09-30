import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, FileText } from "lucide-react";

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

    // TODO: reemplazar por endpoints reales cuando estén listos
    setStats({ pending: 12, general: 84, calendar: 5, patients: 132 });
    setLoading(false);
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">{/* 👈 4 columnas */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-fade-in">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full mr-4">
              <Clock className="w-6 h-6 text-[#035397]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                Agenda Pendiente
              </h3>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
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
              <p className="text-3xl font-bold text-gray-900">{stats.general}</p>
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
