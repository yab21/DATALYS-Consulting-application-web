"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Tab, Tabs, Spinner, Chip, Button, Avatar, Textarea } from '@heroui/react';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  Clock,
  Eye,
  FileText,
  User as UserIcon,
  Building2,
  CheckCircle,
  XCircle,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
  Dot,
  Mail,
  Edit3,
  Plus,
  Trash2,
  Paperclip,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { IncidentsService, Incident, type IncidentHistoryEntry, type IncidentNote } from '@/services/incidents';
import { incidentFilesService } from '@/services/incident-files';
import { projectsService, Project } from '@/services/projects';
import { UsersService, User } from '@/services/users';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';
import { useAuth } from '@/context/AuthContext';
import { useSimpleNotifications, simpleNotificationHelpers } from '@/components/UI/Notifications/SimpleNotificationSystem';
import LoadingState from "@/components/UI/Loading/LoadingState";
import IncidentFiles from "../../Incidents/Voir/IncidentFiles";
import { AnimatePresence, motion } from 'framer-motion';

interface VoirIncidentProps {
  id: string;
}

const VoirIncident: React.FC<VoirIncidentProps> = ({ id }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [history, setHistory] = useState<IncidentHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [notes, setNotes] = useState<IncidentNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteFiles, setNoteFiles] = useState<File[]>([]);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const incidentId = parseInt(id);

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedCard && cardRefs.current[expandedCard]) {
        if (!cardRefs.current[expandedCard]!.contains(event.target as Node)) {
          setExpandedCard(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedCard]);

  useEffect(() => { loadIncidentData(); }, [id]);

  const loadIncidentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const incidentData = await IncidentsService.getIncidentById(incidentId);
      if (!incidentData) { setError('Incident non trouvé'); return; }
      setIncident(incidentData);

      // Chargement eager du projet, de l'utilisateur assigné et de l'historique
      if (incidentData.project_id) {
        loadProjectData(incidentData);
      }
      if (incidentData.user_id) {
        loadAssignedUser(incidentData);
      }
      loadHistory();
      loadNotes();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setError(extractBackendMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (inc?: Incident) => {
    const current = inc || incident;
    if (!current || !current.project_id) return;
    try {
      setLoadingProject(true);
      const allProjects = await projectsService.getActiveProjects();
      const foundProject = allProjects.find(p => p.id === current.project_id);
      setProject(foundProject || null);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
    } finally {
      setLoadingProject(false);
    }
  };

  const loadAssignedUser = async (inc?: Incident) => {
    const current = inc || incident;
    if (!current || !current.user_id) return;
    try {
      setLoadingUser(true);
      const userData = await UsersService.getUserById(current.user_id);
      setAssignedUser(userData);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
    } finally {
      setLoadingUser(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response: any = await IncidentsService.getIncidentHistory(incidentId);

      // Gérer les différents formats de réponse possibles
      if (response && response.history && Array.isArray(response.history)) {
        setHistory(response.history);
      } else if (response && response.data && Array.isArray(response.data)) {
        setHistory(response.data);
      } else if (response && response.items && Array.isArray(response.items)) {
        setHistory(response.items);
      } else if (Array.isArray(response)) {
        setHistory(response);
      } else {
        setHistory([]);
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadNotes = async () => {
    try {
      setLoadingNotes(true);
      const data = await IncidentsService.getNotes(incidentId);
      setNotes(data);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!user || !newNoteContent.trim()) return;
    try {
      setSubmittingNote(true);
      const result = await IncidentsService.addNote(incidentId, newNoteContent.trim(), user.id, noteFiles);
      setNewNoteContent('');
      setNoteFiles([]);
      await loadNotes();
      const msg = result?.message || extractBackendMessage(result) || 'Note ajoutée';
      showNotification(simpleNotificationHelpers.success('Succès', msg));
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      const msg = extractBackendMessage(error) || "Impossible d'ajouter la note";
      showNotification(simpleNotificationHelpers.error('Erreur', msg));
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      setDeletingNoteId(noteId);
      const result = await IncidentsService.deleteNote(incidentId, noteId, user!.id, user!.email);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      const msg = result?.message || extractBackendMessage(result) || 'Note supprimée';
      showNotification(simpleNotificationHelpers.success('Succès', msg));
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      const msg = extractBackendMessage(error) || 'Impossible de supprimer la note';
      showNotification(simpleNotificationHelpers.error('Erreur', msg));
    } finally {
      setDeletingNoteId(null);
    }
  };

  const getHistoryActionConfig = (actionType: string, newStatus: string) => {
    switch (actionType) {
      case 'status_change':
        return { icon: <Activity className="h-4 w-4 text-primary" />, bgColor: 'bg-primary/10', chipColor: 'primary' as const, label: 'Changement de statut' };
      case 'waiting':
        return { icon: <Clock className="h-4 w-4 text-warning" />, bgColor: 'bg-warning/10', chipColor: 'warning' as const, label: 'Mise en attente' };
      case 'resolution':
        return { icon: <CheckCircle className="h-4 w-4 text-success" />, bgColor: 'bg-success/10', chipColor: 'success' as const, label: 'Résolution' };
      default:
        if (newStatus === 'resolu') return { icon: <CheckCircle className="h-4 w-4 text-success" />, bgColor: 'bg-success/10', chipColor: 'success' as const, label: 'Résolution' };
        if (newStatus === 'en_attente') return { icon: <Clock className="h-4 w-4 text-warning" />, bgColor: 'bg-warning/10', chipColor: 'warning' as const, label: 'Mise en attente' };
        return { icon: <Edit3 className="h-4 w-4 text-gray-500" />, bgColor: 'bg-gray-100 dark:bg-gray-700', chipColor: 'default' as const, label: actionType || 'Action' };
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatDateShort = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'nouveau': return 'Nouveau';
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      case 'en_arbitrage': return 'En arbitrage';
      case 'en_pause': return 'En pause';
      case 'resolu': return 'Résolu';
      default: return status;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'nouveau': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'en_cours': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
      case 'en_attente': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      case 'en_arbitrage': return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'en_pause': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      case 'resolu': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'nouveau': return 'bg-blue-500';
      case 'en_cours': return 'bg-amber-500';
      case 'en_attente': return 'bg-gray-400';
      case 'en_arbitrage': return 'bg-red-500';
      case 'en_pause': return 'bg-gray-400';
      case 'resolu': return 'bg-emerald-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusColor = (status: string): "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (status) {
      case 'nouveau': return 'primary';
      case 'en_cours': return 'warning';
      case 'en_attente': return 'secondary';
      case 'en_arbitrage': return 'danger';
      case 'en_pause': return 'secondary';
      case 'resolu': return 'success';
      default: return 'secondary';
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'P0': return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'P1': return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'P2': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'P3': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'P4': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string): "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (priority) {
      case 'P0': return 'danger';
      case 'P1': return 'warning';
      case 'P2': return 'primary';
      case 'P3': return 'success';
      case 'P4': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSLAStatusLabel = (status: string) => {
    switch (status) {
      case 'respecte': return 'Respecté';
      case 'en_retard': return 'En retard';
      case 'non_applicable': return 'N/A';
      default: return status;
    }
  };

  const getSLAStatusColor = (status: string): "success" | "danger" | "secondary" => {
    switch (status) {
      case 'respecte': return 'success';
      case 'en_retard': return 'danger';
      default: return 'secondary';
    }
  };

  // Dropdown
  const handleCardClick = (label: string) => setExpandedCard(prev => prev === label ? null : label);

  const renderDropdownContent = (label: string) => {
    if (!incident) return null;
    switch (label) {
      case "Priorité":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Niveau</span>
              <Chip color={getPriorityColor(incident.priority)} variant="flat" size="sm">{incident.priority}</Chip>
            </div>
            {incident.priority_label && (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Label</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{incident.priority_label}</span>
              </div>
            )}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Impact</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{incident.impact_label || incident.impact || 'N/A'}</span>
            </div>
          </>
        );
      case "SLA Prise en charge":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
              <Chip color={getSLAStatusColor(incident.sla_prise_en_charge_status)} variant="flat" size="sm">
                {getSLAStatusLabel(incident.sla_prise_en_charge_status)}
              </Chip>
            </div>
            {assignedUser && (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Assigné à</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{assignedUser.name}</span>
              </div>
            )}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Créé le</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{formatDateShort(incident.created_at)}</span>
            </div>
          </>
        );
      case "SLA Résolution":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
              <Chip color={getSLAStatusColor(incident.sla_resolution_status)} variant="flat" size="sm">
                {getSLAStatusLabel(incident.sla_resolution_status)}
              </Chip>
            </div>
            {incident.status === 'resolu' && (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Résolu</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Oui</span>
              </div>
            )}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Dernière MAJ</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{formatDateShort(incident.updated_at)}</span>
            </div>
          </>
        );
      case "Refus":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Nombre de refus</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{incident.refusal_count || 0}</span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Statut actuel</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(incident.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(incident.status)}`} />
                {getStatusLabel(incident.status)}
              </span>
            </div>
          </>
        );
      default: return null;
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Chargement de l'incident..." />
        <LoadingState type="skeleton" skeletonVariant="profile" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumb pageName="Erreur" />
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erreur</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onPress={loadIncidentData} color="primary" variant="flat" size="sm">Réessayer</Button>
            <Button onPress={() => router.back()} variant="bordered" size="sm">Retour</Button>
          </div>
        </div>
      </>
    );
  }

  if (!incident) {
    return (
      <>
        <Breadcrumb pageName="Incident introuvable" />
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Incident introuvable</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">L&apos;incident demandé n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
          <Button onPress={() => router.back()} variant="flat" className="mt-6" size="sm">Retour</Button>
        </div>
      </>
    );
  }

  const statCards = [
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Priorité",
      value: incident.priority,
      iconBg: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      borderActive: "border-red-300 dark:border-red-700"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "SLA Prise en charge",
      value: getSLAStatusLabel(incident.sla_prise_en_charge_status),
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderActive: "border-blue-300 dark:border-blue-700"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "SLA Résolution",
      value: getSLAStatusLabel(incident.sla_resolution_status),
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderActive: "border-emerald-300 dark:border-emerald-700"
    },
    {
      icon: <XCircle className="w-5 h-5" />,
      label: "Refus",
      value: incident.refusal_count || 0,
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderActive: "border-orange-300 dark:border-orange-700"
    }
  ];

  return (
    <>
      <Breadcrumb pageName={`Incident: ${incident.incident_number}`} />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton retour */}
        <Button
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push('/tableaudebord/incidents')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white -ml-2"
        >
          Retour aux incidents
        </Button>

        {/* Header incident */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {incident.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    #{incident.incident_number}
                  </span>
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    {incident.declarant_name}
                  </span>
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateShort(incident.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(incident.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(incident.status)}`} />
                {getStatusLabel(incident.status)}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getPriorityStyles(incident.priority)}`}>
                <AlertTriangle className="w-3 h-3" />
                {incident.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Stat cards avec dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const isExpanded = expandedCard === stat.label;
            return (
              <div
                key={stat.label}
                ref={(el) => { cardRefs.current[stat.label] = el; }}
                className="relative"
              >
                <div
                  onClick={() => handleCardClick(stat.label)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border p-5 cursor-pointer transition-all duration-200 select-none ${
                    isExpanded
                      ? `${stat.borderActive} shadow-md`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <span className={stat.iconColor}>{stat.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                        {stat.value}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{stat.label}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      }
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-30"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                          {renderDropdownContent(stat.label)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Onglets */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
            size="md"
            classNames={{
              tabList: "bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pt-2 gap-2",
              tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:border data-[selected=true]:border-gray-200 dark:data-[selected=true]:border-gray-600 data-[selected=true]:border-b-0 rounded-t-lg px-4 py-2.5 transition-colors",
              tabContent: "text-gray-500 dark:text-gray-400 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-medium text-sm"
            }}
          >
            {/* Vue d'ensemble */}
            <Tab
              key="overview"
              title={<div className="flex items-center gap-2"><Eye className="w-4 h-4" /><span>Vue d&apos;ensemble</span></div>}
            >
              <div className="p-6 sm:p-8">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-[#4ba9b7]" />
                      Détails de l&apos;incident
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Numéro</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">#{incident.incident_number}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Type</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{incident.type}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Catégorie</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{incident.category}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Déclaré par</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{incident.declarant_name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Priorité</dt>
                        <dd>
                          <Chip color={getPriorityColor(incident.priority)} variant="flat" size="sm" startContent={<AlertTriangle className="w-3 h-3" />}>
                            {incident.priority}{incident.priority_label ? ` - ${incident.priority_label}` : ''}
                          </Chip>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Impact</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{incident.impact_label || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Domaine</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{incident.domain || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Dernière mise à jour</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(incident.updated_at)}</dd>
                      </div>
                    </div>
                  </div>
                </div>

                {incident.description && (
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#4ba9b7]" />
                        Description
                      </h2>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{incident.description}</p>
                    </div>
                  </div>
                )}

              </div>
            </Tab>

            {/* Notes de résolution */}
            <Tab
              key="notes"
              title={<div className="flex items-center gap-2"><Edit3 className="w-4 h-4" /><span>Notes de résolution</span></div>}
            >
              <div className="p-6 sm:p-8 space-y-4">
                {/* Formulaire d'ajout — en haut */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3">
                  <Textarea
                    placeholder="Ajouter une note de résolution..."
                    value={newNoteContent}
                    onValueChange={setNewNoteContent}
                    minRows={3}
                    maxRows={8}
                    className="w-full"
                    classNames={{ input: 'text-sm' }}
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                      <Paperclip className="w-4 h-4" />
                      <span>Joindre des fichiers</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            setNoteFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    <Button
                      color="primary"
                      size="sm"
                      startContent={<Plus className="h-4 w-4" />}
                      onPress={handleAddNote}
                      isLoading={submittingNote}
                      isDisabled={!newNoteContent.trim()}
                    >
                      {submittingNote ? 'Ajout...' : 'Ajouter la note'}
                    </Button>
                  </div>
                  {noteFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {noteFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300">
                          <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setNoteFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Liste des notes — plus récente en premier */}
                {loadingNotes ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="sm" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Edit3 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Aucune note pour cet incident</p>
                  </div>
                ) : (
                  [...notes].reverse().map((note) => (
                    <div key={note.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" name={note.author_name} className="bg-primary text-white flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{note.author_name}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{formatDate(note.created_at)}</span>
                        {note.attachments && note.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <Paperclip className="w-3 h-3" />
                            {note.attachments.length}
                          </span>
                        )}
                        {user?.role_id === 1 && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            isLoading={deletingNoteId === note.id}
                            onPress={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-9">{note.content}</p>
                      {note.attachments && note.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pl-9 pt-1">
                          {note.attachments.map((att) => (
                            <button
                              key={att.id}
                              type="button"
                              onClick={() => incidentFilesService.viewIncidentFile(att.file_url, att.file_name)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[200px]">{att.file_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Tab>

            {/* Suivi & SLA */}
            <Tab
              key="tracking"
              title={<div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>Suivi & SLA</span></div>}
            >
              <div className="p-6 sm:p-8 space-y-6">
                {/* SLA Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        SLA Prise en charge
                      </h3>
                    </div>
                    <div className="p-6">
                      <Chip color={getSLAStatusColor(incident.sla_prise_en_charge_status)} variant="flat" size="lg">
                        {getSLAStatusLabel(incident.sla_prise_en_charge_status)}
                      </Chip>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        SLA Résolution
                      </h3>
                    </div>
                    <div className="p-6">
                      <Chip color={getSLAStatusColor(incident.sla_resolution_status)} variant="flat" size="lg">
                        {getSLAStatusLabel(incident.sla_resolution_status)}
                      </Chip>
                    </div>
                  </div>
                </div>

                {/* Assigné à */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-purple-500" />
                      Utilisateur assigné
                    </h3>
                  </div>
                  <div className="p-6">
                    {loadingUser ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" />
                        <span className="text-sm text-gray-500">Chargement...</span>
                      </div>
                    ) : assignedUser ? (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 dark:text-purple-400 font-bold text-sm uppercase">
                            {assignedUser.name.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{assignedUser.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {assignedUser.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expert #{incident.user_id}</p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#4ba9b7]" />
                      Timeline
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">Créé le</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(incident.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">Dernière MAJ</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(incident.updated_at)}</span>
                    </div>
                    {incident.status === 'resolu' && (
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">Résolu</span>
                        <Chip color="success" variant="flat" size="sm">Résolu</Chip>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Tab>

            {/* Fichiers */}
            <Tab
              key="files"
              title={<div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>Fichiers</span></div>}
            >
              <div className="p-6">
                <IncidentFiles incidentId={incident.id} />
              </div>
            </Tab>

            {/* Projet associé */}
            {incident.project_id && (
              <Tab
                key="project"
                title={<div className="flex items-center gap-2"><Building2 className="w-4 h-4" /><span>Projet associé</span></div>}
              >
                <div className="p-6 sm:p-8">
                  {loadingProject ? (
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                  ) : project ? (
                    <div
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all cursor-pointer group"
                      onClick={() => router.push(`/tableaudebord/projet/pageprojet/${project.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-[#4ba9b7]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-[#4ba9b7] transition-colors">
                              {project.title}
                            </h4>
                            <Chip color={project.is_active ? "success" : "warning"} variant="flat" size="sm" className="flex-shrink-0">
                              {project.is_active ? "Actif" : "Inactif"}
                            </Chip>
                          </div>
                          {project.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-400 dark:text-gray-500">
                            {project.partner_name && (
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-3 h-3" />
                                {project.partner_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" />
                              {formatDateShort(project.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Building2 className="w-7 h-7 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Projet introuvable</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Le projet associé n&apos;a pas pu être chargé</p>
                    </div>
                  )}
                </div>
              </Tab>
            )}

            {/* Historique */}
            <Tab
              key="history"
              title={<div className="flex items-center gap-2"><Activity className="w-4 h-4" /><span>Historique</span></div>}
            >
              <div className="p-6 sm:p-8">
                {loadingHistory ? (
                  <div className="flex justify-center py-12">
                    <Spinner size="md" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun historique disponible</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Ligne verticale de la timeline */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                    <div className="space-y-6">
                      {history.map((entry) => {
                        const actionConfig = getHistoryActionConfig(entry.action_type, entry.new_status);
                        return (
                          <div key={entry.id} className="relative flex gap-4 pl-2">
                            {/* Point sur la timeline */}
                            <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${actionConfig.bgColor}`}>
                              {actionConfig.icon}
                            </div>

                            {/* Contenu */}
                            <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {entry.user_name}
                                  </span>
                                  <Chip size="sm" variant="flat" color={actionConfig.chipColor}>
                                    {actionConfig.label}
                                  </Chip>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(entry.created_at)}
                                </span>
                              </div>

                              {/* Transition de statut */}
                              {entry.old_status && (
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                  <Chip size="sm" variant="bordered" className="text-gray-500">
                                    {getStatusLabel(entry.old_status)}
                                  </Chip>
                                  <span className="text-gray-400">&rarr;</span>
                                  <Chip size="sm" variant="flat" color={getStatusColor(entry.new_status)}>
                                    {getStatusLabel(entry.new_status)}
                                  </Chip>
                                </div>
                              )}

                              {/* Commentaire */}
                              {entry.comment && (
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  {entry.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default VoirIncident;
