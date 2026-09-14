// Core types for BioVault Lab

export type Role = 'admin' | 'gestor' | 'visualizador';

export type VialType = 'tumoral' | 'no_tumoral';

export type Localizacion = 'Mama' | 'Pulmon' | 'Prostata' | 'Sistema_digestivo';

export type Sexo = 'Femenino' | 'Masculino' | 'Otro' | 'No_especificado';

export interface Usuario {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  role: Role;
  active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface Biopsia {
  id: string;
  numero_biopsia: string;
  localizacion: Localizacion;
  localizacion_especifica: string | null;
  diagnostico: string;
  anio_extraccion: number;
  sexo: Sexo;
  tanque: string;
  rack: string;
  caja: string;
  posicion: string;
  created_by: string;
  fecha_creacion: string;
  updated_by: string | null;
  fecha_modificacion: string | null;
}

export interface Vial {
  id: string;
  biopsia_id: string;
  identificador_vial: string;
  tipo: VialType;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}

export interface Nota {
  id: string;
  biopsia_id: string;
  usuario_id: string;
  texto: string;
  fecha_creacion: string;
}

export interface AccionHistorial {
  id: string;
  usuario_id: string;
  username: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  descripcion: string;
  fecha: string;
  hora: string;
}

export interface CopiaSeguridad {
  id: string;
  nombre: string;
  fecha: string;
  tamano_bytes: number;
  creado_por: string;
}

export interface AppState {
  usuarios: Usuario[];
  biopsias: Biopsia[];
  viales: Vial[];
  notas: Nota[];
  historial: AccionHistorial[];
  copias_seguridad: CopiaSeguridad[];
}

export interface Session {
  userId: string;
  username: string;
  role: Role;
  isAuthenticated: boolean;
}

export type AccionTipo = 
  | 'login'
  | 'logout'
  | 'crear_biopsia'
  | 'editar_biopsia'
  | 'eliminar_biopsia'
  | 'crear_vial'
  | 'editar_vial'
  | 'eliminar_vial'
  | 'crear_nota'
  | 'eliminar_nota'
  | 'exportar_excel'
  | 'crear_usuario'
  | 'editar_usuario'
  | 'eliminar_usuario'
  | 'cambiar_rol'
  | 'activar_usuario'
  | 'desactivar_usuario'
  | 'restablecer_contrasena'
  | 'restaurar_backup';

// Permission helpers
export const puedeCrearBiopsia = (role: Role): boolean => 
  role === 'admin' || role === 'gestor';

export const puedeEditarBiopsia = (role: Role): boolean => 
  role === 'admin' || role === 'gestor';

export const puedeEliminarBiopsia = (role: Role): boolean => 
  role === 'admin' || role === 'gestor';

export const puedeGestionarViales = (role: Role): boolean => 
  role === 'admin' || role === 'gestor';

export const puedeCrearNotas = (role: Role): boolean => 
  role === 'admin' || role === 'gestor' || role === 'visualizador';

export const puedeExportarExcel = (role: Role): boolean => 
  role === 'admin' || role === 'gestor';

export const puedeVerUsuarios = (role: Role): boolean => 
  role === 'admin';

export const puedeVerHistorial = (role: Role): boolean => 
  role === 'admin';

export const puedeGestionarUsuarios = (role: Role): boolean => 
  role === 'admin';

export const puedeVerReportes = (role: Role): boolean => 
  role === 'admin' || role === 'gestor' || role === 'visualizador';

export const puedeCrearBackup = (role: Role): boolean => 
  role === 'admin';

export const puedeRestaurarBackup = (role: Role): boolean => 
  role === 'admin';