import { useEffect } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  Outlet,
} from "react-router-dom";
import LoginScreen from "./components/auth/LoginScreen";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import MedicosManagement from "./components/dashboard/MedicosManagement";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
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
              <div>Gestión de Usuarios</div>
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
