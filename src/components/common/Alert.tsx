import React from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

type AlertType = "success" | "error" | "info";

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const base = "p-3 rounded mb-4 flex items-start gap-3";
  const variants: Record<AlertType, string> = {
    success: "bg-green-50 text-green-800 border border-green-200",
    error: "bg-red-50 text-red-800 border border-red-200",
    info: "bg-blue-50 text-blue-800 border border-blue-200",
  };
  const Icon =
    type === "success" ? CheckCircle : type === "error" ? XCircle : Info;

  return (
    <div className={`${base} ${variants[type]}`}>
      <div className="mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-sm">{message}</div>
      {onClose && (
        <button
          aria-label="Cerrar mensaje"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 ml-2"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
