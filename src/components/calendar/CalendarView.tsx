import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { appointmentsService } from "../../services/appointmentsService";
import { Calendar as CalIcon } from "lucide-react";

type Consulta = any;

function groupByDate(consultas: Consulta[]) {
  const map = new Map<string, Consulta[]>();
  consultas.forEach((c) => {
    const raw = c.fecha ?? c.Fecha ?? c.date ?? c.fecha_registro;
    const d = raw ? new Date(raw) : null;
    const key = d
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString()
      : "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  });
  return map;
}

const CalendarView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Prefer service which attaches auth headers
        const data = await appointmentsService.fetchTodasConsultas();
        const list = Array.isArray(data) ? data : data?.consultas ?? [];
        setConsultas(list);
      } catch (err) {
        console.error("Error loading consultas for calendar:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#035397]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">Error cargando calendario: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-[#035397] underline"
        >
          Volver
        </button>
      </div>
    );
  }

  const grouped = groupByDate(consultas);
  // sort keys ascending
  const keys = Array.from(grouped.keys()).sort();

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalIcon className="w-6 h-6 text-[#035397]" />
          <h1 className="text-2xl font-bold">Calendario de Consultas</h1>
        </div>
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 hover:underline"
          >
            Volver
          </button>
        </div>
      </div>

      {keys.length === 0 && (
        <div className="bg-white rounded-lg p-6 shadow">
          No hay citas registradas.
        </div>
      )}

      <div className="space-y-4">
        {keys.map((k) => {
          const day = new Date(k);
          const items = grouped.get(k) || [];
          return (
            <div key={k} className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold">
                {day.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                <span className="ml-2 text-sm text-gray-500">
                  ({items.length} cita{items.length !== 1 ? "s" : ""})
                </span>
              </h3>
              <ul className="mt-3 space-y-2">
                {items.map((c: any, idx: number) => (
                  <li
                    key={idx}
                    className="p-2 border rounded flex justify-between items-center"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {c.hora ?? c.Hora ?? "--:--"} —{" "}
                        {c.motivo ?? c.Motivo ?? "(sin motivo)"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paciente:{" "}
                        {c.nombrePaciente ??
                          c.pacienteNombre ??
                          c.paciente?.nombre ??
                          c.paciente}
                        {" • "}
                        Médico:{" "}
                        {c.nombreMedico ??
                          c.medicoNombre ??
                          c.medico?.nombre ??
                          c.medico}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(
                        c.fecha ?? c.Fecha ?? c.date
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
