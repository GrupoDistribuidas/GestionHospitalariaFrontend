import type { 
  Usuario, 
  UsuariosResponse, 
  UsuarioResponse, 
  CreateUsuarioRequest, 
  UpdateUsuarioRequest, 
  Medico, 
  EmpleadoOption 
} from '../types/usuario';
import { API_BASE } from '../config/api';

export class UsuarioService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Obtiene todos los usuarios
   */
  async getUsuarios(): Promise<Usuario[]> {
    try {
      console.log('Fetching usuarios from:', `${API_BASE}/Usuarios`);
      
      const response = await fetch(`${API_BASE}/Usuarios`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        }
        throw new Error(`Error al obtener usuarios: ${response.status} - ${response.statusText}`);
      }

      const data: UsuariosResponse = await response.json();
      console.log('Usuarios data received:', data);
      return data.usuarios || [];
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('No se puede conectar al servidor. Verifique que el servidor esté disponible y la URL sea correcta.');
      }
      throw error instanceof Error ? error : new Error('Error desconocido al obtener usuarios');
    }
  }

  /**
   * Busca un usuario por nombre de usuario
   */
  async buscarUsuario(nombreUsuario: string): Promise<Usuario> {
    try {
      const response = await fetch(`${API_BASE}/Usuarios/buscar/${nombreUsuario}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('Usuario no encontrado.');
        }
        throw new Error(`Error al buscar usuario: ${response.status}`);
      }

      const data: UsuarioResponse = await response.json();
      return data.usuario;
    } catch (error) {
      console.error('Error searching usuario:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario
   */
  async createUsuario(usuario: CreateUsuarioRequest): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/Usuarios/${usuario.idEmpleado}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(usuario)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        }
        if (response.status === 400) {
          throw new Error('Datos inválidos. Verifique la información ingresada.');
        }
        throw new Error(`Error al crear usuario: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUsuario(id: number, usuario: UpdateUsuarioRequest): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/Usuarios/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(usuario)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        }
        if (response.status === 400) {
          throw new Error('Datos inválidos. Verifique la información ingresada.');
        }
        if (response.status === 404) {
          throw new Error('Usuario no encontrado.');
        }
        throw new Error(`Error al actualizar usuario: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating usuario:', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario
   */
  async deleteUsuario(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/Usuarios/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        }
        if (response.status === 404) {
          throw new Error('Usuario no encontrado.');
        }
        throw new Error(`Error al eliminar usuario: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene la lista de médicos para obtener los empleados
   */
  async getMedicos(): Promise<Medico[]> {
    try {
      const response = await fetch(`${API_BASE}/Medicos`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        }
        throw new Error(`Error al obtener médicos: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching medicos:', error);
      throw new Error('No se pudieron obtener los médicos. Verifique que el servidor esté disponible.');
    }
  }

  /**
   * Obtiene empleados disponibles (que no tienen usuario asignado)
   */
  async getEmpleadosDisponibles(): Promise<EmpleadoOption[]> {
    try {
      console.log('Getting empleados disponibles...');
      
      const [usuarios, medicos] = await Promise.all([
        this.getUsuarios(),
        this.getMedicos()
      ]);

      console.log('Usuarios for empleados check:', usuarios);
      console.log('Medicos for empleados:', medicos);

      // Crear un Set con los IDs de empleados que ya tienen usuario
      const empleadosConUsuario = new Set(usuarios.map(u => u.idEmpleado));

      // Mapear médicos a empleados y marcar cuáles tienen usuario
      const empleados: EmpleadoOption[] = medicos.map(medico => ({
        idEmpleado: medico.idEmpleado,
        nombre: medico.nombreMedico,
        hasUser: empleadosConUsuario.has(medico.idEmpleado)
      }));

      console.log('Empleados processed:', empleados);
      return empleados;
    } catch (error) {
      console.error('Error getting empleados disponibles:', error);
      throw error instanceof Error ? error : new Error('Error obteniendo empleados disponibles');
    }
  }

  /**
   * Valida los datos del usuario
   */
  validateUsuarioData(usuario: CreateUsuarioRequest | UpdateUsuarioRequest, isUpdate = false): string[] {
    const errors: string[] = [];

    if (!usuario.nombreUsuario || usuario.nombreUsuario.trim().length === 0) {
      errors.push('El nombre de usuario es requerido');
    } else if (usuario.nombreUsuario.length > 12) {
      errors.push('El nombre de usuario no debe exceder 12 caracteres');
    }

    // Para actualizaciones, la contraseña es opcional
    const isPasswordProvided = usuario.contraseña && usuario.contraseña.trim().length > 0;
    
    if (!isUpdate) {
      // Para creación, la contraseña es obligatoria
      if (!isPasswordProvided) {
        errors.push('La contraseña es requerida');
      }
    }
    
    // Si se proporciona contraseña (en creación o actualización), validarla
    if (isPasswordProvided) {
      if (usuario.contraseña!.length > 12) {
        errors.push('La contraseña no debe exceder 12 caracteres');
      }
    }

    if (!usuario.rol || (usuario.rol !== 'Usuario' && usuario.rol !== 'Admin')) {
      errors.push('Debe seleccionar un rol válido (Usuario o Admin)');
    }

    if (!usuario.idEmpleado || usuario.idEmpleado <= 0) {
      errors.push('Debe seleccionar un empleado');
    }

    return errors;
  }
}

// Singleton instance
export const usuarioService = new UsuarioService();
