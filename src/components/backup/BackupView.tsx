import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { AppState } from '@/types';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  Shield,
  Download,
  Upload,
} from 'lucide-react';

import { save, open } from '@tauri-apps/plugin-dialog';
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs';

interface BackupFile {
  formato: string;
  version: number;
  fecha_creacion: string;
  creado_por: string;
  datos: AppState;
}

export const BackupView: React.FC = () => {
  const {
    getFullState,
    restoreFullState,
    session,
  } = useAppContext();

  const { toast } = useToast();

  const [showCreateBackup, setShowCreateBackup] = useState(false);
  const [showRestoreBackup, setShowRestoreBackup] = useState(false);

  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
  const [pendingBackupPath, setPendingBackupPath] = useState('');

  const isValidBackup = (value: unknown): value is BackupFile => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const backup = value as Partial<BackupFile>;

    if (backup.formato !== 'BancoDeTumoresINOR') {
      return false;
    }

    if (backup.version !== 1) {
      return false;
    }

    if (!backup.datos || typeof backup.datos !== 'object') {
      return false;
    }

    const datos = backup.datos as Partial<AppState>;

    return (
      Array.isArray(datos.usuarios) &&
      Array.isArray(datos.biopsias) &&
      Array.isArray(datos.viales) &&
      Array.isArray(datos.notas) &&
      Array.isArray(datos.historial) &&
      Array.isArray(datos.copias_seguridad)
    );
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);

      const state = await getFullState();
      const createdAt = new Date().toISOString();

      const backupData: BackupFile = {
        formato: 'BancoDeTumoresINOR',
        version: 1,
        fecha_creacion: createdAt,
        creado_por: session?.username || 'desconocido',
        datos: state,
      };

      const json = JSON.stringify(backupData, null, 2);

      const date = new Date();
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');

      const fileName =
        `BancoTumores_Backup_${yyyy}-${mm}-${dd}_${hh}-${min}.json`;

      const filePath = await save({
        defaultPath: fileName,
        filters: [
          {
            name: 'Copia de seguridad Banco de Tumores',
            extensions: ['json'],
          },
        ],
      });

      if (!filePath) {
        return;
      }

      await writeTextFile(filePath, json);

      setShowCreateBackup(false);

      toast({
        title: 'Copia creada',
        description: 'La copia de seguridad se ha guardado correctamente.',
      });
    } catch (error) {
      console.error('Error creando backup:', error);

      toast({
        title: 'Error',
        description: 'No se pudo crear la copia de seguridad.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSelectBackup = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: 'Copia de seguridad Banco de Tumores',
            extensions: ['json'],
          },
        ],
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      const contents = await readTextFile(selected);

      let parsed: unknown;

      try {
        parsed = JSON.parse(contents);
      } catch {
        toast({
          title: 'Archivo no válido',
          description: 'El archivo seleccionado no contiene un JSON válido.',
          variant: 'destructive',
        });
        return;
      }

      if (!isValidBackup(parsed)) {
        toast({
          title: 'Copia no válida',
          description:
            'El archivo no corresponde a una copia compatible de Banco de Tumores INOR.',
          variant: 'destructive',
        });
        return;
      }

      setPendingBackup(parsed);
      setPendingBackupPath(selected);
      setShowRestoreBackup(true);
    } catch (error) {
      console.error('Error leyendo backup:', error);

      toast({
        title: 'Error',
        description: 'No se pudo leer la copia de seguridad seleccionada.',
        variant: 'destructive',
      });
    }
  };

  const handleRestoreBackup = async () => {
    if (!pendingBackup) {
      return;
    }

    try {
      setRestoring(true);

      await restoreFullState(pendingBackup.datos);

      setShowRestoreBackup(false);
      setPendingBackup(null);
      setPendingBackupPath('');

      toast({
        title: 'Restauración completada',
        description:
          'Los datos de la copia de seguridad se han restaurado correctamente.',
      });
    } catch (error) {
      console.error('Error restaurando backup:', error);

      toast({
        title: 'Error al restaurar',
        description:
          'La restauración no pudo completarse. Los datos anteriores se han conservado.',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Copia de seguridad
          </h1>

          <p className="text-sm text-gray-500">
            Protege los datos almacenados en la base de datos
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => setShowCreateBackup(true)}
        >
          <Shield className="h-4 w-4 mr-2" />
          Crear copia
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Copias de seguridad</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Las copias se guardan como archivos independientes de la aplicación.
            Puedes almacenarlas en otra carpeta, una memoria USB o una unidad externa.
          </p>

          <div className="rounded-md border p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 mt-0.5" />

              <div className="flex-1">
                <p className="font-medium">
                  Crear una copia completa
                </p>

                <p className="text-sm text-gray-500">
                  Incluye usuarios, biopsias, viales, notas, historial
                  y los demás datos almacenados en SQLite.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowCreateBackup(true)}
              >
                Crear copia
              </Button>
            </div>
          </div>

          <div className="rounded-md border p-4">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 mt-0.5" />

              <div className="flex-1">
                <p className="font-medium">
                  Restaurar una copia
                </p>

                <p className="text-sm text-gray-500">
                  Selecciona un archivo de copia previamente creado por la aplicación.
                  El archivo será validado antes de modificar la base de datos.
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleSelectBackup}
              >
                Seleccionar archivo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showCreateBackup}
        onOpenChange={setShowCreateBackup}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Crear copia de seguridad
            </DialogTitle>

            <DialogDescription>
              Se creará un archivo con todos los datos actuales.
              Podrás elegir dónde guardarlo.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={creating}
              onClick={() => setShowCreateBackup(false)}
            >
              Cancelar
            </Button>

            <Button
              disabled={creating}
              onClick={handleCreateBackup}
            >
              {creating ? 'Creando...' : 'Crear copia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRestoreBackup}
        onOpenChange={(open) => {
          if (!restoring) {
            setShowRestoreBackup(open);

            if (!open) {
              setPendingBackup(null);
              setPendingBackupPath('');
            }
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Restaurar copia de seguridad
            </DialogTitle>

            <DialogDescription>
              Esta operación reemplazará todos los datos actuales por los
              contenidos en la copia seleccionada.
            </DialogDescription>
          </DialogHeader>

          {pendingBackup && (
            <div className="rounded-md border p-3 text-sm space-y-1">
              <p>
                <strong>Fecha:</strong>{' '}
                {new Date(pendingBackup.fecha_creacion).toLocaleString()}
              </p>

              <p>
                <strong>Creada por:</strong>{' '}
                {pendingBackup.creado_por}
              </p>

              <p>
                <strong>Biopsias:</strong>{' '}
                {pendingBackup.datos.biopsias.length}
              </p>

              <p>
                <strong>Viales:</strong>{' '}
                {pendingBackup.datos.viales.length}
              </p>

              <p className="text-xs text-gray-500 break-all">
                {pendingBackupPath}
              </p>
            </div>
          )}

          <p className="text-sm font-medium">
            Esta acción no se puede deshacer. Asegúrate de haber creado
            una copia de los datos actuales antes de continuar.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={restoring}
              onClick={() => setShowRestoreBackup(false)}
            >
              Cancelar
            </Button>

            <Button
              variant="destructive"
              disabled={restoring}
              onClick={handleRestoreBackup}
            >
              {restoring ? 'Restaurando...' : 'Restaurar datos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
