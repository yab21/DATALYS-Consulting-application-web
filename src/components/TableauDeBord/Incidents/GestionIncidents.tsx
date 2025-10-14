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
  User as UserIcon
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
  priorite: "faible" | "moyenne" | "haute" | "critique";
  statut: "ouvert" | "en_cours" | "resolu" | "ferme";
  projectId: string;
  projectNom: string;
  partnerId: string;
  partnerNom: string;
  partnerLogo?: string;
  dateCreation: Date;
  dateResolution?: Date;
  assigneA: string;
  commentaires: number;
  tempsMoyenResolution?: number;
}

// Fonction de conversion API vers interface locale
const convertApiIncidentToLocal = (apiIncident: ApiIncident): Incident => ({
  id: apiIncident.id.toString(),
  titre: apiIncident.title,
  description: apiIncident.description,
  priorite: (apiIncident.priority as any) || "moyenne",
  statut: (apiIncident.status as any) || "ouvert",
  projectId: "proj-" + apiIncident.id,
  projectNom: apiIncident.project_name || `Projet ${apiIncident.id}`,
  partnerId: "partner-" + apiIncident.id,
  partnerNom: apiIncident.user_name || "Utilisateur",
  partnerLogo: undefined,
  dateCreation: new Date(apiIncident.created_at),
  dateResolution: apiIncident.status === "resolved" ? new Date(apiIncident.updated_at) : undefined,
  assigneA: "Support Technique",
  commentaires: Math.floor(Math.random() * 10) + 1,
  tempsMoyenResolution: apiIncident.status === "resolved" ? Math.random() * 48 : undefined,
});

interface IncidentStats {
  total: number;
  ouverts: number;
  enCours: number;
  resolus: number;
  critiques: number;
  tempsMoyenResolution: number;
}

// Données mockées étendues
const MOCK_INCIDENTS: Incident[] = [
  {
    id: "inc-1",
    titre: "Problème de connectivité VPN",
    description: "Les utilisateurs n'arrivent pas à se connecter au VPN depuis ce matin. Erreur de timeout lors de l'authentification.",
    priorite: "haute",
    statut: "en_cours",
    projectId: "proj-1",
    projectNom: "Migration Cloud AWS",
    partnerId: "partner-1",
    partnerNom: "TechCorp Solutions",
    partnerLogo: "/images/partners/techcorp.svg",
    dateCreation: new Date("2024-01-20T08:30:00"),
    assigneA: "Support Technique",
    commentaires: 5,
    tempsMoyenResolution: 4.5,
  },
  {
    id: "inc-2",
    titre: "Lenteur application web",
    description: "L'application web présente des lenteurs importantes, particulièrement lors du chargement des données",
    priorite: "moyenne",
    statut: "ouvert",
    projectId: "proj-3",
    projectNom: "Application Mobile",
    partnerId: "partner-2",
    partnerNom: "InnovTech Corp",
    dateCreation: new Date("2024-01-18T14:20:00"),
    assigneA: "Équipe DevOps",
    commentaires: 2,
  },
  {
    id: "inc-3",
    titre: "Erreur de synchronisation",
    description: "Problème de synchronisation des données entre les serveurs de production et de backup",
    priorite: "critique",
    statut: "resolu",
    projectId: "proj-1",
    projectNom: "Migration Cloud AWS",
    partnerId: "partner-1",
    partnerNom: "TechCorp Solutions",
    dateCreation: new Date("2024-01-15T09:15:00"),
    dateResolution: new Date("2024-01-16T11:30:00"),
    assigneA: "Admin Système",
    commentaires: 8,
    tempsMoyenResolution: 26.25,
  },
  {
    id: "inc-4",
    titre: "Problème d'authentification SSO",
    description: "Les utilisateurs ne peuvent pas se connecter via SSO, redirection en boucle",
    priorite: "critique",
    statut: "ouvert",
    projectId: "proj-4",
    projectNom: "Sécurisation Réseau",
    partnerId: "partner-3",
    partnerNom: "SecureNet Ltd",
    dateCreation: new Date("2024-01-19T16:45:00"),
    assigneA: "Équipe Sécurité",
    commentaires: 1,
  },
  {
    id: "inc-5",
    titre: "Backup automatique en échec",
    description: "Les sauvegardes automatiques nocturnes échouent depuis 3 jours",
    priorite: "haute",
    statut: "en_cours",
    projectId: "proj-2",
    projectNom: "Infrastructure Cloud",
    partnerId: "partner-2",
    partnerNom: "InnovTech Corp",
    dateCreation: new Date("2024-01-17T07:00:00"),
    assigneA: "Admin Système",
    commentaires: 4,
  },
  {
    id: "inc-6",
    titre: "Certificat SSL expiré",
    description: "Le certificat SSL du domaine principal a expiré, site inaccessible",
    priorite: "critique",
    statut: "resolu",
    projectId: "proj-5",
    projectNom: "Site Web Corporate",
    partnerId: "partner-4",
    partnerNom: "WebCorp Agency",
    dateCreation: new Date("2024-01-16T10:20:00"),
    dateResolution: new Date("2024-01-16T12:45:00"),
    assigneA: "Équipe DevOps",
    commentaires: 3,
    tempsMoyenResolution: 2.42,
  },
];

const GestionIncidents: React.FC = () => {
  const { hasPermission } = useAuth();
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
  
  // États de loading pour les boutons
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États pour les formulaires
  const [createForm, setCreateForm] = useState<CreateIncidentData>({
    title: "",
    description: "",
    user_name: "",
    project_name: "",
    is_active: true,
    priority: "moyenne",
    status: "ouvert"
  });
  
  const [editForm, setEditForm] = useState<UpdateIncidentData>({
    id: 0,
    title: "",
    description: "",
    user_name: "",
    project_name: "",
    is_active: true,
    priority: "moyenne",
    status: "ouvert"
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
    ouverts: 0,
    enCours: 0,
    resolus: 0,
    critiques: 0,
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
            ...(statusFilter !== "tous" && { status: statusFilter }),
            ...(priorityFilter !== "tous" && { priority: priorityFilter }),
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
          ouverts: convertedIncidents.filter(i => i.statut === "ouvert").length,
          enCours: convertedIncidents.filter(i => i.statut === "en_cours").length,
          resolus: convertedIncidents.filter(i => i.statut === "resolu").length,
          critiques: convertedIncidents.filter(i => i.priorite === "critique").length,
          tempsMoyenResolution: convertedIncidents
            .filter(i => i.tempsMoyenResolution)
            .reduce((sum, i) => sum + (i.tempsMoyenResolution || 0), 0) / 
            (convertedIncidents.filter(i => i.tempsMoyenResolution).length || 1)
        };
        
        setStats(newStats);
        console.log("✅ Incidents chargés via API incidents:", convertedIncidents);
        
      } catch (error) {
        console.error("❌ Erreur lors du chargement des incidents:", error);
        
        // Fallback vers les données mockées en cas d'erreur
        console.log("🔄 Fallback vers les données mockées");
        setIncidents(MOCK_INCIDENTS);
        setFilteredIncidents(MOCK_INCIDENTS);
        
        const newStats: IncidentStats = {
          total: MOCK_INCIDENTS.length,
          ouverts: MOCK_INCIDENTS.filter(i => i.statut === "ouvert").length,
          enCours: MOCK_INCIDENTS.filter(i => i.statut === "en_cours").length,
          resolus: MOCK_INCIDENTS.filter(i => i.statut === "resolu").length,
          critiques: MOCK_INCIDENTS.filter(i => i.priorite === "critique").length,
          tempsMoyenResolution: MOCK_INCIDENTS
            .filter(i => i.tempsMoyenResolution)
            .reduce((sum, i) => sum + (i.tempsMoyenResolution || 0), 0) / 
            (MOCK_INCIDENTS.filter(i => i.tempsMoyenResolution).length || 1)
        };
        
        setStats(newStats);
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
      case "ouvert": return "danger";
      case "en_cours": return "warning";
      case "resolu": return "success";
      case "ferme": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critique": return "danger";
      case "haute": return "warning";
      case "moyenne": return "primary";
      case "faible": return "success";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ouvert": return <XCircle className="h-4 w-4" />;
      case "en_cours": return <Clock className="h-4 w-4" />;
      case "resolu": return <CheckCircle className="h-4 w-4" />;
      case "ferme": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critique": return "🔴";
      case "haute": return "🟠";
      case "moyenne": return "🟡";
      case "faible": return "🟢";
      default: return "⚪";
    }
  };

  const handleIncidentAction = async (incident: Incident, action: string) => {
    setSelectedIncident(incident);
    
    switch (action) {
      case "view":
        setShowDetailModal(true);
        break;
      case "edit":
        // Pré-remplir le formulaire d'édition
        console.log("🔧 Pré-remplissage du formulaire d'édition:", incident);
        
        // Les vrais noms d'utilisateur et projet à utiliser
        // (ils viennent de la fonction de conversion qui utilise les données de l'API)
        const originalUserName = incident.partnerNom; // "Utilisateur" (générique)
        const originalProjectName = incident.projectNom; // "Projet 92" (générique)
        
        // Vérifier si ces noms existent dans nos listes
        const userExists = users.find(u => u.name === originalUserName);
        const projectExists = projects.find(p => p.title === originalProjectName);
        
        // Si pas trouvés, utiliser le premier disponible ou garder une valeur par défaut
        const validUserName = userExists ? userExists.name : (users.length > 0 ? users[0].name : "");
        const validProjectName = projectExists ? projectExists.title : (projects.length > 0 ? projects[0].title : "");
        
        const editData = {
          id: parseInt(incident.id),
          title: incident.titre,
          description: incident.description,
          user_name: validUserName,
          project_name: validProjectName,
          is_active: true,
          priority: incident.priorite,
          status: incident.statut === "en_cours" ? "en_cours" : incident.statut
        };
        
        console.log("📝 Données du formulaire d'édition:", editData);
        console.log("👤 Utilisateur original:", incident.partnerNom, "-> Utilisateur valide:", validUserName, "(existe:", !!userExists, ")");
        console.log("📋 Projet original:", incident.projectNom, "-> Projet valide:", validProjectName, "(existe:", !!projectExists, ")");
        console.log("📊 Utilisateurs disponibles:", users.map(u => u.name));
        console.log("📊 Projets disponibles:", projects.map(p => p.title));
        
        setEditForm(editData);
        setShowEditModal(true);
        break;
      case "delete":
        setShowDeleteModal(true);
        break;
      case "assign":
        // Logique d'assignation
        console.log("Assigner incident:", incident.id);
        break;
      case "resolve":
        try {
          // Appeler l'API pour marquer comme résolu
          await IncidentsService.updateIncident({
            id: parseInt(incident.id),
            status: "resolved",
            is_active: true
          });
          
          // Mettre à jour l'état local
          setIncidents(prev => prev.map(i => 
            i.id === incident.id 
              ? { ...i, statut: "resolu", dateResolution: new Date() }
              : i
          ));
          
          console.log("✅ Incident marqué comme résolu:", incident.id);
        } catch (error) {
          console.error("❌ Erreur lors de la résolution de l'incident:", error);
        }
        break;
    }
  };

  // Fonction pour créer un incident
  const handleCreateIncident = async () => {
    if (isCreating) return; // Prévenir les double-clics
    
    setIsCreating(true);
    try {
      console.log("🔄 Création d'un nouvel incident:", createForm);
      console.log("👤 Utilisateur sélectionné:", createForm.user_name);
      console.log("📋 Projet sélectionné:", createForm.project_name);
      
      await IncidentsService.createIncident(createForm);
      
      // Recharger les données
      const criteria: IncidentCriteria = {
        index: currentPage,
        size: pageSize,
        data: { is_active: true }
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
        user_name: "",
        project_name: "",
        is_active: true,
        priority: "moyenne",
        status: "ouvert"
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
      
      await IncidentsService.updateIncident(editForm);
      
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
                    Ouverts
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.ouverts}
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
                    Résolus
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.resolus}
                  </p>
                </div>
                <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
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
                    Critiques
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.critiques}
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
          transition={{ delay: 0.6 }}
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
                  <SelectItem key="ouvert" value="ouvert">Ouvert</SelectItem>
                  <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                  <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                  <SelectItem key="ferme" value="ferme">Fermé</SelectItem>
                </Select>

                <Select
                  placeholder="Priorité"
                  selectedKeys={filterPriority ? [filterPriority] : []}
                  onSelectionChange={(keys) => setFilterPriority(Array.from(keys)[0] as string)}
                  className="max-w-[150px]"
                  startContent={<AlertTriangle className="h-4 w-4" />}
                >
                  <SelectItem key="tous" value="tous">Toutes</SelectItem>
                  <SelectItem key="critique" value="critique">Critique</SelectItem>
                  <SelectItem key="haute" value="haute">Haute</SelectItem>
                  <SelectItem key="moyenne" value="moyenne">Moyenne</SelectItem>
                  <SelectItem key="faible" value="faible">Faible</SelectItem>
                </Select>
              </div>

              <div className="flex items-center gap-4">
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
                <TableColumn>PARTENAIRE</TableColumn>
                <TableColumn>PROJET</TableColumn>
                <TableColumn>PRIORITÉ</TableColumn>
                <TableColumn>STATUT</TableColumn>
                <TableColumn>ASSIGNÉ À</TableColumn>
                <TableColumn>CRÉÉ</TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Aucun incident trouvé">
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {incident.titre}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {incident.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="sm"
                          src={incident.partnerLogo}
                          name={incident.partnerNom.charAt(0)}
                          className="bg-primary-100 text-primary-600"
                        />
                        <span className="font-medium">{incident.partnerNom}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{incident.projectNom}</span>
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
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{incident.assigneA}</span>
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
                              Voir détails
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
                                key="assign"
                                startContent={<UserCheck className="h-4 w-4" />}
                                onPress={() => handleIncidentAction(incident, "assign")}
                              >
                                Réassigner
                              </DropdownItem>,
                              ...(incident.statut !== "resolu" ? [
                                <DropdownItem
                                  key="resolve"
                                  startContent={<CheckCircle className="h-4 w-4" />}
                                  onPress={() => handleIncidentAction(incident, "resolve")}
                                  className="text-success"
                                >
                                  Marquer comme résolu
                                </DropdownItem>
                              ] : []),
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
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({
            title: "",
            description: "",
            user_name: "",
            project_name: "",
            is_active: true,
            priority: "moyenne",
            status: "ouvert"
          });
        }}
        size="2xl"
        scrollBehavior="inside"
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
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Utilisateur"
                  placeholder="Sélectionnez un utilisateur"
                  selectedKeys={createForm.user_name ? [createForm.user_name] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, user_name: Array.from(keys)[0] as string }))}
                  isLoading={loadingUsers}
                  isRequired
                >
                  {users.map((user) => (
                    <SelectItem key={user.name} value={user.name} textValue={`${user.name} (${user.email})`}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </Select>
                
                <Select
                  label="Projet"
                  placeholder="Sélectionnez un projet"
                  selectedKeys={createForm.project_name ? [createForm.project_name] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, project_name: Array.from(keys)[0] as string }))}
                  isLoading={loadingProjects}
                  isRequired
                >
                  {projects.map((project) => (
                    <SelectItem key={project.title} value={project.title} textValue={`${project.title} ${project.partner_name ? `(${project.partner_name})` : ''}`}>
                      {project.title} {project.partner_name ? `(${project.partner_name})` : ''}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Priorité"
                  selectedKeys={createForm.priority ? [createForm.priority] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, priority: Array.from(keys)[0] as string }))}
                >
                  <SelectItem key="faible" value="faible">Faible</SelectItem>
                  <SelectItem key="moyenne" value="moyenne">Moyenne</SelectItem>
                  <SelectItem key="haute" value="haute">Haute</SelectItem>
                  <SelectItem key="critique" value="critique">Critique</SelectItem>
                </Select>
                
                <Select
                  label="Statut"
                  selectedKeys={createForm.status ? [createForm.status] : []}
                  onSelectionChange={(keys) => setCreateForm(prev => ({ ...prev, status: Array.from(keys)[0] as string }))}
                >
                  <SelectItem key="ouvert" value="ouvert">Ouvert</SelectItem>
                  <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                  <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                  <SelectItem key="ferme" value="ferme">Fermé</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setShowCreateModal(false)}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateIncident}
              isDisabled={!createForm.title || !createForm.description || !createForm.user_name || !createForm.project_name}
            >
              Créer l'incident
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal édition incident */}
      {selectedIncident && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          size="2xl"
          scrollBehavior="inside"
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
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Utilisateur"
                    selectedKeys={editForm.user_name ? [editForm.user_name] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, user_name: Array.from(keys)[0] as string }))}
                    isLoading={loadingUsers}
                    isRequired
                  >
                    {users.map((user) => (
                      <SelectItem key={user.name} value={user.name} textValue={`${user.name} (${user.email})`}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <Select
                    label="Projet"
                    selectedKeys={editForm.project_name ? [editForm.project_name] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, project_name: Array.from(keys)[0] as string }))}
                    isLoading={loadingProjects}
                    isRequired
                  >
                    {projects.map((project) => (
                      <SelectItem key={project.title} value={project.title} textValue={`${project.title} ${project.partner_name ? `(${project.partner_name})` : ''}`}>
                        {project.title} {project.partner_name ? `(${project.partner_name})` : ''}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Priorité"
                    selectedKeys={editForm.priority ? [editForm.priority] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, priority: Array.from(keys)[0] as string }))}
                  >
                    <SelectItem key="faible" value="faible">Faible</SelectItem>
                    <SelectItem key="moyenne" value="moyenne">Moyenne</SelectItem>
                    <SelectItem key="haute" value="haute">Haute</SelectItem>
                    <SelectItem key="critique" value="critique">Critique</SelectItem>
                  </Select>
                  
                  <Select
                    label="Statut"
                    selectedKeys={editForm.status ? [editForm.status] : []}
                    onSelectionChange={(keys) => setEditForm(prev => ({ ...prev, status: Array.from(keys)[0] as string }))}
                  >
                    <SelectItem key="ouvert" value="ouvert">Ouvert</SelectItem>
                    <SelectItem key="en_cours" value="en_cours">En cours</SelectItem>
                    <SelectItem key="resolu" value="resolu">Résolu</SelectItem>
                    <SelectItem key="ferme" value="ferme">Fermé</SelectItem>
                  </Select>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => setShowEditModal(false)}
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
    </div>
  );
};

export default GestionIncidents;