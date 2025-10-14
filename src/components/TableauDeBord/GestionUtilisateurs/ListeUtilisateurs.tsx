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
  Switch,
  Pagination,
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
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission, UserRole } from "@/lib/permissions";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
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

  const { showNotification } = useSimpleNotifications();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"view" | "edit" | "delete" | "toggle">("view");
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role_name: "",
    is_active: true,
  });
  const [editLoading, setEditLoading] = useState(false);

  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    partnerUsers: 0,
    inactiveUsers: 0,
  });

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

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

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole, selectedStatus]);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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
    
    // Pré-remplir le formulaire pour l'édition
    if (action === "edit") {
      setEditForm({
        name: user.name,
        email: user.email,
        role_name: user.role_id === UserRole.ADMIN ? "admin" : "partner",
        is_active: user.is_active,
      });
    }
    
    onOpen();
  };

  const executeUserAction = async () => {
    if (!selectedUser) return;

    try {
      switch (actionType) {
        case "edit":
          setEditLoading(true);
          // Mise à jour via API
          const updateResponse = await UsersService.updateUser({
            id: selectedUser.id,
            name: editForm.name,
            email: editForm.email,
            role_name: editForm.role_name,
            is_active: editForm.is_active,
          });
          
          if (updateResponse.code === 200 || updateResponse.status === 'success') {
            const updatedUsers = users.map((user) =>
              user.id === selectedUser.id
                ? { 
                    ...user, 
                    name: editForm.name,
                    email: editForm.email,
                    role_id: editForm.role_name === "admin" ? UserRole.ADMIN : UserRole.PARTNER,
                    is_active: editForm.is_active,
                  }
                : user
            );
            setUsers(updatedUsers);
            
            showNotification({
              type: "success",
              title: "Utilisateur modifié",
              message: `${editForm.name} a été mis à jour avec succès`,
              duration: 3000,
            });
          } else {
            throw new Error(updateResponse.message || 'Erreur lors de la modification');
          }
          break;
          
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
      setEditLoading(false);
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
        {/* Version Desktop - Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table 
            aria-label="Table des utilisateurs" 
            removeWrapper
            classNames={{
              base: "min-w-full",
              table: "min-w-[700px]",
            }}
          >
            <TableHeader>
              <TableColumn>UTILISATEUR</TableColumn>
              <TableColumn>RÔLE</TableColumn>
              <TableColumn>STATUT</TableColumn>
              <TableColumn className="hidden lg:table-cell">DERNIÈRE CONNEXION</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      name={user.name.charAt(0)}
                      className="bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      {/* Version mobile - informations compactes */}
                      <div className="block sm:hidden mt-2 space-x-2">
                        <Chip size="sm" variant="flat" color={getRoleColor(user.role_id)}>
                          {getRoleLabel(user.role_id)}
                        </Chip>
                        <Chip size="sm" variant="flat" color={user.is_active ? "success" : "warning"}>
                          {user.is_active ? "Actif" : "Inactif"}
                        </Chip>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
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
                <TableCell className="hidden md:table-cell">
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
                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Non disponible
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
        </div>

        {/* Version Mobile - Cards */}
        <div className="block md:hidden space-y-4">
          {paginatedUsers.map((user) => (
            <Card key={user.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardBody className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar
                      size="md"
                      name={user.name.charAt(0)}
                      className="bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
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
                      </div>
                    </div>
                  </div>
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
                          Consulter
                        </DropdownItem>,
                        ...(canModify() ? [
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
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
            </div>
            <Pagination
              total={totalPages}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              showShadow
              color="primary"
              size="sm"
              classNames={{
                wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
                item: "w-8 h-8 text-small rounded-none bg-transparent",
                cursor: "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-100 text-white font-bold",
                prev: "bg-transparent hover:bg-default-100",
                next: "bg-transparent hover:bg-default-100",
              }}
            />
          </div>
        )}

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
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size={actionType === "edit" ? "2xl" : "lg"}
        placement="center"
        scrollBehavior="inside"
        classNames={{
          base: "bg-white dark:bg-gray-800 mx-4 my-4 mt-20",
          backdrop: "bg-black/60 backdrop-blur-sm",
          wrapper: "z-[9999] pt-16",
          header: "border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-4",
          footer: "border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-4",
          body: "px-6 py-4 bg-white dark:bg-gray-800 max-h-[70vh] overflow-y-auto",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex items-center gap-3">
                {actionType === "view" && (
                  <>
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      Détails de l'utilisateur
                    </span>
                  </>
                )}
                {actionType === "edit" && (
                  <>
                    <Edit className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      Modifier l'utilisateur
                    </span>
                  </>
                )}
                {actionType === "delete" && (
                  <>
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      Supprimer l'utilisateur
                    </span>
                  </>
                )}
                {actionType === "toggle" && (
                  <>
                    {selectedUser?.is_active ? (
                      <UserX className="h-5 w-5 text-orange-600" />
                    ) : (
                      <UserCheck className="h-5 w-5 text-green-600" />
                    )}
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedUser?.is_active ? "Désactiver" : "Activer"} l'utilisateur
                    </span>
                  </>
                )}
              </ModalHeader>
              
              <ModalBody className="py-6">
                {selectedUser && (
                  <div className="space-y-6">
                    {actionType === "view" && (
                      <div className="space-y-6">
                        {/* Profil utilisateur */}
                        <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6">
                          <div className="flex items-center gap-6">
                            <Avatar
                              size="lg"
                              name={selectedUser.name.charAt(0)}
                              className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold w-20 h-20"
                            />
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedUser.name}
                              </h3>
                              <p className="text-lg text-blue-600 dark:text-blue-400">
                                {selectedUser.email}
                              </p>
                              <div className="mt-2">
                                <Chip
                                  size="md"
                                  variant="flat"
                                  color={getRoleColor(selectedUser.role_id)}
                                  startContent={
                                    selectedUser.role_id === UserRole.ADMIN ? (
                                      <Shield className="h-4 w-4" />
                                    ) : (
                                      <Users className="h-4 w-4" />
                                    )
                                  }
                                >
                                  {getRoleLabel(selectedUser.role_id)}
                                </Chip>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Informations détaillées */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                            <CardBody className="p-4 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                  {selectedUser.is_active ? (
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <UserX className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Statut du compte
                                  </label>
                                  <p className="font-bold text-gray-900 dark:text-white">
                                    {selectedUser.is_active ? "Actif" : "Inactif"}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          {selectedUser.partner_name && (
                            <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                              <CardBody className="p-4 bg-white dark:bg-gray-800">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                    <Users className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                      Partenaire associé
                                    </label>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                      {selectedUser.partner_name}
                                    </p>
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          )}

                          <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                            <CardBody className="p-4 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                  <Calendar className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Date de création
                                  </label>
                                  <p className="font-bold text-gray-900 dark:text-white">
                                    {new Date(selectedUser.created_at).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "long", 
                                      year: "numeric"
                                    })}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                            <CardBody className="p-4 bg-white dark:bg-gray-800">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                                  <Settings className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Dernière connexion
                                  </label>
                                  <p className="font-bold text-gray-500 dark:text-gray-400 italic">
                                    Information non disponible
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </div>
                    )}

                    {actionType === "edit" && (
                      <div className="space-y-6">
                        {/* Informations personnelles */}
                        <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                          <CardBody className="p-6 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Informations personnelles
                              </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  Nom complet <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  placeholder="Nom de l'utilisateur"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                  variant="bordered"
                                  size="lg"
                                  startContent={<User className="h-4 w-4 text-gray-500" />}
                                  classNames={{
                                    input: "text-gray-900 dark:text-white bg-white dark:bg-gray-700",
                                    inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 focus-within:border-blue-500 dark:focus-within:border-blue-400",
                                  }}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                  Adresse email <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  placeholder="email@exemple.com"
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                  variant="bordered"
                                  size="lg"
                                  startContent={<Mail className="h-4 w-4 text-gray-500" />}
                                  classNames={{
                                    input: "text-gray-900 dark:text-white bg-white dark:bg-gray-700",
                                    inputWrapper: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 focus-within:border-blue-500 dark:focus-within:border-blue-400",
                                  }}
                                />
                              </div>
                            </div>
                          </CardBody>
                        </Card>

                        {/* Rôle et permissions */}
                        <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                          <CardBody className="p-6 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                                <Shield className="h-5 w-5 text-purple-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Rôle et permissions
                              </h3>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                Rôle utilisateur <span className="text-red-500">*</span>
                              </label>
                              <Select
                                placeholder="Sélectionner un rôle"
                                selectedKeys={editForm.role_name ? [editForm.role_name] : []}
                                onSelectionChange={(keys) => {
                                  const value = Array.from(keys)[0] as string;
                                  setEditForm({...editForm, role_name: value});
                                }}
                                variant="bordered"
                                size="lg"
                                renderValue={(items) => {
                                  return items.map((item) => (
                                    <div key={item.key} className="flex items-center gap-2" style={{ color: '#1f2937' }}>
                                      {item.key === "admin" ? (
                                        <Shield className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <Users className="h-4 w-4 text-blue-500" />
                                      )}
                                      <span style={{ color: '#1f2937' }} className="text-gray-900 font-medium">
                                        {item.key === "admin" ? "Administrateur" : "Partenaire"}
                                      </span>
                                    </div>
                                  ));
                                }}
                                classNames={{
                                  trigger: "bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400",
                                  value: "text-gray-900 dark:text-white font-medium",
                                  popoverContent: "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600",
                                  listboxWrapper: "max-h-[200px]",
                                  listbox: "bg-white dark:bg-gray-800",
                                }}
                              >
                                <SelectItem 
                                  key="admin" 
                                  value="admin"
                                  classNames={{
                                    base: "text-gray-900 dark:text-white data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-gray-700",
                                  }}
                                >
                                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Shield className="h-4 w-4 text-red-500" />
                                    <span className="text-gray-900 dark:text-white font-medium">Administrateur</span>
                                  </div>
                                </SelectItem>
                                <SelectItem 
                                  key="partner" 
                                  value="partner"
                                  classNames={{
                                    base: "text-gray-900 dark:text-white data-[hover=true]:bg-gray-100 dark:data-[hover=true]:bg-gray-700",
                                  }}
                                >
                                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Users className="h-4 w-4 text-blue-500" />
                                    <span className="text-gray-900 dark:text-white font-medium">Partenaire</span>
                                  </div>
                                </SelectItem>
                              </Select>
                            </div>
                          </CardBody>
                        </Card>

                        {/* Statut du compte */}
                        <Card className="shadow-sm border border-gray-200 dark:border-gray-700">
                          <CardBody className="p-6 bg-white dark:bg-gray-800">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                <Settings className="h-5 w-5 text-green-600" />
                              </div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Statut du compte
                              </h3>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  Compte {editForm.is_active ? "activé" : "désactivé"}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {editForm.is_active 
                                    ? "L'utilisateur peut se connecter et utiliser la plateforme"
                                    : "L'utilisateur ne peut pas se connecter"}
                                </p>
                              </div>
                              <Switch
                                isSelected={editForm.is_active}
                                onValueChange={(value) => setEditForm({...editForm, is_active: value})}
                                color="success"
                                size="lg"
                              />
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    )}

                    {actionType === "delete" && (
                      <div className="text-center py-8">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-full bg-red-100 dark:bg-red-900/20 p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                        >
                          <Trash2 className="h-12 w-12 text-red-600" />
                        </motion.div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          Confirmer la suppression
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                          Êtes-vous sûr de vouloir supprimer cet utilisateur ?
                        </p>
                        
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6">
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="md"
                              name={selectedUser.name.charAt(0)}
                              className="bg-gradient-to-br from-red-500 to-red-600 text-white"
                            />
                            <div className="text-left">
                              <p className="font-bold text-red-900 dark:text-red-100">
                                {selectedUser.name}
                              </p>
                              <p className="text-sm text-red-600 dark:text-red-400">
                                {selectedUser.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ <strong>Attention :</strong> Cette action est irréversible. 
                            Toutes les données de l'utilisateur seront définitivement supprimées.
                          </p>
                        </div>
                      </div>
                    )}

                    {actionType === "toggle" && (
                      <div className="text-center py-8">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className={`rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center ${
                            selectedUser.is_active 
                              ? "bg-orange-100 dark:bg-orange-900/20" 
                              : "bg-green-100 dark:bg-green-900/20"
                          }`}
                        >
                          {selectedUser.is_active ? (
                            <UserX className="h-12 w-12 text-orange-600" />
                          ) : (
                            <UserCheck className="h-12 w-12 text-green-600" />
                          )}
                        </motion.div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                          {selectedUser.is_active ? "Désactiver" : "Activer"} l'utilisateur
                        </h3>
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                          {selectedUser.is_active 
                            ? "L'utilisateur ne pourra plus se connecter à la plateforme"
                            : "L'utilisateur pourra à nouveau accéder à la plateforme"}
                        </p>
                        
                        <div className={`rounded-lg p-4 ${
                          selectedUser.is_active 
                            ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700" 
                            : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
                        }`}>
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="md"
                              name={selectedUser.name.charAt(0)}
                              className={`text-white ${
                                selectedUser.is_active 
                                  ? "bg-gradient-to-br from-orange-500 to-orange-600"
                                  : "bg-gradient-to-br from-green-500 to-green-600"
                              }`}
                            />
                            <div className="text-left">
                              <p className={`font-bold ${
                                selectedUser.is_active 
                                  ? "text-orange-900 dark:text-orange-100"
                                  : "text-green-900 dark:text-green-100"
                              }`}>
                                {selectedUser.name}
                              </p>
                              <p className={`text-sm ${
                                selectedUser.is_active 
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-green-600 dark:text-green-400"
                              }`}>
                                {selectedUser.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              
              <ModalFooter className="gap-3">
                <Button 
                  variant="flat" 
                  onPress={onClose}
                  size="lg"
                  className="px-6"
                >
                  Annuler
                </Button>
                
                {actionType !== "view" && (
                  <Button
                    color={actionType === "delete" ? "danger" : "primary"}
                    onPress={executeUserAction}
                    isLoading={actionType === "edit" ? editLoading : false}
                    size="lg"
                    className={`px-6 font-semibold ${
                      actionType === "delete" 
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700" 
                        : actionType === "toggle"
                        ? selectedUser?.is_active
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    }`}
                  >
                    {actionType === "delete" && "Supprimer définitivement"}
                    {actionType === "toggle" && "Confirmer le changement"}
                    {actionType === "edit" && "Enregistrer les modifications"}
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