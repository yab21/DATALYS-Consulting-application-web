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
} from "@heroui/react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Settings,
  Eye,
  Power,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { RolesService, Role } from "@/services/roles";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { extractBackendMessage } from "@/lib/error-handler";

interface RoleStats {
  totalRoles: number;
  activeRoles: number;
  inactiveRoles: number;
}

const GestionRoles: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    hasPermission,
  } = useAuth();

  const { showNotification } = useSimpleNotifications();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [actionType, setActionType] = useState<"view" | "edit" | "delete" | "toggle" | "create">("view");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stats, setStats] = useState<RoleStats>({
    totalRoles: 0,
    activeRoles: 0,
    inactiveRoles: 0,
  });

  // Form data pour création/modification
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Vérification des permissions d'accès
  useEffect(() => {
    if (isAuthenticated && (!isAdmin() || !hasPermission(Permission.MANAGE_ROLES_PERMISSIONS))) {
      showNotification({
        type: "error",
        title: "Erreur",
        message: "Accès refusé",
        duration: 5000,
      });
      return;
    }
  }, [isAuthenticated, isAdmin, hasPermission, showNotification]);

  // Chargement des rôles via l'API
  useEffect(() => {
    const loadRoles = async () => {
      if (!isAuthenticated || !isAdmin() || !hasPermission(Permission.MANAGE_ROLES_PERMISSIONS)) return;

      setLoading(true);
      try {
        const response = await RolesService.getRolesByCriteria();
        
        let rolesData;
        if (response.code === 200 && response.items) {
          rolesData = response.items;
        } else if (Array.isArray(response)) {
          rolesData = response;
        } else {
          rolesData = response.data || response;
        }

        if (rolesData && Array.isArray(rolesData)) {
          setRoles(rolesData);
          setFilteredRoles(rolesData);

          // Calculer les statistiques
          const totalRoles = rolesData.length;
          const activeRoles = rolesData.filter((r) => r.is_active).length;
          const inactiveRoles = rolesData.filter((r) => !r.is_active).length;

          setStats({
            totalRoles,
            activeRoles,
            inactiveRoles,
          });
        } else {
          throw new Error('Format de réponse inattendu de l\'API');
        }
      } catch (error) {
        console.error("Erreur lors du chargement des rôles:", error);
        const message = extractBackendMessage(error);
        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [isAuthenticated, isAdmin, hasPermission, showNotification]);

  // Filtrage des rôles par recherche
  useEffect(() => {
    let filtered = roles;

    if (searchTerm) {
      filtered = filtered.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredRoles(filtered);
  }, [roles, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    });
    setErrors({});
  };

  const handleRoleAction = (role: Role | null, action: "view" | "edit" | "delete" | "toggle" | "create") => {
    setSelectedRole(role);
    setActionType(action);
    
    if (action === "create") {
      resetForm();
    } else if (action === "edit" && role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        is_active: role.is_active,
      });
    }
    
    onOpen();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom du rôle est requis";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeRoleAction = async () => {
    if (!selectedRole && actionType !== "create") return;

    setIsSubmitting(true);
    try {
      switch (actionType) {
        case "create":
          if (!validateForm()) return;
          
          const createResponse = await RolesService.createRole({
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active,
          });
          
          if (createResponse.code === 200) {
            // Recharger la liste
            const response = await RolesService.getRolesByCriteria();
            if (response.code === 200 && response.items) {
              setRoles(response.items);
            }
            
            showNotification({
              type: "success",
              title: "Rôle créé",
              message: `Le rôle "${formData.name}" a été créé avec succès`,
              duration: 3000,
            });
          }
          break;

        case "edit":
          if (!validateForm() || !selectedRole) return;
          
          const updateResponse = await RolesService.updateRole({
            id: selectedRole.id,
            name: formData.name,
            description: formData.description,
            is_active: formData.is_active,
          });
          
          if (updateResponse.code === 200) {
            const updatedRoles = roles.map((role) =>
              role.id === selectedRole.id
                ? { ...role, name: formData.name, description: formData.description, is_active: formData.is_active }
                : role
            );
            setRoles(updatedRoles);
            
            showNotification({
              type: "success",
              title: "Rôle modifié",
              message: `Le rôle "${formData.name}" a été mis à jour`,
              duration: 3000,
            });
          }
          break;

        case "toggle":
          if (!selectedRole) return;
          
          const toggleResponse = await RolesService.toggleRoleStatus(
            selectedRole.id,
            !selectedRole.is_active
          );
          
          if (toggleResponse.code === 200) {
            const updatedRoles = roles.map((role) =>
              role.id === selectedRole.id
                ? { ...role, is_active: !role.is_active }
                : role
            );
            setRoles(updatedRoles);
            
            showNotification({
              type: "success",
              title: "Rôle mis à jour",
              message: `Le rôle a été ${selectedRole.is_active ? "désactivé" : "activé"}`,
              duration: 3000,
            });
          }
          break;

        case "delete":
          if (!selectedRole) return;
          
          const deleteResponse = await RolesService.deleteRole(selectedRole.id);
          
          if (deleteResponse.code === 200) {
            const filteredRolesList = roles.filter((role) => role.id !== selectedRole.id);
            setRoles(filteredRolesList);
            
            showNotification({
              type: "success",
              title: "Rôle supprimé",
              message: `Le rôle "${selectedRole.name}" a été supprimé`,
              duration: 3000,
            });
          }
          break;
      }
    } catch (error) {
      console.error('Erreur lors de l\'action sur le rôle:', error);
      const message = extractBackendMessage(error);
      showNotification({
        type: "error",
        title: "Erreur",
        message,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
      onClose();
      resetForm();
      setSelectedRole(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Stats skeleton - 3 cartes pour les rôles */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse flex-1 max-w-md"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse w-40"></div>
          </div>
        </div>

        {/* Roles cards skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
              Gestion des Rôles
            </h1>
            <div className="flex flex-wrap gap-3">
              <Chip size="lg" variant="flat" color="primary">
                {stats.totalRoles} rôles
              </Chip>
              <Chip size="lg" variant="flat" color="success">
                {stats.activeRoles} actifs
              </Chip>
              <Chip size="lg" variant="flat" color="warning">
                {stats.inactiveRoles} inactifs
              </Chip>
            </div>
          </div>

          <Button
            color="primary"
            size="lg"
            startContent={<Plus className="h-5 w-5" />}
            className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold shadow-lg"
            onPress={() => handleRoleAction(null, "create")}
          >
            Nouveau Rôle
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
        <Input
          placeholder="Rechercher un rôle..."
         
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search className="h-4 w-4 text-gray-400" />}
          className="max-w-md"
          size="lg"
        />
      </motion.div>

      {/* Table des rôles */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table aria-label="Table des rôles" removeWrapper>
          <TableHeader>
            <TableColumn>RÔLE</TableColumn>
            <TableColumn>DESCRIPTION</TableColumn>
            <TableColumn>STATUT</TableColumn>
            <TableColumn>CRÉÉ LE</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {role.name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {role.description || "Aucune description"}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={role.is_active ? "success" : "warning"}
                    startContent={<Power className="h-3 w-3" />}
                  >
                    {role.is_active ? "Actif" : "Inactif"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(role.created_at).toLocaleDateString("fr-FR")}
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
                    <DropdownMenu aria-label="Actions rôle">
                      <DropdownItem
                        key="view"
                        startContent={<Eye className="h-4 w-4" />}
                        onPress={() => handleRoleAction(role, "view")}
                      >
                        Voir détails
                      </DropdownItem>
                      <DropdownItem
                        key="edit"
                        startContent={<Edit className="h-4 w-4" />}
                        onPress={() => handleRoleAction(role, "edit")}
                      >
                        Modifier
                      </DropdownItem>
                      <DropdownItem
                        key="toggle"
                        startContent={<Power className="h-4 w-4" />}
                        onPress={() => handleRoleAction(role, "toggle")}
                      >
                        {role.is_active ? "Désactiver" : "Activer"}
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        startContent={<Trash2 className="h-4 w-4" />}
                        className="text-danger"
                        color="danger"
                        onPress={() => handleRoleAction(role, "delete")}
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

        {filteredRoles.length === 0 && (
          <div className="py-16 text-center">
            <Settings className="mx-auto mb-4 h-20 w-20 text-gray-300 dark:text-gray-600" />
            <h3 className="mb-2 text-xl font-bold text-gray-600 dark:text-gray-300">
              Aucun rôle trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Modifiez vos critères de recherche ou créez un nouveau rôle
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
                {actionType === "view" && "Détails du rôle"}
                {actionType === "create" && "Créer un rôle"}
                {actionType === "edit" && "Modifier le rôle"}
                {actionType === "delete" && "Supprimer le rôle"}
                {actionType === "toggle" && 
                  `${selectedRole?.is_active ? "Désactiver" : "Activer"} le rôle`}
              </ModalHeader>
              <ModalBody>
                {actionType === "view" && selectedRole && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nom</label>
                      <p className="font-semibold">{selectedRole.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p>{selectedRole.description || "Aucune description"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Statut</label>
                      <p className="font-semibold">
                        {selectedRole.is_active ? "Actif" : "Inactif"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Créé le</label>
                      <p>{new Date(selectedRole.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                )}

                {(actionType === "create" || actionType === "edit") && (
                  <div className="space-y-4">
                    <Input
                      label="Nom du rôle"
                      placeholder="Ex: Gestionnaire de projet"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      isInvalid={!!errors.name}
                      errorMessage={errors.name}
                      variant="bordered"
                      size="lg"
                    />
                    <Input
                      label="Description (optionnelle)"
                      placeholder="Description du rôle et de ses responsabilités"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      variant="bordered"
                      size="lg"
                    />
                  </div>
                )}

                {actionType === "delete" && selectedRole && (
                  <div className="text-center">
                    <Trash2 className="mx-auto mb-4 h-16 w-16 text-red-500" />
                    <p className="mb-2 text-lg font-semibold">
                      Êtes-vous sûr de vouloir supprimer ce rôle ?
                    </p>
                    <p className="text-gray-600">
                      Le rôle <strong>"{selectedRole.name}"</strong> sera définitivement supprimé.
                      Cette action est irréversible.
                    </p>
                  </div>
                )}

                {actionType === "toggle" && selectedRole && (
                  <div className="text-center">
                    <Power className={`mx-auto mb-4 h-16 w-16 ${selectedRole.is_active ? "text-orange-500" : "text-green-500"}`} />
                    <p className="mb-2 text-lg font-semibold">
                      {selectedRole.is_active ? "Désactiver" : "Activer"} ce rôle ?
                    </p>
                    <p className="text-gray-600">
                      Le rôle <strong>"{selectedRole.name}"</strong> sera {selectedRole.is_active ? "désactivé" : "activé"}.
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
                    onPress={executeRoleAction}
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

export default GestionRoles;