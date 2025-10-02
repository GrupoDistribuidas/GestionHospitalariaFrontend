import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { StatisticsData, ConsultationsByDoctor } from '../../types/consultation';
import { TrendingUp, Users, Activity, Award } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatisticsChartsProps {
  statistics: StatisticsData;
  consultationsByDoctor: ConsultationsByDoctor[];
  isLoading?: boolean;
}

const StatisticsCharts: React.FC<StatisticsChartsProps> = ({
  statistics,
  consultationsByDoctor,
  isLoading = false
}) => {
  // Paleta de colores suave y profesional
  const colors = {
    primary: '#6366f1',      // Indigo suave
    secondary: '#8b5cf6',    // Violeta suave
    accent: '#06b6d4',       // Cyan suave
    success: '#10b981',      // Emerald suave
    warning: '#f59e0b',      // Amber suave
    info: '#3b82f6',         // Blue suave
    light: '#f1f5f9',        // Slate muy claro
    muted: '#64748b'         // Slate medio
  };

  const chartColors = [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.success,
    colors.warning,
    colors.info,
    '#ec4899', // Pink suave
    '#f97316', // Orange suave
    '#84cc16', // Lime suave
    '#06b6d4'  // Cyan suave
  ];

  // Configuración del gráfico de barras - Consultas por Médico
  const barChartData = {
    labels: consultationsByDoctor.slice(0, 5).map(doctor => 
      doctor.nombreMedico.length > 15 
        ? doctor.nombreMedico.substring(0, 15) + '...' 
        : doctor.nombreMedico
    ),
    datasets: [
      {
        label: 'Consultas',
        data: consultationsByDoctor.slice(0, 5).map(doctor => doctor.totalConsultas),
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Top 5 Médicos por Consultas',
        font: {
          size: 16,
          weight: 600,
        },
        color: '#1e293b',
        padding: 20,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          afterLabel: function(context: any) {
            const doctorIndex = context.dataIndex;
            const doctor = consultationsByDoctor[doctorIndex];
            return `Especialidad: ${doctor.especialidad}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          color: colors.muted,
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: colors.muted,
          font: {
            size: 11,
          },
          maxRotation: 45,
        },
      },
    },
  };

  // Configuración del gráfico de dona - Distribución por Especialidades
  const doughnutChartData = {
    labels: statistics.especialidades.map(esp => esp.nombreEspecialidad),
    datasets: [
      {
        data: statistics.especialidades.map(esp => esp.totalConsultas),
        backgroundColor: chartColors.slice(0, statistics.especialidades.length),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverOffset: 8,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
          color: '#1e293b',
        },
      },
      title: {
        display: true,
        text: 'Consultas por Especialidad',
        font: {
          size: 16,
          weight: 600,
        },
        color: '#1e293b',
        padding: 20,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: colors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Consultas</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalConsultas.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Médicos Activos</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalMedicos.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio por Médico</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.promedioConsultasPorMedico.toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Máximo Consultas</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.maxConsultasPorMedico}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {statistics.medicoConMasConsultas}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Consultas por Médico */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-80">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Gráfico de Dona - Distribución por Especialidades */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-80">
            <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCharts;