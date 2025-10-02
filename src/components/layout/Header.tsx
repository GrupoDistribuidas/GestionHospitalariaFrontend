import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut, Menu } from "lucide-react";
import logo from "../../assets/logo.png";

interface HeaderProps {
  onMenuToggle?: () => void; // For mobile menu toggle
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const userName = localStorage.getItem("username") || "Usuario";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  if (!token) return null;

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-white/90 backdrop-blur-md
        shadow-[0_14px_32px_-14px_rgba(2,6,23,0.28)]
        after:content-[''] after:absolute after:inset-x-0 after:-bottom-px after:h-px
        after:bg-gradient-to-r after:from-transparent after:via-gray-200 after:to-transparent
      `}
    >
      {/* Desktop / Tablet */}
      <div
        className="hidden md:flex items-center justify-between pr-8"
        style={{
          // separa un poco más del sidebar y sube la altura percibida
          paddingLeft: "calc(var(--sidebar-width, 16rem) + 1.25rem)",
          paddingTop: "1rem",
          paddingBottom: "1rem",
        }}
      >
        {/* Branding */}
        <Link to="/dashboard" className="group flex items-center min-w-0">
          <img
            src={logo}
            alt="Logo Gestión Hospitalaria"
            className="h-9 w-9 mr-3 rounded shadow-sm ring-1 ring-black/5 group-hover:scale-[1.02] transition"
          />
          <span className="text-[1.25rem] leading-none font-bold text-[#035397] tracking-wide truncate">
            Gestión Hospitalaria
          </span>
        </Link>

        {/* Perfil / acciones */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full bg-gray-50 ring-1 ring-gray-200">
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#035397]/10 text-[#035397] ring-1 ring-[#035397]/15">
              <User className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium text-gray-800">{userName}</span>
          </div>

          <button
            onClick={handleLogout}
            className="
              inline-flex items-center gap-2 px-3.5 py-2
              text-gray-600 hover:text-gray-900
              rounded-md hover:bg-gray-100
              ring-1 ring-transparent hover:ring-gray-200
              transition
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#035397]/40
            "
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex md:hidden items-center justify-between px-4 py-4">
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="mr-3 p-2 rounded-md hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#035397]/40"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <Link to="/dashboard" className="flex items-center">
            <img
              src={logo}
              alt="Logo Gestión Hospitalaria"
              className="h-9 w-9 mr-3 rounded shadow-sm ring-1 ring-black/5"
            />
            <span className="text-lg font-bold text-[#035397] tracking-wide">
              Gestión Hospitalaria
            </span>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="
            inline-flex items-center gap-2 px-3 py-2
            text-gray-600 hover:text-gray-900
            rounded-md hover:bg-gray-100 transition
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#035397]/40
          "
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden xs:block">Salir</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
