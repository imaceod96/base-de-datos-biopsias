// Ficha individual de biopsia
// Muestra información detallada, viales y notas

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Biopsia, Vial, Nota } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Edit, Trash2, Plus, Clock, User } from 'lucide-react';
import { CryptoUtils, DateUtils } from '@/utils/crypto';

interface BiopsiaDetailProps {
  biopsiaId: string;
  onBack: () => void;
  onEdit: () => void;
}

export const BiopsiaDetail: React.FC<BiopsiaDetailProps> = ({ biopsiaId, onBack, onEdit }) => {
  const { biopsias, viales, notas, createNota, deleteNota, addHistorialEntry, session } = useAppContext();
  const { toast } = useToast();
  
  const biopsia = biopsias.find(b => b.id === biopsiaId);
  const vialesBiopsia = viales.filter(v => v.biopsia_id === biopsiaId);
  const notasBiopsia = notas.filter(n => n.biopsia_id === biopsiaId);
  
  // Estado para nueva nota
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notaToDelete, setNotaToDelete] = useState<string | null>(null);

  if (!biopsia) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Biopsia no encontrada</p>
        <Button onClick={onBack}>Volver</Button>
      </div>
    );
  }

  // Añadir nota
  const handleAddNote = async () => {
    if (!newNoteText.trim()) {
      toast({
        title: 'Error',
        description: 'El texto de la nota no puede estar vacío',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createNota({
        id: CryptoUtils.generateId(),
        biopsia_id: biopsiaId,
        usuario_id: session?.userId || '',
        texto: newNoteText,
        fecha_creacion: DateUtils.getCurrentDateTime(),
      });
      
      await addHistorialEntry({
        usuario_id: session?.userId || '',
        username: session?.username || '',
        accion: 'crear_nota',
        entidad: 'nota',
        entidad_id: biopsiaId,
        descripcion: `Añadió una nota a biopsia ${biopsia.numero_biopsia}`,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });
      
      toast({
        title: 'Éxito',
        description: 'Nota añadida correctamente',
      });
      setNewNoteText('');
      setShowNewNote(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al añadir la nota',
        variant: 'destructive',
      });
    }
  };

  // Eliminar nota
  const handleDeleteNote = async (notaId: string) => {
    try {
      await deleteNota(notaId);
      await addHistorialEntry({
        usuario_id: session?.userId || '',
        username: session?.username || '',
        accion: 'eliminar_nota',
        entidad: 'nota',
        entidad_id: notaId,
        descripcion: `Eliminó una nota de biopsia ${biopsia.numero_biopsia}`,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });
      
      toast({
        title: 'Éxito',
        description: 'Nota eliminada correctamente',
      });
      setNotaToDelete(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar la nota',
        variant: 'destructive',
      });
    }
  };

  // Eliminar biopsia
  const handleDeleteBiopsia = async () => {
    if (window.confirm('¿Seguro que quieres eliminar esta biopsia? Esta acción eliminará también sus viales asociados.')) {
      try {
        // Implementar eliminación
        toast({
          title: 'Éxito',
          description: 'Biopsia eliminada correctamente',
        });
        onBack();
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Biopsia {biopsia.numero_biopsia}
          </h1>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Información de la biopsia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de la biopsia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Localización</Label>
              <p className="text-sm text-gray-900">
                {biopsia.localizacion === 'Mama' ? 'Mama' :
                 biopsia.localizacion === 'Pulmon' ? 'Pulmón' :
                 biopsia.localizacion === 'Prostata' ? 'Próstata' : 'Sistema digestivo'}
                {biopsia.localizacion_especifica && ` - ${biopsia.localizacion_especifica}`}
              </p>
            </div>
            <div>
              <Label>Diagnóstico</Label>
              <p className="text-sm text-gray-900">{biopsia.diagnostico}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Año de extracción</Label>
                <p className="text-sm text-gray-900">{biopsia.anio_extraccion}</p>
              </div>
              <div>
                <Label>Sexo</Label>
                <p className="text-sm text-gray-900">
                  {biopsia.sexo === 'Femenino' ? 'Femenino' :
                   biopsia.sexo === 'Masculino' ? 'Masculino' :
                   biopsia.sexo === 'Otro' ? 'Otro' : 'No especificado'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ubicación física</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>Ubicación</Label>
              <p className="text-sm text-gray-900">{biopsia.ubicacion}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Viales */}
      <Card>
        <CardHeader>
          <CardTitle>Viales ({vialesBiopsia.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {vialesBiopsia.length === 0 ? (
            <p className="text-sm text-gray-500">No hay viales registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vialesBiopsia.map((vial) => (
                  <TableRow key={vial.id}>
                    <TableCell className="font-medium">{vial.identificador_vial}</TableCell>
                    <TableCell>
                      <Badge variant={vial.tipo === 'tumoral' ? 'destructive' : 'secondary'}>
                        {vial.tipo === 'tumoral' ? 'TUMORAL' : 'NO TUMORAL'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notasBiopsia.length === 0 ? (
            <p className="text-sm text-gray-500">Todavía no existen notas para esta biopsia.</p>
          ) : (
            notasBiopsia.map((nota) => (
              <div key={nota.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">{nota.usuario_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {DateUtils.formatDate(nota.fecha_creacion)} {DateUtils.formatTime(nota.fecha_creacion)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-900">{nota.texto}</p>
              </div>
            ))
          )}
          
          {showNewNote ? (
            <div className="border rounded-lg p-4 space-y-4">
              <Label>Nueva nota</Label>
              <Textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Escriba su nota..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewNote(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddNote}>
                  Guardar nota
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowNewNote(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir nota
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Creada por: {biopsia.created_by}</span>
        <span>Fecha: {DateUtils.formatDate(biopsia.fecha_creacion)}</span>
      </div>
    </div>
  );
};