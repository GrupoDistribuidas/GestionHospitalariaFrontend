# TODO: Implementation Plan for Gestión de Usuarios and Perfil Personal

Based on the approved plan, here are the logical steps to implement the features:

- [x] Step 1: Create src/components/dashboard/UsuariosManagement.tsx

  - New component modeled after MedicosManagement.tsx.
  - Implement data fetching from /api/usuarios.
  - Add table with columns: Nombre, Email, Rol, Estado, Acciones.
  - Include search/filtering, modals for CRUD (create/edit/view/delete), notifications, status badges.
  - Handlers: fetchData, handleCreateUsuario, handleUpdateUsuario, handleDeleteUsuario.

- [x] Step 2: Create src/components/dashboard/PerfilPersonal.tsx

  - New display-only component.
  - Fetch current user profile from /api/usuario/perfil on mount.
  - Layout: Header with avatar/name/rol/status, grid sections for Información Personal, Laboral, Contacto.
  - Use consistent styling with loading/error states.

- [x] Step 3: Update src/App.tsx

  - Import UsuariosManagement and PerfilPersonal.
  - Update /usuarios route to render <UsuariosManagement />.
  - Add new route /mi-perfil to render <PerfilPersonal /> within Layout.

- [x] Step 4: Update src/components/layout/Sidebar.tsx

  - Change /perfil link label from "Gestion Médicos" to "Personal Médico".
  - Add new link for /mi-perfil: User icon, label "Perfil Personal" (after Personal Médico link).

- [x] Step 5: Testing and Verification
  - Run dev server (npm run dev).
  - Navigate to /usuarios: Verify table loads, search works, CRUD modals function (assume API responses).
  - Navigate to /mi-perfil: Verify profile data displays correctly.
  - Check responsive design, auth redirects, error handling.
  - Use browser_action for UI screenshots if needed.
  - Note: Without backend, 404 errors are expected; components show error states with retry buttons.

Progress will be updated as steps are completed.
