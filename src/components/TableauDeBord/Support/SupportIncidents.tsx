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
} from "@heroui/react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
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
  RefreshCw,
  Trash2,
  Settings
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { extractBackendMessage } from "@/lib/error-handler";
import { IncidentsService, type Incident as ApiIncident, type IncidentCriteria, type CreateIncidentData, type UpdateIncidentData } from "@/services/incidents";
import { projectsService, type Project } from "@/services/projects";
import { UsersService, type User as UserType } from "@/services/users";
import { partnersService, type Partner } from "@/services/partners";

// Extensions des types pour inclure le statut "en_pause"
type SupportStatus = 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'en_pause' | 'resolu';

interface CreateSupportIncidentData extends Omit<CreateIncidentData, 'status'> {
  status: SupportStatus;
}

interface UpdateSupportIncidentData extends Omit<UpdateIncidentData, 'status'> {
  status?: SupportStatus;
}

// Types locaux pour l'interface Support
interface SupportTicket {
  id: string;
  titre: string;
  description: string;
  incident_number: string;
  type: string;
  priorite: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  priorite_label: string;
  statut: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'en_pause' | 'resolu';
  statut_color: 'blue' | 'orange' | 'gray' | 'purple' | 'green' | 'default';
  category: string;
  impact: string;
  impact_label: string;
  domain: string;
  declarant_name: string;
  user_id: number;
  project_id: number;
  projectNom: string;
  partnerNom: string;
  partnerLogo?: string;
  dateCreation: Date;
  dateUpdate: Date;
  dateResolution?: Date;
  assigneA: string;
  commentaires: number;
  tempsMoyenResolution?: number;
  sla_prise_en_charge_status: 'respecte' | 'en_retard' | 'non_applicable';
  sla_resolution_status: 'respecte' | 'en_retard' | 'non_applicable';
  sla_prise_en_charge_deadline?: string;
  sla_resolution_deadline?: string;
  temps_restant_prise_en_charge?: {
    depassement: boolean;
    heures: number;
    jours: number;
    minutes: number;
    status: string;
    total_minutes: number;
  };
  temps_restant_resolution?: {
    depassement: boolean;
    heures: number;
    jours: number;
    minutes: number;
    status: string;
    total_minutes: number;
  };
  is_read: boolean;
  refusal_count: number;
  is_active: boolean;
  is_deleted: boolean;
  resolution_notes?: string;
}

// Fonction de conversion API vers interface locale
const convertApiIncidentToSupportTicket = (apiIncident: any): SupportTicket => ({
  id: apiIncident.id.toString(),
  titre: apiIncident.title,
  description: apiIncident.description,
  incident_number: apiIncident.incident_number,
  type: apiIncident.type,
  priorite: apiIncident.priority,
  priorite_label: apiIncident.priority_label || getPriorityLabel(apiIncident.priority),
  statut: apiIncident.status,
  statut_color: apiIncident.status_color || getStatusColor(apiIncident.status),
  category: apiIncident.category || '',
  impact: apiIncident.impact || '',
  impact_label: apiIncident.impact_label || apiIncident.impact || '',
  domain: apiIncident.domain || '',
  declarant_name: apiIncident.declarant_name,
  user_id: apiIncident.user_id || 0,
  project_id: apiIncident.project_id || 0,
  projectNom: apiIncident.project_name || apiIncident.projectNom || '',
  partnerNom: apiIncident.partner_name || apiIncident.partnerNom || '',
  partnerLogo: apiIncident.partner_logo || apiIncident.partnerLogo,
  dateCreation: new Date(apiIncident.created_at),
  dateUpdate: new Date(apiIncident.updated_at),
  dateResolution: apiIncident.resolution_date ? new Date(apiIncident.resolution_date) : undefined,
  assigneA: apiIncident.assigned_to || apiIncident.assigneA || '',
  commentaires: apiIncident.comments_count || apiIncident.commentaires || 0,
  tempsMoyenResolution: apiIncident.temps_moyen_resolution || apiIncident.tempsMoyenResolution,
  sla_prise_en_charge_status: apiIncident.sla_prise_en_charge_status,
  sla_resolution_status: apiIncident.sla_resolution_status,
  sla_prise_en_charge_deadline: apiIncident.sla_prise_en_charge_deadline,
  sla_resolution_deadline: apiIncident.sla_resolution_deadline,
  temps_restant_prise_en_charge: apiIncident.temps_restant_prise_en_charge,
  temps_restant_resolution: apiIncident.temps_restant_resolution,
  is_read: apiIncident.is_read,
  refusal_count: apiIncident.refusal_count,
  is_active: apiIncident.is_active,
  is_deleted: apiIncident.is_deleted,
  resolution_notes: apiIncident.resolution_notes
});

// Fonctions utilitaires - Exactement comme dans GestionIncidents
const getStatusColor = (status: string) => {
  switch (status) {
    case "nouveau": return "primary"; // Bleu
    case "en_cours": return "warning"; // Orange
    case "en_attente": return "default"; // Gris
    case "en_arbitrage": return "secondary"; // Violet
    case "en_pause": return "warning"; // Orange
    case "resolu": return "success"; // Vert
    case "ferme": return "default"; // Gris
    default: return "default";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "P0": return "danger"; // Rouge - Arrêt de service
    case "P1": return "warning"; // Orange - Haute
    case "P2": return "primary"; // Bleu - Moyenne
    case "P3": return "success"; // Vert - Faible
    case "P4": return "default"; // Gris - Très faible
    default: return "default";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "nouveau": return <AlertTriangle className="h-4 w-4" />;
    case "en_cours": return <Clock className="h-4 w-4" />;
    case "en_attente": return <Clock className="h-4 w-4" />;
    case "en_arbitrage": return <UserCheck className="h-4 w-4" />;
    case "en_pause": return <Clock className="h-4 w-4" />;
    case "resolu": return <CheckCircle className="h-4 w-4" />;
    case "ferme": return <CheckCircle className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "P0": return "🔴"; // Arrêt de service
    case "P1": return "🟠"; // Haute
    case "P2": return "🟡"; // Moyenne
    case "P3": return "🟢"; // Faible
    case "P4": return "⚪"; // Très faible
    default: return "⚪";
  }
};

const getSLAColor = (status: string) => {
  switch (status) {
    case "respecte": return "success";
    case "en_retard": return "danger";
    case "non_applicable": return "default";
    default: return "default";
  }
};

const getSLAIcon = (status: string) => {
  switch (status) {
    case "respecte": return <CheckCircle className="h-3 w-3" />;
    case "en_retard": return <XCircle className="h-3 w-3" />;
    case "non_applicable": return <Clock className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
};

const getSLALabel = (status: string) => {
  switch (status) {
    case "respecte": return "Respecté";
    case "en_retard": return "En retard";
    case "non_applicable": return "N/A";
    default: return "N/A";
  }
};

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'P0': return 'Critique';
    case 'P1': return 'Elevée'; 
    case 'P2': return 'Moyenne';
    case 'P3': return 'Incident ordinaire';
    case 'P4': return 'Faible';
    default: return priority;
  }
}

// Configuration des délais SLA selon la priorité
const SLA_CONFIG = {
  P0: { prise_en_charge: 15, resolution: 120 }, // 15 min / 2h
  P1: { prise_en_charge: 30, resolution: 240 }, // 30 min / 4h
  P2: { prise_en_charge: 60, resolution: 1440 }, // 1h / 1 jour
  P3: { prise_en_charge: 240, resolution: 4320 }, // 4h / 3 jours
  P4: { prise_en_charge: 1440, resolution: 7200 } // 1 jour / 5 jours
};

// Fonction pour calculer le temps restant SLA
function calculateSLAStatus(createdAt: string, priority: string, status: string) {
  const creation = new Date(createdAt);
  const now = new Date();
  const elapsedMinutes = Math.floor((now.getTime() - creation.getTime()) / (1000 * 60));
  
  const slaConfig = SLA_CONFIG[priority as keyof typeof SLA_CONFIG] || SLA_CONFIG.P3;
  
  // Calculer le statut pour la prise en charge
  const priseEnChargeStatus = status === 'nouveau' ? {
    total_minutes: slaConfig.prise_en_charge - elapsedMinutes,
    depassement: elapsedMinutes > slaConfig.prise_en_charge,
    status: elapsedMinutes > slaConfig.prise_en_charge ? 'en_retard' : 'respecte'
  } : {
    total_minutes: 0,
    depassement: false,
    status: 'respecte' as const
  };
  
  // Calculer le statut pour la résolution
  const resolutionStatus = status !== 'resolu' ? {
    total_minutes: slaConfig.resolution - elapsedMinutes,
    depassement: elapsedMinutes > slaConfig.resolution,
    status: elapsedMinutes > slaConfig.resolution ? 'en_retard' : 'respecte'
  } : {
    total_minutes: 0,
    depassement: false,
    status: 'respecte' as const
  };
  
  return {
    prise_en_charge: priseEnChargeStatus,
    resolution: resolutionStatus
  };
}

// Fonction pour formater le temps restant
function formatTimeRemaining(totalMinutes: number): string {
  if (totalMinutes <= 0) {
    const overdue = Math.abs(totalMinutes);
    const hours = Math.floor(overdue / 60);
    const minutes = overdue % 60;
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `+${days}j ${remainingHours}h ${minutes}m`;
    }
    return `+${hours}h ${minutes}m`;
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}j ${remainingHours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

// Composant pour afficher les compteurs SLA
const SLACountdown: React.FC<{ ticket: SupportTicket }> = ({ ticket }) => {
  const [timeRemaining, setTimeRemaining] = useState(() => 
    calculateSLAStatus(ticket.dateCreation.toISOString(), ticket.priorite, ticket.statut)
  );
  
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(
        calculateSLAStatus(ticket.dateCreation.toISOString(), ticket.priorite, ticket.statut)
      );
    };
    
    // Mettre à jour toutes les minutes
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, [ticket.dateCreation, ticket.priorite, ticket.statut]);
  
  return (
    <div className="flex flex-col gap-1">
      {ticket.statut === 'nouveau' && (
        <Chip
          size="sm"
          variant="flat"
          color={timeRemaining.prise_en_charge.depassement ? "danger" : "success"}
          startContent={timeRemaining.prise_en_charge.depassement ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
        >
          Prise en charge: {formatTimeRemaining(timeRemaining.prise_en_charge.total_minutes)}
        </Chip>
      )}
      {ticket.statut !== 'resolu' && (
        <Chip
          size="sm"
          variant="flat"
          color={timeRemaining.resolution.depassement ? "danger" : "success"}
          startContent={timeRemaining.resolution.depassement ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
        >
          Résolution: {formatTimeRemaining(timeRemaining.resolution.total_minutes)}
        </Chip>
      )}
    </div>
  );
};

interface SupportStats {
  total: number;
  nouveaux: number;
  enCours: number;
  enAttente: number;
  enArbitrage: number;
  enPause: number;
  resolus: number;
  p0: number;
  p1: number;
  tempsMoyenResolution: number;
}

// Composant Skeleton pour le chargement
const SkeletonLoader: React.FC = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="flex justify-between items-start">
      <div>
        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>
      <div className="flex gap-3">
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    </div>

    {/* Stats skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>

    {/* Filters skeleton */}
    <Card>
      <CardBody className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </CardBody>
    </Card>

    {/* Table skeleton */}
    <Card>
      <CardBody className="p-0">
        <div className="space-y-4 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </CardBody>
    </Card>
  </div>
);

const SupportIncidents: React.FC = () => {
  const { hasPermission, user, isPartner } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const router = useRouter();
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [filterPriority, setFilterPriority] = useState<string>("tous");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // États des modales
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // États de loading pour les boutons
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États pour les formulaires
  const [createForm, setCreateForm] = useState<CreateSupportIncidentData>({
    title: "",
    description: "",
    type: "support",
    priority: "P3",
    status: "nouveau",
    category: "",
    impact: "",
    domain: "",
    declarant_name: "",
    user_id: 0,
    project_id: 0,
    is_active: true,
    is_read: false,
    resolution_notes: ""
  });
  
  const [editForm, setEditForm] = useState<UpdateSupportIncidentData>({
    id: 0,
    title: "",
    description: "",
    type: "support",
    priority: "P3",
    status: "nouveau",
    category: "",
    impact: "",
    domain: "",
    declarant_name: "",
    user_id: 0,
    project_id: 0,
    is_active: true,
    is_read: false,
    resolution_notes: ""
  });

  // États pour les données de référence
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPartners, setLoadingPartners] = useState(false);


  // Chargement initial
  useEffect(() => {
    loadData();
    loadPartners();
    loadProjects();
    loadUsers();
  }, []);

  // Filtrage des tickets
  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, filterStatus, filterPriority]);

  // Fonctions de chargement des données de référence
  const loadPartners = useCallback(async () => {
    try {
      setLoadingPartners(true);
      const allPartners = await partnersService.getActivePartners();
      setPartners(allPartners);
      console.log('📋 Partenaires chargés:', allPartners.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des partenaires:', error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        "Impossible de charger la liste des partenaires"
      ));
    } finally {
      setLoadingPartners(false);
    }
  }, [showNotification]);

  const loadProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const allProjects = await projectsService.getActiveProjects();
      setProjects(allProjects);
      console.log('📋 Projets chargés:', allProjects.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        "Impossible de charger la liste des projets"
      ));
    } finally {
      setLoadingProjects(false);
    }
  }, [showNotification]);

  const loadUsers = useCallback(async () => {
    // Ne charger les utilisateurs que pour les admins
    if (!isPartner()) {
      try {
        setLoadingUsers(true);
        const response = await UsersService.getUsersByCriteria({ size: 1000 });
        const allUsers = response.items || [];
        
        // Filtrer les utilisateurs pour éviter les doublons de noms
        const uniqueUsersMap = new Map();
        allUsers.forEach((user: UserType) => {
          if (!uniqueUsersMap.has(user.name)) {
            uniqueUsersMap.set(user.name, user);
          }
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());
        
        setUsers(uniqueUsers);
        console.log('📋 Utilisateurs chargés:', uniqueUsers.length);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des utilisateurs:', error);
        showNotification(simpleNotificationHelpers.error(
          "Erreur",
          "Impossible de charger la liste des utilisateurs"
        ));
      } finally {
        setLoadingUsers(false);
      }
    }
  }, [showNotification, isPartner]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const criteria: IncidentCriteria = {
        index: 0,
        size: 100,
        data: {
          type: 'support',
          // Pour les partners, filtrer par user_id (tickets qui leur sont assignés)
          ...(isPartner() && user && { user_id: user.id }),
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

      const supportTickets = apiIncidents.map(convertApiIncidentToSupportTicket);
      console.log('📊 Support tickets chargés:', supportTickets.length);
      setTickets(supportTickets);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des tickets support:', error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur de chargement",
        "Impossible de charger les tickets de support"
      ));
    } finally {
      setLoading(false);
    }
  }, [showNotification]);


  const filterTickets = useCallback(() => {
    let filtered = [...tickets];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.titre?.toLowerCase().includes(term) ||
        ticket.description?.toLowerCase().includes(term) ||
        ticket.incident_number?.toLowerCase().includes(term) ||
        ticket.declarant_name?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "tous") {
      filtered = filtered.filter(ticket => ticket.statut === filterStatus);
    }

    if (filterPriority !== "tous") {
      filtered = filtered.filter(ticket => ticket.priorite === filterPriority);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, filterStatus, filterPriority]);

  // Calcul des statistiques
  const calculateStats = (): SupportStats => {
    return {
      total: tickets.length,
      nouveaux: tickets.filter(t => t.statut === 'nouveau').length,
      enCours: tickets.filter(t => t.statut === 'en_cours').length,
      enAttente: tickets.filter(t => t.statut === 'en_attente').length,
      enArbitrage: tickets.filter(t => t.statut === 'en_arbitrage').length,
      enPause: tickets.filter(t => t.statut === 'en_pause').length,
      resolus: tickets.filter(t => t.statut === 'resolu').length,
      p0: tickets.filter(t => t.priorite === 'P0').length,
      p1: tickets.filter(t => t.priorite === 'P1').length,
      tempsMoyenResolution: tickets
        .filter(t => t.tempsMoyenResolution)
        .reduce((acc, t) => acc + (t.tempsMoyenResolution || 0), 0) / 
        Math.max(tickets.filter(t => t.tempsMoyenResolution).length, 1)
    };
  };

  // Handlers CRUD
  const handleCreate = async () => {
    if (!hasPermission(Permission.HANDLE_ALL_INCIDENTS)) {
      showNotification(simpleNotificationHelpers.error(
        "Permission refusée",
        "Vous n'avez pas les droits pour créer un ticket de support"
      ));
      return;
    }

    if (!user) {
      showNotification(simpleNotificationHelpers.error(
        "Erreur d'authentification",
        "Utilisateur non connecté"
      ));
      return;
    }

    try {
      setIsCreating(true);
      // Passer l'ID et l'email de l'utilisateur connecté depuis le contexte Auth
      const result = await IncidentsService.createIncident(createForm, user.id, user.email);
      
      showNotification(simpleNotificationHelpers.success(
        "Succès",
        extractBackendMessage(result) || result?.message || "Ticket de support créé avec succès"
      ));
      
      setShowCreateModal(false);
      resetCreateForm();
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        extractBackendMessage(error) || "Impossible de créer le ticket de support"
      ));
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!hasPermission(Permission.HANDLE_ALL_INCIDENTS)) {
      showNotification(simpleNotificationHelpers.error(
        "Permission refusée",
        "Vous n'avez pas les droits pour modifier ce ticket"
      ));
      return;
    }

    try {
      setIsUpdating(true);
      const result = await IncidentsService.updateIncident(editForm);
      
      showNotification(simpleNotificationHelpers.success(
        "Succès",
        extractBackendMessage(result) || result?.message || "Ticket modifié avec succès"
      ));
      
      setShowEditModal(false);
      setSelectedTicket(null);
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        extractBackendMessage(error) || "Impossible de modifier le ticket"
      ));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!hasPermission(Permission.HANDLE_ALL_INCIDENTS)) {
      showNotification(simpleNotificationHelpers.error(
        "Permission refusée",
        "Vous n'avez pas les droits pour supprimer ce ticket"
      ));
      return;
    }

    try {
      setIsDeleting(true);
      const result = await IncidentsService.deleteIncident(parseInt(selectedTicket!.id));
      
      showNotification(simpleNotificationHelpers.success(
        "Succès",
        extractBackendMessage(result) || result?.message || "Ticket supprimé avec succès"
      ));
      
      setShowDeleteModal(false);
      setSelectedTicket(null);
      await loadData();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        extractBackendMessage(error) || "Impossible de supprimer le ticket"
      ));
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonctions utilitaires
  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      type: "support",
      priority: "P3",
      status: "nouveau" as SupportStatus,
      category: "",
      impact: "",
      domain: "",
      declarant_name: "",
      user_id: 0,
      project_id: 0,
      is_active: true,
      is_read: false,
      resolution_notes: ""
    });
  };

  const handleViewTicket = (ticketId: string) => {
    router.push(`/tableaudebord/support/${ticketId}`);
  };

  const handleManageTicket = (ticketId: string) => {
    router.push(`/tableaudebord/support/${ticketId}/gerer`);
  };

  const openViewModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDetailModal(true);
  };

  const openEditModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setEditForm({
      id: parseInt(ticket.id),
      title: ticket.titre,
      description: ticket.description,
      type: ticket.type,
      priority: ticket.priorite,
      status: ticket.statut,
      category: ticket.category,
      impact: ticket.impact,
      domain: ticket.domain,
      declarant_name: ticket.declarant_name,
      user_id: ticket.user_id,
      project_id: ticket.project_id,
      is_active: true,
      is_read: ticket.is_read,
      resolution_notes: ticket.resolution_notes
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowDeleteModal(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Client</h1>
          <p className="text-gray-600 mt-1">Gestion des demandes de support clients avec suivi SLA</p>
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
          
          {hasPermission(Permission.HANDLE_ALL_INCIDENTS) && (
            <Button
              color="success"
              startContent={<Plus size={16} />}
              onClick={() => setShowCreateModal(true)}
            >
              Nouveau Ticket
            </Button>
          )}
        </div>
      </div>

      {/* Statistiques des tickets de support */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Incidents
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.total}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Nouveaux
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.nouveaux}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    En Cours
                  </p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.enCours}
                  </p>
                </div>
                <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                  <Timer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    En Arbitrage
                  </p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.enArbitrage}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                  <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    P0 Critiques
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.p0}
                  </p>
                </div>
                <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Temps Moyen
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round(stats.tempsMoyenResolution || 0)}h
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Filtres */}
      <Card>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher tickets..."
             
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Search size={16} />}
              className="w-full"
            />
            
            <Select
              placeholder="Filtrer par statut"
              selectedKeys={filterStatus === "tous" ? [] : [filterStatus]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilterStatus(selected || "tous");
              }}
            >
              <SelectItem key="tous">Tous les statuts</SelectItem>
              <SelectItem key="nouveau">Nouveau</SelectItem>
              <SelectItem key="en_cours">En cours</SelectItem>
              <SelectItem key="en_attente">En attente</SelectItem>
              <SelectItem key="en_arbitrage">En arbitrage</SelectItem>
              <SelectItem key="en_pause">En pause</SelectItem>
              <SelectItem key="resolu">Résolu</SelectItem>
            </Select>
            
            <Select
              placeholder="Filtrer par priorité"
              selectedKeys={filterPriority === "tous" ? [] : [filterPriority]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilterPriority(selected || "tous");
              }}
            >
              <SelectItem key="tous">Toutes les priorités</SelectItem>
              <SelectItem key="P1">P1 - Critique</SelectItem>
              <SelectItem key="P2">P2 - Élevée</SelectItem>
              <SelectItem key="P3">P3 - Moyenne</SelectItem>
              <SelectItem key="P4">P4 - Faible</SelectItem>
            </Select>

            <div className="flex items-center gap-2">
              <Chip color="primary" variant="flat">
                {filteredTickets.length} résultat(s)
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tableau des tickets */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Liste des tickets de support">
            <TableHeader>
              <TableColumn>NUMÉRO</TableColumn>
              <TableColumn>TITRE</TableColumn>
              <TableColumn>CLIENT</TableColumn>
              <TableColumn>PRIORITÉ</TableColumn>
              <TableColumn>STATUT</TableColumn>
              <TableColumn>CATÉGORIE</TableColumn>
              <TableColumn>IMPACT</TableColumn>
              <TableColumn>DOMAINE</TableColumn>
              <TableColumn>DÉLAIS DE TRAITEMENT</TableColumn>
              <TableColumn>CRÉÉ LE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Aucun ticket de support trouvé">
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {ticket.incident_number}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p 
                        className="font-medium cursor-pointer hover:text-[#4ba9b7] transition-colors"
                        onClick={() => handleViewTicket(ticket.id)}
                      >
                        {ticket.titre}
                      </p>
                      {ticket.description && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {ticket.description.substring(0, 100)}
                          {ticket.description.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        size="sm"
                        name={ticket.declarant_name}
                        className="w-8 h-8"
                      />
                      <span className="text-sm">{ticket.declarant_name || 'Client'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getPriorityColor(ticket.priorite)}
                      startContent={<span>{getPriorityIcon(ticket.priorite)}</span>}
                    >
                      {ticket.priorite}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getStatusColor(ticket.statut)}
                      startContent={getStatusIcon(ticket.statut)}
                    >
                      {ticket.statut.replace("_", " ")}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{ticket.category || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{ticket.impact || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{ticket.domain || "N/A"}</span>
                  </TableCell>
                  <TableCell>
                    <SLACountdown ticket={ticket} />
                  </TableCell>
                  <TableCell>
                    {formatDate(ticket.dateCreation)}
                  </TableCell>
                  <TableCell>
                    {!isPartner() && (
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
                            onPress={() => handleViewTicket(ticket.id)}
                          >
                            Voir détails
                          </DropdownItem>
                          <DropdownItem
                            key="manage"
                            startContent={<Settings size={14} />}
                            onPress={() => handleManageTicket(ticket.id)}
                          >
                            Gérer
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<Edit size={14} />}
                            onClick={() => openEditModal(ticket)}
                          >
                            Modifier
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash2 size={14} />}
                            onClick={() => openDeleteModal(ticket)}
                          >
                            Supprimer
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal de création */}
      <Modal 
        isOpen={showCreateModal} 
        onOpenChange={setShowCreateModal}
        size="2xl"
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Créer un nouveau ticket de support
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Titre du ticket"
                    placeholder="Ex: Problème de connectivité..."
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    isRequired
                  />

                  <Textarea
                    label="Description"
                    placeholder="Décrivez le problème en détail..."
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    minRows={3}
                    isRequired
                  />
                  
                  <Select
                    label="Déclarant du ticket"
                    placeholder="Sélectionnez l'utilisateur déclarant"
                    selectedKeys={createForm.declarant_name ? 
                      [users.find(user => user.name === createForm.declarant_name)?.id.toString() || ''] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      // Trouver l'utilisateur correspondant pour obtenir son nom
                      const selectedUser = users.find(user => user.id.toString() === selectedKey);
                      const userName = selectedUser ? selectedUser.name : '';
                      setCreateForm(prev => ({ ...prev, declarant_name: userName }));
                    }}
                    isLoading={loadingUsers}
                    isRequired
                  >
                    {users.map((user) => (
                      <SelectItem key={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Assigné à"
                      placeholder="Sélectionnez un partenaire"
                      selectedKeys={createForm.user_id ? [createForm.user_id.toString()] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setCreateForm(prev => ({ ...prev, user_id: selected ? parseInt(selected) : 0 }));
                      }}
                      isLoading={loadingPartners}
                    >
                      {partners.map((partner) => (
                        <SelectItem key={partner.id.toString()}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </Select>
                    
                    <Select
                      label="Projet"
                      placeholder="Sélectionnez un projet"
                      selectedKeys={createForm.project_id ? [createForm.project_id.toString()] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setCreateForm(prev => ({ ...prev, project_id: selected ? parseInt(selected) : 0 }));
                      }}
                      isLoading={loadingProjects}
                    >
                      {projects.map((project) => (
                        <SelectItem key={project.id.toString()}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Type"
                      value={createForm.type}
                      isReadOnly
                      className="cursor-not-allowed"
                      classNames={{
                        input: "text-gray-600 bg-gray-50"
                      }}
                    />
                    
                    <Input
                      label="Catégorie"
                      placeholder="Ex: Technique, Fonctionnel..."
                      value={createForm.category}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                    
                    <Select
                      label="Domaine concerné"
                      placeholder="Sélectionnez le domaine"
                      selectedKeys={createForm.domain ? [createForm.domain] : []}
                      onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, domain: Array.from(keys)[0] as string }))}
                    >
                      <SelectItem key="reseau">Réseau</SelectItem>
                      <SelectItem key="infrastructure">Infrastructure système</SelectItem>
                      <SelectItem key="cloud">Cloud</SelectItem>
                      <SelectItem key="energie">Energie</SelectItem>
                    </Select>
                  </div>
                  
                  <Select
                    label="Impact"
                    placeholder="Sélectionnez l'impact de l'incident"
                    selectedKeys={createForm.impact ? [createForm.impact] : []}
                    onSelectionChange={(keys) => {
                      const impact = Array.from(keys)[0] as string || "";
                      let priority = createForm.priority;
                      
                      // Déterminer automatiquement la criticité selon l'impact
                      switch(impact) {
                        case 'arret_service':
                          priority = 'P0';
                          break;
                        case 'service_fortement_degrade':
                          priority = 'P1';
                          break;
                        case 'majeur':
                          priority = 'P2';
                          break;
                        case 'mineur':
                          priority = 'P4';
                          break;
                        default:
                          priority = 'P3';
                      }
                      
                      setCreateForm(prev => ({ ...prev, impact, priority }));
                    }}
                    isRequired
                  >
                    <SelectItem key="arret_service">Arrêt de service</SelectItem>
                    <SelectItem key="service_fortement_degrade">Service fortement dégradé</SelectItem>
                    <SelectItem key="majeur">Majeur</SelectItem>
                    <SelectItem key="mineur">Mineur</SelectItem>
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Priorité"
                      selectedKeys={createForm.priority ? [createForm.priority] : []}
                      onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, priority: Array.from(keys)[0] as any }))}
                    >
                      <SelectItem key="P0">P0 - Arrêt de service (immédiat)</SelectItem>
                      <SelectItem key="P1">P1 - Haute (dégradation)</SelectItem>
                      <SelectItem key="P2">P2 - Moyenne</SelectItem>
                      <SelectItem key="P3">P3 - Faible</SelectItem>
                      <SelectItem key="P4">P4 - Très faible</SelectItem>
                    </Select>
                    
                    <Select
                      label="Statut"
                      selectedKeys={createForm.status ? [createForm.status] : []}
                      onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, status: Array.from(keys)[0] as any }))}
                    >
                      <SelectItem key="nouveau">Nouveau</SelectItem>
                      <SelectItem key="en_cours">En cours</SelectItem>
                      <SelectItem key="en_attente">En attente</SelectItem>
                      <SelectItem key="en_arbitrage">En arbitrage</SelectItem>
                      <SelectItem key="en_pause">En pause</SelectItem>
                      <SelectItem key="resolu">Résolu</SelectItem>
                    </Select>
                  </div>
                  
                  <Textarea
                    label="Notes de résolution (optionnel)"
                    placeholder="Ajoutez des notes sur la résolution du ticket..."
                    value={createForm.resolution_notes}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, resolution_notes: e.target.value }))}
                    minRows={2}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleCreate}
                  isLoading={isCreating}
                  isDisabled={!createForm.title || !createForm.description || !createForm.declarant_name || !createForm.user_id || !createForm.project_id || !createForm.category || !createForm.impact || !createForm.domain}
                >
                  {isCreating ? "Création..." : "Créer le ticket"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de détail */}
      <Modal 
        isOpen={showDetailModal} 
        onOpenChange={setShowDetailModal}
        size="3xl"
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Détails du ticket - {selectedTicket?.incident_number}
              </ModalHeader>
              <ModalBody>
                {selectedTicket && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Informations générales</h4>
                        <div className="space-y-2">
                          <p><span className="font-medium">Titre:</span> {selectedTicket.titre}</p>
                          <p><span className="font-medium">Client:</span> {selectedTicket.declarant_name}</p>
                          <p><span className="font-medium">Date de création:</span> {formatDate(selectedTicket.dateCreation)}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Statut et priorité</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Priorité:</span>
                            <Chip
                              color={getPriorityColor(selectedTicket.priorite)}
                              size="sm"
                              variant="flat"
                            >
                              {selectedTicket.priorite_label}
                            </Chip>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Statut:</span>
                            <Chip
                              color={selectedTicket.statut_color === 'blue' ? 'primary' :
                                     selectedTicket.statut_color === 'orange' ? 'warning' :
                                     selectedTicket.statut_color === 'gray' ? 'default' :
                                     selectedTicket.statut_color === 'purple' ? 'secondary' :
                                     selectedTicket.statut_color === 'green' ? 'success' : 'default'}
                              size="sm"
                              variant="flat"
                            >
                              {selectedTicket.statut === 'nouveau' ? 'Nouveau' :
                               selectedTicket.statut === 'en_cours' ? 'En cours' :
                               selectedTicket.statut === 'en_attente' ? 'En attente' :
                               selectedTicket.statut === 'en_arbitrage' ? 'En arbitrage' :
                               selectedTicket.statut === 'resolu' ? 'Résolu' : selectedTicket.statut}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{selectedTicket.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Fermer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal d'édition */}
      <Modal 
        isOpen={showEditModal} 
        onOpenChange={setShowEditModal}
        size="2xl"
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Modifier le ticket - {selectedTicket?.incident_number}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Titre du ticket"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />

                  <Textarea
                    label="Description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    minRows={3}
                  />
                  
                  <Select
                    label="Déclarant du ticket"
                    placeholder="Sélectionnez l'utilisateur déclarant"
                    selectedKeys={editForm.declarant_name ? 
                      [users.find(user => user.name === editForm.declarant_name)?.id.toString() || ''] : []
                    }
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string;
                      // Trouver l'utilisateur correspondant pour obtenir son nom
                      const selectedUser = users.find(user => user.id.toString() === selectedKey);
                      const userName = selectedUser ? selectedUser.name : '';
                      setEditForm(prev => ({ ...prev, declarant_name: userName }));
                    }}
                    isLoading={loadingUsers}
                  >
                    {users.map((user) => (
                      <SelectItem key={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Assigné à"
                      placeholder="Sélectionnez un partenaire"
                      selectedKeys={editForm.user_id ? [editForm.user_id.toString()] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setEditForm(prev => ({ ...prev, user_id: selected ? parseInt(selected) : 0 }));
                      }}
                      isLoading={loadingPartners}
                    >
                      {partners.map((partner) => (
                        <SelectItem key={partner.id.toString()}>
                          {partner.name}
                        </SelectItem>
                      ))}
                    </Select>
                    
                    <Select
                      label="Projet"
                      placeholder="Sélectionnez un projet"
                      selectedKeys={editForm.project_id ? [editForm.project_id.toString()] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setEditForm(prev => ({ ...prev, project_id: selected ? parseInt(selected) : 0 }));
                      }}
                      isLoading={loadingProjects}
                    >
                      {projects.map((project) => (
                        <SelectItem key={project.id.toString()}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Type"
                      value={editForm.type}
                      isReadOnly
                      className="cursor-not-allowed"
                      classNames={{
                        input: "text-gray-600 bg-gray-50"
                      }}
                      description="Le type ne peut pas être modifié"
                    />
                    
                    <Input
                      label="Catégorie"
                      value={editForm.category}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    />
                    
                    <Select
                      label="Domaine concerné"
                      placeholder="Sélectionnez le domaine"
                      selectedKeys={editForm.domain ? [editForm.domain] : []}
                      onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, domain: Array.from(keys)[0] as string }))}
                    >
                      <SelectItem key="reseau">Réseau</SelectItem>
                      <SelectItem key="infrastructure">Infrastructure système</SelectItem>
                      <SelectItem key="cloud">Cloud</SelectItem>
                      <SelectItem key="energie">Energie</SelectItem>
                    </Select>
                  </div>
                  
                  <Select
                    label="Impact"
                    placeholder="Sélectionnez l'impact de l'incident"
                    selectedKeys={editForm.impact ? [editForm.impact] : []}
                    onSelectionChange={(keys) => {
                      const impact = Array.from(keys)[0] as string || "";
                      let priority = editForm.priority;
                      
                      // Suggérer automatiquement la criticité selon l'impact (mais laisser éditable)
                      switch(impact) {
                        case 'arret_service':
                          priority = 'P0';
                          break;
                        case 'service_fortement_degrade':
                          priority = 'P1';
                          break;
                        case 'majeur':
                          priority = 'P2';
                          break;
                        case 'mineur':
                          priority = 'P4';
                          break;
                        default:
                          priority = 'P3';
                      }
                      
                      setEditForm(prev => ({ ...prev, impact, priority }));
                    }}
                    isRequired
                  >
                    <SelectItem key="arret_service">Arrêt de service</SelectItem>
                    <SelectItem key="service_fortement_degrade">Service fortement dégradé</SelectItem>
                    <SelectItem key="majeur">Majeur</SelectItem>
                    <SelectItem key="mineur">Mineur</SelectItem>
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Priorité"
                      selectedKeys={editForm.priority ? [editForm.priority] : []}
                      onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, priority: Array.from(keys)[0] as any }))}
                    >
                      <SelectItem key="P0">P0 - Arrêt de service (immédiat)</SelectItem>
                      <SelectItem key="P1">P1 - Haute (dégradation)</SelectItem>
                      <SelectItem key="P2">P2 - Moyenne</SelectItem>
                      <SelectItem key="P3">P3 - Faible</SelectItem>
                      <SelectItem key="P4">P4 - Très faible</SelectItem>
                    </Select>
                    
                    <Select
                      label="Statut"
                      selectedKeys={editForm.status ? [editForm.status] : []}
                      onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, status: Array.from(keys)[0] as any }))}
                    >
                      <SelectItem key="nouveau">Nouveau</SelectItem>
                      <SelectItem key="en_cours">En cours</SelectItem>
                      <SelectItem key="en_attente">En attente</SelectItem>
                      <SelectItem key="en_arbitrage">En arbitrage</SelectItem>
                      <SelectItem key="en_pause">En pause</SelectItem>
                      <SelectItem key="resolu">Résolu</SelectItem>
                    </Select>
                  </div>
                  
                  <Textarea
                    label="Notes de résolution (optionnel)"
                    placeholder="Ajoutez des notes sur la résolution du ticket..."
                    value={editForm.resolution_notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, resolution_notes: e.target.value }))}
                    minRows={2}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button 
                  color="primary" 
                  onPress={handleEdit}
                  isLoading={isUpdating}
                  isDisabled={!editForm.title || !editForm.description || !editForm.declarant_name || !editForm.user_id || !editForm.project_id || !editForm.category || !editForm.impact || !editForm.domain}
                >
                  {isUpdating ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de suppression */}
      <Modal 
        isOpen={showDeleteModal} 
        onOpenChange={setShowDeleteModal}
        size="md"
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Confirmer la suppression
              </ModalHeader>
              <ModalBody>
                <div className="text-center py-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Supprimer le ticket {selectedTicket?.incident_number}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Cette action est irréversible. Toutes les données associées à ce ticket seront définitivement supprimées.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleDelete}
                  isLoading={isDeleting}
                >
                  Supprimer définitivement
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SupportIncidents;