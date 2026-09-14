// Barra superior de Banco de Tumores INOR
// Contiene buscador, filtros, botones de acción y info del usuario

import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Role } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectGroup, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectValue } from '@/components/ui/select';
import { useMemo } from 'react';

interface TopBarProps {
  user: { username: string; role: Role } | null;
  onNavigate: (view: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onNavigate }) => {
  const { session, usuarios, biopsias, viales, getVialesCount, getVialesTumoralesCount, getVialesNoTumoralesCount } = useAppContext();

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedLocalizacion, setSelectedLocalizacion] = React.useState<string | null>(null);
  const [selectedAnio, setSelectedAnio] = React.useState<number | null>(null);
  const [selectedSexo, setSelectedSexo] = React.useState<string | null>(null);

  // Contadores
  const totalBiopsias = useMemo(() => {
    return getVialesCount();
  }, [getVialesCount]);

  const tumorales = useMemo(() => {
    return getVialesTumoralesCount();
  }, [getVialesTumoralesCount]);

  const noTumorales = useMemo(() => {
    return getVialesNoTumoralesCount();
  }, [getVialesNoTumoralesCount]);

  // Filtrar biopsias
  const filteredBiopsias = useMemo(() => {
    if (!searchTerm && !selectedLocalizacion && !selectedAnio && !selectedSexo) {
      return biopsias;
    }
    return biopsias.filter((b) => {
      const matchesSearch = searchTerm
        ? b.numero_biopsia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.diagnostico && b.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (b.localizacion && b.localizacion.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const matchesLocalizacion = selectedLocalizacion
        ? b.localizacion === selectedLocalizacion
        : true;
      const matchesAnio = selectedAnio ? b.anio_extraccion === selectedAnio : true;
      const matchesSexo = selectedSexo ? b.sexo === selectedSexo : true;
      return matchesSearch && matchesLocalizacion && matchesAnio && matchesSexo;
    });
  }, [biopsias, searchTerm, selectedLocalizacion, selectedAnio, selectedSexo]);

  // Botones de acción disponibles
  const puedeCrear = session?.role === 'admin' || session?.role === 'gestor';

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Título */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-gray-900">Banco de Tumores INOR</span>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar biopsias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
          Limpiar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Select onValueChange={(value) => setSelectedLocalizacion(value as any | null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Localización" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Localización</SelectLabel>
              <SelectItem value="Mama">Mama</SelectItem>
              <SelectItem value="Pulmon">Pulmón</SelectItem>
              <SelectItem value="Prostata">Próstata</SelectItem>
              <SelectItem value="Sistema_digestivo">Sistema digestivo</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => setSelectedAnio(value ? Number(value) : null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Año</SelectLabel>
              <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => setSelectedSexo(value as any | null)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sexo" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sexo</SelectLabel>
              <SelectItem value="Femenino">Femenino</SelectItem>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
              <SelectItem value="No_especificado">No especificado</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center gap-3">
        {puedeCrear && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('biopsia-form')}
          >
            + Nueva biopsia
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => onNavigate('reportes')}>
          Reportes
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onNavigate('usuarios')}>
          Usuarios
        </Button>
      </div>

      {/* Info del usuario */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Bienvenido, {user?.username}</span>
        <Button variant="ghost" size="sm" onClick={() => onNavigate('cuenta')}>
          Mi cuenta
        </Button>
        <Button variant="destructive" size="sm" onClick={() => session?.role === 'admin' ? onNavigate('backup') : null}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
};