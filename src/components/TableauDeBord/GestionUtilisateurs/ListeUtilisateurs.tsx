"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  Select,
  SelectItem,
} from "@nextui-org/react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Users,
  Filter,
  Eye,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission, UserRole } from "@/lib/permissions";
import { useNotifications } from "@/components/UI/Notifications/NotificationSystem";
import { UsersService, User as UserType } from "@/services/users";
import LoadingState from "@/components/UI/Loading/LoadingState";
import Link from "next/link";

// Types pour la gestion des utilisateurs (utilise le type du service)
type User = UserType;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  partnerUsers: number;
  inactiveUsers: number;
}

const ListeUtilisateurs: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    hasPermission,
    canCreate,
    canModify,
    canDelete,
  } = useAuth();

  const { showNotification } = useNotifications();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"view" | "edit" | "delete" | "toggle">("view");

  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    partnerUsers: 0,
    inactiveUsers: 0,
  });

  // Vérification des permissions d'accès
  useEffect(() => {
    if (isAuthenticated && !isAdmin()) {
      showNotification({
        type: "error",
        title: "Accès refusé",
        message: "Seuls les administrateurs peuvent gérer les utilisateurs",
        duration: 5000,
      });
      return;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // Chargement des utilisateurs via l'API
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAuthenticated || !isAdmin()) return;

      setLoading(true);
      try {
        const response = await UsersService.getUsersByCriteria();
        
        // Adapter la structure de réponse selon ce que l'API retourne réellement
        let userData;
        
        if (response.code === 200 && response.items && Array.isArray(response.items)) {
          // Format de l'API actuelle : {code: 200, count: 5, items: [...]}
          userData = response.items;
        } else if (response.status === 'success' && response.data) {
          userData = response.data;
        } else if (Array.isArray(response)) {
          // Si l'API retourne directement un tableau
          userData = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Si les données sont dans response.data
          userData = response.data;
        } else {
          // Essayer d'utiliser la réponse directement
          userData = response;
        }
        
        if (userData && Array.isArray(userData)) {
          setUsers(userData);
          setFilteredUsers(userData);

          // Calculer les statistiques
          const totalUsers = userData.length;
          const activeUsers = userData.filter((u) => u.is_active).length;
          const adminUsers = userData.filter((u) => u.role_id === UserRole.ADMIN).length;
          const partnerUsers = userData.filter((u) => u.role_id === UserRole.PARTNER).length;
          const inactiveUsers = userData.filter((u) => !u.is_active).length;

          setStats({
            totalUsers,
            activeUsers,
            adminUsers,
            partnerUsers,
            inactiveUsers,
          });
        } else {
          throw new Error('Format de réponse inattendu de l\'API');
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message: "Impossible de charger la liste des utilisateurs",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAuthenticated, isAdmin, showNotification]);

  // Filtrage des utilisateurs
  useEffect(() => {
    let filtered = users;

    // Filtrage par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.partner_name && user.partner_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrage par rôle
    if (selectedRole !== "all") {
      filtered = filtered.filter((user) => user.role_id.toString() === selectedRole);
    }

    // Filtrage par statut
    if (selectedStatus !== "all") {
      filtered = filtered.filter((user) => 
        selectedStatus === "active" ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const getRoleLabel = (roleId: UserRole | number) => {
    if (roleId === UserRole.ADMIN || roleId === 1) return "Administrateur";
    return "Utilisateur/Partenaire";
  };

  const getRoleColor = (roleId: UserRole | number) => {
    if (roleId === UserRole.ADMIN || roleId === 1) return "danger";
    return "primary";
  };

  const handleUserAction = (user: User, action: "view" | "edit" | "delete" | "toggle") => {
    setSelectedUser(user);
    setActionType(action);
    onOpen();
  };

  const executeUserAction = async () => {
    if (!selectedUser) return;

    try {
      switch (actionType) {
        case "toggle":
          // Activation/désactivation via API
          const response = await UsersService.toggleUserStatus(
            selectedUser.id, 
            !selectedUser.is_active
          );
          
          // Vérifier le format de réponse de l'API
          if (response.code === 200 || response.status === 'success') {
            const updatedUsers = users.map((user) =>
              user.id === selectedUser.id
                ? { ...user, is_active: !user.is_active }
                : user
            );
            setUsers(updatedUsers);
            
            showNotification({
              type: "success",
              title: "Utilisateur mis à jour",
              message: `${selectedUser.name} a été ${selectedUser.is_active ? "désactivé" : "activé"}`,
              duration: 3000,
            });
          } else {
            throw new Error(response.message || 'Erreur lors de la mise à jour');
          }
          break;

        case "delete":
          // Suppression via API
          const deleteResponse = await UsersService.deleteUser(selectedUser.id);
          
          if (deleteResponse.code === 200 || deleteResponse.status === 'success') {
            const filteredUsersList = users.filter((user) => user.id !== selectedUser.id);
            setUsers(filteredUsersList);
            
            showNotification({
              type: "success",
              title: "Utilisateur supprimé",
              message: `${selectedUser.name} a été supprimé du système`,
              duration: 3000,
            });
          } else {
            throw new Error(deleteResponse.message || 'Erreur lors de la suppression');
          }
          break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'action utilisateur:', error);
      showNotification({
        type: "error",
        title: "Erreur",
        message: error instanceof Error ? error.message : "Une erreur s'est produite lors de l'opération",
        duration: 5000,
      });
    } finally {
      onClose();
      setSelectedUser(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Utilisateurs
          </h1>
        </div>
        <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={6} />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <Shield className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h3 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
          Accès Administrateur Requis
        </h3>
        <p className="text-red-600 dark:text-red-400">
          Seuls les administrateurs peuvent accéder à la gestion des utilisateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Utilisateurs
            </h1>
            <div className="flex flex-wrap gap-3">
              <Chip size="lg" variant="flat" color="primary">
                {stats.totalUsers} utilisateurs
              </Chip>
              <Chip size="lg" variant="flat" color="success">
                {stats.activeUsers} actifs
              </Chip>
              <Chip size="lg" variant="flat" color="danger">
                {stats.adminUsers} admins
              </Chip>
              <Chip size="lg" variant="flat" color="secondary">
                {stats.partnerUsers} partenaires
              </Chip>
            </div>
          </div>

          {canCreate() && hasPermission(Permission.CREATE_USERS) && (
            <Link href="/tableaudebord/gestion-utilisateurs/ajouter">
              <Button
                color="primary"
                size="lg"
                startContent={<Plus className="h-5 w-5" />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold shadow-lg"
              >
                Nouvel Utilisateur
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              className="max-w-md"
              size="lg"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtres:</span>
            </div>
            <Select
              selectedKeys={selectedRole ? [selectedRole] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setSelectedRole(value || "all");
              }}
              className="min-w-[150px]"
              size="sm"
              placeholder="Rôle"
            >
              <SelectItem key="all" value="all">
                Tous les rôles
              </SelectItem>
              <SelectItem key="1" value="1">
                Administrateurs
              </SelectItem>
              <SelectItem key="2" value="2">
                Partenaires
              </SelectItem>
            </Select>
            <Select
              selectedKeys={selectedStatus ? [selectedStatus] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setSelectedStatus(value || "all");
              }}
              className="min-w-[130px]"
              size="sm"
              placeholder="Statut"
            >
              <SelectItem key="all" value="all">
                Tous
              </SelectItem>
              <SelectItem key="active" value="active">
                Actifs
              </SelectItem>
              <SelectItem key="inactive" value="inactive">
                Inactifs
              </SelectItem>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Table des utilisateurs */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table aria-label="Table des utilisateurs" removeWrapper>
          <TableHeader>
            <TableColumn>UTILISATEUR</TableColumn>
            <TableColumn>RÔLE</TableColumn>
            <TableColumn>PARTENAIRE</TableColumn>
            <TableColumn>STATUT</TableColumn>
            <TableColumn>DERNIÈRE CONNEXION</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      name={user.name.charAt(0)}
                      className="bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={getRoleColor(user.role_id)}
                    startContent={
                      user.role_id === UserRole.ADMIN ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <Users className="h-3 w-3" />
                      )
                    }
                  >
                    {getRoleLabel(user.role_id)}
                  </Chip>
                </TableCell>
                <TableCell>
                  {user.partner_name ? (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {user.partner_name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={user.is_active ? "success" : "warning"}
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
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString("fr-FR")
                      : "Jamais"}
                  </span>
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        variant="light"
                        size="sm"
                        isIconOnly
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Actions utilisateur">
                      {[
                        <DropdownItem
                          key="view"
                          startContent={<Eye className="h-4 w-4" />}
                          onPress={() => handleUserAction(user, "view")}
                        >
                          Voir détails
                        </DropdownItem>,
                        ...(canModify() && hasPermission(Permission.MODIFY_ALL_PROFILES) ? [
                          <DropdownItem
                            key="edit"
                            startContent={<Edit className="h-4 w-4" />}
                            onPress={() => handleUserAction(user, "edit")}
                          >
                            Modifier
                          </DropdownItem>
                        ] : []),
                        ...(canModify() ? [
                          <DropdownItem
                            key="toggle"
                            startContent={
                              user.is_active ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )
                            }
                            onPress={() => handleUserAction(user, "toggle")}
                          >
                            {user.is_active ? "Désactiver" : "Activer"}
                          </DropdownItem>
                        ] : []),
                        ...(canDelete() && hasPermission(Permission.DELETE_USERS) ? [
                          <DropdownItem
                            key="delete"
                            startContent={<Trash2 className="h-4 w-4" />}
                            className="text-danger"
                            color="danger"
                            onPress={() => handleUserAction(user, "delete")}
                          >
                            Supprimer
                          </DropdownItem>
                        ] : [])
                      ]}
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto mb-4 h-20 w-20 text-gray-300 dark:text-gray-600" />
            <h3 className="mb-2 text-xl font-bold text-gray-600 dark:text-gray-300">
              Aucun utilisateur trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Modifiez vos critères de recherche ou ajoutez un nouvel utilisateur
            </p>
          </div>
        )}
      </motion.div>

      {/* Modal d'action */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {actionType === "view" && "Détails de l'utilisateur"}
                {actionType === "edit" && "Modifier l'utilisateur"}
                {actionType === "delete" && "Supprimer l'utilisateur"}
                {actionType === "toggle" && 
                  `${selectedUser?.is_active ? "Désactiver" : "Activer"} l'utilisateur`}
              </ModalHeader>
              <ModalBody>
                {selectedUser && (
                  <div className="space-y-4">
                    {actionType === "view" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <Avatar
                            size="lg"
                            name={selectedUser.name.charAt(0)}
                            className="bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                          />
                          <div>
                            <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                            <p className="text-gray-600">{selectedUser.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Rôle</label>
                            <p className="font-semibold">{getRoleLabel(selectedUser.role_id)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Statut</label>
                            <p className="font-semibold">
                              {selectedUser.is_active ? "Actif" : "Inactif"}
                            </p>
                          </div>
                          {selectedUser.partner_name && (
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-gray-600">Partenaire</label>
                              <p className="font-semibold">{selectedUser.partner_name}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-600">Créé le</label>
                            <p>{new Date(selectedUser.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Dernière connexion</label>
                            <p>
                              {selectedUser.last_login
                                ? new Date(selectedUser.last_login).toLocaleDateString("fr-FR")
                                : "Jamais"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {actionType === "delete" && (
                      <div className="text-center">
                        <Trash2 className="mx-auto mb-4 h-16 w-16 text-red-500" />
                        <p className="mb-2 text-lg font-semibold">
                          Êtes-vous sûr de vouloir supprimer cet utilisateur ?
                        </p>
                        <p className="text-gray-600">
                          <strong>{selectedUser.name}</strong> sera définitivement supprimé.
                          Cette action est irréversible.
                        </p>
                      </div>
                    )}
                    {actionType === "toggle" && (
                      <div className="text-center">
                        {selectedUser.is_active ? (
                          <UserX className="mx-auto mb-4 h-16 w-16 text-orange-500" />
                        ) : (
                          <UserCheck className="mx-auto mb-4 h-16 w-16 text-green-500" />
                        )}
                        <p className="mb-2 text-lg font-semibold">
                          {selectedUser.is_active ? "Désactiver" : "Activer"} cet utilisateur ?
                        </p>
                        <p className="text-gray-600">
                          <strong>{selectedUser.name}</strong> sera{" "}
                          {selectedUser.is_active ? "désactivé" : "activé"}.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Annuler
                </Button>
                {actionType !== "view" && (
                  <Button
                    color={actionType === "delete" ? "danger" : "primary"}
                    onPress={executeUserAction}
                  >
                    {actionType === "delete" && "Supprimer"}
                    {actionType === "toggle" && "Confirmer"}
                    {actionType === "edit" && "Modifier"}
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ListeUtilisateurs;