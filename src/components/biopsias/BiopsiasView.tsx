// Vista principal de biopsias
// Muestra tabla de biopsias con búsqueda, filtros y acciones

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableCaption 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Trash2, 
  Edit, 
  Eye, 
  Plus, 
  Filter as FilterIcon,
  Search as SearchIcon
} from 'lucide-react';
import { BiopsiaForm } from './BiopsiaForm';
import { BiopsiaDetail } from './BiopsiaDetail';

interface BiopsiasViewProps {
  onNewBiopsia: () => void;
}

export const BiopsiasView: React.FC<BiopsiasViewProps> = ({ onNewBiopsia }) => {
  const { 
    biopsias, 
    viales, 
    createBiopsia, 
    updateBiopsia, 
    deleteBiopsia,
    getBiopsiasCountByLocalizacion,
    addHistorialEntry
  } = useAppContext();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocalizacion, setSelectedLocalizacion] = useState<string | null>(null);
  const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
  const [selectedSexo, setSelectedSexo] = useState<string | null>(null);
  const [editingBiopsiaId, setEditingBiopsiaId] = useState<string | null>(null);
  const [viewingBiopsiaId, setViewingBiopsiaId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Contadores por localización
  const [counts, setCounts] = useState({
    mama: 0,
    pulmon: 0,
    prostata: 0,
    digestivo: 0
  });

  useEffect(() => {
    const loadCounts = async () => {
      const mama = await getBiopsiasCountByLocalizacion('Mama');
      const pulmon = await getBiopsiasCountByLocalizacion('Pulmon');
      const prostata = await getBiopsiasCountByLocalizacion('Prostata');
      const digestivo = await getBiopsiasCountByLocalizacion('Sistema_digestivo');
      setCounts({ mama, pulmon, prostata, digestivo });
    };
    loadCounts();
  }, [getBiopsiasCountByLocalizacion]);

  // Filtrar biopsias
  const filteredBiopsias = React.useMemo(() => {
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

  // Contar viales por biopsia
  const countViales = (biopsiaId: string) => {
    return viales.filter(v => v.biopsia_id === biopsiaId).length;
  };

  const handleDelete = async (id: string, numero: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar esta biopsia? Esta acción eliminará también sus viales asociados.`)) {
      try {
        await deleteBiopsia(id);
        await addHistorialEntry({
          usuario_id: '', // Se llenará en el contexto
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Biopsias</h1>
          <p className="text-sm text-gray-500">
            {filteredBiopsias.length} de {biopsias.length} biopsias mostradas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button
            variant="secondary"
            onClick={onNewBiopsia}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva biopsia
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Localización</label>
              <Select 
                value={selectedLocalizacion ?? ''}
                onValueChange={(value) => setSelectedLocalizacion(value as any | null)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione una localización" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mama">Mama ({counts.mama})</SelectItem>
                  <SelectItem value="Pulmon">Pulmón ({counts.pulmon})</SelectItem>
                  <SelectItem value="Prostata">Próstata ({counts.prostata})</SelectItem>
                  <SelectItem value="Sistema_digestivo">Sistema digestivo ({counts.digestivo})</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
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
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLocalizacion(null);
                  setSelectedAnio(null);
                  setSelectedSexo(null);
                }}
              >
                Limpiar
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

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>
            Lista de biopsias
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Localización</TableHead>
              <TableHead>Diagnóstico</TableHead>
              <TableHead>Año</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Viales</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBiopsias.length === 0 ? (
              <TableRow>
                <TableCell colSpan="8" className="text-center py-4">
                  Todavía no hay biopsias registradas.
                </TableCell>
              </TableRow>
            ) : (
              filteredBiopsias.map((biopsia, index) => (
                <TableRow key={biopsia.id} className="cursor-pointer hover:bg-muted" 
                  onClick={() => {
                    if (!editingBiopsiaId) {
                      setViewingBiopsiaId(biopsia.id);
                    }
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{biopsia.numero_biopsia}</TableCell>
                  <TableCell>
                    <span className="badge badge-outline">
                      {biopsia.localizacion === 'Mama' ? 'Mama' :
                       biopsia.localizacion === 'Pulmon' ? 'Pulmón' :
                       biopsia.localizacion === 'Prostata' ? 'Próstata' : 'Sistema digestivo'}
                    </span>
                    {biopsia.localizacion_especifica && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({biopsia.localizacion_especifica})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs break-words">{biopsia.diagnostico}</TableCell>
                  <TableCell>{biopsia.anio_extraccion}</TableCell>
                  <TableCell>
                    <span className="badge badge-outline">
                      {biopsia.sexo === 'Femenino' ? 'Femenino' :
                       biopsia.sexo === 'Masculino' ? 'Masculino' :
                       biopsia.sexo === 'Otro' ? 'Otro' : 'No especificado'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{countViales(biopsia.id)}</Badge>
                  </TableCell>
                  <TableCell className="flex items-center space-x-2">
                    {editingBiopsiaId === biopsia.id ? (
                      <>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => {
                            // Guardar cambios
                            setEditingBiopsiaId(null);
                          }}
                        >
                          Guardar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingBiopsiaId(null);
                          }}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setViewingBiopsiaId(biopsia.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingBiopsiaId(biopsia.id);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(biopsia.id, biopsia.numero_biopsia);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

// Tipos auxiliares
type Localizacion = 'Mama' | 'Pulmon' | 'Prostata' | 'Sistema_digestivo';
type Sexo = 'Femenino' | 'Masculino' | 'Otro' | 'No_especificado';
