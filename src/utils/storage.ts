// Motor de almacenamiento local persistente para Banco de Tumores INOR
// Utiliza IndexedDB para almacenamiento robusto y eficiente

import { AppState, Usuario, Biopsia, Vial, Nota, AccionHistorial, CopiaSeguridad } from '@/types';
import { CryptoUtils, StorageUtils } from './crypto';

const DB_NAME = 'BancoDeTumoresINORDB';
const DB_VERSION = 1;

// Nombres de stores
const STORES = {
  USUARIOS: 'usuarios',
  BIOPSIAS: 'biopsias',
  VIALES: 'viales',
  NOTAS: 'notas',
  HISTORIAL: 'historial',
  COPIAS: 'copias_seguridad',
} as const;

class StorageEngine {
  private db: IDBDatabase | null = null;
  private static instance: StorageEngine | null = null;

  private constructor() {}

  // Singleton pattern
  static getInstance(): StorageEngine {
    if (!StorageEngine.instance) {
      StorageEngine.instance = new StorageEngine();
    }
    return StorageEngine.instance;
  }

  // Inicializa la base de datos
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear stores si no existen
        if (!db.objectStoreNames.contains(STORES.USUARIOS)) {
          const usuariosStore = db.createObjectStore(STORES.USUARIOS, { keyPath: 'id' });
          usuariosStore.createIndex('username', 'username', { unique: true });
          usuariosStore.createIndex('role', 'role', { unique: false });
          usuariosStore.createIndex('active', 'active', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.BIOPSIAS)) {
          const biopsiasStore = db.createObjectStore(STORES.BIOPSIAS, { keyPath: 'id' });
          biopsiasStore.createIndex('numero_biopsia', 'numero_biopsia', { unique: true });
          biopsiasStore.createIndex('localizacion', 'localizacion', { unique: false });
          biopsiasStore.createIndex('anio_extraccion', 'anio_extraccion', { unique: false });
          biopsiasStore.createIndex('created_by', 'created_by', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.VIALES)) {
          const vialesStore = db.createObjectStore(STORES.VIALES, { keyPath: 'id' });
          vialesStore.createIndex('biopsia_id', 'biopsia_id', { unique: false });
          vialesStore.createIndex('tipo', 'tipo', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.NOTAS)) {
          const notasStore = db.createObjectStore(STORES.NOTAS, { keyPath: 'id' });
          notasStore.createIndex('biopsia_id', 'biopsia_id', { unique: false });
          notasStore.createIndex('usuario_id', 'usuario_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.HISTORIAL)) {
          const historialStore = db.createObjectStore(STORES.HISTORIAL, { keyPath: 'id' });
          historialStore.createIndex('usuario_id', 'usuario_id', { unique: false });
          historialStore.createIndex('entidad', 'entidad', { unique: false });
          historialStore.createIndex('fecha', 'fecha', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.COPIAS)) {
          db.createObjectStore(STORES.COPIAS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB inicializada correctamente');
        resolve();
      };
    });
  }

  // Verifica si la base de datos está inicializada
  private checkDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llama a initialize() primero.');
    }
    return this.db;
  }

  // Operaciones CRUD genéricas
  private async getAll<T>(storeName: string): Promise<T[]> {
    const db = this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getById<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async put<T>(storeName: string, item: T): Promise<void> {
    const db = this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async delete(storeName: string, id: string): Promise<void> {
    const db = this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async query<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
    const db = this.checkDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ===== USUARIOS =====
  async getUsuarios(): Promise<Usuario[]> {
    return this.getAll<Usuario>(STORES.USUARIOS);
  }

  async getUsuarioById(id: string): Promise<Usuario | undefined> {
    return this.getById<Usuario>(STORES.USUARIOS, id);
  }

  async getUsuarioByUsername(username: string): Promise<Usuario | undefined> {
    return this.query<Usuario>(STORES.USUARIOS, 'username', username).then(
      (users) => users[0]
    );
  }

  async createUsuario(usuario: Usuario): Promise<void> {
    await this.put(STORES.USUARIOS, usuario);
  }

  async updateUsuario(usuario: Usuario): Promise<void> {
    await this.put(STORES.USUARIOS, usuario);
  }

  async deleteUsuario(id: string): Promise<void> {
    await this.delete(STORES.USUARIOS, id);
  }

  async getActiveAdmins(): Promise<Usuario[]> {
    const usuarios = await this.getUsuarios();
    return usuarios.filter((u) => u.role === 'admin' && u.active);
  }

  // ===== BIOPSIAS =====
  async getBiopsias(): Promise<Biopsia[]> {
    return this.getAll<Biopsia>(STORES.BIOPSIAS);
  }

  async getBiopsiaById(id: string): Promise<Biopsia | undefined> {
    return this.getById<Biopsia>(STORES.BIOPSIAS, id);
  }

  async getBiopsiaByNumero(numero: string): Promise<Biopsia | undefined> {
    return this.query<Biopsia>(STORES.BIOPSIAS, 'numero_biopsia', numero).then(
      (biopsias) => biopsias[0]
    );
  }

  async createBiopsia(biopsia: Biopsia): Promise<void> {
    await this.put(STORES.BIOPSIAS, biopsia);
  }

  async updateBiopsia(biopsia: Biopsia): Promise<void> {
    await this.put(STORES.BIOPSIAS, biopsia);
  }

  async deleteBiopsia(id: string): Promise<void> {
    await this.delete(STORES.BIOPSIAS, id);
  }

  async getBiopsiasByLocalizacion(localizacion: string): Promise<Biopsia[]> {
    return this.query<Biopsia>(STORES.BIOPSIAS, 'localizacion', localizacion);
  }

  // ===== VIALES =====
  async getViales(): Promise<Vial[]> {
    return this.getAll<Vial>(STORES.VIALES);
  }

  async getVialesByBiopsia(biopsiaId: string): Promise<Vial[]> {
    return this.query<Vial>(STORES.VIALES, 'biopsia_id', biopsiaId);
  }

  async createVial(vial: Vial): Promise<void> {
    await this.put(STORES.VIALES, vial);
  }

  async updateVial(vial: Vial): Promise<void> {
    await this.put(STORES.VIALES, vial);
  }

  async deleteVial(id: string): Promise<void> {
    await this.delete(STORES.VIALES, id);
  }

  async deleteVialesByBiopsia(biopsiaId: string): Promise<void> {
    const viales = await this.getVialesByBiopsia(biopsiaId);
    for (const vial of viales) {
      await this.delete(STORES.VIALES, vial.id);
    }
  }

  // ===== NOTAS =====
  async getNotas(): Promise<Nota[]> {
    return this.getAll<Nota>(STORES.NOTAS);
  }

  async getNotasByBiopsia(biopsiaId: string): Promise<Nota[]> {
    return this.query<Nota>(STORES.NOTAS, 'biopsia_id', biopsiaId).then((notas) =>
      notas.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
    );
  }

  async createNota(nota: Nota): Promise<void> {
    await this.put(STORES.NOTAS, nota);
  }

  async deleteNota(id: string): Promise<void> {
    await this.delete(STORES.NOTAS, id);
  }

  // ===== HISTORIAL =====
  async getHistorial(): Promise<AccionHistorial[]> {
    return this.getAll<AccionHistorial>(STORES.HISTORIAL);
  }

  async createHistorial(accion: AccionHistorial): Promise<void> {
    await this.put(STORES.HISTORIAL, accion);
  }

  // ===== COPIAS DE SEGURIDAD =====
  async getCopiasSeguridad(): Promise<CopiaSeguridad[]> {
    return this.getAll<CopiaSeguridad>(STORES.COPIAS);
  }

  async createCopiaSeguridad(copia: CopiaSeguridad): Promise<void> {
    await this.put(STORES.COPIAS, copia);
  }

  async deleteCopiaSeguridad(id: string): Promise<void> {
    await this.delete(STORES.COPIAS, id);
  }

  // ===== OBTENER TODO EL ESTADO =====
  async getFullState(): Promise<AppState> {
    const [usuarios, biopsias, viales, notas, historial, copias] = await Promise.all([
      this.getUsuarios(),
      this.getBiopsias(),
      this.getViales(),
      this.getNotas(),
      this.getHistorial(),
      this.getCopiasSeguridad(),
    ]);

    return {
      usuarios,
      biopsias,
      viales,
      notas,
      historial,
      copias_seguridad: copias,
    };
  }

  // ===== RESTAURAR ESTADO COMPLETO =====
  async restoreFullState(state: AppState): Promise<void> {
    // Limpiar todas las tablas
    const db = this.checkDB();
    
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(
        Object.values(STORES),
        'readwrite'
      );
      
      Object.values(STORES).forEach((storeName) => {
        const store = transaction.objectStore(storeName);
        store.clear();
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Insertar nuevos datos
    for (const usuario of state.usuarios) {
      await this.createUsuario(usuario);
    }
    for (const biopsia of state.biopsias) {
      await this.createBiopsia(biopsia);
    }
    for (const vial of state.viales) {
      await this.createVial(vial);
    }
    for (const nota of state.notas) {
      await this.createNota(nota);
    }
    for (const accion of state.historial) {
      await this.createHistorial(accion);
    }
    for (const copia of state.copias_seguridad) {
      await this.createCopiaSeguridad(copia);
    }
  }

  // ===== CONTADORES =====
  async getBiopsiasCount(): Promise<number> {
    const biopsias = await this.getBiopsias();
    return biopsias.length;
  }

  async getBiopsiasCountByLocalizacion(localizacion: string): Promise<number> {
    const biopsias = await this.getBiopsiasByLocalizacion(localizacion);
    return biopsias.length;
  }

  async getVialesCount(): Promise<number> {
    const viales = await this.getViales();
    return viales.length;
  }

  async getVialesTumoralesCount(): Promise<number> {
    const viales = await this.getViales();
    return viales.filter((v) => v.tipo === 'tumoral').length;
  }

  async getVialesNoTumoralesCount(): Promise<number> {
    const viales = await this.getViales();
    return viales.filter((v) => v.tipo === 'no_tumoral').length;
  }
}

// Exportar singleton
export const storageEngine = StorageEngine.getInstance();