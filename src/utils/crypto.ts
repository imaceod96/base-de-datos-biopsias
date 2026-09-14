// Utilidades criptográficas seguras para Banco de Tumores INOR
// Utiliza Web Crypto API con PBKDF2 y SHA-256 para el hash de contraseñas

export class CryptoUtils {
  private static readonly SALT_SIZE = 16;
  private static readonly KEY_SIZE = 32;
  private static readonly ITERATIONS = 100000;

  // Genera un salt aleatorio
  static generateSalt(): Uint8Array {
    const array = new Uint8Array(this.SALT_SIZE);
    crypto.getRandomValues(array);
    return array;
  }

  // Hashea una contraseña con un salt
  static async hashPassword(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: 'AES-GCM', length: this.KEY_SIZE * 8 },
      true, // <-- Allow the key to be extractable
      ['encrypt', 'decrypt']
    );

    // Exportar la clave como array de bytes
    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    return this.arrayToHex(exportedKey);
  }

  // Verifica una contraseña contra un hash almacenado
  static async verifyPassword(password: string, storedHashHex: string, saltHex: string): Promise<boolean> {
    try {
      const salt = this.hexToArray(saltHex);
      const computedHash = await this.hashPassword(password, salt);
      return computedHash === storedHashHex;
    } catch (error) {
      console.error('Error verificando contraseña:', error);
      return false;
    }
  }

  // Genera un hash seguro para almacenar (con salt)
  static async generateSecureHash(password: string): Promise<{ hash: string; salt: string }> {
    const salt = this.generateSalt();
    const hash = await this.hashPassword(password, salt);
    return {
      hash: hash,
      salt: this.arrayToHex(salt)
    };
  }

  // Convierte array de bytes a hex
  static arrayToHex(array: ArrayBuffer): string {
    return Array.from(new Uint8Array(array))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Convierte hex a array de bytes
  static hexToArray(hex: string): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  // Genera un ID único
  static generateId(): string {
    return crypto.randomUUID();
  }

  // Genera un hash simple para auditoría (no reversible)
  static async generateAuditHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayToHex(hashBuffer);
  }
}

// Utilidades para el almacenamiento local
export class StorageUtils {
  private static readonly STORAGE_KEY = 'banco_tumores_inor_app_state';
  private static readonly SESSION_KEY = 'banco_tumores_inor_session';

  // Guarda el estado de la aplicación
  static saveAppState(state: any): void {
    try {
      const data = JSON.stringify(state);
      localStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('Error guardando estado de la aplicación:', error);
    }
  }

  // Carga el estado de la aplicación
  static loadAppState(): any {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error cargando estado de la aplicación:', error);
      return null;
    }
  }

  // Guarda la sesión
  static saveSession(session: any): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Error guardando sesión:', error);
    }
  }

  // Carga la sesión
  static loadSession(): any {
    try {
      const data = localStorage.getItem(this.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error cargando sesión:', error);
      return null;
    }
  }

  // Elimina la sesión
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Exporta el estado como JSON para copias de seguridad
  static exportStateAsJSON(state: any): string {
    return JSON.stringify(state, null, 2);
  }

  // Importa estado desde JSON
  static importStateFromJSON(jsonString: string): any {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error importando estado desde JSON:', error);
      return null;
    }
  }
}

// Utilidades de fecha y hora
export class DateUtils {
  // Formatea fecha a formato dd/mm/yyyy
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Formatea hora a formato HH:MM
  static formatTime(dateString: string): string {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Obtiene fecha actual en formato ISO
  static getCurrentDateTime(): string {
    return new Date().toISOString();
  }

  // Obtiene fecha actual en formato dd/mm/yyyy
  static getCurrentDate(): string {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Obtiene hora actual en formato HH:MM
  static getCurrentTime(): string {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

// Utilidades de validación
export class ValidationUtils {
  // Valida número de biopsia (formato B-AA-NNNNN)
  // AA = últimos 2 dígitos del año, NNNNN = numeración consecutiva
  static validateNumeroBiopsia(numero: string): { isValid: boolean; error?: string } {
    const pattern = /^B-\d{2}-\d{5}$/;
    if (!pattern.test(numero)) {
      return { isValid: false, error: 'El formato debe ser B-AA-NNNNN (ejemplo: B-26-00001)' };
    }
    return { isValid: true };
  }

  // Genera el siguiente número de biopsia para un año dado
  // Formato: B-AA-NNNNN donde AA = últimos 2 dígitos del año
  static generateNextBiopsiaNumber(year: number, biopsias: { numero_biopsia: string; anio_extraccion: number }[]): string {
    const yearStr = year.toString().slice(-2);
    const prefix = `B-${yearStr}-`;
    
    let maxNumber = 0;
    biopsias.forEach(b => {
      if (b.anio_extraccion === year && b.numero_biopsia.startsWith(prefix)) {
        const numPart = b.numero_biopsia.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    const nextNumber = (maxNumber + 1).toString().padStart(5, '0');
    return `${prefix}${nextNumber}`;
  }

  // Auto-formatea el número de biopsia insertando guiones automáticamente
  // Formato esperado: B-AA-NNNNN
  static formatNumeroBiopsiaInput(input: string): string {
    // Eliminar todos los caracteres no alfanuméricos
    const cleaned = input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    if (cleaned.length === 0) return '';
    
    let formatted = '';
    // B (1 carácter)
    formatted = cleaned.substring(0, 1);
    // AA (2 caracteres)
    if (cleaned.length > 1) {
      formatted += '-' + cleaned.substring(1, 3);
    }
    // NNNNN (5 caracteres)
    if (cleaned.length > 3) {
      formatted += '-' + cleaned.substring(3, 8);
    }
    
    return formatted;
  }

  // Valida año (4 dígitos, razonable)
  static validateYear(year: number): { isValid: boolean; error?: string } {
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      return { isValid: false, error: `El año debe estar entre 1900 y ${currentYear + 1}` };
    }
    return { isValid: true };
  }

  // Valida longitud de contraseña
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (password.length < 8) {
      return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }
    return { isValid: true };
  }

  // Valida username (alphanumeric y longitud)
  static validateUsername(username: string): { isValid: boolean; error?: string } {
    const pattern = /^[a-zA-Z0-9_]+$/;
    if (!pattern.test(username)) {
      return { isValid: false, error: 'El nombre de usuario solo puede contener letras, números y guiones bajos' };
    }
    if (username.length < 3 || username.length > 30) {
      return { isValid: false, error: 'El nombre de usuario debe tener entre 3 y 30 caracteres' };
    }
    return { isValid: true };
  }

  // Valida que no haya campos vacíos
  static validateRequired(fields: { [key: string]: any }): { isValid: boolean; error?: string } {
    for (const [key, value] of Object.entries(fields)) {
      if (value === null || value === undefined || value === '') {
        return { isValid: false, error: `El campo ${key} es obligatorio` };
      }
    }
    return { isValid: true };
  }
}