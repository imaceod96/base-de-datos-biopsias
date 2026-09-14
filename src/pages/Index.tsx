// Página principal de BioVault Lab
// Maneja el enrutamiento basado en el estado de autenticación

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { FirstAdminSetup } from '@/components/auth/FirstAdminSetup';
import { MainLayout } from '@/components/layout/MainLayout';
import { BiopsiasView } from '@/components/biopsias/BiopsiasView';
import { BiopsiaForm } from '@/components/biopsias/BiopsiaForm';
import { BiopsiaDetail } from '@/components/biopsias/BiopsiaDetail';
import { ReportesView } from '@/components/reportes/ReportesView';
import { UsuariosView } from '@/components/usuarios/UsuariosView';
import { HistorialView } from '@/components/historial/HistorialView';
import { BackupView } from '@/components/backup/BackupView';
import { CuentaView } from '@/components/cuenta/CuentaView';

type View = 'biopsias' | 'biopsia-form' | 'biopsia-detail' | 'reportes' | 'usuarios' | 'historial' | 'backup' | 'cuenta';

const Index = () => {
  const { session, isFirstStartup, isAuthenticated } = useAppContext();
  const [currentView, setCurrentView] = useState<View>('biopsias');
  const [selectedBiopsiaId, setSelectedBiopsiaId] = useState<string | null>(null);
  const [editingBiopsiaId, setEditingBiopsiaId] = useState<string | null>(null);

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    // Si es primera ejecución, mostrar configuración inicial
    if (isFirstStartup) {
      return <FirstAdminSetup />;
    }
    return <LoginScreen />;
  }

  // Renderizar vista principal
  const renderView = () => {
    switch (currentView) {
      case 'biopsias':
        return <BiopsiasView onNewBiopsia={() => {
          setEditingBiopsiaId(null);
          setCurrentView('biopsia-form');
        }} />;
      case 'biopsia-form':
        return <BiopsiaForm biopsiaId={editingBiopsiaId} onSave={() => { setEditingBiopsiaId(null); setCurrentView('biopsias'); }} onCancel={() => { setEditingBiopsiaId(null); setCurrentView('biopsias'); }} />;
      case 'biopsia-detail':
        return <BiopsiaDetail biopsiaId={selectedBiopsiaId!} onBack={() => setCurrentView('biopsias')} onEdit={() => { setEditingBiopsiaId(selectedBiopsiaId); setCurrentView('biopsia-form'); }} />;
      case 'reportes':
        return <ReportesView />;
      case 'usuarios':
        return <UsuariosView />;
      case 'historial':
        return <HistorialView />;
      case 'backup':
        return <BackupView />;
      case 'cuenta':
        return <CuentaView />;
      default:
        return <BiopsiasView onNewBiopsia={() => { setEditingBiopsiaId(null); setCurrentView('biopsia-form'); }} />;
    }
  };

  return (
    <MainLayout
      currentView={currentView}
      onNavigate={(view) => {
        setCurrentView(view);
        if (view !== 'biopsia-detail') {
          setSelectedBiopsiaId(null);
        }
      }}
      user={session ? { username: session.username, role: session.role } : null}
    >
      {renderView()}
    </MainLayout>
  );
};

export default Index;