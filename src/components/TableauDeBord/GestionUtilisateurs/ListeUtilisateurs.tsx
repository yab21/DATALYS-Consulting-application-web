"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Button,
  Input,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Select,
  SelectItem,
  Pagination,
} from "@nextui-org/react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Users,
  Filter,
  Eye,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission, UserRole } from "@/lib/permissions";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { UsersService, User as UserType } from "@/services/users";
import LoadingState from "@/components/UI/Loading/LoadingState";
import Link from "next/link";
import UserModals from "./UserModals";

// Types pour la gestion des utilisateurs (utilise le type du service)
type User = UserType;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  partnerUsers: number;
  inactiveUsers: number;
}

// Interface pour la gestion des modals
interface ModalState {
  isOpen: boolean;
  type: 'edit' | 'delete' | 'view' | 'toggle' | null;
  user: User | null;
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
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

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

  // États pour les modals
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    user: null
  });

  // Vérification des permissions d'accès
  useEffect(() => {
    if (isAuthenticated && !isAdmin()) {
      showNotification({
        type: "error",
        title: "Erreur",
        message: "Accès refusé",
        duration: 5000,
      });
      return;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // Chargement initial des utilisateurs
  useEffect(() => {
    loadUsers();
  }, [isAuthenticated, isAdmin]);

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
    if (roleId === UserRole.PARTNER || roleId === 5) return "Partenaire";
    return "Utilisateur";
  };

  const getRoleColor = (roleId: UserRole | number) => {
    if (roleId === UserRole.ADMIN || roleId === 1) return "danger";
    if (roleId === UserRole.PARTNER || roleId === 5) return "primary";
    return "default";
  };

  const handleUserAction = (user: User, action: "view" | "edit" | "delete" | "toggle") => {
    setModalState({
      isOpen: true,
      type: action,
      user
    });
  };

  // Recharger les données
  const loadUsers = async () => {
    if (!isAuthenticated || !isAdmin()) return;

    setLoading(true);
    try {
      const response = await UsersService.getUsersByCriteria();
      
      let userData;
      
      if (response.code === 200 && response.items && Array.isArray(response.items)) {
        userData = response.items;
      } else if (response.status === 'success' && response.data) {
        userData = response.data;
      } else if (Array.isArray(response)) {
        userData = response;
      } else if (response.data && Array.isArray(response.data)) {
        userData = response.data;
      } else {
        userData = response;
      }
      
      if (userData && Array.isArray(userData)) {
        setUsers(userData);
        setFilteredUsers(userData);

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

  // Handlers pour les callbacks des modals
  const handleModalSuccess = (message: string) => {
    showNotification({
      type: "success",
      title: "Succès",
      message,
      duration: 3000,
    });
  };

  const handleModalError = (message: string) => {
    showNotification({
      type: "error",
      title: "Erreur",
      message,
      duration: 5000,
    });
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
              <SelectItem key="5" value="5">
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
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table 
          aria-label="Table des utilisateurs"
          selectionMode="none"
          className="w-full"
          classNames={{
            wrapper: "min-h-[400px] shadow-none border border-gray-200 dark:border-gray-700 w-full",
            table: "min-h-[200px] w-full table-fixed",
            th: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm",
            td: "py-4 px-3",
          }}
          bottomContent={
            filteredUsers.length > 0 ? (
              <div className="flex w-full justify-between items-center px-2 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
                </span>
                {filteredUsers.length > 10 && (
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={currentPage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                )}
              </div>
            ) : null
          }
        >
          <TableHeader>
            <TableColumn key="user" width="28%">UTILISATEUR</TableColumn>
            <TableColumn key="role" width="18%">RÔLE</TableColumn>
            <TableColumn key="status" width="15%">STATUT</TableColumn>
            <TableColumn key="activity" width="19%">DERNIÈRE ACTIVITÉ</TableColumn>
            <TableColumn key="actions" width="20%">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody 
            items={paginatedUsers}
            emptyContent="Aucun utilisateur trouvé"
          >
            {(user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      name={user.name.charAt(0)}
                      className="bg-blue-500 text-white"
                    />
                    <div className="flex flex-col">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{user.name}</p>
                      <p className="font-medium text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    className="capitalize"
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
                </TableCell>
                <TableCell>
                  <Chip
                    className="capitalize"
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
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(user.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(user.updated_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="relative flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      isIconOnly
                      onPress={() => handleUserAction(user, "view")}
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {canModify() && hasPermission(Permission.MODIFY_ALL_PROFILES) && (
                      <Button
                        size="sm"
                        variant="light"
                        color="warning"
                        isIconOnly
                        onPress={() => handleUserAction(user, "edit")}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {canModify() && (
                      <Button
                        size="sm"
                        variant="light"
                        color={user.is_active ? "warning" : "success"}
                        isIconOnly
                        onPress={() => handleUserAction(user, "toggle")}
                        title={user.is_active ? "Désactiver" : "Activer"}
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {canDelete() && hasPermission(Permission.DELETE_USERS) && (
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        onPress={() => handleUserAction(user, "delete")}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Modals */}
      <UserModals
        isOpen={modalState.isOpen}
        type={modalState.type}
        user={modalState.user}
        onClose={() => setModalState({ isOpen: false, type: null, user: null })}
        onRefresh={loadUsers}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />
    </div>
  );
};

export default ListeUtilisateurs;