// Vista principal de biopsias
// Muestra biopsias agrupadas por localizacion en desplegables con contadores

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Trash2,
  Edit,
  Eye,
  Plus,
  Filter as FilterIcon,
  Search as SearchIcon,
  ChevronDown,
} from 'lucide-react';
import { BiopsiaForm } from './BiopsiaForm';
import { BiopsiaDetail } from './BiopsiaDetail';

interface BiopsiasViewProps {
  onNewBiopsia: () => void;
}

type Localizacion = 'Mama' | 'Pulmon' | 'Prostata' | 'Sistema_digestivo';

const LOCALIZACIONES: { value: Localizacion; label: string }[] = [
  { value: 'Mama', label: 'Mama' },
  { value: 'Pulmon', label: 'Pulmón' },
  { value: 'Prostata', label: 'Próstata' },
  { value: 'Sistema_digestivo', label: 'Sistema digestivo' },
];

const formatLocalizacion = (value: string): string => {
  const item = LOCALIZACIONES.find(l => l.value === value);
  return item?.label || value;
};

export const BiopsiasView: React.FC<BiopsiasViewProps> = ({ onNewBiopsia }) => {
  const { biopsias, viales, deleteBiopsia, addHistorialEntry } = useAppContext();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
  const [selectedSexo, setSelectedSexo] = useState<string | null>(null);
  const [editingBiopsiaId, setEditingBiopsiaId] = useState<string | null>(null);
  const [viewingBiopsiaId, setViewingBiopsiaId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Contadores por localización
  const counts = useMemo(() => {
    const totals: Record<Localizacion, number> = {
      Mama: 0,
      Pulmon: 0,
      Prostata: 0,
      Sistema_digestivo: 0,
    };
    biopsias.forEach(b => {
      if (totals[b.localizacion] !== undefined) {
        totals[b.localizacion] += 1;
      }
    });
    return totals;
  }, [biopsias]);

  const totalBiopsias = biopsias.length;

  // Filtrar biopsias
  const filteredBiopsias = useMemo(() => {
    if (!searchTerm && !selectedAnio && !selectedSexo) {
      return biopsias;
    }
    return biopsias.filter((b) => {
      const matchesSearch = searchTerm
        ? b.numero_biopsia.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.diagnostico && b.diagnostico.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (b.localizacion && b.localizacion.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      const matchesAnio = selectedAnio ? b.anio_extraccion === selectedAnio : true;
      const matchesSexo = selectedSexo ? b.sexo === selectedSexo : true;
      return matchesSearch && matchesAnio && matchesSexo;
    });
  }, [biopsias, searchTerm, selectedAnio, selectedSexo]);

  // Agrupar biopsias filtradas por localización
  const biopsiasPorLocalizacion = useMemo(() => {
    const grouped: Record<Localizacion, typeof filteredBiopsias> = {
      Mama: [],
      Pulmon: [],
      Prostata: [],
      Sistema_digestivo: [],
    };
    filteredBiopsias.forEach(b => {
      if (grouped[b.localizacion]) {
        grouped[b.localizacion].push(b);
      }
    });
    return grouped;
  }, [filteredBiopsias]);

  // Contar viales por biopsia
  const countViales = (biopsiaId: string) => {
    return viales.filter(v => v.biopsia_id === biopsiaId).length;
  };

  const handleDelete = async (id: string, numero: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar esta biopsia? Esta acción eliminará también sus viales asociados.`)) {
      try {
        await deleteBiopsia(id);
        await addHistorialEntry({
          usuario_id: '',
          username: '',
          accion: 'eliminar_biopsia',
          entidad: 'biopsia',
          entidad_id: id,
          descripcion: `Eliminó biopsia ${numero}`,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        });
        toast({
          title: 'Éxito',
          description: 'Biopsia eliminada correctamente',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al eliminar la biopsia',
          variant: 'destructive',
        });
      }
    }
  };

  const renderBiopsiaCard = (biopsia: any) => (
    <div key={biopsia.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{biopsia.numero_biopsia}</div>
        <div className="text-sm text-gray-500 break-words">{biopsia.diagnostico}</div>
        <div className="text-xs text-gray-400 mt-1">
          Año {biopsia.anio_extraccion} · {biopsia.sexo} · {countViales(biopsia.id)} viales
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewingBiopsiaId(biopsia.id); }}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditingBiopsiaId(biopsia.id); }}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(biopsia.id, biopsia.numero_biopsia); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Biopsias</h1>
          <p className="text-sm text-gray-500">
            {filteredBiopsias.length} de {totalBiopsias} biopsias mostradas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <FilterIcon className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="secondary" onClick={onNewBiopsia}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva biopsia
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">Filtros avanzados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Año</label>
              <Select 
                value={selectedAnio?.toString() ?? ''}
                onValueChange={(value) => setSelectedAnio(value ? Number(value) : null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un año" />
                </SelectTrigger>
                <SelectContent>
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sexo</label>
              <Select 
                value={selectedSexo ?? ''}
                onValueChange={(value) => setSelectedSexo(value as any | null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                  <SelectItem value="No_especificado">No especificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedAnio(null);
                setSelectedSexo(null);
              }}>
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Buscar por número, diagnóstico, ubicación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
      </div>

      {/* Biopsias agrupadas por localización */}
      <Accordion type="single" collapsible className="space-y-3">
        {LOCALIZACIONES.map(localizacion => (
          <AccordionItem key={localizacion.value} value={localizacion.value}>
            <AccordionTrigger className="flex items-center justify-between w-full rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-muted/40">
              <div className="flex items-center gap-3">
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200" />
                <span className="font-semibold">{localizacion.label}</span>
              </div>
              <Badge variant="secondary">{biopsiasPorLocalizacion[localizacion.value].length}</Badge>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 px-4 pb-4">
                {biopsiasPorLocalizacion[localizacion.value].length === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">No hay biopsias registradas en esta localización.</p>
                ) : (
                  biopsiasPorLocalizacion[localizacion.value].map(renderBiopsiaCard)
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Modales */}
      {editingBiopsiaId && (
        <BiopsiaForm 
          biopsiaId={editingBiopsiaId} 
          onSave={() => {
            setEditingBiopsiaId(null);
          }} 
          onCancel={() => {
            setEditingBiopsiaId(null);
          }}
        />
      )}
      
      {viewingBiopsiaId && (
        <BiopsiaDetail 
          biopsiaId={viewingBiopsiaId} 
          onBack={() => setViewingBiopsiaId(null)} 
          onEdit={() => {
            setEditingBiopsiaId(viewingBiopsiaId);
            setViewingBiopsiaId(null);
          }}
        />
      )}
    </div>
  );
};
