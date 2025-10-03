import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Heart,
  Shield,
  ChevronRight,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { safeFetch } from "../../services/apiClient";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que se hayan ingresado usuario y contraseña
    if (!formData.email || !formData.password) {
      setError("Por favor ingrese usuario y contraseña");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await safeFetch("/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();
      console.debug("Login response:", data);

      // Try to locate token in common locations to be resilient with backend shape
      const tokenValue =
        data?.token ??
        data?.access_token ??
        data?.data?.token ??
        data?.result?.token ??
        data?.accessToken;

      if (data.success && tokenValue) {
        // Guardar token en localStorage
        localStorage.setItem("authToken", tokenValue);
        // Guardar username del formulario como nombre del usuario
        localStorage.setItem("username", formData.email);
        // Guardar datos del usuario si están disponibles
        if (data.user) {
          localStorage.setItem("userData", JSON.stringify(data.user));
        }
        console.log("Login exitoso:", data.message);
        navigate("/dashboard");
      } else {
        // If backend returned success but no token, show helpful message
        if (data.success && !tokenValue) {
          console.error(
            "Login responded success but no token found in response"
          );
          setError(
            "Login exitoso pero no se recibió token. Verifique la respuesta del servidor."
          );
        } else {
          setError(data.message || "Error en el login");
        }
      }
    } catch (err) {
      setError(
        "Error de conexión. Verifique que el servidor esté funcionando."
      );
      console.error("Error de login:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#FCF7F8] via-[#FCF7F8] to-[#f8f1f3] flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-6 h-6 text-[#035397]">
          <Heart className="w-full h-full" />
        </div>
        <div className="absolute top-32 right-20 w-4 h-4 text-[#035397]">
          <Shield className="w-full h-full" />
        </div>
        <div className="absolute bottom-20 left-32 w-5 h-5 text-[#035397]">
          <Heart className="w-full h-full" />
        </div>
        <div className="absolute bottom-40 right-16 w-6 h-6 text-[#035397]">
          <Shield className="w-full h-full" />
        </div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-[#035397] px-8 py-8 text-center relative">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center p-2">
                <img
                  src={logo}
                  alt="Logo Gestión Hospitalaria"
                  className="w-full h-full "
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Gestión Hospitalaria
            </h1>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2 text-left"
                >
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] focus:border-[#035397] text-gray-900 placeholder-gray-500 transition-colors duration-200"
                    placeholder="Ingrese su usuario"
                    autoComplete="username"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2 text-left"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] focus:border-[#035397] text-gray-900 placeholder-gray-500 transition-colors duration-200"
                    placeholder="Ingrese su contraseña"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-[#035397] focus:ring-[#035397] border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Recordarme
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-[#035397] hover:text-blue-800 font-medium transition-colors duration-200"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-bold py-2.5 px-4 rounded-lg transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center group ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#035397] hover:bg-blue-800 text-white hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
