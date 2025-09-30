import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import logo from "../../assets/logo.png";

const ForgotPasswordScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [username, setUsername] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setMessage("Por favor ingrese su nombre de usuario");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch("http://localhost:5088/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || "Correo de recuperación enviado exitosamente. Revisa tu bandeja de entrada.");
        setMessageType("success");
        setEmailSent(true); // Marcar que el correo fue enviado
        setUsername(""); // Limpiar el campo
      } else {
        setMessage(data.message || "Error al enviar el correo. Verifica que tu username sea correcto y que tengas un email registrado.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Error de conexión. Verifique que el servidor esté funcionando.");
      setMessageType("error");
      console.error("Error en recuperación de contraseña:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log("Botón Volver al Login clickeado"); // Debug log
    console.log("Navigate function:", navigate); // Debug log
    
    try {
      navigate("/login", { replace: true });
      console.log("Navigate ejecutado exitosamente"); // Debug log
    } catch (error) {
      console.error("Error con navigate:", error);
      // Fallback usando window.location
      window.location.href = "/login";
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#FCF7F8] via-[#FCF7F8] to-[#f8f1f3] flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
<div className="absolute inset-0 opacity-5 pointer-events-none">

        <div className="absolute top-10 left-10 w-6 h-6 text-[#035397]">
          <Mail className="w-full h-full" />
        </div>
        <div className="absolute top-32 right-20 w-4 h-4 text-[#035397]">
          <CheckCircle className="w-full h-full" />
        </div>
        <div className="absolute bottom-20 left-32 w-5 h-5 text-[#035397]">
          <Mail className="w-full h-full" />
        </div>
        <div className="absolute bottom-40 right-16 w-6 h-6 text-[#035397]">
          <CheckCircle className="w-full h-full" />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-r from-[#035397] to-blue-700">
            <div className="flex justify-center mb-4">
              <img
                src={logo}
                alt="Hospital Logo"
                className="h-16 w-16 object-contain bg-white rounded-full p-2"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Recuperar Contraseña
            </h1>
            <p className="text-blue-100 text-sm">
              Ingresa tu nombre de usuario para recibir instrucciones de recuperación
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-gray-700 mb-2 text-left"
                >
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#035397] focus:border-[#035397] text-gray-900 placeholder-gray-500 transition-colors duration-200"
                    placeholder="Ingrese su nombre de usuario"
                    disabled={isLoading || emailSent}
                  />
                </div>
              </div>

              {/* Message */}
              {message && (
                <div
                  className={`flex items-center p-4 rounded-lg border ${
                    messageType === "success"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-red-50 border-red-300 text-red-700"
                  }`}
                >
                  {messageType === "success" ? (
                    <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  )}
                  <span className="text-sm">{message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || emailSent}
                className={`w-full font-bold py-2.5 px-4 rounded-lg transition-all duration-200 transform focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center ${
                  isLoading || emailSent
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#035397] hover:bg-blue-800 text-white hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Enviando...
                  </>
                ) : emailSent ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Correo Enviado
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Correo de Recuperación
                  </>
                )}
              </button>
            </form>

            {/* Back to Login - Fuera del formulario */}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center text-[#035397] hover:text-blue-800 font-medium py-3 px-4 transition-colors duration-200 mt-4 border border-transparent hover:border-blue-200 rounded-lg cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Login
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t">
            <p className="text-xs text-gray-500 text-center">
              Si no recibes el correo, verifica tu carpeta de spam o contacta al administrador del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;