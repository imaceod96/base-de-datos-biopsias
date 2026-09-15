// Formulario modal de alta/edición de biopsia
// Incluye validaciones y sub-localización digestiva

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Biopsia, Vial, Localizacion, Sexo, VialType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit } from 'lucide-react';
import { CryptoUtils, DateUtils, ValidationUtils } from '@/utils/crypto';

interface BiopsiaFormProps {
  biopsiaId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export const BiopsiaForm: React.FC<BiopsiaFormProps> = ({ biopsiaId, onSave, onCancel }) => {
  const { biopsias, viales, createBiopsia, updateBiopsia, createVial, deleteVial, addHistorialEntry, session, updateVial: contextUpdateVial } = useAppContext();
  const { toast } = useToast();
  
  const isEditing = biopsiaId !== null;
  const biopsiaOriginal = isEditing ? biopsias.find(b => b.id === biopsiaId) : null;
  
  // Estado del formulario
  const [numeroBiopsia, setNumeroBiopsia] = useState('');
  const [localizacion, setLocalizacion] = useState<Localizacion>('Mama');
  const [localizacionEspecifica, setLocalizacionEspecifica] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [anioExtraccion, setAnioExtraccion] = useState('');
  const [sexo, setSexo] = useState<Sexo>('Femenino');
  const [ubicacion, setUbicacion] = useState('');
  const [vialesList, setVialesList] = useState<Array<{ id?: string; identificador: string; tipo: VialType }>>([]);
  const [showLocalizacionEspecifica, setShowLocalizacionEspecifica] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos si estamos editando
  useEffect(() => {
    if (isEditing && biopsiaOriginal) {
      setNumeroBiopsia(biopsiaOriginal.numero_biopsia);
      setLocalizacion(biopsiaOriginal.localizacion);
      setLocalizacionEspecifica(biopsiaOriginal.localizacion_especifica || '');
      setDiagnostico(biopsiaOriginal.diagnostico);
      setAnioExtraccion(biopsiaOriginal.anio_extraccion.toString());
      setSexo(biopsiaOriginal.sexo);
      setUbicacion(biopsiaOriginal.ubicacion || '');
      
      // Cargar viales
      const vialesBiopsia = viales.filter(v => v.biopsia_id === biopsiaId);
      setVialesList(vialesBiopsia.map(v => ({
        id: v.id,
        identificador: v.identificador_vial,
        tipo: v.tipo
      })));
    }
  }, [isEditing, biopsiaOriginal, viales, biopsiaId]);

  // Auto-generar número de biopsia cuando cambia el año
  useEffect(() => {
    if (!isEditing && anioExtraccion.trim()) {
      const year = parseInt(anioExtraccion);
      if (!isNaN(year)) {
        const nextNumber = ValidationUtils.generateNextBiopsiaNumber(year, biopsias);
        setNumeroBiopsia(nextNumber);
      }
    }
  }, [anioExtraccion, biopsias, isEditing]);

  // Mostrar/ocultar sub-localización
  useEffect(() => {
    setShowLocalizacionEspecifica(localizacion === 'Sistema_digestivo');
  }, [localizacion]);

  // Validaciones
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!numeroBiopsia.trim()) {
      newErrors.numeroBiopsia = 'El número de biopsia es obligatorio';
    } else {
      const validation = ValidationUtils.validateNumeroBiopsia(numeroBiopsia);
      if (!validation.isValid) {
        newErrors.numeroBiopsia = validation.error || 'Formato inválido';
      } else if (!isEditing) {
        // Verificar unicidad
        const exists = biopsias.some(b => b.numero_biopsia === numeroBiopsia);
        if (exists) {
          newErrors.numeroBiopsia = 'El número de biopsia ya existe';
        }
      }
    }
    
    if (!diagnostico.trim()) {
      newErrors.diagnostico = 'El diagnóstico es obligatorio';
    }
    
    if (!anioExtraccion.trim()) {
      newErrors.anioExtraccion = 'El año de extracción es obligatorio';
    } else {
      const year = parseInt(anioExtraccion);
      const validation = ValidationUtils.validateYear(year);
      if (!validation.isValid) {
        newErrors.anioExtraccion = validation.error || 'Año inválido';
      }
    }
    
    if (!ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const now = DateUtils.getCurrentDateTime();
    const userId = session?.userId || '';
    const username = session?.username || '';

    try {
      if (isEditing && biopsiaOriginal) {
        // Actualizar biopsia existente
        const updatedBiopsia: Biopsia = {
          ...biopsiaOriginal,
          numero_biopsia: numeroBiopsia,
          localizacion,
          localizacion_especifica: showLocalizacionEspecifica ? localizacionEspecifica : null,
          diagnostico,
          anio_extraccion: parseInt(anioExtraccion),
          sexo,
          ubicacion,
          updated_by: userId,
          fecha_modificacion: now,
        };
        
        await updateBiopsia(updatedBiopsia);
        await addHistorialEntry({
          usuario_id: userId,
          username,
          accion: 'editar_biopsia',
          entidad: 'biopsia',
          entidad_id: updatedBiopsia.id,
          descripcion: `Editó biopsia ${updatedBiopsia.numero_biopsia}`,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        });
        
        toast({
          title: 'Éxito',
          description: 'Cambios guardados correctamente',
        });
      } else {
        // Crear nueva biopsia
        const newBiopsia: Biopsia = {
          id: CryptoUtils.generateId(),
          numero_biopsia: numeroBiopsia,
          localizacion,
          localizacion_especifica: showLocalizacionEspecifica ? localizacionEspecifica : null,
          diagnostico,
          anio_extraccion: parseInt(anioExtraccion),
          sexo,
          ubicacion,
          created_by: userId,
          fecha_creacion: now,
          updated_by: null,
          fecha_modificacion: null,
        };
        
        await createBiopsia(newBiopsia);
        await addHistorialEntry({
          usuario_id: userId,
          username,
          accion: 'crear_biopsia',
          entidad: 'biopsia',
          entidad_id: newBiopsia.id,
          descripcion: `Creó biopsia ${newBiopsia.numero_biopsia}`,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        });
        
        toast({
          title: 'Éxito',
          description: 'Biopsia guardada correctamente',
        });
      }
      
      onSave();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar la biopsia',
        variant: 'destructive',
      });
    }
  };

  // Manejar viales
  const addVial = () => {
    setVialesList([...vialesList, { identificador: '', tipo: 'tumoral' }]);
  };

  const updateVialField = (index: number, field: 'identificador' | 'tipo', value: string) => {
    const newViales = [...vialesList];
    newViales[index] = { ...newViales[index], [field]: value };
    setVialesList(newViales);
  };

  const removeVial = (index: number) => {
    const newViales = [...vialesList];
    newViales.splice(index, 1);
    setVialesList(newViales);
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar biopsia' : 'Nueva biopsia'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los datos de la biopsia' : 'Complete los datos para crear una nueva biopsia'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="numeroBiopsia">Número de biopsia *</Label>
              <Input
                id="numeroBiopsia"
                value={numeroBiopsia}
                onChange={(e) => setNumeroBiopsia(ValidationUtils.formatNumeroBiopsiaInput(e.target.value))}
                placeholder="B-26-00001"
                className={errors.numeroBiopsia ? 'border-red-500' : ''}
              />
              {errors.numeroBiopsia && <p className="text-xs text-red-500">{errors.numeroBiopsia}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="localizacion">Localización *</Label>
              <Select value={localizacion} onValueChange={(value) => setLocalizacion(value as Localizacion)}>
                <SelectTrigger className={errors.localizacion ? 'border-red-500' : ''}>
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

            {showLocalizacionEspecifica && (
              <div className="space-y-2">
                <Label htmlFor="localizacionEspecifica">Localización específica</Label>
                <Input
                  id="localizacionEspecifica"
                  value={localizacionEspecifica}
                  onChange={(e) => setLocalizacionEspecifica(e.target.value)}
                  placeholder="Colon, Recto, Estómago..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="anioExtraccion">Año de extracción *</Label>
              <Input
                id="anioExtraccion"
                value={anioExtraccion}
                onChange={(e) => setAnioExtraccion(e.target.value)}
                placeholder="2026"
                className={errors.anioExtraccion ? 'border-red-500' : ''}
              />
              {errors.anioExtraccion && <p className="text-xs text-red-500">{errors.anioExtraccion}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo *</Label>
              <Select value={sexo} onValueChange={(value) => setSexo(value as Sexo)}>
                <SelectTrigger>
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

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="diagnostico">Diagnóstico *</Label>
              <Textarea
                id="diagnostico"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Introduzca el diagnóstico..."
                rows={4}
                className={errors.diagnostico ? 'border-red-500' : ''}
              />
              {errors.diagnostico && <p className="text-xs text-red-500">{errors.diagnostico}</p>}
            </div>
          </div>

          {/* Ubicación física */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ubicación</h3>
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Descripción de la ubicación *</Label>
              <Textarea
                id="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Describa la ubicación física de la muestra..."
                rows={3}
                className={errors.ubicacion ? 'border-red-500' : ''}
              />
              {errors.ubicacion && <p className="text-xs text-red-500">{errors.ubicacion}</p>}
            </div>
          </div>

          {/* Viales */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Viales</h3>
              <Button type="button" variant="outline" size="sm" onClick={addVial}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir vial
              </Button>
            </div>
            
            {vialesList.length === 0 ? (
              <p className="text-sm text-gray-500">No hay viales registrados.</p>
            ) : (
              <div className="space-y-3">
                {vialesList.map((vial, index) => (
                  <div key={index} className="flex items-end gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`vial-${index}-identificador`}>Identificador</Label>
                      <Input
                        id={`vial-${index}-identificador`}
                        value={vial.identificador}
                        onChange={(e) => updateVialField(index, 'identificador', e.target.value)}
                        placeholder="V-001"
                      />
                    </div>
                    <div className="w-48 space-y-2">
                      <Label htmlFor={`vial-${index}-tipo`}>Tipo</Label>
                      <Select 
                        value={vial.tipo} 
                        onValueChange={(value) => updateVialField(index, 'tipo', value as VialType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tumoral">TUMORAL</SelectItem>
                          <SelectItem value="no_tumoral">NO TUMORAL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeVial(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Guardar cambios' : 'Crear biopsia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};