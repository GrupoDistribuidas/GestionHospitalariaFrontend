import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Shield,
  ChevronDown,
  X
} from 'lucide-react';
import { usuarioService } from '../../services/usuarioService';
import { API_BASE } from '../../config/api';
import type { Usuario, CreateUsuarioRequest, UpdateUsuarioRequest, EmpleadoOption } from '../../types/usuario';

// Error Boundary para capturar errores
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Error en la aplicación</h2>
          </div>
          <p className="text-red-700 mb-4">
            Ha ocurrido un error inesperado. Por favor, verifique la consola para más detalles.
          </p>
          <p className="text-sm text-red-600 mb-4">
            Error: {this.state.error?.message}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined });
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const GestionUsuarios: React.FC = () => {
  // Estados principales
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState<EmpleadoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searching, setSearching] = useState(false);

  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  // Estados para formularios
  const [createForm, setCreateForm] = useState<CreateUsuarioRequest>({
    nombreUsuario: '',
    contraseña: '',
    rol: '',
    idEmpleado: 0
  });
  const [editForm, setEditForm] = useState<UpdateUsuarioRequest>({
    idUsuario: 0,
    nombreUsuario: '',
    contraseña: '',
    rol: '',
    idEmpleado: 0
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para el selector de empleados
  const [empleadoSearchTerm, setEmpleadoSearchTerm] = useState<string>('');
  const [showEmpleadoDropdown, setShowEmpleadoDropdown] = useState<boolean>(false);
  const [filteredEmpleados, setFilteredEmpleados] = useState<EmpleadoOption[]>([]);

  const navigate = useNavigate();

  // Cargar datos iniciales con mejor manejo de errores
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    console.log('Starting to load data...');
    loadData();
  }, [navigate]);

  // Filtrar empleados según búsqueda
  useEffect(() => {
    try {
      if (!empleadoSearchTerm.trim()) {
        setFilteredEmpleados(empleadosDisponibles.filter(emp => !emp.hasUser));
      } else {
        const filtered = empleadosDisponibles.filter(empleado =>
          !empleado.hasUser &&
          empleado.nombre.toLowerCase().includes(empleadoSearchTerm.toLowerCase())
        );
        setFilteredEmpleados(filtered);
      }
    } catch (err) {
      console.error('Error filtering empleados:', err);
      setError('Error filtrando empleados');
    }
  }, [empleadoSearchTerm, empleadosDisponibles]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Loading usuarios and empleados...');
      console.log('API_BASE being used:', API_BASE);
      
      const [usuariosData, empleadosData] = await Promise.all([
        usuarioService.getUsuarios(),
        usuarioService.getEmpleadosDisponibles()
      ]);
      
      console.log('Usuarios loaded:', usuariosData);
      console.log('Empleados loaded:', empleadosData);
      
      setUsuarios(usuariosData || []);
      setEmpleadosDisponibles(empleadosData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Error cargando datos');
      
      if (err instanceof Error && err.message.includes('Sesión expirada')) {
        localStorage.removeItem('authToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Ingrese un nombre de usuario para buscar');
      return;
    }

    setSearching(true);
    setError('');
    
    try {
      const usuario = await usuarioService.buscarUsuario(searchTerm.trim());
      setUsuarios([usuario]);
    } catch (err) {
      console.error('Error searching usuario:', err);
      setError(err instanceof Error ? err.message : 'Error buscando usuario');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setError('');
    loadData();
  };

  const handleCreate = async () => {
    setError('');
    
    // Validar datos
    const errors = usuarioService.validateUsuarioData(createForm);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    try {
      await usuarioService.createUsuario(createForm);
      setShowCreateModal(false);
      resetCreateForm();
      await loadData();
    } catch (err) {
      console.error('Error creating usuario:', err);
      setError(err instanceof Error ? err.message : 'Error creando usuario');
    }
  };

  const handleEdit = async () => {
    setError('');
    
    // Validar contraseñas solo si se está intentando cambiar la contraseña
    if (editForm.contraseña && editForm.contraseña.trim() !== '') {
      if (editForm.contraseña !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      
      // Validar que la contraseña tenga al menos 1 carácter si se está cambiando
      if (editForm.contraseña.length < 1) {
        setError('La contraseña debe tener al menos 1 carácter');
        return;
      }
    }

    // Validar otros datos (excluyendo contraseña si está vacía)
    const dataToValidate = { ...editForm };
    const errors = usuarioService.validateUsuarioData(dataToValidate, true); // true indica que es una actualización
    
    if (errors.length > 0) {
      // Filtrar errores de contraseña si no se está cambiando
      const filteredErrors = !editForm.contraseña || editForm.contraseña.trim() === '' 
        ? errors.filter(error => !error.toLowerCase().includes('contraseña'))
        : errors;
        
      if (filteredErrors.length > 0) {
        setError(filteredErrors.join(', '));
        return;
      }
    }

    try {
      // Preparar datos para envío
      const updateData = { ...editForm };
      // Si la contraseña está vacía, no la incluimos en la actualización
      if (!editForm.contraseña || editForm.contraseña.trim() === '') {
        delete updateData.contraseña;
      }
      
      await usuarioService.updateUsuario(editForm.idUsuario, updateData);
      setShowEditModal(false);
      resetEditForm();
      await loadData();
    } catch (err) {
      console.error('Error updating usuario:', err);
      setError(err instanceof Error ? err.message : 'Error actualizando usuario');
    }
  };

  const handleDelete = async () => {
    if (!selectedUsuario) return;

    try {
      await usuarioService.deleteUsuario(selectedUsuario.idUsuario);
      setShowDeleteModal(false);
      setSelectedUsuario(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting usuario:', err);
      setError(err instanceof Error ? err.message : 'Error eliminando usuario');
    }
  };

  const openEditModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setEditForm({
      idUsuario: usuario.idUsuario,
      nombreUsuario: usuario.nombreUsuario,
      contraseña: '',
      rol: usuario.rol,
      idEmpleado: usuario.idEmpleado
    });
    setConfirmPassword('');
    setError('');
    setShowEditModal(true);
  };

  const openViewModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowViewModal(true);
  };

  const openDeleteModal = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setShowDeleteModal(true);
  };

  const resetCreateForm = () => {
    setCreateForm({
      nombreUsuario: '',
      contraseña: '',
      rol: '',
      idEmpleado: 0
    });
    setEmpleadoSearchTerm('');
  };

  const resetEditForm = () => {
    setEditForm({
      idUsuario: 0,
      nombreUsuario: '',
      contraseña: '',
      rol: '',
      idEmpleado: 0
    });
    setConfirmPassword('');
  };

  const handleEmpleadoSelect = (empleado: EmpleadoOption) => {
    setCreateForm(prev => ({ ...prev, idEmpleado: empleado.idEmpleado }));
    setEmpleadoSearchTerm(empleado.nombre);
    setShowEmpleadoDropdown(false);
  };

  const clearEmpleadoSelection = () => {
    setCreateForm(prev => ({ ...prev, idEmpleado: 0 }));
    setEmpleadoSearchTerm('');
    setShowEmpleadoDropdown(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios del sistema hospitalario</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre de usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Buscar</span>
          </button>
          {searchTerm && (
            <button 
              onClick={clearSearch}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Usuarios Registrados ({usuarios.length})
          </h2>
        </div>

        {usuarios.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No se encontraron usuarios
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuarios.map((usuario) => (
                  <tr key={usuario.idUsuario} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.nombreUsuario}
                          </div>
                          <div className="text-sm text-gray-500">
                           
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.empleado?.nombre || 'Sin empleado asignado'}</div>
                    {/**  <div className="text-sm text-gray-500">ID: {usuario.empleado?.idEmpleado || 'N/A'}</div>*/} 
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {usuario.empleado?.email || 'Sin email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.rol === 'Admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openViewModal(usuario)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(usuario)}
                          className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(usuario)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Crear Nuevo Usuario</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario (máx. 12 caracteres)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={createForm.nombreUsuario}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, nombreUsuario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese nombre de usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña (máx. 12 caracteres)
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={createForm.contraseña}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, contraseña: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingrese contraseña"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={createForm.rol}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, rol: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un rol</option>
                  <option value="Usuario">Usuario</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar empleado..."
                    value={empleadoSearchTerm}
                    onChange={(e) => {
                      setEmpleadoSearchTerm(e.target.value);
                      setShowEmpleadoDropdown(true);
                    }}
                    onFocus={() => setShowEmpleadoDropdown(true)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {createForm.idEmpleado > 0 && (
                    <button
                      onClick={clearEmpleadoSelection}
                      className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  
                  {showEmpleadoDropdown && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                      {filteredEmpleados.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                          No hay empleados disponibles
                        </div>
                      ) : (
                        filteredEmpleados.map((empleado) => (
                          <button
                            key={empleado.idEmpleado}
                            onClick={() => handleEmpleadoSelect(empleado)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                          >
                            <div className="font-medium text-gray-900">{empleado.nombre}</div>
                           <div className="text-gray-500 text-xs">ID: {empleado.idEmpleado}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Editar Usuario</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Empleado (No editable)
                </label>
                <input
                  type="text"
                  value={selectedUsuario.empleado?.nombre || 'Sin empleado asignado'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario (máx. 12 caracteres)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={editForm.nombreUsuario}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nombreUsuario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña (máx. 12 caracteres) - Opcional
                </label>
                <input
                  type="password"
                  maxLength={12}
                  value={editForm.contraseña}
                  onChange={(e) => setEditForm(prev => ({ ...prev, contraseña: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dejar vacío para mantener contraseña actual"
                />
                <div className="text-xs text-gray-500 mt-1">
                   Solo ingrese una nueva contraseña si desea cambiarla
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña {editForm.contraseña && editForm.contraseña.trim() && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={12}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!editForm.contraseña || !editForm.contraseña.trim()}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                      !editForm.contraseña || !editForm.contraseña.trim()
                        ? 'border-gray-200 bg-gray-50 text-gray-400'
                        : confirmPassword && editForm.contraseña
                        ? editForm.contraseña === confirmPassword
                          ? 'border-green-300 focus:ring-green-500 bg-green-50'
                          : 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder={
                      !editForm.contraseña || !editForm.contraseña.trim() 
                        ? "No requerido" 
                        : "Confirme la nueva contraseña"
                    }
                  />
                  {editForm.contraseña && editForm.contraseña.trim() && confirmPassword && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {editForm.contraseña === confirmPassword ? (
                        <div className="flex items-center text-green-600" title="Las contraseñas coinciden">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600" title="Las contraseñas no coinciden">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {editForm.contraseña && editForm.contraseña.trim() && (
                  <div className={`mt-1 text-xs ${
                    !confirmPassword
                      ? 'text-gray-500'
                      : editForm.contraseña === confirmPassword
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {!confirmPassword
                      ? '⚠️ Confirme la nueva contraseña'
                      : editForm.contraseña === confirmPassword
                      ? '✓ Las contraseñas coinciden'
                      : '✗ Las contraseñas no coinciden'
                    }
                  </div>
                )}
                {(!editForm.contraseña || !editForm.contraseña.trim()) && (
                  <div className="mt-1 text-xs text-gray-500">
                    ℹ️ Confirmación no requerida cuando no se cambia la contraseña
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={editForm.rol}
                  onChange={(e) => setEditForm(prev => ({ ...prev, rol: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Usuario">Usuario</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetEditForm();
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Usuario */}
      {showViewModal && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Detalles Completos del Usuario</h3>
            </div>
            <div className="px-6 py-4">
              {/* Header del Usuario */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">{selectedUsuario.nombreUsuario}</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  selectedUsuario.rol === 'Admin' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  <Shield className="w-4 h-4 mr-1" />
                  {selectedUsuario.rol}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información del Usuario */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Información del Usuario
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-gray-600">ID Usuario</div>
                      <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">{selectedUsuario.idUsuario}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Nombre de Usuario</div>
                      <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">{selectedUsuario.nombreUsuario}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Rol del Sistema</div>
                      <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">{selectedUsuario.rol}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">ID Empleado Asociado</div>
                      <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">{selectedUsuario.idEmpleado}</div>
                    </div>
                  </div>
                </div>

                {/* Información del Empleado */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Información del Empleado
                  </h5>
                  {selectedUsuario.empleado ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-600">ID Empleado</div>
                        <div className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">{selectedUsuario.empleado.idEmpleado}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Nombre Completo</div>
                        <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">{selectedUsuario.empleado.nombre}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          Email
                        </div>
                        <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">{selectedUsuario.empleado.email}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          Teléfono
                        </div>
                        <div className="text-sm text-gray-900 bg-white px-2 py-1 rounded border">{selectedUsuario.empleado.telefono}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No hay información de empleado disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Usuario */}
      {showDeleteModal && selectedUsuario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span>Eliminar Usuario</span>
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-gray-700 mb-2">
                  ¿Está seguro que desea eliminar el usuario?
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedUsuario.nombreUsuario}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Empleado: {selectedUsuario.empleado?.nombre || 'Sin empleado asignado'}
                </p>
                <p className="text-sm text-red-600 mt-4">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal envuelto en ErrorBoundary
const GestionUsuariosWithErrorBoundary: React.FC = () => {
  return (
    <ErrorBoundary>
      <GestionUsuarios />
    </ErrorBoundary>
  );
};

export default GestionUsuariosWithErrorBoundary;