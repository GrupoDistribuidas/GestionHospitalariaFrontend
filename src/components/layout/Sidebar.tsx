import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Users,
  Stethoscope,
  FileText,
  LogOut,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { isAdmin } from "../../services/auth";

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onClose }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<Record<string, boolean>>({
    perfil: true,
    gestion: true,
    reportes: true,
  });

  const isActive = (path: string) => location.pathname === path;

  const handleLinkClick = (path: string) => {
    if (onClose) onClose();
    if (path === "/login") {
      localStorage.removeItem("authToken");
    }
  };

  const toggleGroup = (id: string) =>
    setOpenGroup((s) => ({ ...s, [id]: !s[id] }));

  const baseWidth = isCollapsed ? "w-20" : "w-64";
  const sidebarClasses = [
    `bg-[#2C3E50] text-white ${baseWidth} h-full z-50 transition-transform duration-300 ease-in-out`,
    "border-r border-black/10 shadow-lg",
    isMobileOpen
      ? "fixed inset-y-0 left-0 transform translate-x-0 md:translate-x-0"
      : "fixed inset-y-0 left-0 transform -translate-x-full md:translate-x-0",
    "md:fixed md:left-0 md:translate-x-0",
  ].join(" ");

  const Label: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    isCollapsed ? null : <span className="truncate">{children}</span>;

  const LinkItem: React.FC<{
    to: string;
    icon: React.ReactNode;
    label: string;
  }> = ({ to, icon, label }) => (
    <li>
      <Link
        to={to}
        onClick={() => handleLinkClick(to)}
        className={`flex items-center p-2 rounded transition-colors duration-200 ${
          isActive(to) ? "bg-[#035397] text-white" : "hover:bg-gray-800"
        } ${isCollapsed ? "justify-center" : ""}`}
        title={isCollapsed ? label : undefined}
      >
        <span className="w-5 h-5 mr-0 md:mr-3 flex items-center justify-center">
          {icon}
        </span>
        <Label>{label}</Label>
      </Link>
    </li>
  );

  const GroupHeader: React.FC<{
    id: string;
    icon: React.ReactNode;
    title: string;
  }> = ({ id, icon, title }) => (
    <button
      type="button"
      onClick={() => toggleGroup(id)}
      className={`w-full flex items-center gap-3 text-xs uppercase tracking-wide text-gray-300/90 ${
        isCollapsed ? "justify-center" : "justify-between"
      }`}
      title={isCollapsed ? title : undefined}
    >
      <div
        className={`flex items-center ${isCollapsed ? "justify-center" : ""}`}
      >
        <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
        <Label>
          <span className="ml-3">{title}</span>
        </Label>
      </div>
      {!isCollapsed && (
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            openGroup[id] ? "rotate-0" : "-rotate-90"
          }`}
        />
      )}
    </button>
  );

  return (
    <>
      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        {/* Header / botón colapsar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div
            className={`font-semibold ${
              isCollapsed ? "text-base text-center w-full" : "text-lg"
            }`}
          >
            {isCollapsed ? "GH" : "Gestión Hospitalaria"}
          </div>

          {/* Botón plegar (solo desktop) */}
          <button
            type="button"
            className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-800"
            onClick={() => setIsCollapsed((v) => !v)}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            title={isCollapsed ? "Expandir" : "Colapsar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="p-4 h-[calc(100%-64px)] flex flex-col">
          {/* Inicio */}
          <ul className="space-y-2">
            <LinkItem to="/dashboard" icon={<Home />} label="Inicio" />
          </ul>

          {/* PERFIL */}
          <div className="mt-4">
            <GroupHeader id="perfil" icon={<User />} title="Perfil" />
            {!isCollapsed && openGroup.perfil && (
              <ul className="mt-2 space-y-2 pl-2">
                {isAdmin() && (
                  <LinkItem
                    to="/perfil"
                    icon={<User className="w-5 h-5" />}
                    label="Personal Médico"
                  />
                )}
                <LinkItem
                  to="/mi-perfil"
                  icon={<User className="w-5 h-5" />}
                  label="Perfil Personal"
                />
              </ul>
            )}
          </div>

          {/* GESTIÓN */}
          <div className="mt-4">
            <GroupHeader id="gestion" icon={<Stethoscope />} title="Gestión" />
            {!isCollapsed && openGroup.gestion && (
              <ul className="mt-2 space-y-2 pl-2">
                {isAdmin() && (
                  <LinkItem
                    to="/usuarios"
                    icon={<Users className="w-5 h-5" />}
                    label="Gestión de Usuarios"
                  />
                )}
                {isAdmin() && (
                  <LinkItem
                    to="/especialidades"
                    icon={<Stethoscope className="w-5 h-5" />}
                    label="Gestión de Especialidades"
                  />
                )}
                <LinkItem
                  to="/pacientes"
                  icon={<HeartPulse className="w-5 h-5" />}
                  label="Gestión de Pacientes"
                />
                {/* Agenda existente (creación rápida de citas) se mantiene para usuarios no-admin */}
                {!isAdmin() && (
                  <LinkItem
                    to="/agenda"
                    icon={<FileText className="w-5 h-5" />}
                    label="Gestión de Citas"
                  />
                )}

                {/* Nueva pantalla: gestión completa de consultas (listado, CRUD) */}
                <LinkItem
                  to="/consultas"
                  icon={<FileText className="w-5 h-5" />}
                  label="Consultas"
                />
              </ul>
            )}
          </div>

          {/* REPORTES */}
          {isAdmin() && (
            <div className="mt-4">
              <GroupHeader id="reportes" icon={<FileText />} title="Reportes" />
              {!isCollapsed && openGroup.reportes && (
                <ul className="mt-2 space-y-2 pl-2">
                  <LinkItem
                    to="/reportes"
                    icon={<FileText className="w-5 h-5" />}
                    label="Reportes de Consultas"
                  />
                </ul>
              )}
            </div>
          )}
          {/* Logout */}
          <div className="mt-auto pt-4 border-t border-white/10">
            <ul>
              <li>
                <Link
                  to="/login"
                  onClick={() => handleLinkClick("/login")}
                  className={`flex items-center p-2 rounded transition-colors duration-200 hover:bg-gray-800 ${
                    isCollapsed ? "justify-center" : ""
                  }`}
                  title={isCollapsed ? "Cerrar Sesión" : undefined}
                >
                  <span className="w-5 h-5 mr-0 md:mr-3 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </span>
                  <Label>Cerrar Sesión</Label>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
