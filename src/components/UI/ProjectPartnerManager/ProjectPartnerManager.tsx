"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Spinner,
  Tooltip
} from '@nextui-org/react';
import {
  UserPlus,
  Users,
  MoreVertical,
  Edit3,
  Trash2,
  Search,
  Building2,
  Mail,
  Phone,
  Crown,
  Eye,
  Edit,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { 
  ProjectPartner, 
  AvailablePartner, 
  projectPartnersService 
} from '@/services/projectPartners';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

interface ProjectPartnerManagerProps {
  projectId: number;
  projectName: string;
  onPartnersUpdate?: (partners: ProjectPartner[]) => void;
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  readOnly?: boolean;
  className?: string;
}

const ProjectPartnerManager: React.FC<ProjectPartnerManagerProps> = ({
  projectId,
  projectName,
  onPartnersUpdate,
  allowAdd = true,
  allowEdit = true,
  allowDelete = true,
  readOnly = false,
  className = ""
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  // États principaux
  const [projectPartners, setProjectPartners] = useState<ProjectPartner[]>([]);
  const [availablePartners, setAvailablePartners] = useState<AvailablePartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<ProjectPartner | null>(null);
  const [selectedAvailablePartner, setSelectedAvailablePartner] = useState<AvailablePartner | null>(null);

  // États pour les actions
  const [actionLoading, setActionLoading] = useState(false);
  const [newPartnerPermission, setNewPartnerPermission] = useState<'read' | 'write' | 'admin'>('read');

  // Modales
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();

  // Charger les données
  const loadProjectPartners = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const partners = await projectPartnersService.getProjectPartners(projectId, user.id);
      setProjectPartners(partners);
      onPartnersUpdate?.(partners);
      console.log('Partenaires du projet chargés:', partners);
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires du projet:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de charger les partenaires du projet",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePartners = async () => {
    if (!user) return;
    
    try {
      const partners = await projectPartnersService.getAvailablePartners(
        user.id, 
        projectId, 
        searchTerm || undefined
      );
      setAvailablePartners(partners);
      console.log('Partenaires disponibles chargés:', partners);
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires disponibles:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de charger les partenaires disponibles",
        type: "error",
        priority: "medium",
        category: "system",
        read: false,
      });
    }
  };

  useEffect(() => {
    loadProjectPartners();
  }, [projectId, user]);

  useEffect(() => {
    if (isAddOpen) {
      loadAvailablePartners();
    }
  }, [isAddOpen, searchTerm, user]);

  // Gestionnaires d'événements
  const handleAddPartner = async () => {
    if (!user || !selectedAvailablePartner) return;

    try {
      setActionLoading(true);
      
      await projectPartnersService.addPartnerToProject(
        selectedAvailablePartner.id,
        projectId,
        newPartnerPermission,
        user.id
      );

      addNotification({
        title: "Partenaire ajouté",
        body: `${selectedAvailablePartner.name} a été ajouté au projet avec les droits ${projectPartnersService.getPermissionLabel(newPartnerPermission)}`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setSelectedAvailablePartner(null);
      setNewPartnerPermission('read');
      onAddClose();
      await loadProjectPartners();
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du partenaire:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible d'ajouter le partenaire au projet",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPartner = async () => {
    if (!user || !selectedPartner) return;

    try {
      setActionLoading(true);
      
      await projectPartnersService.updatePartnerPermissions(
        selectedPartner.id,
        newPartnerPermission,
        user.id
      );

      addNotification({
        title: "Permissions mises à jour",
        body: `Les permissions de ${selectedPartner.partner_name} ont été modifiées`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setSelectedPartner(null);
      onEditClose();
      await loadProjectPartners();
      
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de modifier les permissions",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!user || !selectedPartner) return;

    try {
      setActionLoading(true);
      
      await projectPartnersService.removePartnerFromProject(
        selectedPartner.id,
        user.id
      );

      addNotification({
        title: "Partenaire supprimé",
        body: `${selectedPartner.partner_name} a été retiré du projet`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setSelectedPartner(null);
      onDeleteClose();
      await loadProjectPartners();
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de retirer le partenaire du projet",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (partner: ProjectPartner) => {
    setSelectedPartner(partner);
    setNewPartnerPermission(partner.permission_type);
    onEditOpen();
  };

  const openDeleteModal = (partner: ProjectPartner) => {
    setSelectedPartner(partner);
    onDeleteOpen();
  };

  const openDetailsModal = (partner: ProjectPartner) => {
    setSelectedPartner(partner);
    onDetailsOpen();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'read': return <Eye className="w-4 h-4" />;
      case 'write': return <Edit className="w-4 h-4" />;
      case 'admin': return <Crown className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec statistiques */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Partenaires du projet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {loading ? 'Chargement...' : `${projectPartners.length} partenaire${projectPartners.length > 1 ? 's' : ''} assigné${projectPartners.length > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            
            {!readOnly && allowAdd && (
              <Button
                color="primary"
                variant="flat"
                startContent={<UserPlus className="w-4 h-4" />}
                onPress={onAddOpen}
                isDisabled={loading}
              >
                Ajouter un partenaire
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Liste des partenaires */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" color="primary" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Chargement des partenaires...
              </span>
            </div>
          ) : projectPartners.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Aucun partenaire assigné
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-4">
                Ce projet n'a pas encore de partenaires assignés
              </p>
              {!readOnly && allowAdd && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={onAddOpen}
                  startContent={<UserPlus className="w-4 h-4" />}
                >
                  Ajouter le premier partenaire
                </Button>
              )}
            </div>
          ) : (
            <Table aria-label="Partenaires du projet" removeWrapper>
              <TableHeader>
                <TableColumn>Partenaire</TableColumn>
                <TableColumn>Contact</TableColumn>
                <TableColumn>Permissions</TableColumn>
                <TableColumn>Ajouté le</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {projectPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={partner.partner_logo}
                          name={partner.partner_name}
                          size="md"
                          className="flex-shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {partner.partner_name}
                          </p>
                          {partner.partner_sector && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {partner.partner_sector}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {partner.partner_email}
                        </p>
                        {partner.partner_phone && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {partner.partner_phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={projectPartnersService.getPermissionColor(partner.permission_type)}
                        startContent={getPermissionIcon(partner.permission_type)}
                      >
                        {projectPartnersService.getPermissionLabel(partner.permission_type)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(partner.assigned_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip content="Voir les détails">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => openDetailsModal(partner)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Tooltip>

                        {!readOnly && (allowEdit || allowDelete) && (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="edit"
                                startContent={<Edit3 className="w-4 h-4" />}
                                onPress={() => openEditModal(partner)}
                              >
                                Modifier permissions
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                color="danger"
                                startContent={<Trash2 className="w-4 h-4" />}
                                onPress={() => openDeleteModal(partner)}
                              >
                                Retirer du projet
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal d'ajout de partenaire */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="2xl">
        <ModalContent>
          <ModalHeader>Ajouter un partenaire au projet</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Recherche de partenaires */}
              <Input
                label="Rechercher un partenaire"
                placeholder="Nom de l'entreprise ou secteur d'activité"
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
              />

              {/* Liste des partenaires disponibles */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availablePartners.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'Aucun partenaire trouvé' : 'Aucun partenaire disponible'}
                    </p>
                  </div>
                ) : (
                  availablePartners.map((partner) => (
                    <Card
                      key={partner.id}
                      isPressable
                      onPress={() => setSelectedAvailablePartner(partner)}
                      className={`border-2 transition-colors ${
                        selectedAvailablePartner?.id === partner.id
                          ? 'border-primary bg-primary-50 dark:bg-primary-900/20'
                          : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      <CardBody className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={partner.logo}
                            name={partner.name}
                            size="sm"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {partner.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {partner.sector} • {partner.responsible}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                )}
              </div>

              {/* Sélection des permissions */}
              {selectedAvailablePartner && (
                <Select
                  label="Niveau de permissions"
                  placeholder="Sélectionnez le niveau d'accès"
                  selectedKeys={[newPartnerPermission]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as 'read' | 'write' | 'admin';
                    setNewPartnerPermission(key);
                  }}
                >
                  <SelectItem key="read" startContent={<Eye className="w-4 h-4" />}>
                    Lecture - Peut consulter les fichiers
                  </SelectItem>
                  <SelectItem key="write" startContent={<Edit className="w-4 h-4" />}>
                    Écriture - Peut ajouter et modifier
                  </SelectItem>
                  <SelectItem key="admin" startContent={<Crown className="w-4 h-4" />}>
                    Administrateur - Accès complet
                  </SelectItem>
                </Select>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onAddClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleAddPartner}
              isLoading={actionLoading}
              isDisabled={!selectedAvailablePartner}
            >
              Ajouter au projet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de modification des permissions */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalContent>
          <ModalHeader>Modifier les permissions</ModalHeader>
          <ModalBody>
            {selectedPartner && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar
                    src={selectedPartner.partner_logo}
                    name={selectedPartner.partner_name}
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedPartner.partner_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Permissions actuelles: {projectPartnersService.getPermissionLabel(selectedPartner.permission_type)}
                    </p>
                  </div>
                </div>

                <Select
                  label="Nouveau niveau de permissions"
                  selectedKeys={[newPartnerPermission]}
                  onSelectionChange={(keys) => {
                    const key = Array.from(keys)[0] as 'read' | 'write' | 'admin';
                    setNewPartnerPermission(key);
                  }}
                >
                  <SelectItem key="read" startContent={<Eye className="w-4 h-4" />}>
                    Lecture - Peut consulter les fichiers
                  </SelectItem>
                  <SelectItem key="write" startContent={<Edit className="w-4 h-4" />}>
                    Écriture - Peut ajouter et modifier
                  </SelectItem>
                  <SelectItem key="admin" startContent={<Crown className="w-4 h-4" />}>
                    Administrateur - Accès complet
                  </SelectItem>
                </Select>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onEditClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleEditPartner}
              isLoading={actionLoading}
            >
              Mettre à jour
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            Retirer le partenaire
          </ModalHeader>
          <ModalBody>
            {selectedPartner && (
              <div>
                <p className="mb-4">
                  Êtes-vous sûr de vouloir retirer <strong>{selectedPartner.partner_name}</strong> de ce projet ?
                </p>
                <div className="bg-danger-50 dark:bg-danger-900/20 p-3 rounded-lg">
                  <p className="text-danger text-sm">
                    <strong>Attention :</strong> Ce partenaire perdra immédiatement l'accès à tous les fichiers et dossiers du projet.
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDeleteClose}>
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={handleDeletePartner}
              isLoading={actionLoading}
            >
              Retirer du projet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal des détails */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose}>
        <ModalContent>
          <ModalHeader>Détails du partenaire</ModalHeader>
          <ModalBody>
            {selectedPartner && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={selectedPartner.partner_logo}
                    name={selectedPartner.partner_name}
                    size="lg"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedPartner.partner_name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedPartner.partner_sector}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact</p>
                    <p className="text-gray-900 dark:text-white">{selectedPartner.partner_email}</p>
                  </div>
                  
                  {selectedPartner.partner_phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</p>
                      <p className="text-gray-900 dark:text-white">{selectedPartner.partner_phone}</p>
                    </div>
                  )}

                  {selectedPartner.partner_responsible && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Responsable</p>
                      <p className="text-gray-900 dark:text-white">{selectedPartner.partner_responsible}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Permissions</p>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={projectPartnersService.getPermissionColor(selectedPartner.permission_type)}
                      startContent={getPermissionIcon(selectedPartner.permission_type)}
                    >
                      {projectPartnersService.getPermissionLabel(selectedPartner.permission_type)}
                    </Chip>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ajouté le</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedPartner.assigned_at)}</p>
                  </div>

                  {selectedPartner.partner_description && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                      <p className="text-gray-900 dark:text-white">{selectedPartner.partner_description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDetailsClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectPartnerManager;