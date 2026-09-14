// Vista de gestión de usuarios
// Solo visible para Administradores

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Usuario, Role } from '@/types';
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
  Switch,
} from '@/components/ui/switch';
import {
  Trash2,
  Edit,
  Plus,
  Shield,
  UserCheck,
  UserX,
  Key,
} from 'lucide-react';
import { CryptoUtils, DateUtils } from '@/utils/crypto';

export const UsuariosView: React.FC = () => {
  const { 
    usuarios, 
    createUsuario, 
    updateUsuario, 
    deleteUsuario,
    addHistorialEntry,
    session
  } = useAppContext();
  const { toast } = useToast();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('visualizador');
  const [newActive, setNewActive] = useState(true);

  // Verificar si es el último admin
  const getActiveAdmins = () => usuarios.filter(u => u.role === 'admin' && u.active);
  const isLastAdmin = (userId: string) => {
    const admins = getActiveAdmins();
    return admins.length === 1 && admins[0].id === userId;
  };

  // Manejar creación/edición
  const handleSubmit = async () => {
    if (!newUsername.trim() || (!editingUser && !newPassword)) {
      toast({
        title: 'Error',
        description: 'El nombre de usuario y la contraseña son obligatorios para nuevos usuarios',
        variant: 'destructive',
      });
      return;
    }

    try {
      const now = DateUtils.getCurrentDateTime();
      
      if (editingUser) {
        // Editar usuario existente
        const updatedUser: Usuario = {
          ...editingUser,
          username: newUsername,
          role: newRole,
          active: newActive,
          updated_at: now,
        };
        
        await updateUsuario(updatedUser);
        await addHistorialEntry({
          usuario_id: session?.userId || '',
          username: session?.username || '',
          accion: 'editar_usuario',
          entidad: 'usuario',
          entidad_id: editingUser.id,
          descripcion: `Editó usuario ${newUsername}`,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        });
        
        toast({
          title: 'Éxito',
          description: 'Usuario actualizado correctamente',
        });
      } else {
        // Crear nuevo usuario
        const { hash, salt } = await CryptoUtils.generateSecureHash(newPassword);
        
        const newUser: Usuario = {
          id: CryptoUtils.generateId(),
          username: newUsername,
          password_hash: hash,
          salt: salt,
          role: newRole,
          active: newActive,
          created_at: now,
          updated_at: now,
          last_login: null,
        };
        
        await createUsuario(newUser);
        await addHistorialEntry({
          usuario_id: session?.userId || '',
          username: session?.username || '',
          accion: 'crear_usuario',
          entidad: 'usuario',
          entidad_id: newUser.id,
          descripcion: `Creó usuario ${newUsername}`,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        });
        
        toast({
          title: 'Éxito',
          description: 'Usuario creado correctamente',
        });
      }
      
      setShowDialog(false);
      setEditingUser(null);
      setNewUsername('');
      setNewPassword('');
      setNewRole('visualizador');
      setNewActive(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar el usuario',
        variant: 'destructive',
      });
    }
  };

  // Manejar eliminación
  const handleDelete = async (user: Usuario) => {
    if (isLastAdmin(user.id)) {
      toast({
        title: 'Error',
        description: 'No se puede eliminar el último administrador activo',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm(`¿Seguro que quieres eliminar al usuario ${user.username}?`)) {
      try {
        await deleteUsuario(user.id);
        await addHistorialEntry({
          usuario_id: session?.userId || '',
          username: session?.username || '',
          accion: 'eliminar_usuario',
          entidad: 'usuario',
          entidad_id: user.id,
          descripcion: `Eliminó usuario ${user.username}`,
          fecha: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        });
        
        toast({
          title: 'Éxito',
          description: 'Usuario eliminado correctamente',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Error al eliminar el usuario',
          variant: 'destructive',
        });
      }
    }
  };

  // Manejar restablecimiento de contraseña
  const handleResetPassword = async (user: Usuario) => {
    const newPassword = prompt('Introduzca la nueva contraseña (mínimo 8 caracteres):');
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'La contraseña debe tener al menos 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { hash, salt } = await CryptoUtils.generateSecureHash(newPassword);
      const updatedUser: Usuario = {
        ...user,
        password_hash: hash,
        salt: salt,
        updated_at: DateUtils.getCurrentDateTime(),
      };
      
      await updateUsuario(updatedUser);
      await addHistorialEntry({
        usuario_id: session?.userId || '',
        username: session?.username || '',
        accion: 'restablecer_contrasena',
        entidad: 'usuario',
        entidad_id: user.id,
        descripcion: `Restableció la contraseña de ${user.username}`,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });
      
      toast({
        title: 'Éxito',
        description: 'Contraseña restablecida correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al restablecer la contraseña',
        variant: 'destructive',
      });
    }
  };

  // Manejar cambio de estado
  const handleToggleState = async (user: Usuario) => {
    if (isLastAdmin(user.id) && user.active) {
      toast({
        title: 'Error',
        description: 'No se puede desactivar el último administrador activo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updatedUser: Usuario = {
        ...user,
        active: !user.active,
        updated_at: DateUtils.getCurrentDateTime(),
      };
      
      await updateUsuario(updatedUser);
      await addHistorialEntry({
        usuario_id: session?.userId || '',
        username: session?.username || '',
        accion: !user.active ? 'activar_usuario' : 'desactivar_usuario',
        entidad: 'usuario',
        entidad_id: user.id,
        descripcion: `${!user.active ? 'Activó' : 'Desactivó'} usuario ${user.username}`,
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      });
      
      toast({
        title: 'Éxito',
        description: `Usuario ${!user.active ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cambiar el estado del usuario',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500">
            Gestión de usuarios y roles del sistema
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de usuarios ({usuarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de creación</TableHead>
                  <TableHead>Último acceso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="6" className="text-center py-4">
                      Todavía no hay usuarios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'admin' ? 'default' :
                          user.role === 'gestor' ? 'secondary' : 'outline'
                        }>
                          {user.role === 'admin' ? 'Administrador' :
                           user.role === 'gestor' ? 'Gestor' : 'Visualizador'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={user.active}
                          onCheckedChange={() => handleToggleState(user)}
                          disabled={isLastAdmin(user.id) && user.active}
                        />
                      </TableCell>
                      <TableCell>{DateUtils.formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.last_login ? DateUtils.formatDate(user.last_login) : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditingUser(user);
                              setNewUsername(user.username);
                              setNewRole(user.role);
                              setNewActive(user.active);
                              setShowDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleResetPassword(user)}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(user)}
                            disabled={isLastAdmin(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para crear/editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifique los datos del usuario' : 'Complete los datos para crear un nuevo usuario'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Introduzca el nombre de usuario"
              />
            </div>
            
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="visualizador">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {editingUser && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newActive}
                  onCheckedChange={setNewActive}
                />
                <Label>Activo</Label>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};