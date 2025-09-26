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

  if (!token) {
    return null; // Don't render header on login page
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-40 md:left-64">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <button
            onClick={onMenuToggle}
            className="md:hidden mr-3 p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <Link to="/dashboard" className="flex items-center">
            <img
              src={logo}
              alt="Logo Gestión Hospitalaria"
              className="h-8 w-8 mr-2"
            />
            <span className="text-xl font-bold text-[#035397]">
              Gestión Hospitalaria
            </span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {userName}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
