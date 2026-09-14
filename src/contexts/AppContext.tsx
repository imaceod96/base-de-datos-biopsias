// Contexto global de la aplicación BioVault Lab
// Gestiona autenticación, estado de datos y operaciones CRUD

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Usuario, Biopsia, Vial, Nota, AccionHistorial, Role, Session, CopiaSeguridad, AppState } from '@/types';
import { CryptoUtils, StorageUtils, DateUtils } from '@/utils/crypto';
import { storageEngine } from '@/utils/storage';
import { AuthManager } from '@/utils/auth';

interface AppContextType {
  // Autenticación
  session: Session | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isFirstStartup: boolean;
  createFirstAdmin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  
  // Datos
  usuarios: Usuario[];
  biopsias: Biopsia[];
  viales: Vial[];
  notas: Nota[];
  historial: AccionHistorial[];
  copias_seguridad: CopiaSeguridad[];

  // Operaciones de biopsia
  createBiopsia: (biopsia: Biopsia) => Promise<void>;
  updateBiopsia: (biopsia: Biopsia) => Promise<void>;
  deleteBiopsia: (id: string) => Promise<void>;
  
  // Operaciones de vial
  createVial: (vial: Vial) => Promise<void>;
  updateVial: (vial: Vial) => Promise<void>;
  deleteVial: (id: string) => Promise<void>;
  
  // Operaciones de nota
  createNota: (nota: Nota) => Promise<void>;
  deleteNota: (id: string) => Promise<void>;
  
  // Operaciones de usuario
  createUsuario: (usuario: Usuario) => Promise<void>;
  updateUsuario: (usuario: Usuario) => Promise<void>;
  deleteUsuario: (id: string) => Promise<void>;
  
  // Operaciones de historial
  addHistorialEntry: (entry: Omit<AccionHistorial, 'id'>) => Promise<void>;

  // Operaciones de backup
  createCopiaSeguridad: (copia: CopiaSeguridad) => Promise<void>;
  getCopiasSeguridad: () => Promise<CopiaSeguridad[]>;
  restoreFullState: (state: AppState) => Promise<void>;

  // Utilidades
  getBiopsiasCount: () => Promise<number>;
  getBiopsiasCountByLocalizacion: (localizacion: string) => Promise<number>;
  getVialesCount: () => Promise<number>;
  getVialesTumoralesCount: () => Promise<number>;
  getVialesNoTumoralesCount: () => Promise<number>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isFirstStartup, setIsFirstStartup] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [biopsias, setBiopsias] = useState<Biopsia[]>([]);
  const [viales, setViales] = useState<Vial[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [historial, setHistorial] = useState<AccionHistorial[]>([]);
  const [copias_seguridad, setCopiasSeguridad] = useState<CopiaSeguridad[]>([]);

  // Cargar datos al iniciar
  const refreshData = useCallback(async () => {
    try {
      const [users, biops, vials, notes, hist, backups] = await Promise.all([
        storageEngine.getUsuarios(),
        storageEngine.getBiopsias(),
        storageEngine.getViales(),
        storageEngine.getNotas(),
        storageEngine.getHistorial(),
        storageEngine.getCopiasSeguridad(),
      ]);
      setUsuarios(users);
      setBiopsias(biops);
      setViales(vials);
      setNotas(notes);
      setHistorial(hist);
      setCopiasSeguridad(backups);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, []);

  // Verificar primera ejecución y sesión
  useEffect(() => {
    const init = async () => {
      await storageEngine.initialize();
      const first = await AuthManager.isFirstStartup();
      setIsFirstStartup(first);
      
      if (!first) {
        const session = AuthManager.getSession();
        if (session && session.isAuthenticated) {
          setSession(session);
        }
      }
      
      await refreshData();
    };
    init();
  }, [refreshData]);

  // Login
  const login = useCallback(async (username: string, password: string) => {
    const result = await AuthManager.login(username, password);
    if (result.success && result.user) {
      setSession({
        userId: result.user.id,
        username: result.user.username,
        role: result.user.role,
        isAuthenticated: true,
      });
      await refreshData();
    }
    return result;
  }, [refreshData]);

  // Logout
  const logout = useCallback(() => {
    AuthManager.logout();
    setSession(null);
  }, []);

  // Crear primer administrador
  const createFirstAdmin = useCallback(async (username: string, password: string) => {
    const result = await AuthManager.createFirstAdmin(username, password);
    if (result.success) {
      setIsFirstStartup(false);
      await refreshData();
    }
    return result;
  }, [refreshData]);

  // Operaciones de biopsia
  const createBiopsia = useCallback(async (biopsia: Biopsia) => {
    await storageEngine.createBiopsia(biopsia);
    await refreshData();
  }, [refreshData]);

  const updateBiopsia = useCallback(async (biopsia: Biopsia) => {
    await storageEngine.updateBiopsia(biopsia);
    await refreshData();
  }, [refreshData]);

  const deleteBiopsia = useCallback(async (id: string) => {
    await storageEngine.deleteBiopsia(id);
    await storageEngine.deleteVialesByBiopsia(id);
    await refreshData();
  }, [refreshData]);

  // Operaciones de vial
  const createVial = useCallback(async (vial: Vial) => {
    await storageEngine.createVial(vial);
    await refreshData();
  }, [refreshData]);

  const updateVial = useCallback(async (vial: Vial) => {
    await storageEngine.updateVial(vial);
    await refreshData();
  }, [refreshData]);

  const deleteVial = useCallback(async (id: string) => {
    await storageEngine.deleteVial(id);
    await refreshData();
  }, [refreshData]);

  // Operaciones de nota
  const createNota = useCallback(async (nota: Nota) => {
    await storageEngine.createNota(nota);
    await refreshData();
  }, [refreshData]);

  const deleteNota = useCallback(async (id: string) => {
    await storageEngine.deleteNota(id);
    await refreshData();
  }, [refreshData]);

  // Operaciones de usuario
  const createUsuario = useCallback(async (usuario: Usuario) => {
    await storageEngine.createUsuario(usuario);
    await refreshData();
  }, [refreshData]);

  const updateUsuario = useCallback(async (usuario: Usuario) => {
    await storageEngine.updateUsuario(usuario);
    await refreshData();
  }, [refreshData]);

  const deleteUsuario = useCallback(async (id: string) => {
    await storageEngine.deleteUsuario(id);
    await refreshData();
  }, [refreshData]);

  // Operaciones de historial
  const addHistorialEntry = useCallback(async (entry: Omit<AccionHistorial, 'id'>) => {
    const newEntry = { ...entry, id: CryptoUtils.generateId() };
    await storageEngine.createHistorial(newEntry);
    await refreshData();
  }, [refreshData]);

  // Operaciones de backup
  const createCopiaSeguridad = useCallback(async (copia: CopiaSeguridad) => {
    await storageEngine.createCopiaSeguridad(copia);
    await refreshData();
  }, [refreshData]);

  const getCopiasSeguridad = useCallback(async () => {
    return storageEngine.getCopiasSeguridad();
  }, []);

  const restoreFullState = useCallback(async (state: AppState) => {
    await storageEngine.restoreFullState(state);
    await refreshData();
  }, [refreshData]);

  // Utilidades
  const getBiopsiasCount = useCallback(async () => {
    return storageEngine.getBiopsiasCount();
  }, []);

  const getBiopsiasCountByLocalizacion = useCallback(async (localizacion: string) => {
    return storageEngine.getBiopsiasCountByLocalizacion(localizacion);
  }, []);

  const getVialesCount = useCallback(async () => {
    return storageEngine.getVialesCount();
  }, []);

  const getVialesTumoralesCount = useCallback(async () => {
    return storageEngine.getVialesTumoralesCount();
  }, []);

  const getVialesNoTumoralesCount = useCallback(async () => {
    return storageEngine.getVialesNoTumoralesCount();
  }, []);

  const value = useMemo(() => ({
    // Autenticación
    session,
    isAuthenticated: !!session,
    login,
    logout,
    isFirstStartup: isFirstStartup,
    createFirstAdmin,
    
    // Datos
    usuarios,
    biopsias,
    viales,
    notas,
    historial,
    copias_seguridad,
    
    // Operaciones de biopsia
    createBiopsia,
    updateBiopsia,
    deleteBiopsia,
    
    // Operaciones de vial
    createVial,
    updateVial,
    deleteVial,
    
    // Operaciones de nota
    createNota,
    deleteNota,
    
    // Operaciones de usuario
    createUsuario,
    updateUsuario,
    deleteUsuario,
    
    // Operaciones de historial
    addHistorialEntry,

    // Operaciones de backup
    createCopiaSeguridad,
    getCopiasSeguridad,
    restoreFullState,
    
    // Utilidades
    getBiopsiasCount,
    getBiopsiasCountByLocalizacion,
    getVialesCount,
    getVialesTumoralesCount,
    getVialesNoTumoralesCount,
    refreshData,
  }), [
    session, isFirstStartup, usuarios, biopsias, viales, notas, historial, copias_seguridad,
    login, logout, createFirstAdmin,
    createBiopsia, updateBiopsia, deleteBiopsia,
    createVial, updateVial, deleteVial,
    createNota, deleteNota,
    createUsuario, updateUsuario, deleteUsuario,
    addHistorialEntry,
    createCopiaSeguridad, getCopiasSeguridad, restoreFullState,
    getBiopsiasCount, getBiopsiasCountByLocalizacion,
    getVialesCount, getVialesTumoralesCount, getVialesNoTumoralesCount,
    refreshData,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};