// Vista de trazabilidad e historial de acciones
// Solo visible para Administradores

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AccionHistorial } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Input,
} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { DateUtils } from '@/utils/crypto';

export const HistorialView: React.FC = () => {
  const { historial, addHistorialEntry, session } = useAppContext();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedAccion, setSelectedAccion] = useState<string | null>(null);
  const [selectedBiopsia, setSelectedBiopsia] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filtrar historial
  const filteredHistorial = useMemo(() => {
    let filtered = historial;
    
    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.entidad.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedUser) {
      filtered = filtered.filter(h => h.username === selectedUser);
    }
    
    if (selectedAccion) {
      filtered = filtered.filter(h => h.accion === selectedAccion);
    }
    
    if (selectedBiopsia) {
      filtered = filtered.filter(h => h.entidad_id === selectedBiopsia);
    }
    
    if (selectedDate) {
      filtered = filtered.filter(h => h.fecha === selectedDate);
    }
    
    return filtered;
  }, [historial, searchTerm, selectedUser, selectedAccion, selectedBiopsia, selectedDate]);

  // Obtener usuarios únicos para filtro
  const usuariosUnicos = useMemo(() => {
    const users = new Set(historial.map(h => h.username));
    return Array.from(users);
  }, [historial]);

  // Obtener acciones únicas para filtro
  const accionesUnicas = useMemo(() => {
    const actions = new Set(historial.map(h => h.accion));
    return Array.from(actions);
  }, [historial]);

  // Obtener biopsias únicas para filtro
  const biopsiasUnicas = useMemo(() => {
    const biopsias = new Set(historial.filter(h => h.entidad === 'biopsia').map(h => h.entidad_id));
    return Array.from(biopsias);
  }, [historial]);

  // Obtener fechas únicas para filtro
  const fechasUnicas = useMemo(() => {
    const dates = new Set(historial.map(h => h.fecha));
    return Array.from(dates).sort().reverse();
  }, [historial]);

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedUser(null);
    setSelectedAccion(null);
    setSelectedBiopsia(null);
    setSelectedDate(null);
  };

  // Exportar historial a CSV
  const handleExport = () => {
    const headers = ['Fecha', 'Hora', 'Usuario', 'Acción', 'Entidad', 'Descripción'];
    const rows = filteredHistorial.map(h => [
      h.fecha,
      h.hora,
      h.username,
      h.accion,
      h.entidad,
      h.descripcion
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial_${DateUtils.getCurrentDate()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Éxito',
      description: 'Historial exportado correctamente',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial / Trazabilidad</h1>
          <p className="text-sm text-gray-500">
            Registro completo de todas las acciones del sistema
          </p>
        </div>
        <Button onClick={handleExport}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Exportar historial
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Select 
                value={selectedUser ?? ''}
                onValueChange={(value) => setSelectedUser(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {usuariosUnicos.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Acción</Label>
              <Select 
                value={selectedAccion ?? ''}
                onValueChange={(value) => setSelectedAccion(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {accionesUnicas.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Biopsia</Label>
              <Select 
                value={selectedBiopsia ?? ''}
                onValueChange={(value) => setSelectedBiopsia(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {biopsiasUnicas.map(id => (
                    <SelectItem key={id} value={id}>{id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Select 
                value={selectedDate ?? ''}
                onValueChange={(value) => setSelectedDate(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {fechasUnicas.map(date => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de historial */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registros ({filteredHistorial.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorial.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-4">
                      Todavía no existen acciones registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistorial.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.fecha}</TableCell>
                      <TableCell>{entry.hora}</TableCell>
                      <TableCell className="font-medium">{entry.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.accion}</Badge>
                      </TableCell>
                      <TableCell>{entry.entidad}</TableCell>
                      <TableCell>{entry.descripcion}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};