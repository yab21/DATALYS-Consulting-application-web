"use client";

import React, { useState, useEffect } from "react";
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
  Download
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { IncidentsService, type Incident as ApiIncident, type IncidentCriteria, type CreateIncidentData, type UpdateIncidentData } from "@/services/incidents";
import { projectsService, type Project } from "@/services/projects";
import { UsersService, type User as UserType } from "@/services/users";

// Types locaux pour l'interface
interface Incident {
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
  dateResolution?: Date;
  assigneA: string;
  commentaires: number;
  tempsMoyenResolution?: number;
  sla_prise_en_charge_status: 'respecte' | 'en_retard' | 'non_applicable';
  sla_resolution_status: 'respecte' | 'en_retard' | 'non_applicable';
  is_read: boolean;
  refusal_count: number;
  resolution_notes?: string;
}

// Fonction de conversion API vers interface locale
const convertApiIncidentToLocal = (apiIncident: ApiIncident): Incident => ({
  id: apiIncident.id.toString(),
  titre: apiIncident.title,
  description: apiIncident.description,
  incident_number: apiIncident.incident_number,
  type: apiIncident.type,
  priorite: apiIncident.priority,
  priorite_label: apiIncident.priority_label,
  statut: apiIncident.status,
  statut_color: apiIncident.status_color,
  category: apiIncident.category,
  impact: apiIncident.impact,
  impact_label: apiIncident.impact_label,
  domain: apiIncident.domain,
  declarant_name: apiIncident.declarant_name,
  user_id: apiIncident.user_id,
  project_id: apiIncident.project_id,
  projectNom: `Projet ${apiIncident.project_id}`,
  partnerNom: apiIncident.declarant_name || "Utilisateur",
  partnerLogo: undefined,
  dateCreation: new Date(apiIncident.created_at),
  dateResolution: undefined, // Plus de statut résolu dans le nouveau système
  assigneA: "Support Technique",
  commentaires: Math.floor(Math.random() * 10) + 1,
  tempsMoyenResolution: undefined, // Plus de statut résolu dans le nouveau système
  sla_prise_en_charge_status: apiIncident.sla_prise_en_charge_status,
  sla_resolution_status: apiIncident.sla_resolution_status,
  is_read: apiIncident.is_read,
  refusal_count: apiIncident.refusal_count,
  resolution_notes: apiIncident.resolution_notes,
});

interface IncidentStats {
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


const GestionIncidents: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [filterPriority, setFilterPriority] = useState<string>("tous");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // États de loading pour les boutons
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // États pour les formulaires
  const [createForm, setCreateForm] = useState<CreateIncidentData>({
    title: "",
    description: "",
    type: "incident", // Type par défaut pour les incidents
    priority: "P2",
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
  
  const [editForm, setEditForm] = useState<UpdateIncidentData>({
    id: 0,
    title: "",
    description: "",
    type: "",
    priority: "P2",
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

  // État pour le formulaire d'export
  const [exportForm, setExportForm] = useState({
    format: 'pdf' as 'pdf' | 'xlsx' | 'csv',
    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Premier jour du mois
    date_to: new Date().toISOString().split('T')[0], // Aujourd'hui
    include_stats: true,
    include_details: true,
    status: '',
    priority: '',
    category: '',
    domain: '',
    project_id: 0,
    user_id: 0
  });
  
  // Charger les projets et utilisateurs au montage du composant
  useEffect(() => {
    const loadProjectsAndUsers = async () => {
      // Charger les projets
      setLoadingProjects(true);
      try {
        console.log("🔄 Chargement des projets...");
        const projectsList = await projectsService.getActiveProjects();
        
        // Filtrer les projets pour éviter les doublons de titres
        const uniqueProjectsMap = new Map();
        projectsList.forEach(project => {
          if (!uniqueProjectsMap.has(project.title)) {
            uniqueProjectsMap.set(project.title, project);
          }
        });
        const uniqueProjects = Array.from(uniqueProjectsMap.values());
        
        setProjects(uniqueProjects);
        console.log("✅ Projets chargés:", uniqueProjects);
        console.log("📊 Projets originaux:", projectsList.length, "Projets uniques:", uniqueProjects.length);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des projets:", error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
      
      // Charger les utilisateurs
      setLoadingUsers(true);
      try {
        console.log("🔄 Chargement des utilisateurs...");
        const response = await UsersService.getUsersByCriteria({
          index: 0,
          size: 100,
          data: { is_active: true }
        });
        
        let usersList: UserType[] = [];
        if (response.code === 200 && response.items) {
          usersList = response.items;
        } else if (Array.isArray(response)) {
          usersList = response;
        }
        
        // Filtrer les utilisateurs pour éviter les doublons de noms
        // Utiliser une Map pour garder le premier utilisateur de chaque nom
        const uniqueUsersMap = new Map();
        usersList.forEach(user => {
          if (!uniqueUsersMap.has(user.name)) {
            uniqueUsersMap.set(user.name, user);
          }
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());
        
        setUsers(uniqueUsers);
        console.log("✅ Utilisateurs chargés:", uniqueUsers);
        console.log("📊 Utilisateurs originaux:", usersList.length, "Utilisateurs uniques:", uniqueUsers.length);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des utilisateurs:", error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    loadProjectsAndUsers();
  }, []);
  const [stats, setStats] = useState<IncidentStats>({
    total: 0,
    nouveaux: 0,
    enCours: 0,
    enAttente: 0,
    enArbitrage: 0,
    enPause: 0,
    resolus: 0,
    p0: 0,
    p1: 0,
    tempsMoyenResolution: 0
  });

  // État pour les filtres et pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>("tous");
  const [priorityFilter, setPriorityFilter] = useState<string>("tous");
  // const [typeFilter, setTypeFilter] = useState<string>("tous"); // Pas utilisé pour l'instant
  
  // État pour les projets et utilisateurs
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Chargement des données via l'API incidents
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        console.log("🔄 Chargement incidents via API incidents");
        
        // Préparer les critères de recherche
        const criteria: IncidentCriteria = {
          index: currentPage,
          size: pageSize,
          data: {
            is_active: true,
            type: 'incident', // Filtrer seulement les incidents (pas les supports)
            ...(statusFilter !== "tous" && { status: statusFilter as any }),
            ...(priorityFilter !== "tous" && { priority: priorityFilter as any }),
          }
        };
        
        // Appel à l'API incidents
        const response = await IncidentsService.getIncidentsByCriteria(criteria);
        
        let apiIncidents: ApiIncident[] = [];
        
        // Traitement de la réponse selon le format
        if (response.code === 200 && response.items && Array.isArray(response.items)) {
          apiIncidents = response.items;
        } else if (Array.isArray(response)) {
          apiIncidents = response;
        } else if (response.data && Array.isArray(response.data)) {
          apiIncidents = response.data;
        }
        
        // Conversion vers le format local
        const convertedIncidents: Incident[] = apiIncidents.map(convertApiIncidentToLocal);
        
        setIncidents(convertedIncidents);
        setFilteredIncidents(convertedIncidents);
        
        // Calcul des statistiques
        const newStats: IncidentStats = {
          total: convertedIncidents.length,
          nouveaux: convertedIncidents.filter(i => i.statut === "nouveau").length,
          enCours: convertedIncidents.filter(i => i.statut === "en_cours").length,
          enAttente: convertedIncidents.filter(i => i.statut === "en_attente").length,
          enArbitrage: convertedIncidents.filter(i => i.statut === "en_arbitrage").length,
          enPause: convertedIncidents.filter(i => i.statut === "en_pause").length,
          resolus: convertedIncidents.filter(i => i.statut === "resolu").length,
          p0: convertedIncidents.filter(i => i.priorite === "P0").length,
          p1: convertedIncidents.filter(i => i.priorite === "P1").length,
          tempsMoyenResolution: convertedIncidents
            .filter(i => i.tempsMoyenResolution)
            .reduce((sum, i) => sum + (i.tempsMoyenResolution || 0), 0) / 
            (convertedIncidents.filter(i => i.tempsMoyenResolution).length || 1)
        };
        
        setStats(newStats);
        console.log("✅ Incidents chargés via API incidents:", convertedIncidents);
        
      } catch (error) {
        console.error("❌ Erreur lors du chargement des incidents:", error);
        
        // Afficher un message d'erreur à l'utilisateur
        showNotification(simpleNotificationHelpers.error(
          "Erreur", 
          "Impossible de charger les incidents. Veuillez réessayer."
        ));
        
        // Réinitialiser les données
        setIncidents([]);
        setFilteredIncidents([]);
        setStats({
          total: 0,
          nouveaux: 0,
          enCours: 0,
          enAttente: 0,
          enArbitrage: 0,
          enPause: 0,
          resolus: 0,
          p0: 0,
          p1: 0,
          tempsMoyenResolution: 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    currentPage,
    pageSize,
    statusFilter,
    priorityFilter
  ]);

  // Filtrage des incidents
  useEffect(() => {
    let filtered = incidents;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(incident =>
        incident.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.partnerNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.projectNom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (filterStatus !== "tous") {
      filtered = filtered.filter(incident => incident.statut === filterStatus);
    }

    // Filtrage par priorité
    if (filterPriority !== "tous") {
      filtered = filtered.filter(incident => incident.priorite === filterPriority);
    }

    setFilteredIncidents(filtered);
  }, [incidents, searchTerm, filterStatus, filterPriority]);

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

  // Fonctions utilitaires pour les SLA
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
      case "en_retard": return <Timer className="h-3 w-3" />;
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


  const handleIncidentAction = async (incident: Incident, action: string) => {
    setSelectedIncident(incident);
    
    switch (action) {
      case "view":
        // Rediriger vers la page de détail de l'incident
        window.location.href = `/tableaudebord/incidents/${incident.id}`;
        break;
      case "edit":
        // Pré-remplir le formulaire d'édition
        console.log("🔧 Pré-remplissage du formulaire d'édition:", incident);
        
        const editData = {
          id: parseInt(incident.id),
          title: incident.titre,
          description: incident.description,
          type: incident.type,
          priority: incident.priorite,
          status: incident.statut,
          category: incident.category,
          impact: incident.impact,
          domain: incident.domain,
          declarant_name: incident.declarant_name,
          user_id: incident.user_id,
          project_id: incident.project_id,
          is_active: true,
          is_read: incident.is_read,
          resolution_notes: incident.resolution_notes || ""
        };
        
        console.log("📝 Données du formulaire d'édition:", editData);
        
        setEditForm(editData);
        setShowEditModal(true);
        break;
      case "delete":
        setShowDeleteModal(true);
        break;
    }
  };

  // Fonction pour créer un incident
  const handleCreateIncident = async () => {
    if (isCreating) return; // Prévenir les double-clics
    
    setIsCreating(true);
    try {
      console.log("🔄 Création d'un nouvel incident:", createForm);
      
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      await IncidentsService.createIncident(createForm, user.id, user.email);
      
      // Recharger les données
      const criteria: IncidentCriteria = {
        index: currentPage,
        size: pageSize,
        data: { 
          is_active: true,
          type: 'incident' // Filtrer seulement les incidents
        }
      };
      
      const refreshResponse = await IncidentsService.getIncidentsByCriteria(criteria);
      let apiIncidents: ApiIncident[] = [];
      
      if (refreshResponse.code === 200 && refreshResponse.items) {
        apiIncidents = refreshResponse.items;
      } else if (Array.isArray(refreshResponse)) {
        apiIncidents = refreshResponse;
      }
      
      const convertedIncidents = apiIncidents.map(convertApiIncidentToLocal);
      setIncidents(convertedIncidents);
      setFilteredIncidents(convertedIncidents);
      
      // Réinitialiser le formulaire
      setCreateForm({
        title: "",
        description: "",
        type: "incident",
        priority: "P2",
        status: "nouveau",
        category: "technique",
        impact: "genant",
        domain: "application",
        declarant_name: "",
        user_id: 0,
        project_id: 0,
        is_active: true,
        is_read: false,
        resolution_notes: ""
      });
      
      setShowCreateModal(false);
      showNotification(simpleNotificationHelpers.success("Succès", "Incident créé avec succès"));
      console.log("✅ Incident créé avec succès");
      
    } catch (error: any) {
      console.error("❌ Erreur lors de la création de l'incident:", error);
      
      // Le service incidents va maintenant bien capturer les erreurs API
      let errorMessage = error.message || "Une erreur inattendue s'est produite";
      
      showNotification(simpleNotificationHelpers.error("Erreur", errorMessage));
    } finally {
      setIsCreating(false);
    }
  };

  // Fonction pour modifier un incident
  const handleUpdateIncident = async () => {
    if (isUpdating) return; // Prévenir les double-clics
    
    setIsUpdating(true);
    try {
      console.log("🔄 Modification de l'incident:", editForm);
      
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      await IncidentsService.updateIncident(editForm, user.id, user.email);
      
      // Mettre à jour l'état local
      setIncidents(prev => prev.map(i => 
        i.id === selectedIncident?.id 
          ? {
              ...i,
              titre: editForm.title || i.titre,
              description: editForm.description || i.description,
              priorite: (editForm.priority as any) || i.priorite,
              statut: (editForm.status as any) || i.statut,
            }
          : i
      ));
      
      setShowEditModal(false);
      setSelectedIncident(null);
      showNotification(simpleNotificationHelpers.success("Succès", "Incident modifié avec succès"));
      console.log("✅ Incident modifié avec succès");
      
    } catch (error: any) {
      console.error("❌ Erreur lors de la modification de l'incident:", error);
      
      // Le service incidents va maintenant bien capturer les erreurs API
      let errorMessage = error.message || "Une erreur inattendue s'est produite";
      
      showNotification(simpleNotificationHelpers.error("Erreur", errorMessage));
    } finally {
      setIsUpdating(false);
    }
  };

  // Fonction pour supprimer un incident
  const handleDeleteIncident = async () => {
    if (!selectedIncident || isDeleting) return;
    
    setIsDeleting(true);
    try {
      console.log("🔄 Suppression de l'incident:", selectedIncident.id);
      
      await IncidentsService.deleteIncident(parseInt(selectedIncident.id));
      
      // Retirer de l'état local
      setIncidents(prev => prev.filter(i => i.id !== selectedIncident.id));
      setFilteredIncidents(prev => prev.filter(i => i.id !== selectedIncident.id));
      
      setShowDeleteModal(false);
      setSelectedIncident(null);
      showNotification(simpleNotificationHelpers.success("Succès", "Incident supprimé avec succès"));
      console.log("✅ Incident supprimé avec succès");
      
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression de l'incident:", error);
      
      // Le service incidents va maintenant bien capturer les erreurs API
      let errorMessage = error.message || "Une erreur inattendue s'est produite";
      
      showNotification(simpleNotificationHelpers.error("Erreur", errorMessage));
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonction pour exporter les incidents
  const handleExportIncidents = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      console.log("📊 Export d'incidents démarré:", exportForm);
      
      // Préparer les critères d'export
      const exportOptions = {
        format: exportForm.format,
        criteria: {
          ...(exportForm.status && exportForm.status !== 'tous' && { status: exportForm.status }),
          ...(exportForm.priority && exportForm.priority !== 'tous' && { priority: exportForm.priority }),
          ...(exportForm.category && exportForm.category !== 'tous' && { category: exportForm.category }),
          ...(exportForm.domain && exportForm.domain !== 'tous' && { domain: exportForm.domain }),
          ...(exportForm.user_id > 0 && { user_id: exportForm.user_id }),
          ...(exportForm.project_id > 0 && { project_id: exportForm.project_id })
        },
        date_from: exportForm.date_from,
        date_to: exportForm.date_to,
        include_stats: exportForm.include_stats,
        include_details: exportForm.include_details
      };
      
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Utiliser la nouvelle méthode qui gère correctement les fichiers binaires
      const blob = await IncidentsService.exportIncidentsFile(exportOptions, user.id, user.email);
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents_export_${new Date().toISOString().split('T')[0]}.${exportForm.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      showNotification(simpleNotificationHelpers.success("Succès", "Export généré avec succès"));
      console.log("✅ Export terminé avec succès");
      
    } catch (error: any) {
      console.error("❌ Erreur lors de l'export:", error);
      let errorMessage = error.message || "Une erreur inattendue s'est produite lors de l'export";
      showNotification(simpleNotificationHelpers.error("Erreur", errorMessage));
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}j`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return "Il y a moins d'1h";
    if (hours < 24) return `Il y a ${Math.round(hours)}h`;
    if (hours < 48) return "Hier";
    return `Il y a ${Math.round(hours / 24)} jours`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-96 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques des incidents */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-7">
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
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.enCours}
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
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
                    En Pause
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.enPause}
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
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
                    P0 (Critiques)
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.p0}
                  </p>
                </div>
                <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Temps Moyen
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatDuration(stats.tempsMoyenResolution)}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Filtres et recherche */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardBody className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <Input
                  placeholder="Rechercher un incident..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startContent={<Search className="h-4 w-4 text-gray-400" />}
                  className="max-w-md"
                />
                
                <Select
                  placeholder="Statut"
                  selectedKeys={filterStatus ? [filterStatus] : []}
                  onSelectionChange={(keys) => setFilterStatus(Array.from(keys)[0] as string)}
                  className="max-w-[150px]"
                  startContent={<Filter className="h-4 w-4" />}
                >
                  <SelectItem key="tous" value="tous">Tous</SelectItem>
                  <SelectItem key="nouveau" value="nouveau">Nouveau</SelectItem>
                  <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                  <SelectItem key="en_attente" value="en_attente">En attente</SelectItem>
                  <SelectItem key="en_arbitrage" value="en_arbitrage">En arbitrage</SelectItem>
                  <SelectItem key="en_pause" value="en_pause">En pause</SelectItem>
                  <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                </Select>

                <Select
                  placeholder="Priorité"
                  selectedKeys={filterPriority ? [filterPriority] : []}
                  onSelectionChange={(keys) => setFilterPriority(Array.from(keys)[0] as string)}
                  className="max-w-[150px]"
                  startContent={<AlertTriangle className="h-4 w-4" />}
                >
                  <SelectItem key="tous" value="tous">Toutes</SelectItem>
                  <SelectItem key="P0" value="P0">P0 - Critique</SelectItem>
                  <SelectItem key="P1" value="P1">P1 - Haute</SelectItem>
                  <SelectItem key="P2" value="P2">P2 - Moyenne</SelectItem>
                  <SelectItem key="P3" value="P3">P3 - Faible</SelectItem>
                  <SelectItem key="P4" value="P4">P4 - Très faible</SelectItem>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  variant="flat"
                  startContent={<Download className="h-4 w-4" />}
                  onPress={() => setShowExportModal(true)}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Exporter
                </Button>
                <Button
                  color="primary"
                  onPress={() => setShowCreateModal(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Créer un incident
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredIncidents.length} incident(s) trouvé(s)
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Table des incidents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <CardBody className="p-0">
            <Table aria-label="Table des incidents" className="min-h-[400px]">
              <TableHeader>
                <TableColumn>INCIDENT</TableColumn>
                <TableColumn>PRIORITÉ</TableColumn>
                <TableColumn>STATUT</TableColumn>
                <TableColumn>DÉLAIS DE TRAITEMENT</TableColumn>
                <TableColumn>CRÉÉ</TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Aucun incident trouvé">
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {incident.titre}
                          </p>
                          {!incident.is_read && (
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          #{incident.incident_number}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {incident.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getPriorityColor(incident.priorite)}
                        startContent={<span>{getPriorityIcon(incident.priorite)}</span>}
                      >
                        {incident.priorite}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(incident.statut)}
                        startContent={getStatusIcon(incident.statut)}
                      >
                        {incident.statut.replace("_", " ")}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getSLAColor(incident.sla_prise_en_charge_status)}
                          startContent={getSLAIcon(incident.sla_prise_en_charge_status)}
                        >
                          Prise en charge: {getSLALabel(incident.sla_prise_en_charge_status)}
                        </Chip>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={getSLAColor(incident.sla_resolution_status)}
                          startContent={getSLAIcon(incident.sla_resolution_status)}
                        >
                          Résolution: {getSLALabel(incident.sla_resolution_status)}
                        </Chip>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {incident.dateCreation.toLocaleDateString("fr-FR")}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(incident.dateCreation)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions incident">
                          {[
                            <DropdownItem
                              key="view"
                              startContent={<Eye className="h-4 w-4" />}
                              onPress={() => handleIncidentAction(incident, "view")}
                            >
                              Upload
                            </DropdownItem>,
                            ...(hasPermission(Permission.HANDLE_ALL_INCIDENTS) ? [
                              <DropdownItem
                                key="edit"
                                startContent={<Edit className="h-4 w-4" />}
                                onPress={() => handleIncidentAction(incident, "edit")}
                              >
                                Modifier
                              </DropdownItem>,
                              <DropdownItem
                                key="delete"
                                startContent={<XCircle className="h-4 w-4" />}
                                onPress={() => handleIncidentAction(incident, "delete")}
                                className="text-danger"
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
          </CardBody>
        </Card>
      </motion.div>

      {/* Modal détails incident */}
      {selectedIncident && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          size="4xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedIncident.titre}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedIncident.partnerNom} - {selectedIncident.projectNom}
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Chip
                    variant="flat"
                    color={getPriorityColor(selectedIncident.priorite)}
                    startContent={getPriorityIcon(selectedIncident.priorite)}
                  >
                    Priorité {selectedIncident.priorite}
                  </Chip>
                  <Chip
                    variant="flat"
                    color={getStatusColor(selectedIncident.statut)}
                    startContent={getStatusIcon(selectedIncident.statut)}
                  >
                    {selectedIncident.statut.replace("_", " ")}
                  </Chip>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedIncident.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Assigné à:</span>
                        <span>{selectedIncident.assigneA}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Créé le:</span>
                        <span>{selectedIncident.dateCreation.toLocaleDateString("fr-FR")}</span>
                      </div>
                      {selectedIncident.dateResolution && (
                        <div className="flex justify-between">
                          <span>Résolu le:</span>
                          <span>{selectedIncident.dateResolution.toLocaleDateString("fr-FR")}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Commentaires:</span>
                        <span>{selectedIncident.commentaires}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Projet & Partenaire</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Partenaire:</span>
                        <span>{selectedIncident.partnerNom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projet:</span>
                        <span>{selectedIncident.projectNom}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => setShowDetailModal(false)}
              >
                Fermer
              </Button>
              {hasPermission(Permission.HANDLE_ALL_INCIDENTS) ? (
                <Button
                  color="primary"
                  onPress={() => {
                    setShowDetailModal(false);
                    setShowEditModal(true);
                  }}
                >
                  Modifier
                </Button>
              ) : null}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal création incident */}
      <Modal
        isOpen={showCreateModal}
        isDismissable={!isCreating}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({
            title: "",
            description: "",
            type: "incident",
            priority: "P2",
            status: "nouveau",
            category: "technique",
            impact: "genant",
            domain: "application",
            declarant_name: "",
            user_id: 0,
            project_id: 0,
            is_active: true,
            is_read: false,
            resolution_notes: ""
          });
        }}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "z-[60]",
          backdrop: "z-[59]"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Créer un nouvel incident</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titre de l'incident"
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
                label="Déclarant de l'incident"
                placeholder="Sélectionnez la personne qui déclare l'incident"
                selectedKeys={createForm.declarant_name ? [createForm.declarant_name] : []}
                onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, declarant_name: Array.from(keys)[0] as string }))}
                isLoading={loadingUsers}
                isRequired
              >
                {users.map((user) => (
                  <SelectItem key={user.name} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Assigné à (Responsable)"
                  placeholder="Sélectionnez l'utilisateur responsable"
                  selectedKeys={createForm.user_id ? [createForm.user_id.toString()] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, user_id: parseInt(Array.from(keys)[0] as string) }))}
                  isLoading={loadingUsers}
                  isRequired
                >
                  {users.map((user) => (
                    <SelectItem key={user.id.toString()} value={user.id.toString()} textValue={`${user.name} (${user.email})`}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </Select>
                
                <Select
                  label="Projet"
                  placeholder="Sélectionnez un projet"
                  selectedKeys={createForm.project_id ? [createForm.project_id.toString()] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, project_id: parseInt(Array.from(keys)[0] as string) }))}
                  isLoading={loadingProjects}
                  isRequired
                >
                  {projects.map((project) => (
                    <SelectItem key={project.id.toString()} value={project.id.toString()} textValue={`${project.title} ${project.partner_name ? `(${project.partner_name})` : ''}`}>
                      {project.title} {project.partner_name ? `(${project.partner_name})` : ''}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Type"
                  placeholder="Ex: Incident, Demande, Problème..."
                  value={createForm.type}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as any }))}
                  isRequired
                />

                <Input
                  label="Catégorie"
                  placeholder="Ex: Technique, Fonctionnel..."
                  value={createForm.category}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value as any }))}
                  isRequired
                />

                <Input
                  label="Domaine"
                  placeholder="Ex: Réseau, Application..."
                  value={createForm.domain}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, domain: e.target.value as any }))}
                  isRequired
                />
              </div>

              <Input
                label="Impact"
                placeholder="Ex: Arrêt de service, Ralentissement..."
                value={createForm.impact}
                onChange={(e) => setCreateForm(prev => ({ ...prev, impact: e.target.value as any }))}
                isRequired
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Priorité"
                  selectedKeys={createForm.priority ? [createForm.priority] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, priority: Array.from(keys)[0] as any }))}
                  isRequired
                >
                  <SelectItem key="P0" value="P0">P0 - Arrêt de service (immédiat)</SelectItem>
                  <SelectItem key="P1" value="P1">P1 - Haute (dégradation)</SelectItem>
                  <SelectItem key="P2" value="P2">P2 - Moyenne</SelectItem>
                  <SelectItem key="P3" value="P3">P3 - Faible</SelectItem>
                  <SelectItem key="P4" value="P4">P4 - Très faible</SelectItem>
                </Select>
                
                <Select
                  label="Statut"
                  selectedKeys={createForm.status ? [createForm.status] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, status: Array.from(keys)[0] as any }))}
                  isRequired
                >
                  <SelectItem key="nouveau" value="nouveau">Nouveau</SelectItem>
                  <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                  <SelectItem key="en_attente" value="en_attente">En attente</SelectItem>
                  <SelectItem key="en_arbitrage" value="en_arbitrage">En arbitrage</SelectItem>
                  <SelectItem key="en_pause" value="en_pause">En pause</SelectItem>
                  <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                </Select>
              </div>
              
              <Textarea
                label="Notes de résolution (optionnel)"
                placeholder="Ajoutez des notes sur la résolution de l'incident..."
                value={createForm.resolution_notes}
                onChange={(e) => setCreateForm(prev => ({ ...prev, resolution_notes: e.target.value }))}
                minRows={2}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setShowCreateModal(false)}
              isDisabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateIncident}
              isLoading={isCreating}
              isDisabled={!createForm.title || !createForm.description || !createForm.declarant_name || !createForm.user_id || !createForm.project_id}
            >
              {isCreating ? "Création..." : "Créer l'incident"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal édition incident */}
      {selectedIncident && (
        <Modal
          isOpen={showEditModal}
          isDismissable={!isUpdating}
          onClose={() => setShowEditModal(false)}
          size="2xl"
          scrollBehavior="inside"
          classNames={{
            wrapper: "z-[60]",
            backdrop: "z-[59]"
          }}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <Edit className="h-5 w-5 text-warning" />
                </div>
                <h3 className="text-xl font-bold">Modifier l'incident</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  label="Titre de l'incident"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  isRequired
                />
                
                <Textarea
                  label="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  minRows={3}
                  isRequired
                />
                
                <Select
                  label="Déclarant de l'incident"
                  placeholder="Sélectionnez la personne qui déclare l'incident"
                  selectedKeys={editForm.declarant_name ? [editForm.declarant_name] : []}
                  onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, declarant_name: Array.from(keys)[0] as string }))}
                  isLoading={loadingUsers}
                  isRequired
                >
                  {users.map((user) => (
                    <SelectItem key={user.name} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Assigné à (Responsable)"
                    selectedKeys={editForm.user_id ? [editForm.user_id.toString()] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, user_id: parseInt(Array.from(keys)[0] as string) }))}
                    isLoading={loadingUsers}
                    isRequired
                  >
                    {users.map((user) => (
                      <SelectItem key={user.id.toString()} value={user.id.toString()} textValue={`${user.name} (${user.email})`}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <Select
                    label="Projet"
                    selectedKeys={editForm.project_id ? [editForm.project_id.toString()] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, project_id: parseInt(Array.from(keys)[0] as string) }))}
                    isLoading={loadingProjects}
                    isRequired
                  >
                    {projects.map((project) => (
                      <SelectItem key={project.id.toString()} value={project.id.toString()} textValue={`${project.title} ${project.partner_name ? `(${project.partner_name})` : ''}`}>
                        {project.title} {project.partner_name ? `(${project.partner_name})` : ''}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Type"
                    placeholder="Ex: Incident, Demande, Problème..."
                    value={editForm.type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
                    isRequired
                  />

                  <Input
                    label="Catégorie"
                    placeholder="Ex: Technique, Fonctionnel..."
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as any }))}
                    isRequired
                  />

                  <Input
                    label="Domaine"
                    placeholder="Ex: Réseau, Application..."
                    value={editForm.domain}
                    onChange={(e) => setEditForm(prev => ({ ...prev, domain: e.target.value as any }))}
                    isRequired
                  />
                </div>

                <Input
                  label="Impact"
                  placeholder="Ex: Arrêt de service, Ralentissement..."
                  value={editForm.impact}
                  onChange={(e) => setEditForm(prev => ({ ...prev, impact: e.target.value as any }))}
                  isRequired
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Priorité"
                    selectedKeys={editForm.priority ? [editForm.priority] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, priority: Array.from(keys)[0] as any }))}
                    isRequired
                  >
                    <SelectItem key="P0" value="P0">P0 - Arrêt de service (immédiat)</SelectItem>
                    <SelectItem key="P1" value="P1">P1 - Haute (dégradation)</SelectItem>
                    <SelectItem key="P2" value="P2">P2 - Moyenne</SelectItem>
                    <SelectItem key="P3" value="P3">P3 - Faible</SelectItem>
                    <SelectItem key="P4" value="P4">P4 - Très faible</SelectItem>
                  </Select>
                  
                  <Select
                    label="Statut"
                    selectedKeys={editForm.status ? [editForm.status] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, status: Array.from(keys)[0] as any }))}
                    isRequired
                  >
                    <SelectItem key="nouveau" value="nouveau">Nouveau</SelectItem>
                    <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                    <SelectItem key="en_attente" value="en_attente">En attente</SelectItem>
                    <SelectItem key="en_arbitrage" value="en_arbitrage">En arbitrage</SelectItem>
                    <SelectItem key="en_pause" value="en_pause">En pause</SelectItem>
                    <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                  </Select>
                </div>
                
                <Textarea
                  label="Notes de résolution (optionnel)"
                  placeholder="Ajoutez des notes sur la résolution de l'incident..."
                  value={editForm.resolution_notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, resolution_notes: e.target.value }))}
                  minRows={2}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => setShowEditModal(false)}
                isDisabled={isUpdating}
              >
                Annuler
              </Button>
              <Button
                color="primary"
                onPress={handleUpdateIncident}
                isLoading={isUpdating}
              >
                {isUpdating ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal suppression incident */}
      {selectedIncident && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          size="md"
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-danger/10 p-2">
                  <XCircle className="h-5 w-5 text-danger" />
                </div>
                <h3 className="text-xl font-bold">Supprimer l'incident</h3>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-600 dark:text-gray-300">
                Êtes-vous sûr de vouloir supprimer l'incident <strong>"{selectedIncident.titre}"</strong> ?
              </p>
              <p className="text-sm text-danger">
                Cette action est irréversible.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => setShowDeleteModal(false)}
              >
                Annuler
              </Button>
              <Button
                color="danger"
                onPress={handleDeleteIncident}
                isLoading={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Modal d'export */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "z-[60]",
          backdrop: "z-[59]"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Exporter les incidents</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Format d'export */}
              <div>
                <label className="block text-sm font-medium mb-2">Format d'export</label>
                <Select
                  selectedKeys={[exportForm.format]}
                  onSelectionChange={(keys) => setExportForm(prev => ({ ...prev, format: Array.from(keys)[0] as any }))}
                  className="max-w-xs"
                >
                  <SelectItem key="pdf" value="pdf">PDF</SelectItem>
                  <SelectItem key="xlsx" value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem key="csv" value="csv">CSV</SelectItem>
                </Select>
              </div>

              {/* Période */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Date de début"
                  value={exportForm.date_from}
                  onChange={(e) => setExportForm(prev => ({ ...prev, date_from: e.target.value }))}
                />
                <Input
                  type="date"
                  label="Date de fin"
                  value={exportForm.date_to}
                  onChange={(e) => setExportForm(prev => ({ ...prev, date_to: e.target.value }))}
                />
              </div>

              {/* Filtres optionnels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Statut (optionnel)"
                  selectedKeys={exportForm.status ? [exportForm.status] : []}
                  onSelectionChange={(keys) => setExportForm(prev => ({ ...prev, status: Array.from(keys)[0] as string || '' }))}
                  placeholder="Tous les statuts"
                >
                  <SelectItem key="tous" value="">Tous</SelectItem>
                  <SelectItem key="nouveau" value="nouveau">Nouveau</SelectItem>
                  <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                  <SelectItem key="en_attente" value="en_attente">En attente</SelectItem>
                  <SelectItem key="en_arbitrage" value="en_arbitrage">En arbitrage</SelectItem>
                  <SelectItem key="en_pause" value="en_pause">En pause</SelectItem>
                  <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                </Select>

                <Select
                  label="Priorité (optionnel)"
                  selectedKeys={exportForm.priority ? [exportForm.priority] : []}
                  onSelectionChange={(keys) => setExportForm(prev => ({ ...prev, priority: Array.from(keys)[0] as string || '' }))}
                  placeholder="Toutes les priorités"
                >
                  <SelectItem key="tous" value="">Toutes</SelectItem>
                  <SelectItem key="P0" value="P0">P0 - Critique</SelectItem>
                  <SelectItem key="P1" value="P1">P1 - Haute</SelectItem>
                  <SelectItem key="P2" value="P2">P2 - Moyenne</SelectItem>
                  <SelectItem key="P3" value="P3">P3 - Faible</SelectItem>
                  <SelectItem key="P4" value="P4">P4 - Très faible</SelectItem>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Catégorie (optionnel)"
                  selectedKeys={exportForm.category ? [exportForm.category] : []}
                  onSelectionChange={(keys) => setExportForm(prev => ({ ...prev, category: Array.from(keys)[0] as string || '' }))}
                  placeholder="Toutes les catégories"
                >
                  <SelectItem key="tous" value="">Toutes</SelectItem>
                  <SelectItem key="technique" value="technique">Technique</SelectItem>
                  <SelectItem key="fonctionnel" value="fonctionnel">Fonctionnel</SelectItem>
                  <SelectItem key="securite" value="securite">Sécurité</SelectItem>
                  <SelectItem key="performance" value="performance">Performance</SelectItem>
                  <SelectItem key="autre" value="autre">Autre</SelectItem>
                </Select>

                <Select
                  label="Domaine (optionnel)"
                  selectedKeys={exportForm.domain ? [exportForm.domain] : []}
                  onSelectionChange={(keys) => setExportForm(prev => ({ ...prev, domain: Array.from(keys)[0] as string || '' }))}
                  placeholder="Tous les domaines"
                >
                  <SelectItem key="tous" value="">Tous</SelectItem>
                  <SelectItem key="reseau" value="reseau">Réseau</SelectItem>
                  <SelectItem key="application" value="application">Application</SelectItem>
                  <SelectItem key="infrastructure" value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem key="securite" value="securite">Sécurité</SelectItem>
                  <SelectItem key="donnees" value="donnees">Données</SelectItem>
                  <SelectItem key="autre" value="autre">Autre</SelectItem>
                </Select>
              </div>

              {/* Options d'export */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">Options d'export</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportForm.include_stats}
                      onChange={(e) => setExportForm(prev => ({ ...prev, include_stats: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Inclure les statistiques</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exportForm.include_details}
                      onChange={(e) => setExportForm(prev => ({ ...prev, include_details: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Inclure les détails complets</span>
                  </label>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setShowExportModal(false)}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              startContent={<Download className="h-4 w-4" />}
              onPress={handleExportIncidents}
              isLoading={isExporting}
            >
              {isExporting ? "Export en cours..." : "Exporter"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default GestionIncidents;