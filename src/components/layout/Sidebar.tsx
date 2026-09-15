// Barra lateral de navegación de Banco de Tumores INOR

import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Role } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { session, getBiopsiasCount, getBiopsiasCountByLocalizacion, biopsias } = useAppContext();
  const [counts, setCounts] = React.useState<{ [key: string]: number }>({});

  React.useEffect(() => {
    const loadCounts = async () => {
      const total = await getBiopsiasCount();
      setCounts({ total });
    };
    loadCounts();
  }, [biopsias, getBiopsiasCount]);

  const menuItems = [
    { id: 'biopsias', label: 'Biopsias', icon: '📋' },
    { id: 'reportes', label: 'Reportes', icon: '📊' },
    ...(session?.role === 'admin' ? [
      { id: 'usuarios', label: 'Usuarios', icon: '👥' },
      { id: 'historial', label: 'Historial', icon: '📜' },
      { id: 'backup', label: 'Copia de seguridad', icon: '💾' },
    ] : []),
    { id: 'cuenta', label: 'Mi cuenta', icon: '👤' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex flex-col items-center">
              <h1 className="text-xl font-bold text-gray-900">Banco de Tumores INOR</h1>
              <p className="text-sm text-gray-500">Gestión de Biopsias</p>
            </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              currentView === item.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <span className="flex items-center gap-3">
              <span>{item.icon}</span>
              {item.label}
            </span>
            {counts[item.id] !== undefined && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {counts[item.id]}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Info del usuario */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">
              {session?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{session?.username}</p>
            <p className="text-xs text-gray-500 capitalize">{session?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};