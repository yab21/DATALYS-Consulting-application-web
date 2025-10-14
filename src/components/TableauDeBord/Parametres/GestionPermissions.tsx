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
  Select,
  SelectItem,
  Switch,
} from "@nextui-org/react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Users,
  FolderOpen,
  Eye,
  Power,
  Filter,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { PermissionsService, UserProjectPermission } from "@/services/permissions";
import LoadingState from "@/components/UI/Loading/LoadingState";

interface PermissionStats {
  totalPermissions: number;
  activePermissions: number;
  inactivePermissions: number;
  uniqueUsers: number;
  uniqueProjects: number;
}

const GestionPermissions: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    hasPermission,
  } = useAuth();

  const { showNotification } = useSimpleNotifications();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserProjectPermission[]>([]);
  const [filteredPermissions, setFilteredPermissions] = useState<UserProjectPermission[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<UserProjectPermission | null>(null);
  const [actionType, setActionType] = useState<"view" | "edit" | "delete" | "toggle" | "create">("view");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stats, setStats] = useState<PermissionStats>({
    totalPermissions: 0,
    activePermissions: 0,
    inactivePermissions: 0,
    uniqueUsers: 0,
    uniqueProjects: 0,
  });

  // Form data pour création/modification
  const [formData, setFormData] = useState({
    user_id: "",
    project_id: "",
    permission_type: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Types de permissions disponibles
  const permissionTypes = [
    { value: "read", label: "Lecture", description: "Accès en lecture seule" },
    { value: "write", label: "Écriture", description: "Modification des documents" },
    { value: "admin", label: "Administration", description: "Contrôle total du projet" },
    { value: "upload", label: "Upload", description: "Téléchargement de fichiers" },
    { value: "delete", label: "Suppression", description: "Suppression de documents" },
  ];

  // Vérification des permissions d'accès
  useEffect(() => {
    if (isAuthenticated && (!isAdmin() || !hasPermission(Permission.MANAGE_ROLES_PERMISSIONS))) {
      showNotification({
        type: "error",
        title: "Accès refusé",
        message: "Seuls les administrateurs avec permissions peuvent gérer les permissions",
        duration: 5000,
      });
      return;
    }
  }, [isAuthenticated, isAdmin, hasPermission, showNotification]);

  // Chargement des permissions via l'API
  useEffect(() => {
    const loadPermissions = async () => {
      if (!isAuthenticated || !isAdmin() || !hasPermission(Permission.MANAGE_ROLES_PERMISSIONS)) return;

      setLoading(true);
      try {
        const response = await PermissionsService.getPermissionsByCriteria();
        
        let permissionsData;
        if (response.code === 200 && response.items) {
          permissionsData = response.items;
        } else if (Array.isArray(response)) {
          permissionsData = response;
        } else {
          permissionsData = response.data || response;
        }

        if (permissionsData && Array.isArray(permissionsData)) {
          setPermissions(permissionsData);
          setFilteredPermissions(permissionsData);

          // Calculer les statistiques
          const totalPermissions = permissionsData.length;
          const activePermissions = permissionsData.filter((p) => p.is_active).length;
          const inactivePermissions = permissionsData.filter((p) => !p.is_active).length;
          const uniqueUsers = new Set(permissionsData.map(p => p.user_id)).size;
          const uniqueProjects = new Set(permissionsData.map(p => p.project_id)).size;

          setStats({
            totalPermissions,
            activePermissions,
            inactivePermissions,
            uniqueUsers,
            uniqueProjects,
          });
        } else {
          throw new Error('Format de réponse inattendu de l\'API');
        }
      } catch (error) {
        console.error("Erreur lors du chargement des permissions:", error);
        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message: "Impossible de charger la liste des permissions",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [isAuthenticated, isAdmin, hasPermission, showNotification]);

  // Filtrage des permissions
  useEffect(() => {
    let filtered = permissions;

    if (searchTerm) {
      filtered = filtered.filter(
        (permission) =>
          (permission.user_name && permission.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (permission.project_name && permission.project_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          permission.permission_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterUser) {
      filtered = filtered.filter(p => p.user_id.toString() === filterUser);
    }

    if (filterProject) {
      filtered = filtered.filter(p => p.project_id.toString() === filterProject);
    }

    setFilteredPermissions(filtered);
  }, [permissions, searchTerm, filterUser, filterProject]);

  const resetForm = () => {
    setFormData({
      user_id: "",
      project_id: "",
      permission_type: "",
      is_active: true,
    });
    setErrors({});
  };

  const handlePermissionAction = (permission: UserProjectPermission | null, action: "view" | "edit" | "delete" | "toggle" | "create") => {
    setSelectedPermission(permission);
    setActionType(action);
    
    if (action === "create") {
      resetForm();
    } else if (action === "edit" && permission) {
      setFormData({
        user_id: permission.user_id.toString(),
        project_id: permission.project_id.toString(),
        permission_type: permission.permission_type,
        is_active: permission.is_active,
      });
    }
    
    onOpen();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_id) {
      newErrors.user_id = "Vous devez sélectionner un utilisateur";
    }

    if (!formData.project_id) {
      newErrors.project_id = "Vous devez sélectionner un projet";
    }

    if (!formData.permission_type) {
      newErrors.permission_type = "Vous devez sélectionner un type de permission";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executePermissionAction = async () => {
    if (!selectedPermission && actionType !== "create") return;

    setIsSubmitting(true);
    try {
      switch (actionType) {
        case "create":
          if (!validateForm()) return;
          
          const createResponse = await PermissionsService.createPermission({
            user_id: parseInt(formData.user_id),
            project_id: parseInt(formData.project_id),
            permission_type: formData.permission_type,
            is_active: formData.is_active,
          });
          
          if (createResponse.code === 200) {
            // Recharger la liste
            const response = await PermissionsService.getPermissionsByCriteria();
            if (response.code === 200 && response.items) {
              setPermissions(response.items);
            }
            
            showNotification({
              type: "success",
              title: "Permission créée",
              message: "La permission a été créée avec succès",
              duration: 3000,
            });
          }
          break;

        case "edit":
          if (!validateForm() || !selectedPermission) return;
          
          const updateResponse = await PermissionsService.updatePermission({
            id: selectedPermission.id,
            user_id: parseInt(formData.user_id),
            project_id: parseInt(formData.project_id),
            permission_type: formData.permission_type,
            is_active: formData.is_active,
          });
          
          if (updateResponse.code === 200) {
            const updatedPermissions = permissions.map((permission) =>
              permission.id === selectedPermission.id
                ? { 
                    ...permission, 
                    user_id: parseInt(formData.user_id),
                    project_id: parseInt(formData.project_id),
                    permission_type: formData.permission_type,
                    is_active: formData.is_active 
                  }
                : permission
            );
            setPermissions(updatedPermissions);
            
            showNotification({
              type: "success",
              title: "Permission modifiée",
              message: "La permission a été mise à jour",
              duration: 3000,
            });
          }
          break;

        case "toggle":
          if (!selectedPermission) return;
          
          const toggleResponse = await PermissionsService.togglePermissionStatus(
            selectedPermission.id,
            !selectedPermission.is_active
          );
          
          if (toggleResponse.code === 200) {
            const updatedPermissions = permissions.map((permission) =>
              permission.id === selectedPermission.id
                ? { ...permission, is_active: !permission.is_active }
                : permission
            );
            setPermissions(updatedPermissions);
            
            showNotification({
              type: "success",
              title: "Permission mise à jour",
              message: `La permission a été ${selectedPermission.is_active ? "désactivée" : "activée"}`,
              duration: 3000,
            });
          }
          break;

        case "delete":
          if (!selectedPermission) return;
          
          const deleteResponse = await PermissionsService.deletePermission(selectedPermission.id);
          
          if (deleteResponse.code === 200) {
            const filteredPermissionsList = permissions.filter((permission) => permission.id !== selectedPermission.id);
            setPermissions(filteredPermissionsList);
            
            showNotification({
              type: "success",
              title: "Permission supprimée",
              message: "La permission a été supprimée",
              duration: 3000,
            });
          }
          break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'action sur la permission:', error);
      showNotification({
        type: "error",
        title: "Erreur",
        message: error instanceof Error ? error.message : "Une erreur s'est produite",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      onClose();
      resetForm();
      setSelectedPermission(null);
    }
  };

  const getPermissionTypeLabel = (type: string) => {
    const permType = permissionTypes.find(p => p.value === type);
    return permType ? permType.label : type;
  };

  const getPermissionTypeColor = (type: string) => {
    switch (type) {
      case "admin": return "danger";
      case "write": return "warning";
      case "upload": return "secondary";
      case "delete": return "danger";
      default: return "primary";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Permissions
          </h1>
        </div>
        <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={6} />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin() || !hasPermission(Permission.MANAGE_ROLES_PERMISSIONS)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <Shield className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h3 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
          Permissions Insuffisantes
        </h3>
        <p className="text-red-600 dark:text-red-400">
          Seuls les administrateurs avec permission de gestion des rôles peuvent accéder à cette page.
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
              Gestion des Permissions
            </h1>
            <div className="flex flex-wrap gap-3">
              <Chip size="lg" variant="flat" color="primary">
                {stats.totalPermissions} permissions
              </Chip>
              <Chip size="lg" variant="flat" color="success">
                {stats.activePermissions} actives
              </Chip>
              <Chip size="lg" variant="flat" color="secondary">
                {stats.uniqueUsers} utilisateurs
              </Chip>
              <Chip size="lg" variant="flat" color="warning">
                {stats.uniqueProjects} projets
              </Chip>
            </div>
          </div>

          <Button
            color="primary"
            size="lg"
            startContent={<Plus className="h-5 w-5" />}
            className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold shadow-lg"
            onPress={() => handlePermissionAction(null, "create")}
          >
            Nouvelle Permission
          </Button>
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
              placeholder="Rechercher utilisateur, projet ou type..."
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
            <Button
              variant="flat"
              size="sm"
              onPress={() => {
                setFilterUser("");
                setFilterProject("");
                setSearchTerm("");
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Table des permissions */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table aria-label="Table des permissions" removeWrapper>
          <TableHeader>
            <TableColumn>UTILISATEUR</TableColumn>
            <TableColumn>PROJET</TableColumn>
            <TableColumn>TYPE PERMISSION</TableColumn>
            <TableColumn>STATUT</TableColumn>
            <TableColumn>CRÉÉ LE</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredPermissions.map((permission) => (
              <TableRow key={permission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {permission.user_name || `Utilisateur #${permission.user_id}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {permission.user_id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {permission.project_name || `Projet #${permission.project_id}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {permission.project_id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={getPermissionTypeColor(permission.permission_type)}
                    startContent={<UserCheck className="h-3 w-3" />}
                  >
                    {getPermissionTypeLabel(permission.permission_type)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={permission.is_active ? "success" : "warning"}
                    startContent={<Power className="h-3 w-3" />}
                  >
                    {permission.is_active ? "Active" : "Inactive"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(permission.created_at).toLocaleDateString("fr-FR")}
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
                    <DropdownMenu aria-label="Actions permission">
                      <DropdownItem
                        key="view"
                        startContent={<Eye className="h-4 w-4" />}
                        onPress={() => handlePermissionAction(permission, "view")}
                      >
                        Voir détails
                      </DropdownItem>
                      <DropdownItem
                        key="edit"
                        startContent={<Edit className="h-4 w-4" />}
                        onPress={() => handlePermissionAction(permission, "edit")}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownItem
                        key="toggle"
                        startContent={<Power className="h-4 w-4" />}
                        onPress={() => handlePermissionAction(permission, "toggle")}
                      >
                        {permission.is_active ? "Désactiver" : "Activer"}
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        startContent={<Trash2 className="h-4 w-4" />}
                        className="text-danger"
                        color="danger"
                        onPress={() => handlePermissionAction(permission, "delete")}
                      >
                        Supprimer
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredPermissions.length === 0 && (
          <div className="py-16 text-center">
            <UserCheck className="mx-auto mb-4 h-20 w-20 text-gray-300 dark:text-gray-600" />
            <h3 className="mb-2 text-xl font-bold text-gray-600 dark:text-gray-300">
              Aucune permission trouvée
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Modifiez vos critères de recherche ou créez une nouvelle permission
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
                {actionType === "view" && "Détails de la permission"}
                {actionType === "create" && "Créer une permission"}
                {actionType === "edit" && "Modifier la permission"}
                {actionType === "delete" && "Supprimer la permission"}
                {actionType === "toggle" && 
                  `${selectedPermission?.is_active ? "Désactiver" : "Activer"} la permission`}
              </ModalHeader>
              <ModalBody>
                {actionType === "view" && selectedPermission && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Utilisateur</label>
                      <p className="font-semibold">{selectedPermission.user_name || `ID: ${selectedPermission.user_id}`}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Projet</label>
                      <p className="font-semibold">{selectedPermission.project_name || `ID: ${selectedPermission.project_id}`}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type de permission</label>
                      <p className="font-semibold">{getPermissionTypeLabel(selectedPermission.permission_type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Statut</label>
                      <p className="font-semibold">
                        {selectedPermission.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Créé le</label>
                      <p>{new Date(selectedPermission.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                )}

                {(actionType === "create" || actionType === "edit") && (
                  <div className="space-y-4">
                    <Input
                      label="ID Utilisateur"
                      placeholder="Ex: 1"
                      value={formData.user_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, user_id: e.target.value }))}
                      isInvalid={!!errors.user_id}
                      errorMessage={errors.user_id}
                      variant="bordered"
                      size="lg"
                      type="number"
                    />
                    <Input
                      label="ID Projet"
                      placeholder="Ex: 1"
                      value={formData.project_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                      isInvalid={!!errors.project_id}
                      errorMessage={errors.project_id}
                      variant="bordered"
                      size="lg"
                      type="number"
                    />
                    <Select
                      label="Type de permission"
                      placeholder="Sélectionner un type"
                      selectedKeys={formData.permission_type ? [formData.permission_type] : []}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        setFormData(prev => ({ ...prev, permission_type: value }));
                      }}
                      isInvalid={!!errors.permission_type}
                      errorMessage={errors.permission_type}
                      variant="bordered"
                      size="lg"
                    >
                      {permissionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                      <div>
                        <h5 className="font-semibold text-gray-900">Permission active</h5>
                        <p className="text-sm text-gray-600">La permission sera effective immédiatement</p>
                      </div>
                      <Switch
                        isSelected={formData.is_active}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value }))}
                        color="success"
                        size="lg"
                      />
                    </div>
                  </div>
                )}

                {actionType === "delete" && selectedPermission && (
                  <div className="text-center">
                    <Trash2 className="mx-auto mb-4 h-16 w-16 text-red-500" />
                    <p className="mb-2 text-lg font-semibold">
                      Êtes-vous sûr de vouloir supprimer cette permission ?
                    </p>
                    <p className="text-gray-600">
                      La permission sera définitivement supprimée.
                      Cette action est irréversible.
                    </p>
                  </div>
                )}

                {actionType === "toggle" && selectedPermission && (
                  <div className="text-center">
                    <Power className={`mx-auto mb-4 h-16 w-16 ${selectedPermission.is_active ? "text-orange-500" : "text-green-500"}`} />
                    <p className="mb-2 text-lg font-semibold">
                      {selectedPermission.is_active ? "Désactiver" : "Activer"} cette permission ?
                    </p>
                    <p className="text-gray-600">
                      La permission sera {selectedPermission.is_active ? "désactivée" : "activée"}.
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={isSubmitting}>
                  Annuler
                </Button>
                {actionType !== "view" && (
                  <Button
                    color={actionType === "delete" ? "danger" : "primary"}
                    onPress={executePermissionAction}
                    isLoading={isSubmitting}
                  >
                    {actionType === "create" && "Créer"}
                    {actionType === "edit" && "Modifier"}
                    {actionType === "delete" && "Supprimer"}
                    {actionType === "toggle" && "Confirmer"}
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

export default GestionPermissions;