// Vista de reportes visuales
// Muestra gráficos y estadísticas de la base de datos

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Biopsia, Vial } from '@/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  ChartContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  PieChart as PieChartIcon,
  Filter,
  RefreshCw
} from 'lucide-react';
import { DateUtils } from '@/utils/crypto';

export const ReportesView: React.FC = () => {
  const { 
    biopsias, 
    viales, 
    usuarios 
  } = useAppContext();
  
  const [filters, setFilters] = useState({
    anio: null as number | null,
    localizacion: null as string | null,
    sexo: null as string | null
  });

  // Años disponibles basados en los datos cargados
  const aniosDisponibles = React.useMemo(() => {
    const years = new Set(biopsias.map(b => b.anio_extraccion));
    return Array.from(years).sort((a, b) => a - b);
  }, [biopsias]);
  
  const [loading, setLoading] = useState(false);

  // Filtrar biopsias
  const filteredBiopsias = React.useMemo(() => {
    if (!filters.anio && !filters.localizacion && !filters.sexo) {
      return biopsias;
    }
    return biopsias.filter((b) => {
      const matchesAnio = filters.anio ? b.anio_extraccion === filters.anio : true;
      const matchesLocalizacion = filters.localizacion ? b.localizacion === filters.localizacion : true;
      const matchesSexo = filters.sexo ? b.sexo === filters.sexo : true;
      return matchesAnio && matchesLocalizacion && matchesSexo;
    });
  }, [biopsias, filters]);

  // Contar viales filtrados
  const filteredViales = React.useMemo(() => {
    return viales.filter(v => 
      filteredBiopsias.some(b => b.id === v.biopsia_id)
    );
  }, [filteredBiopsias, viales]);

  // Estadísticas
  const totalBiopsias = filteredBiopsias.length;
  const totalViales = filteredViales.length;
  const tumorales = filteredViales.filter(v => v.tipo === 'tumoral').length;
  const noTumorales = filteredViales.filter(v => v.tipo === 'no_tumoral').length;

  // Biopsias por localización
  const biopsiasPorLocalizacion = React.useMemo(() => {
    const counts = {
      Mama: 0,
      Pulmon: 0,
      Prostata: 0,
      Sistema_digestivo: 0
    };
    
    filteredBiopsias.forEach(b => {
      if (b.localizacion in counts) {
        counts[b.localizacion as keyof typeof counts]++;
      }
    });
    
    return Object.entries(counts).map(([localizacion, count]) => ({
      localizacion,
      count,
      porcentaje: totalBiopsias > 0 ? (count / totalBiopsias) * 100 : 0
    }));
  }, [filteredBiopsias, totalBiopsias]);

  // Biopsias por año
  const biopsiasPorAnio = React.useMemo(() => {
    const counts: Record<number, number> = {};
    
    filteredBiopsias.forEach(b => {
      counts[b.anio_extraccion] = (counts[b.anio_extraccion] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([anio, count]) => ({
        anio: Number(anio),
        count
      }))
      .sort((a, b) => a.anio - b.anio);
  }, [filteredBiopsias]);

  // Distribución de sexos
  const biopsiasPorSexo = React.useMemo(() => {
    const counts: Record<string, number> = {
      Femenino: 0,
      Masculino: 0,
      Otro: 0,
      'No especificado': 0
    };
    
    filteredBiopsias.forEach(b => {
      if (b.sexo in counts) {
        counts[b.sexo as keyof typeof counts]++;
      }
    });
    
    return Object.entries(counts).map(([sexo, count]) => ({
      sexo,
      count
    }));
  }, [filteredBiopsias]);

  // Manejar filtros
  const handleApplyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const handleResetFilters = () => {
    setFilters({
      anio: null,
      localizacion: null,
      sexo: null
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500">
            Información visual de la base de datos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetFilters}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restablecer filtros
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">Filtros de reportes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Año</label>
            <Select
              value={filters.anio?.toString() ?? ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, anio: value ? Number(value) : null }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione un año" />
              </SelectTrigger>
              <SelectContent>
                {aniosDisponibles.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Localización</label>
            <Select 
              value={filters.localizacion ?? ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, localizacion: value as string | null }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccione una localización" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mama">Mama</SelectItem>
                <SelectItem value="Pulmon">Pulmón</SelectItem>
                <SelectItem value="Prostata">Próstata</SelectItem>
                <SelectItem value="Sistema_digestivo">Sistema digestivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sexo</label>
            <Select 
              value={filters.sexo ?? ''}
              onValueChange={(value) => setFilters(prev => ({ ...prev, sexo: value as string | null }))}
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
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de biopsias</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-bold text-blue-600">{totalBiopsias}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de viales</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-bold text-green-600">{totalViales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Viales tumorales</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-bold text-red-600">{tumorales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Viales no tumorales</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-bold text-yellow-600">{noTumorales}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6">
        {/* Gráfico de biopsias por localización */}
        <Card>
          <CardHeader>
            <CardTitle>Biopsias por localización</CardTitle>
          </CardHeader>
          <CardContent>
            {totalBiopsias === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                                      data={biopsiasPorLocalizacion}
                                      dataKey="count"
                                      nameKey="localizacion"
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, value, percentage }) =>
                                        `${name}: ${value} (${(percentage ?? 0).toFixed(1)}%)`
                                      }
                                    >
                    {biopsiasPorLocalizacion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(entry.localizacion)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de biopsias por año */}
        <Card>
          <CardHeader>
            <CardTitle>Biopsias por año</CardTitle>
          </CardHeader>
          <CardContent>
            {biopsiasPorAnio.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={biopsiasPorAnio}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="anio" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de distribución de sexos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por sexo</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBiopsias.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                                      data={biopsiasPorSexo}
                                      dataKey="count"
                                      nameKey="sexo"
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, value, percentage }) =>
                                        `${name}: ${value} (${(percentage ?? 0).toFixed(1)}%)`
                                      }
                                    >
                    {biopsiasPorSexo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSexColor(entry.sexo)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Funciones auxiliares para colores
const getColor = (localizacion: string): string => {
  const colors: Record<string, string> = {
    Mama: '#FF6384',
    Pulmon: '#36A2EB',
    Prostata: '#FFCE56',
    Sistema_digestivo: '#4BC0C0'
  };
  return colors[localizacion] || '#999999';
};

const getSexColor = (sexo: string): string => {
  const colors: Record<string, string> = {
    Femenino: '#FF6384',
    Masculino: '#36A2EB',
    Otro: '#FFCE56',
    'No especificado': '#4BC0C0'
  };
  return colors[sexo] || '#999999';
};