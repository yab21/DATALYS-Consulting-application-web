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
  User
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { dashboardService } from "@/services/dashboard";

// Types
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
  const { user, isAdmin, isPartner, hasPermission } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("tous");
  const [filterPriority, setFilterPriority] = useState<string>("tous");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
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
  const [typeFilter, setTypeFilter] = useState<string>("tous");

  // Chargement des données selon le rôle utilisateur
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        if (isPartner() && user?.partner_id) {
          // Partenaire : utiliser l'API dashboard incidents
          console.log("🔄 Chargement incidents via API dashboard pour partenaire:", user.partner_id);
          
          // Créer les filtres pour l'API
          const filters: any = {};
          if (statusFilter !== "tous") filters.status = statusFilter;
          if (priorityFilter !== "tous") filters.priority = priorityFilter;
          if (typeFilter !== "tous") filters.type = typeFilter;
          
          const params = dashboardService.createPaginationParams(
            currentPage,
            pageSize,
            filters
          );
          
          const response = await dashboardService.getPartnerIncidents(user.partner_id, params);
          
          if (response.success) {
            // Convertir les données de l'API vers le format Incident local
            const convertedIncidents: Incident[] = response.data.incidents.map(incident => ({
              id: incident.id.toString(),
              titre: incident.title,
              description: incident.description,
              priorite: incident.priority as any,
              statut: incident.status as any,
              projectId: "proj-" + incident.id, // Mock project ID
              projectNom: `Projet ${incident.id}`, // Mock project name
              partnerId: incident.partner_id.toString(),
              partnerNom: user.name || "Partenaire",
              dateCreation: new Date(incident.created_at),
              dateResolution: incident.status === "resolu" ? new Date(incident.updated_at) : undefined,
              assigneA: "Support Technique",
              commentaires: Math.floor(Math.random() * 10) + 1, // Mock comments
              tempsMoyenResolution: incident.status === "resolu" ? Math.random() * 48 : undefined,
            }));
            
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
                convertedIncidents.filter(i => i.tempsMoyenResolution).length || 0
            };
            
            setStats(newStats);
            console.log("✅ Incidents chargés via API dashboard:", convertedIncidents);
          } else {
            throw new Error(response.message || "Erreur API incidents");
          }
        } else {
          // Admin ou fallback : utiliser les données mockées
          console.log("🔄 Chargement incidents via données mockées");
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setIncidents(MOCK_INCIDENTS);
          setFilteredIncidents(MOCK_INCIDENTS);
          
          // Calcul des statistiques
          const newStats: IncidentStats = {
            total: MOCK_INCIDENTS.length,
            ouverts: MOCK_INCIDENTS.filter(i => i.statut === "ouvert").length,
            enCours: MOCK_INCIDENTS.filter(i => i.statut === "en_cours").length,
            resolus: MOCK_INCIDENTS.filter(i => i.statut === "resolu").length,
            critiques: MOCK_INCIDENTS.filter(i => i.priorite === "critique").length,
            tempsMoyenResolution: MOCK_INCIDENTS
              .filter(i => i.tempsMoyenResolution)
              .reduce((sum, i) => sum + (i.tempsMoyenResolution || 0), 0) / 
              MOCK_INCIDENTS.filter(i => i.tempsMoyenResolution).length || 0
          };
          
          setStats(newStats);
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des incidents:", error);
        
        // Fallback vers les données mockées en cas d'erreur
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
            MOCK_INCIDENTS.filter(i => i.tempsMoyenResolution).length || 0
        };
        
        setStats(newStats);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    isPartner, 
    user?.partner_id, 
    user?.name,
    currentPage,
    pageSize,
    statusFilter,
    priorityFilter,
    typeFilter
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

  const handleIncidentAction = (incident: Incident, action: string) => {
    setSelectedIncident(incident);
    
    switch (action) {
      case "view":
        setShowDetailModal(true);
        break;
      case "edit":
        setShowEditModal(true);
        break;
      case "assign":
        // Logique d'assignation
        console.log("Assigner incident:", incident.id);
        break;
      case "resolve":
        // Logique de résolution
        setIncidents(prev => prev.map(i => 
          i.id === incident.id 
            ? { ...i, statut: "resolu", dateResolution: new Date() }
            : i
        ));
        break;
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

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {filteredIncidents.length} incident(s) trouvé(s)
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
                        <User className="h-4 w-4 text-gray-400" />
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
                              ] : [])
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
    </div>
  );
};

export default GestionIncidents;