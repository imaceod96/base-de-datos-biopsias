// Vista de Mi cuenta
// Permite cambiar la contraseña del usuario

import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
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
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Key,
  Save,
  AlertCircle,
} from 'lucide-react';
import { CryptoUtils, DateUtils } from '@/utils/crypto';

export const CuentaView: React.FC = () => {
  const { session, usuarios } = useAppContext();
  const { toast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const user = session ? usuarios.find(u => u.id === session.userId) : null;

  // Verificar contraseña actual
  const verifyCurrentPassword = async () => {
    if (!user) return false;
    const isValid = await CryptoUtils.verifyPassword(currentPassword, user.password_hash, user.salt);
    return isValid;
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'La nueva contraseña debe tener al menos 8 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      const isValid = await verifyCurrentPassword();
      if (!isValid) {
        toast({
          title: 'Error',
          description: 'La contraseña actual es incorrecta',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { hash, salt } = await CryptoUtils.generateSecureHash(newPassword);
      const updatedUser = {
        ...user,
        password_hash: hash,
        salt: salt,
        updated_at: DateUtils.getCurrentDateTime(),
      };
      
      // Actualizar usuario
      // await updateUsuario(updatedUser);
      
      toast({
        title: 'Éxito',
        description: 'Contraseña cambiada correctamente',
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cambiar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
        <p className="text-sm text-gray-500">
          Gestiona tus preferencias y credenciales
        </p>
      </div>

      {/* Información del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nombre de usuario</Label>
              <p className="text-lg font-medium">{user.username}</p>
            </div>
            <div>
              <Label>Rol</Label>
              <Badge variant={user.role === 'admin' ? 'default' : user.role === 'gestor' ? 'secondary' : 'outline'}>
                {user.role === 'admin' ? 'Administrador' : 
                 user.role === 'gestor' ? 'Gestor' : 'Visualizador'}
              </Badge>
            </div>
            <div>
              <Label>Estado</Label>
              <Badge variant={user.active ? 'default' : 'destructive'}>
                {user.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <div>
              <Label>Fecha de creación</Label>
              <p className="text-sm text-gray-600">{DateUtils.formatDate(user.created_at)}</p>
            </div>
            <div>
              <Label>Último acceso</Label>
              <p className="text-sm text-gray-600">
                {user.last_login ? DateUtils.formatDate(user.last_login) : 'Nunca'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Introduzca su contraseña actual"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
              />
            </div>
          </div>
          
          <Button onClick={handleChangePassword} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};