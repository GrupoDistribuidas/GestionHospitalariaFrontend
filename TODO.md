# TODO: Implement Welcome Dashboard Page

## Steps to Complete:

1. [x] Update main.tsx: Wrap root in BrowserRouter from react-router-dom.
2. [x] Create src/components/layout/Sidebar.tsx: Modular sidebar component with navigation links, responsive design.
3. [x] Create src/components/layout/Header.tsx: Modular header component with user info and logout.
4. [x] Create src/components/layout/Layout.tsx: Wrapper for sidebar, header, and main content, responsive flex layout.
5. [x] Update App.tsx: Implement Routes (/login public, /dashboard protected), use Layout for protected routes, auth check with localStorage token.
6. [x] Update LoginScreen.tsx: Import useNavigate, on login success store token and navigate to /dashboard, remove alert.
7. [x] Create src/components/dashboard/DashboardContent.tsx: Fetch stats from backend report endpoints, display welcome title, stat cards (Agenda Pendiente, Resumen General, Calendario), buttons (Agenda Cita, Calendario) with navigation stubs.
8. [x] Create src/components/dashboard/Dashboard.tsx: Use Layout with DashboardContent as main content.
9. [x] Test: Run dev server, login, verify redirect, data fetch, responsive UI on mobile/desktop, no breakage to login.

## Notes:

- Use TailwindCSS for all styling, match screenshot layout/colors (blue #035397, dark sidebar, white main).
- Fetch endpoints: /api/Reportes/resumen-general, /api/Reportes/estadisticas-consultas, /api/Reportes/estadisticas-pacientes with Authorization: Bearer {token}.
- Icons: Use lucide-react (e.g., Home, User, Users, Stethoscope).
- Responsive: Mobile - hamburger toggle for sidebar overlay; Desktop - fixed sidebar.
- After each step, update TODO.md with [x] for completed.

# TODO: Implement Medicos Management Page

## Steps to Complete:

1. [x] Create src/components/dashboard/MedicosManagement.tsx: Implement tabbed component for Personal Medico and Gestión Especialidades, with API fetches, search, tables, modals for CRUD.

2. [x] Update src/App.tsx: Import MedicosManagement, replace /perfil route placeholder, add /especialidades redirect to /perfil?tab=especialidades.

3. [] Test: Run npm run dev, navigate to /perfil, verify UI loads, data fetches from APIs, tabs switch, search works, actions (CRUD modals) function without errors.

## Notes:

- API base: http://localhost:5000/api

- Use fetch with Authorization header.

- Match UI from image: Blue header, search input, tables with badges, icons for actions.

- Handle loading, errors, refresh after CRUD.
