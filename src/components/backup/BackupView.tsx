// Vista de copias de seguridad
// Solo visible para Administradores

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
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
  Button,
} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
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
  Shield,
  Download,
  Upload,
  Folder,
  History,
} from 'lucide-react';
import { CryptoUtils, DateUtils } from '@/utils/crypto';

export const BackupView: React.FC = () => {
  const { 
    usuarios, 
    biopsias, 
    viales, 
    notas, 
    historial,
    createCopiaSeguridad,
    getCopiasSeguridad,
    restoreFullState,
    session
  } = useAppContext();
  const { toast } = useToast();
  
  const [showCreateBackup, setShowCreateBackup] = useState(false);
  const [showRestoreBackup, setShowRestoreBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [backups, setBackups] = useState<{ id: string; nombre: string; fecha: string }[]>([]);

  // Cargar copias de seguridad
  useEffect(() => {
    const loadBackups = async () => {
      const backupsData = await getCopiasSeguridad();
      setBackups(backupsData.map((c: any) => ({
        id: c.id,
        nombre: c.nombre,
        fecha: c.fecha,
      })));
    };
    loadBackups();
  }, [getCopiasSeguridad]);

  // Crear copia de seguridad
  const handleCreateBackup = async () => {
    try {
      const now = DateUtils.getCurrentDateTime();
      const backup = {
        id: CryptoUtils.generateId(),
        nombre: `Backup_${DateUtils.getCurrentDate()}`,
        fecha: now,
        tamano_bytes: 0, // Se calcularía en producción
        creado_por: session?.username || '',
      };
      
      await createCopiaSeguridad(backup);
      await toast({
        title: 'Éxito',
        description: 'Copia de seguridad creada correctamente',
      });
      setShowCreateBackup(false);
    } catch (error) {
      await toast({
        title: 'Error',
        description: 'Error al crear la copia de seguridad',
        variant: 'destructive',
      });
    }
  };

  // Restaurar copia de seguridad
  const handleRestoreBackup = async (backupId: string) => {
    if (window.confirm('Esta acción reemplazará los datos actuales. ¿Quieres continuar?')) {
      try {
        await restoreFullState({
          usuarios: [],
          biopsias: [],
          viales: [],
          notas: [],
          historial: [],
          copias_seguridad: [],
        });
        
        await toast({
          title: 'Éxito',
          description: 'Datos restaurados correctamente',
        });
        setShowRestoreBackup(false);
      } catch (error) {
        await toast({
          title: 'Error',
          description: 'Error al restaurar los datos',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Copia de seguridad</h1>
          <p className="text-sm text-gray-500">
            Gestión de copias de seguridad de la base de datos
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowCreateBackup(true)}>
          <Shield className="h-4 w-4 mr-2" />
          Crear copia
        </Button>
      </div>

      {/* Lista de copias */}
      <Card>
        <CardHeader>
          <CardTitle>Copias de seguridad ({backups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <p className="text-sm text-gray-500">No hay copias de seguridad registradas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>{backup.nombre}</TableCell>
                    <TableCell>{backup.fecha}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedBackup(backup.id)}
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowRestoreBackup(true)}
                      >
                        <Upload className="h-4 w-4" />
                        Restaurar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog crear copia */}
      <Dialog open={showCreateBackup} onOpenChange={setShowCreateBackup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear copia de seguridad</DialogTitle>
            <DialogDescription>
              Se creará una copia con todos los datos actuales del sistema
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBackup(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBackup}>
              Crear copia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog restaurar copia */}
      <Dialog open={showRestoreBackup} onOpenChange={setShowRestoreBackup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar copia de seguridad</DialogTitle>
            <DialogDescription>
              Esta acción reemplazará los datos actuales. ¿Quieres continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreBackup(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleRestoreBackup(selectedBackup!)}>
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};