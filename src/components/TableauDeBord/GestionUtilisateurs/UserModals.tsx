"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  Divider,
  Select,
  SelectItem,
} from "@heroui/react";
import { 
  Save, 
  X, 
  AlertTriangle,
  Mail,
  User,
  Calendar,
  Shield,
  Users,
  Settings,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Edit,
  Trash2,
} from "lucide-react";
import { UsersService, User as UserType } from "@/services/users";
import { UserRole } from "@/lib/permissions";
import { useAuth } from "@/context/AuthContext";
import { extractBackendMessage } from "@/lib/error-handler";
import { isTokenExpiredError } from "@/lib/api-interceptor";

interface UserModalsProps {
  isOpen: boolean;
  type: 'edit' | 'delete' | 'view' | 'toggle' | null;
  user: UserType | null;
  onClose: () => void;
  onRefresh: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface EditFormData {
  name: string;
  email: string;
  role_name: string;
  password?: string;
}

const UserModals: React.FC<UserModalsProps> = ({
  isOpen,
  type,
  user,
  onClose,
  onRefresh,
  onSuccess,
  onError
}) => {
  const { user: currentUser } = useAuth();
  
  // États pour le formulaire de modification
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    email: '',
    role_name: '',
    password: ''
  });
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Initialiser le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (user && type === 'edit') {
      setEditForm({
        name: user.name,
        email: user.email,
        role_name: user.role_id === UserRole.ADMIN ? 'admin' : 'partner',
        password: ''
      });
    }
  }, [user, type]);

  // Gestion des changements dans le formulaire
  const handleEditFormChange = (field: keyof EditFormData, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Fonction pour modifier un utilisateur
  const handleEditSubmit = async () => {
    if (!user || !currentUser) return;

    setEditLoading(true);
    try {
      const updateData: any = {
        id: user.id,
        name: editForm.name,
        email: editForm.email,
        role_name: editForm.role_name,
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (editForm.password && editForm.password.trim()) {
        updateData.password = editForm.password;
      }

      const result = await UsersService.updateUser(updateData);
      
      if (result.code === 200 || result.status === 'success') {
        onSuccess?.(extractBackendMessage(result) || result?.message || 'Opération réussie');
        onRefresh();
        onClose();
      } else {
        onError?.(extractBackendMessage(result) || result.message);
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      onError?.(extractBackendMessage(error));
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour supprimer un utilisateur
  const handleDeleteSubmit = async () => {
    if (!user || !currentUser) return;

    setDeleteLoading(true);
    try {
      const result = await UsersService.deleteUser(user.id);
      
      if (result.code === 200 || result.status === 'success') {
        onSuccess?.(extractBackendMessage(result) || result?.message || 'Opération réussie');
        onRefresh();
        onClose();
      } else {
        onError?.(extractBackendMessage(result) || result.message);
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      onError?.(extractBackendMessage(error));
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fonction pour activer/désactiver un utilisateur
  const handleToggleSubmit = async () => {
    if (!user || !currentUser) return;

    setToggleLoading(true);
    try {
      const result = await UsersService.toggleUserStatus(user.id, !user.is_active);
      
      if (result.code === 200 || result.status === 'success') {
        onSuccess?.(extractBackendMessage(result) || result?.message || 'Opération réussie');
        onRefresh();
        onClose();
      } else {
        onError?.(extractBackendMessage(result) || result.message);
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      onError?.(extractBackendMessage(error));
    } finally {
      setToggleLoading(false);
    }
  };

  // Validation du formulaire
  const isFormValid = () => {
    return editForm.name.trim() && 
           editForm.email.trim() && 
           editForm.role_name.trim();
  };

  // Fonctions utilitaires pour les rôles
  const getRoleLabel = (roleId: UserRole | number) => {
    if (roleId === UserRole.ADMIN || roleId === 1) return "Administrateur";
    if (roleId === UserRole.PARTNER || roleId === 5) return "Partenaire";
    return "Utilisateur";
  };

  const getRoleColor = (roleId: UserRole | number) => {
    if (roleId === UserRole.ADMIN || roleId === 1) return "danger";
    if (roleId === UserRole.PARTNER || roleId === 5) return "primary";
    return "default";
  };

  if (!user) return null;

  // Modal de visualisation
  if (type === 'view') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        scrollBehavior="inside"
        placement="center"
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[85vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg dark:border-gray-600">
                <div className="text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <Card>
                <CardBody className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Rôle</p>
                        <Chip
                          color={getRoleColor(user.role_id)}
                          size="sm"
                          variant="flat"
                          startContent={
                            (user.role_id === UserRole.ADMIN || user.role_id === 1) ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <Users className="h-3 w-3" />
                            )
                          }
                        >
                          {getRoleLabel(user.role_id)}
                        </Chip>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                        <Chip
                          color={user.is_active ? "success" : "warning"}
                          size="sm"
                          variant="flat"
                          startContent={
                            user.is_active ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <UserX className="h-3 w-3" />
                            )
                          }
                        >
                          {user.is_active ? "Actif" : "Inactif"}
                        </Chip>
                      </div>
                    </div>
                    
                    {user.partner_name && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Partenaire</p>
                          <p className="font-medium">{user.partner_name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Créé le</p>
                        <p className="font-medium">
                          {new Date(user.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Dernière activité</p>
                        <p className="font-medium">
                          {new Date(user.updated_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal de modification
  if (type === 'edit') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
        placement="center"
        isDismissable={!editLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[90vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <h3 className="text-xl font-bold">Modifier l'utilisateur</h3>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              {/* Informations personnelles */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Informations personnelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom complet"
                    placeholder="Nom de l'utilisateur"
                    value={editForm.name}
                    onValueChange={(value) => handleEditFormChange('name', value)}
                    isRequired
                  />

                  <Input
                    label="Email"
                    placeholder="email@example.com"
                    type="email"
                    value={editForm.email}
                    onValueChange={(value) => handleEditFormChange('email', value)}
                    isRequired
                  />
                </div>
                
                <div className="mt-4">
                  <Input
                    label="Nouveau mot de passe"
                    placeholder="Laisser vide pour conserver l'ancien mot de passe"
                    type={isPasswordVisible ? "text" : "password"}
                    value={editForm.password || ''}
                    onValueChange={(value) => handleEditFormChange('password', value)}
                    description="Optionnel - Laisser vide pour ne pas modifier le mot de passe"
                    endContent={
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="focus:outline-none"
                        aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    }
                  />
                </div>
              </div>

              <Divider />

              {/* Rôle utilisateur */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Rôle et permissions</h4>
                <Select
                  label="Rôle utilisateur"
                  placeholder="Sélectionner un rôle"
                  selectedKeys={editForm.role_name ? [editForm.role_name] : []}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    handleEditFormChange('role_name', value);
                  }}
                  isRequired
                >
                  <SelectItem key="admin">
                    Administrateur
                  </SelectItem>
                  <SelectItem key="partner">
                    Partenaire
                  </SelectItem>
                </Select>
              </div>

            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={editLoading}
            >
              Annuler
            </Button>
            <Button 
              color="primary" 
              onPress={handleEditSubmit}
              isLoading={editLoading}
              isDisabled={!isFormValid()}
              startContent={!editLoading ? <Save className="h-4 w-4" /> : undefined}
            >
              {editLoading ? 'Modification...' : 'Modifier'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal de suppression
  if (type === 'delete') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        placement="center"
        isDismissable={!deleteLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Supprimer l'utilisateur
                </h3>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.name}</strong> ?
              </p>
              
              <Card className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <CardBody className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Attention
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Cette action est irréversible. L'utilisateur sera définitivement supprimé 
                        ainsi que toutes ses données associées.
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteSubmit}
              isLoading={deleteLoading}
              startContent={!deleteLoading ? <X className="h-4 w-4" /> : undefined}
            >
              {deleteLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  // Modal d'activation/désactivation
  if (type === 'toggle') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        placement="center"
        isDismissable={!toggleLoading}
        classNames={{
          base: "bg-white dark:bg-gray-900",
          backdrop: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                user.is_active 
                  ? "bg-orange-100 dark:bg-orange-900/30" 
                  : "bg-green-100 dark:bg-green-900/30"
              }`}>
                {user.is_active ? (
                  <UserX className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                ) : (
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {user.is_active ? "Désactiver" : "Activer"} l'utilisateur
                </h3>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-6 py-4">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {user.is_active 
                  ? `L'utilisateur ${user.name} ne pourra plus se connecter à la plateforme`
                  : `L'utilisateur ${user.name} pourra à nouveau accéder à la plateforme`
                }
              </p>
              
              <Card className={`border ${
                user.is_active 
                  ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20" 
                  : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
              }`}>
                <CardBody className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      user.is_active 
                        ? "bg-orange-500 text-white" 
                        : "bg-green-500 text-white"
                    }`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        user.is_active 
                          ? "text-orange-800 dark:text-orange-200"
                          : "text-green-800 dark:text-green-200"
                      }`}>
                        {user.name}
                      </p>
                      <p className={`text-sm ${
                        user.is_active 
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-green-600 dark:text-green-400"
                      }`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={onClose}
              isDisabled={toggleLoading}
            >
              Annuler
            </Button>
            <Button 
              color={user.is_active ? "warning" : "success"}
              onPress={handleToggleSubmit}
              isLoading={toggleLoading}
              startContent={!toggleLoading ? (
                user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />
              ) : undefined}
            >
              {toggleLoading 
                ? 'Mise à jour...' 
                : user.is_active 
                  ? 'Désactiver' 
                  : 'Activer'
              }
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return null;
};

export default UserModals;