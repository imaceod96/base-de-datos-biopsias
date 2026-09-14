// Layout principal de BioVault Lab
// Barra lateral, barra superior y zona central

import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Role } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  BarChart3, 
  Users, 
  History, 
  Shield, 
  User,
  LogOut,
  Search,
  Filter,
  Download,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MainLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
}

// Menú de la barra lateral
const menuItems = [
  { id: 'biopsias', label: 'Biopsias', icon: FileText },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'backup', label: 'Copia de seguridad', icon: Shield },
  { id: 'cuenta', label: 'Mi cuenta', icon: User },
];

export const MainLayout: React.FC<MainLayoutProps> = ({ currentView, onNavigate, children }) => {
  const { session, biopsias, viales, usuarios, historial } = useAppContext();
  
  // Calcular contadores
  const totalBiopsias = biopsias.length;
  const totalViales = viales.length;
  const tumorales = viales.filter(v => v.tipo === 'tumoral').length;
  const noTumorales = viales.filter(v => v.tipo === 'no_tumoral').length;
  
  // Contar por localización
  const counts = {
    total: totalBiopsias,
    mama: biopsias.filter(b => b.localizacion === 'Mama').length,
    pulmon: biopsias.filter(b => b.localizacion === 'Pulmon').length,
    prostata: biopsias.filter(b => b.localizacion === 'Prostata').length,
    digestivo: biopsias.filter(b => b.localizacion === 'Sistema_digestivo').length,
  };

  // Verificar permisos
  const puedeVerUsuarios = session?.role === 'admin';
  const puedeVerHistorial = session?.role === 'admin';
  const puedeVerBackup = session?.role === 'admin';
  const puedeCrearBiopsia = session?.role === 'admin' || session?.role === 'gestor';
  const puedeExportar = session?.role === 'admin' || session?.role === 'gestor';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">BioVault Lab</h1>
          <p className="text-sm text-gray-500">Gestión de Biopsias</p>
        </div>

        {/* Dashboard rápido */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalBiopsias}</p>
              <p className="text-xs text-gray-500">Biopsias</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{totalViales}</p>
              <p className="text-xs text-gray-500">Viales</p>
            </div>
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            // Filtrar menú según permisos
            if (item.id === 'usuarios' && !puedeVerUsuarios) return null;
            if (item.id === 'historial' && !puedeVerHistorial) return null;
            if (item.id === 'backup' && !puedeVerBackup) return null;
            
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentView === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Contadores por localización */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Biopsias por localización</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Mama</span>
              <Badge variant="secondary">{counts.mama}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Pulmón</span>
              <Badge variant="secondary">{counts.pulmon}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Próstata</span>
              <Badge variant="secondary">{counts.prostata}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Digestivo</span>
              <Badge variant="secondary">{counts.digestivo}</Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentView === 'biopsias' && 'Biopsias'}
                {currentView === 'reportes' && 'Reportes'}
                {currentView === 'usuarios' && 'Usuarios'}
                {currentView === 'historial' && 'Historial'}
                {currentView === 'backup' && 'Copia de seguridad'}
                {currentView === 'cuenta' && 'Mi cuenta'}
              </h2>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-10"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {puedeCrearBiopsia && (
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva biopsia
                </Button>
              )}
              {puedeExportar && (
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{session?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{session?.username}</span>
                      <Badge variant="outline" className="text-xs mt-1">
                        {session?.role === 'admin' ? 'Administrador' : 
                         session?.role === 'gestor' ? 'Gestor' : 'Visualizador'}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('cuenta')}>
                    <User className="mr-2 h-4 w-4" />
                    Mi cuenta
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};