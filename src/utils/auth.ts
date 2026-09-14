// Módulo de autenticación para Banco de Tumores INOR
// Gestiona login, logout, sesiones y permisos

import { Usuario, Role, Session } from '@/types';
import { CryptoUtils, StorageUtils, ValidationUtils } from './crypto';
import { storageEngine } from './storage';

export class AuthManager {
  // Verifica credenciales de usuario
  static async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: Usuario }> {
    try {
      // Buscar usuario por username
      const usuario = await storageEngine.getUsuarioByUsername(username);
      
      if (!usuario) {
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }

      if (!usuario.active) {
        return { success: false, error: 'Usuario desactivado. Contacte al administrador.' };
      }

      // Verificar contraseña usando salt almacenado
      const isValid = await CryptoUtils.verifyPassword(password, usuario.password_hash, usuario.salt);
      
      if (!isValid) {
        return { success: false, error: 'Usuario o contraseña incorrectos' };
      }

      // Actualizar último acceso
      const now = new Date().toISOString();
      usuario.last_login = now;
      usuario.updated_at = now;
      await storageEngine.updateUsuario(usuario);

      // Crear sesión
      const session: Session = {
        userId: usuario.id,
        username: usuario.username,
        role: usuario.role,
        isAuthenticated: true,
      };

      StorageUtils.saveSession(session);

      // Registrar en historial
      await storageEngine.createHistorial({
        id: CryptoUtils.generateId(),
        usuario_id: usuario.id,
        username: usuario.username,
        accion: 'login',
        entidad: 'usuario',
        entidad_id: usuario.id,
        descripcion: 'Inicio de sesión',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });

      return { success: true, user: usuario };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error al iniciar sesión' };
    }
  }

  // Cierra sesión
  static logout(): void {
    StorageUtils.clearSession();
  }

  // Obtiene sesión actual
  static getSession(): Session | null {
    return StorageUtils.loadSession();
  }

  // Verifica si hay sesión activa
  static isAuthenticated(): boolean {
    const session = StorageUtils.loadSession();
    return session !== null && session.isAuthenticated;
  }

  // Crea primer administrador
  static async createFirstAdmin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si ya existen usuarios
      const usuarios = await storageEngine.getUsuarios();
      if (usuarios.length > 0) {
        return { success: false, error: 'Ya existen usuarios en el sistema' };
      }

      // Validar contraseña
      const passwordValidation = ValidationUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error };
      }

      // Validar username
      const usernameValidation = ValidationUtils.validateUsername(username);
      if (!usernameValidation.isValid) {
        return { success: false, error: usernameValidation.error };
      }

      // Generar hash seguro con salt
      const { hash, salt } = await CryptoUtils.generateSecureHash(password);

      // Crear usuario administrador
      const now = new Date().toISOString();
      const admin: Usuario = {
        id: CryptoUtils.generateId(),
        username: username,
        password_hash: hash,
        salt: salt,
        role: 'admin',
        active: true,
        created_at: now,
        updated_at: now,
        last_login: null,
      };

      await storageEngine.createUsuario(admin);

      // Registrar en historial
      await storageEngine.createHistorial({
        id: CryptoUtils.generateId(),
        usuario_id: admin.id,
        username: admin.username,
        accion: 'crear_usuario',
        entidad: 'usuario',
        entidad_id: admin.id,
        descripcion: 'Creación del primer administrador',
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });

      return { success: true };
    } catch (error) {
      console.error('Error creando primer admin:', error);
      return { success: false, error: 'Error al crear administrador' };
    }
  }

  // Verifica si es el primer inicio
  static async isFirstStartup(): Promise<boolean> {
    const usuarios = await storageEngine.getUsuarios();
    return usuarios.length === 0;
  }
}