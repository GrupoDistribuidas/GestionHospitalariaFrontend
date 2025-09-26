import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, Users, Stethoscope, LogOut } from "lucide-react";

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onClose }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const handleLinkClick = (path: string) => {
    if (onClose) onClose();
    if (path === "/login") {
      localStorage.removeItem("authToken");
    }
  };

  const sidebarClasses = [
    "bg-gray-900 text-white w-64 h-full z-50 transition-transform duration-300 ease-in-out",
    isMobileOpen
      ? "fixed inset-y-0 left-0 transform translate-x-0 md:translate-x-0"
      : "fixed inset-y-0 left-0 transform -translate-x-full md:translate-x-0",
    "md:fixed md:left-0 md:translate-x-0",
  ].join(" ");

  return (
    <aside className={sidebarClasses}>
      <nav className="p-4 h-full flex flex-col">
        <ul className="space-y-2 flex-1">
          <li>
            <Link
              to="/dashboard"
              onClick={() => handleLinkClick("/dashboard")}
              className={`flex items-center p-2 rounded transition-colors duration-200 ${
                isActive("/dashboard")
                  ? "bg-[#035397] text-white"
                  : "hover:bg-gray-800"
              }`}
            >
              <Home className="w-5 h-5 mr-3" />
              Inicio
            </Link>
          </li>
          <li>
            <Link
              to="/perfil"
              onClick={() => handleLinkClick("/perfil")}
              className={`flex items-center p-2 rounded transition-colors duration-200 ${
                isActive("/perfil")
                  ? "bg-[#035397] text-white"
                  : "hover:bg-gray-800"
              }`}
            >
              <User className="w-5 h-5 mr-3" />
              Personal Médico
            </Link>
          </li>
          <li>
            <Link
              to="/mi-perfil"
              onClick={() => handleLinkClick("/mi-perfil")}
              className={`flex items-center p-2 rounded transition-colors duration-200 ${
                isActive("/mi-perfil")
                  ? "bg-[#035397] text-white"
                  : "hover:bg-gray-800"
              }`}
            >
              <User className="w-5 h-5 mr-3" />
              Perfil Personal
            </Link>
          </li>
          <li>
            <Link
              to="/usuarios"
              onClick={() => handleLinkClick("/usuarios")}
              className={`flex items-center p-2 rounded transition-colors duration-200 ${
                isActive("/usuarios")
                  ? "bg-[#035397] text-white"
                  : "hover:bg-gray-800"
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Gestión de Usuarios
            </Link>
          </li>
          <li>
            <Link
              to="/especialidades"
              onClick={() => handleLinkClick("/especialidades")}
              className={`flex items-center p-2 rounded transition-colors duration-200 ${
                isActive("/especialidades")
                  ? "bg-[#035397] text-white"
                  : "hover:bg-gray-800"
              }`}
            >
              <Stethoscope className="w-5 h-5 mr-3" />
              Gestión de Especialidades
            </Link>
          </li>
        </ul>
        <li className="mt-auto">
          <Link
            to="/login"
            onClick={() => handleLinkClick("/login")}
            className="flex items-center p-2 rounded hover:bg-gray-800 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Link>
        </li>
      </nav>
    </aside>
  );
};

export default Sidebar;
