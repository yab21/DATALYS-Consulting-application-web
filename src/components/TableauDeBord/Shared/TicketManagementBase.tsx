"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Tab,
  Select,
  SelectItem,
  Textarea,
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
  Avatar,
  Progress,
} from "@nextui-org/react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  UserCheck, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Calendar,
  User as UserIcon,
  Timer,
  TrendingUp,
  Download,
  Plus,
  RefreshCw
} from "lucide-react";

// Imports des services et types
import { IncidentsService, type Incident as ApiIncident, type IncidentCriteria, type CreateIncidentData, type UpdateIncidentData } from "@/services/incidents";
import { projectsService, type Project } from "@/services/projects";
import { UsersService, type User as UserType } from "@/services/users";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";

// Imports de la configuration contextuelle
import { TICKET_CONTEXTS, getContextConfig, getPriorityConfig, getStatusConfig, calculateSLAStatus, type ContextConfig } from "@/config/ticketContexts";

// Imports des composants SLA
import { SLACountdown, SLAMetrics, ClientSatisfactionMetrics } from "@/components/TableauDeBord/Support/SLAComponents";

interface TicketManagementBaseProps {
  context: 'incidents' | 'support';
  title?: string;
  description?: string;
}

const TicketManagementBase: React.FC<TicketManagementBaseProps> = ({ 
  context,
  title,
  description 
}) => {
  // Configuration contextuelle
  const config = getContextConfig(context);
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  // States communs
  const [incidents, setIncidents] = useState<ApiIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<ApiIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<ApiIncident | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // States de formulaires
  const [createForm, setCreateForm] = useState<Partial<CreateIncidentData>>({
    title: "",
    description: "",
    priority: undefined,
    type: context === 'support' ? "support" : "incident",
    project_id: undefined,
  });
  
  const [editForm, setEditForm] = useState<Partial<UpdateIncidentData>>({});

  // States de filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  // States pour les données de référence
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  // Auth et permissions
  const { user, hasPermission } = useAuth();
  const { showNotification } = useSimpleNotifications();

  // Chargement initial des données
  useEffect(() => {
    loadData();
    loadProjects();
    loadUsers();
  }, [context]);

  // Filtrage des incidents
  useEffect(() => {
    filterIncidents();
  }, [incidents, searchTerm, filterStatus, filterPriority, filterType]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Critères de base selon le contexte
      const criteria: IncidentCriteria = {
        index: 0,
        size: 100,
        data: {
          ...config.defaultFilters,
          // Filtres additionnels selon le contexte
          ...(context === 'support' && { type: 'support' }),
          ...(context === 'incidents' && { type: 'incident' })
        }
      };

      const response = await IncidentsService.getIncidentsByCriteria(criteria);
      let apiIncidents: ApiIncident[] = [];

      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          apiIncidents = response;
        } else if (response.data && Array.isArray(response.data)) {
          apiIncidents = response.data;
        } else if (response.items && Array.isArray(response.items)) {
          apiIncidents = response.items;
        }
      }

      console.log(`📊 ${context} chargés:`, apiIncidents.length);
      setIncidents(apiIncidents);
      
    } catch (error) {
      console.error(`❌ Erreur lors du chargement des ${context}:`, error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur de chargement",
        `Impossible de charger les ${context}`
      ));
    } finally {
      setLoading(false);
    }
  }, [context, config.defaultFilters, showNotification]);

  const loadProjects = async () => {
    try {
      const projectsData = await projectsService.getActiveProjects();
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await UsersService.getUsersByCriteria();
      setUsers(Array.isArray(usersData?.data) ? usersData.data : []);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    }
  };

  const filterIncidents = useCallback(() => {
    let filtered = [...incidents];

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incident => 
        incident.title?.toLowerCase().includes(term) ||
        incident.description?.toLowerCase().includes(term) ||
        incident.incident_number?.toLowerCase().includes(term)
      );
    }

    // Filtrage par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter(incident => incident.status === filterStatus);
    }

    // Filtrage par priorité
    if (filterPriority !== "all") {
      filtered = filtered.filter(incident => incident.priority === filterPriority);
    }

    // Filtrage par type
    if (filterType !== "all") {
      filtered = filtered.filter(incident => incident.type === filterType);
    }

    setFilteredIncidents(filtered);
  }, [incidents, searchTerm, filterStatus, filterPriority, filterType]);

  // Handlers CRUD
  const handleCreate = async () => {
    try {
      if (!createForm.title || !createForm.priority) {
        showNotification(simpleNotificationHelpers.error(
          "Erreur de validation",
          "Veuillez remplir tous les champs obligatoires"
        ));
        return;
      }

      const formData = {
        ...createForm,
        type: context === 'support' ? 'support' : 'incident',
        status: context === 'support' ? 'en_cours' : 'nouveau'
      };

      await IncidentsService.createIncident(formData as CreateIncidentData);
      
      showNotification(simpleNotificationHelpers.success(
        "Succès",
        `${context === 'support' ? 'Ticket de support' : 'Incident'} créé avec succès`
      ));
      
      setIsCreateModalOpen(false);
      setCreateForm({
        title: "",
        description: "",
        priority: undefined,
        type: context === 'support' ? "support" : "incident",
        project_id: undefined,
      });
      
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        `Impossible de créer le ${context === 'support' ? 'ticket' : 'incident'}`
      ));
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedIncident || !editForm.title) {
        showNotification(simpleNotificationHelpers.error(
          "Erreur de validation", 
          "Veuillez remplir tous les champs obligatoires"
        ));
        return;
      }

      await IncidentsService.updateIncident(editForm as UpdateIncidentData);
      
      showNotification(simpleNotificationHelpers.success(
        "Succès",
        `${context === 'support' ? 'Ticket' : 'Incident'} modifié avec succès`
      ));
      
      setIsEditModalOpen(false);
      setSelectedIncident(null);
      setEditForm({});
      
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        `Impossible de modifier le ${context === 'support' ? 'ticket' : 'incident'}`
      ));
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedIncident?.id) return;

      await IncidentsService.deleteIncident(typeof selectedIncident.id === 'string' ? parseInt(selectedIncident.id) : selectedIncident.id);
      
      showNotification(simpleNotificationHelpers.success(
        "Succès",
        `${context === 'support' ? 'Ticket' : 'Incident'} supprimé avec succès`
      ));
      
      setIsDeleteModalOpen(false);
      setSelectedIncident(null);
      
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        `Impossible de supprimer le ${context === 'support' ? 'ticket' : 'incident'}`
      ));
    }
  };

  // Fonctions utilitaires
  const getPriorityColor = (priority: string) => {
    const priorityConfig = getPriorityConfig(context, priority);
    return priorityConfig?.color || 'default';
  };

  const getStatusColor = (status: string) => {
    const statusConfig = getStatusConfig(context, status);
    return statusConfig?.color || 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openViewModal = (incident: ApiIncident) => {
    setSelectedIncident(incident);
    setIsViewModalOpen(true);
  };

  const openEditModal = (incident: ApiIncident) => {
    setSelectedIncident(incident);
    setEditForm({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      priority: incident.priority,
      status: incident.status,
      type: incident.type,
      project_id: incident.project_id,
      assigned_to: (incident as any).assigned_to,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (incident: ApiIncident) => {
    setSelectedIncident(incident);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques SLA si support */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{displayTitle}</h1>
          <p className="text-gray-600 mt-1">{displayDescription}</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            color="primary"
            startContent={<RefreshCw size={16} />}
            onClick={loadData}
            isLoading={loading}
          >
            Actualiser
          </Button>
          
          {config.permissions.create && (
            <Button
              color="success"
              startContent={<Plus size={16} />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Nouveau {context === 'support' ? 'Ticket' : 'Incident'}
            </Button>
          )}
        </div>
      </div>

      {/* Métriques SLA pour le support */}
      {context === 'support' && config.showSLA && (
        <SLAMetrics tickets={incidents} context="support" />
      )}

      {/* Satisfaction client pour le support */}
      {context === 'support' && config.showClientSatisfaction && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            {/* Espace pour d'autres métriques */}
          </div>
          <ClientSatisfactionMetrics />
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder={`Rechercher ${context}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search size={16} />}
              className="w-full"
            />
            
            <Input
              placeholder="Filtrer par statut"
              value={filterStatus === "all" ? "" : filterStatus}
              onChange={(e) => setFilterStatus(e.target.value || "all")}
            />
            
            <Input
              placeholder="Filtrer par priorité"
              value={filterPriority === "all" ? "" : filterPriority}
              onChange={(e) => setFilterPriority(e.target.value || "all")}
            />

            <div className="flex items-center gap-2">
              <Chip color="primary" variant="flat">
                {filteredIncidents.length} résultat(s)
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tableau des tickets */}
      <Card>
        <CardBody className="p-0">
          {context === 'support' && config.showSLA ? (
            <Table aria-label={`Liste des ${context}`}>
              <TableHeader>
                <TableColumn>NUMÉRO</TableColumn>
                <TableColumn>TITRE</TableColumn>
                <TableColumn>PRIORITÉ</TableColumn>
                <TableColumn>STATUT</TableColumn>
                <TableColumn>SLA</TableColumn>
                <TableColumn>CRÉÉ LE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent={`Aucun ${context} trouvé`}>
                {filteredIncidents.map((incident) => {
                  const priorityConfig = getPriorityConfig(context, incident.priority);
                  
                  return (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {incident.incident_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{incident.title}</p>
                          {incident.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {incident.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getPriorityColor(incident.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {priorityConfig?.label || incident.priority}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(incident.status)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusConfig(context, incident.status)?.label || incident.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {priorityConfig ? (
                          <SLACountdown 
                            ticket={incident}
                            priorityConfig={priorityConfig}
                            compact={true}
                          />
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDate(incident.created_at)}
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="view"
                              startContent={<Eye size={14} />}
                              onClick={() => openViewModal(incident)}
                            >
                              Voir
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={<Edit size={14} />}
                              onClick={() => openEditModal(incident)}
                            >
                              Modifier
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<XCircle size={14} />}
                              onClick={() => openDeleteModal(incident)}
                            >
                              Supprimer
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <Table aria-label={`Liste des ${context}`}>
              <TableHeader>
                <TableColumn>NUMÉRO</TableColumn>
                <TableColumn>TITRE</TableColumn>
                <TableColumn>PRIORITÉ</TableColumn>
                <TableColumn>STATUT</TableColumn>
                <TableColumn>CRÉÉ LE</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent={`Aucun ${context} trouvé`}>
                {filteredIncidents.map((incident) => {
                  const priorityConfig = getPriorityConfig(context, incident.priority);
                  
                  return (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {incident.incident_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{incident.title}</p>
                          {incident.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {incident.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getPriorityColor(incident.priority)}
                          size="sm"
                          variant="flat"
                        >
                          {priorityConfig?.label || incident.priority}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getStatusColor(incident.status)}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusConfig(context, incident.status)?.label || incident.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {formatDate(incident.created_at)}
                      </TableCell>
                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="view"
                              startContent={<Eye size={14} />}
                              onClick={() => openViewModal(incident)}
                            >
                              Voir
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={<Edit size={14} />}
                              onClick={() => openEditModal(incident)}
                            >
                              Modifier
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<XCircle size={14} />}
                              onClick={() => openDeleteModal(incident)}
                            >
                              Supprimer
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modales - À implémenter selon les besoins */}
      {/* Modal de création */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Créer un nouveau {context === 'support' ? 'ticket de support' : 'incident'}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Titre"
                    placeholder="Titre du ticket"
                    value={createForm.title || ""}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    isRequired
                  />
                  
                  <Textarea
                    label="Description"
                    placeholder="Description détaillée"
                    value={createForm.description || ""}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    minRows={3}
                  />
                  
                  <Input
                    label="Priorité"
                    placeholder="P1, P2, P3, P4, etc."
                    value={createForm.priority || ""}
                    onChange={(e) => setCreateForm(prev => ({ 
                      ...prev, 
                      priority: e.target.value as any
                    }))}
                    isRequired
                  />
                  
                  {projects.length > 0 && (
                    <Input
                      label="Projet (ID)"
                      placeholder="ID du projet (optionnel)"
                      value={createForm.project_id?.toString() || ""}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        project_id: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                    />
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="primary" onPress={handleCreate}>
                  Créer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Les autres modales (view, edit, delete) peuvent être implémentées de manière similaire */}
    </div>
  );
};

export default TicketManagementBase;