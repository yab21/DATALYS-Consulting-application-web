"use client";

import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Input,
  Switch,
  Chip,
  Avatar,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tabs,
  Tab,
  cn,
} from '@heroui/react';
import { motion } from 'framer-motion';
import { useSimpleNotifications } from '@/context/NotificationContext';

// Types pour les permissions
export type Permission = 
  | 'read' 
  | 'write' 
  | 'delete' 
  | 'share' 
  | 'admin'
  | 'create_project'
  | 'manage_users'
  | 'manage_partners'
  | 'view_analytics'
  | 'export_data'
  | 'system_settings';

export type Role = 'super_admin' | 'admin' | 'manager' | 'editor' | 'viewer' | 'guest';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  avatar?: string;
  role: Role;
  permissions: Permission[];
  departement?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface PermissionRule {
  id: string;
  name: string;
  description: string;
  resource: string;
  permissions: Permission[];
  conditions?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
    value: any;
  }[];
}

export interface RoleDefinition {
  role: Role;
  label: string;
  description: string;
  permissions: Permission[];
  color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  hierarchy: number;
}

// Définitions des rôles par défaut
const DEFAULT_ROLES: RoleDefinition[] = [
  {
    role: 'super_admin',
    label: 'Super Administrateur',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: ['read', 'write', 'delete', 'share', 'admin', 'create_project', 'manage_users', 'manage_partners', 'view_analytics', 'export_data', 'system_settings'],
    color: 'danger',
    hierarchy: 100,
  },
  {
    role: 'admin',
    label: 'Administrateur',
    description: 'Gestion des utilisateurs et projets',
    permissions: ['read', 'write', 'delete', 'share', 'create_project', 'manage_users', 'manage_partners', 'view_analytics', 'export_data'],
    color: 'warning',
    hierarchy: 80,
  },
  {
    role: 'manager',
    label: 'Manager',
    description: 'Gestion des projets et équipe',
    permissions: ['read', 'write', 'delete', 'share', 'create_project', 'view_analytics'],
    color: 'primary',
    hierarchy: 60,
  },
  {
    role: 'editor',
    label: 'Éditeur',
    description: 'Modification et création de contenu',
    permissions: ['read', 'write', 'share'],
    color: 'secondary',
    hierarchy: 40,
  },
  {
    role: 'viewer',
    label: 'Lecteur',
    description: 'Lecture seule',
    permissions: ['read'],
    color: 'success',
    hierarchy: 20,
  },
  {
    role: 'guest',
    label: 'Invité',
    description: 'Accès très limité',
    permissions: [],
    color: 'default',
    hierarchy: 10,
  },
];

// Descriptions des permissions
const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  read: 'Lecture des données',
  write: 'Modification des données',
  delete: 'Suppression des données',
  share: 'Partage avec d\'autres utilisateurs',
  admin: 'Administration complète',
  create_project: 'Création de nouveaux projets',
  manage_users: 'Gestion des utilisateurs',
  manage_partners: 'Gestion des partenaires',
  view_analytics: 'Accès aux statistiques',
  export_data: 'Export des données',
  system_settings: 'Configuration système',
};

// Context pour les permissions
interface PermissionContextType {
  currentUser: User | null;
  hasPermission: (permission: Permission, resource?: string) => boolean;
  hasRole: (role: Role) => boolean;
  canManageUser: (targetUser: User) => boolean;
  getUserPermissions: (userId: string) => Permission[];
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Provider des permissions
interface PermissionProviderProps {
  children: ReactNode;
  currentUser: User | null;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
  currentUser,
}) => {
  const hasPermission = useCallback((permission: Permission, resource?: string): boolean => {
    if (!currentUser) return false;
    if (!currentUser.isActive) return false;
    
    // Super admin a tous les droits
    if (currentUser.role === 'super_admin') return true;
    
    return currentUser.permissions.includes(permission);
  }, [currentUser]);

  const hasRole = useCallback((role: Role): boolean => {
    if (!currentUser) return false;
    return currentUser.role === role;
  }, [currentUser]);

  const canManageUser = useCallback((targetUser: User): boolean => {
    if (!currentUser) return false;
    if (currentUser.id === targetUser.id) return true; // Peut se gérer soi-même
    
    const currentRoleHierarchy = DEFAULT_ROLES.find(r => r.role === currentUser.role)?.hierarchy || 0;
    const targetRoleHierarchy = DEFAULT_ROLES.find(r => r.role === targetUser.role)?.hierarchy || 0;
    
    return currentRoleHierarchy > targetRoleHierarchy;
  }, [currentUser]);

  const getUserPermissions = useCallback((userId: string): Permission[] => {
    // Logique pour récupérer les permissions d'un utilisateur
    // En production, ceci ferait un appel API
    return currentUser?.id === userId ? currentUser.permissions : [];
  }, [currentUser]);

  const value: PermissionContextType = {
    currentUser,
    hasPermission,
    hasRole,
    canManageUser,
    getUserPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// Composant HOC pour protéger les routes
interface ProtectedComponentProps {
  children: ReactNode;
  requiredPermission?: Permission;
  requiredRole?: Role;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallback,
  showMessage = true,
}) => {
  const { hasPermission, hasRole, currentUser } = usePermissions();

  if (!currentUser) {
    return fallback || (showMessage ? (
      <Card>
        <CardBody className="text-center py-8">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-danger mb-2">Accès non autorisé</h3>
          <p className="text-default-400">Vous devez être connecté pour accéder à cette section.</p>
        </CardBody>
      </Card>
    ) : null);
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || (showMessage ? (
      <Card>
        <CardBody className="text-center py-8">
          <div className="text-4xl mb-4">⛔</div>
          <h3 className="text-lg font-semibold text-warning mb-2">Permission insuffisante</h3>
          <p className="text-default-400">
            Vous n'avez pas la permission "{PERMISSION_DESCRIPTIONS[requiredPermission]}" pour accéder à cette section.
          </p>
        </CardBody>
      </Card>
    ) : null);
  }

  if (requiredRole && !hasRole(requiredRole)) {
    const roleLabel = DEFAULT_ROLES.find(r => r.role === requiredRole)?.label || requiredRole;
    return fallback || (showMessage ? (
      <Card>
        <CardBody className="text-center py-8">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-warning mb-2">Rôle insuffisant</h3>
          <p className="text-default-400">
            Vous devez avoir le rôle "{roleLabel}" pour accéder à cette section.
          </p>
        </CardBody>
      </Card>
    ) : null);
  }

  return <>{children}</>;
};

// Composant principal de gestion des permissions
interface PermissionManagerProps {
  users: User[];
  onUserUpdate?: (user: User) => Promise<void>;
  onUserCreate?: (user: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  onUserDelete?: (userId: string) => Promise<void>;
  className?: string;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  users,
  onUserUpdate,
  onUserCreate,
  onUserDelete,
  className,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [activeTab, setActiveTab] = useState('users');

  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const { hasPermission, canManageUser } = usePermissions();
  const { addNotification } = useSimpleNotifications();

  // Définir tous les callbacks avant les returns conditionnels
  const handleEditUser = useCallback((user: User) => {
    if (!canManageUser(user)) {
      addNotification({
        title: 'Action non autorisée',
        body: 'Vous ne pouvez pas modifier cet utilisateur',
        type: 'warning',
        priority: 'medium',
        category: 'system',
        read: false,
      });
      return;
    }

    setSelectedUser(user);
    setEditingUser(user);
    onEditOpen();
  }, [canManageUser, onEditOpen, addNotification]);

  const handleSaveUser = useCallback(async () => {
    if (!selectedUser || !editingUser || !onUserUpdate) return;

    try {
      const updatedUser: User = {
        ...selectedUser,
        ...editingUser,
        permissions: DEFAULT_ROLES.find(r => r.role === editingUser.role)?.permissions || selectedUser.permissions,
      };

      await onUserUpdate(updatedUser);
      
      addNotification({
        title: 'Utilisateur mis à jour',
        body: `Les permissions de ${updatedUser.prenom} ${updatedUser.nom} ont été mises à jour`,
        type: 'success',
        priority: 'medium',
        category: 'user',
        read: false,
      });

      onEditClose();
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      addNotification({
        title: 'Erreur',
        body: 'Impossible de mettre à jour l\'utilisateur',
        type: 'error',
        priority: 'high',
        category: 'system',
        read: false,
      });
    }
  }, [selectedUser, editingUser, onUserUpdate, onEditClose, addNotification]);

  const handleCreateUser = useCallback(async () => {
    if (!editingUser.nom || !editingUser.prenom || !editingUser.email || !editingUser.role || !onUserCreate) return;

    try {
      const newUser: Omit<User, 'id' | 'createdAt'> = {
        nom: editingUser.nom,
        prenom: editingUser.prenom,
        email: editingUser.email,
        role: editingUser.role,
        permissions: DEFAULT_ROLES.find(r => r.role === editingUser.role)?.permissions || [],
        departement: editingUser.departement,
        isActive: true,
      };

      await onUserCreate(newUser);
      
      addNotification({
        title: 'Utilisateur créé',
        body: `${newUser.prenom} ${newUser.nom} a été ajouté au système`,
        type: 'success',
        priority: 'medium',
        category: 'user',
        read: false,
      });

      setEditingUser({});
      onCreateClose();
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      addNotification({
        title: 'Erreur',
        body: 'Impossible de créer l\'utilisateur',
        type: 'error',
        priority: 'high',
        category: 'system',
        read: false,
      });
    }
  }, [editingUser, onUserCreate, onCreateClose, addNotification]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser || !onUserDelete) return;

    try {
      await onUserDelete(selectedUser.id);
      
      addNotification({
        title: 'Utilisateur supprimé',
        body: `${selectedUser.prenom} ${selectedUser.nom} a été supprimé du système`,
        type: 'success',
        priority: 'medium',
        category: 'user',
        read: false,
      });

      onDeleteClose();
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      addNotification({
        title: 'Erreur',
        body: 'Impossible de supprimer l\'utilisateur',
        type: 'error',
        priority: 'high',
        category: 'system',
        read: false,
      });
    }
  }, [selectedUser, onUserDelete, onDeleteClose, addNotification]);

  const getRoleChip = useCallback((role: Role) => {
    const roleInfo = DEFAULT_ROLES.find(r => r.role === role);
    return (
      <Chip
        size="sm"
        color={roleInfo?.color || 'default'}
        variant="flat"
      >
        {roleInfo?.label || role}
      </Chip>
    );
  }, []);

  // Permission check after all hooks are defined
  if (!hasPermission('manage_users')) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <div className="text-4xl mb-4">⛔</div>
          <h3 className="text-lg font-semibold text-warning mb-2">Permission insuffisante</h3>
          <p className="text-default-400">
            Vous n'avez pas la permission de gérer les utilisateurs pour accéder à cette section.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center w-full">
            <div>
              <h2 className="text-xl font-bold">Gestion des Permissions</h2>
              <p className="text-small text-default-400">
                Gérez les utilisateurs, rôles et permissions du système
              </p>
            </div>
            <Button
              color="primary"
              startContent={<span>👤</span>}
              onPress={() => {
                setEditingUser({});
                onCreateOpen();
              }}
            >
              Nouvel utilisateur
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tab key="users" title="Utilisateurs">
              <div className="space-y-4">
                <Table aria-label="Table des utilisateurs">
                  <TableHeader>
                    <TableColumn>UTILISATEUR</TableColumn>
                    <TableColumn>RÔLE</TableColumn>
                    <TableColumn>DÉPARTEMENT</TableColumn>
                    <TableColumn>STATUT</TableColumn>
                    <TableColumn>DERNIÈRE CONNEXION</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={user.avatar}
                              name={`${user.prenom} ${user.nom}`}
                              size="sm"
                            />
                            <div>
                              <p className="font-medium">{user.prenom} {user.nom}</p>
                              <p className="text-small text-default-400">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleChip(user.role)}</TableCell>
                        <TableCell>{user.departement || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={user.isActive ? 'success' : 'danger'}
                            variant="flat"
                          >
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          {user.lastLogin ? user.lastLogin.toLocaleDateString() : 'Jamais'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => handleEditUser(user)}
                              isDisabled={!canManageUser(user)}
                            >
                              Éditer
                            </Button>
                            <Button
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => {
                                setSelectedUser(user);
                                onDeleteOpen();
                              }}
                              isDisabled={!canManageUser(user)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>

            <Tab key="roles" title="Rôles & Permissions">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_ROLES.map((role) => (
                  <motion.div
                    key={role.role}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between w-full">
                          <Chip color={role.color} variant="solid" size="sm">
                            {role.label}
                          </Chip>
                          <span className="text-small text-default-400">
                            Niveau {role.hierarchy}
                          </span>
                        </div>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <p className="text-small text-default-600 mb-3">
                          {role.description}
                        </p>
                        <div className="space-y-2">
                          <p className="text-small font-medium">Permissions :</p>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.map((permission) => (
                              <Chip
                                key={permission}
                                size="sm"
                                variant="flat"
                                color="primary"
                              >
                                {PERMISSION_DESCRIPTIONS[permission]}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Modal d'édition/création d'utilisateur */}
      <Modal
        isOpen={isEditOpen || isCreateOpen}
        onClose={() => {
          onEditClose();
          onCreateClose();
          setEditingUser({});
        }}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>
            {selectedUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Prénom"
                  placeholder="Jean"
                 
                  onValueChange={(value) => setEditingUser(prev => ({ ...prev, prenom: value }))}
                />
                <Input
                  label="Nom"
                  placeholder="Dupont"
                 
                  onValueChange={(value) => setEditingUser(prev => ({ ...prev, nom: value }))}
                />
              </div>
              
              <Input
                label="Email"
                type="email"
                placeholder="jean.dupont@example.com"
               
                onValueChange={(value) => setEditingUser(prev => ({ ...prev, email: value }))}
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Rôle"
                  placeholder="Sélectionner un rôle"
                  selectedKeys={editingUser.role ? [editingUser.role] : []}
                  onSelectionChange={(keys) => {
                    const role = Array.from(keys)[0] as Role;
                    setEditingUser(prev => ({ ...prev, role }));
                  }}
                >
                  {DEFAULT_ROLES.map((role) => (
                    <SelectItem key={role.role}>
                      {role.label}
                    </SelectItem>
                  ))}
                </Select>
                
                <Input
                  label="Département"
                  placeholder="IT, RH, Finance..."
                 
                  onValueChange={(value) => setEditingUser(prev => ({ ...prev, departement: value }))}
                />
              </div>

              {selectedUser && (
                <div className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                  <span>Utilisateur actif</span>
                  <Switch
                    isSelected={editingUser.isActive ?? true}
                    onValueChange={(value) => setEditingUser(prev => ({ ...prev, isActive: value }))}
                  />
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                onEditClose();
                onCreateClose();
                setEditingUser({});
              }}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={selectedUser ? handleSaveUser : handleCreateUser}
              isDisabled={
                !editingUser.nom || 
                !editingUser.prenom || 
                !editingUser.email || 
                !editingUser.role
              }
            >
              {selectedUser ? 'Sauvegarder' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalBody>
            {selectedUser && (
              <div>
                <p className="mb-4">
                  Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
                  <strong>{selectedUser.prenom} {selectedUser.nom}</strong> ?
                </p>
                <p className="text-small text-danger">
                  Cette action est irréversible et supprimera toutes les données associées.
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              Annuler
            </Button>
            <Button color="danger" onPress={handleDeleteUser}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default PermissionManager;