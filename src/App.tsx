import {
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import LoginScreen from "./components/auth/LoginScreen";
import ForgotPasswordScreen from "./components/auth/ForgotPasswordScreen";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import MedicosManagement from "./components/dashboard/MedicosManagement";
import UsuariosManagement from "./components/dashboard/UsuariosManagement";
import PerfilPersonal from "./components/dashboard/PerfilPersonal";
import ConsultationReports from "./components/consultationReport/ConsultationReports";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/perfil"
          element={
            <Layout>
              <MedicosManagement />
            </Layout>
          }
        />
        <Route
          path="/usuarios"
          element={
            <Layout>
              <UsuariosManagement />
            </Layout>
          }
        />
        <Route
          path="/mi-perfil"
          element={
            <Layout>
              <PerfilPersonal />
            </Layout>
          }
        />
        <Route
          path="/reportes"
          element={
            <Layout>
              <ConsultationReports />
            </Layout>
          }
        />
        <Route
          path="/especialidades"
          element={<Navigate to="/perfil?tab=especialidades" replace />}
        />
      </Route>
    </Routes>
  );
}

function ProtectedRoute() {
  const token = localStorage.getItem("authToken");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default App;
