// Tipos para la gestión de usuarios

export interface Empleado {
  idEmpleado: number;
  nombre: string;
  email: string;
  telefono: string;
}

export interface Usuario {
  idUsuario: number;
  nombreUsuario: string;
  rol: 'Usuario' | 'Admin';
  idEmpleado: number;
  empleado: Empleado;
}

export interface UsuariosResponse {
  success: boolean;
  message: string;
  usuarios: Usuario[];
}

export interface UsuarioResponse {
  success: boolean;
  message: string;
  usuario: Usuario;
}

export interface CreateUsuarioRequest {
  nombreUsuario: string;
  contraseña: string;
  rol: string;
  idEmpleado: number;
}

export interface UpdateUsuarioRequest {
  idUsuario: number;
  nombreUsuario: string;
  contraseña?: string; // Opcional - solo si se quiere cambiar
  rol: string;
  idEmpleado: number;
}

export interface Medico {
  idMedico: number;
  nombreMedico: string;
  especialidad: string;
  idEmpleado: number;
}

export interface EmpleadoOption {
  idEmpleado: number;
  nombre: string;
  hasUser: boolean;
}
