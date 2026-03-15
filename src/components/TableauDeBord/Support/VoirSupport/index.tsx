"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Tab, Tabs, Spinner, Chip, Button } from '@heroui/react';
import {
  ArrowLeft,
  Headphones,
  Calendar,
  Clock,
  Eye,
  FileText,
  User as UserIcon,
  Building2,
  CheckCircle,
  Activity,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Dot,
  Mail,
  AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { IncidentsService, Incident } from '@/services/incidents';
import { projectsService, Project } from '@/services/projects';
import { UsersService, User } from '@/services/users';
import { messagesService } from '@/services/messages';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';
import { useAuth } from '@/context/AuthContext';
import LoadingState from "@/components/UI/Loading/LoadingState";
import IncidentFiles from "../../Incidents/Voir/IncidentFiles";
import { AnimatePresence, motion } from 'framer-motion';

interface VoirSupportProps {
  id: string;
}

const VoirSupport: React.FC<VoirSupportProps> = ({ id }) => {
  const router = useRouter();
  const { isPartner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Incident | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [conversationCount, setConversationCount] = useState(0);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const ticketId = parseInt(id);

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

  useEffect(() => { loadTicketData(); }, [id]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const ticketData = await IncidentsService.getIncidentById(ticketId);
      if (!ticketData) { setError('Ticket de support non trouvé'); return; }
      setTicket(ticketData);

      // Charger le nombre d'échanges dans la conversation
      try {
        const conversation = await messagesService.getConversationByTicket(ticketData.incident_number);
        setConversationCount(conversation.count || conversation.items?.length || 0);
      } catch {
        // Pas de conversation encore — count reste à 0
      }

      // Chargement eager du projet et de l'agent assigné
      if (ticketData.project_id) {
        loadProjectData(ticketData);
      }
      if (ticketData.user_id) {
        loadAssignedUser(ticketData);
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      setError(extractBackendMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async (inc?: Incident) => {
    const current = inc || ticket;
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
    const current = inc || ticket;
    if (!current || !current.user_id) return;
    // Les partenaires n'ont pas accès à /users/getByCriteria (403)
    if (isPartner()) return;
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
    if (!ticket) return null;
    switch (label) {
      case "Priorité":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Niveau</span>
              <Chip color={getPriorityColor(ticket.priority)} variant="flat" size="sm">{ticket.priority}</Chip>
            </div>
            {ticket.priority_label && (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Label</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.priority_label}</span>
              </div>
            )}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Impact</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.impact_label || ticket.impact || 'N/A'}</span>
            </div>
          </>
        );
      case "SLA Réponse":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
              <Chip color={getSLAStatusColor(ticket.sla_prise_en_charge_status)} variant="flat" size="sm">
                {getSLAStatusLabel(ticket.sla_prise_en_charge_status)}
              </Chip>
            </div>
            {assignedUser && (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Agent assigné</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{assignedUser.name}</span>
              </div>
            )}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Créé le</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{formatDateShort(ticket.created_at)}</span>
            </div>
          </>
        );
      case "SLA Résolution":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
              <Chip color={getSLAStatusColor(ticket.sla_resolution_status)} variant="flat" size="sm">
                {getSLAStatusLabel(ticket.sla_resolution_status)}
              </Chip>
            </div>
            {ticket.status === 'resolu' && (
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Résolu</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Oui</span>
              </div>
            )}
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Dernière MAJ</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{formatDateShort(ticket.updated_at)}</span>
            </div>
          </>
        );
      case "Échanges":
        return (
          <>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Nombre d&apos;échanges</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{ticket.refusal_count || 0}</span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Statut actuel</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(ticket.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(ticket.status)}`} />
                {getStatusLabel(ticket.status)}
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
        <Breadcrumb pageName="Chargement du ticket..." />
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
            <Headphones className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Erreur</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">{error}</p>
          <div className="flex justify-center gap-3">
            <Button onPress={loadTicketData} color="primary" variant="flat" size="sm">Réessayer</Button>
            <Button onPress={() => router.back()} variant="bordered" size="sm">Retour</Button>
          </div>
        </div>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Breadcrumb pageName="Ticket introuvable" />
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Ticket introuvable</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Le ticket demandé n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
          <Button onPress={() => router.back()} variant="flat" className="mt-6" size="sm">Retour</Button>
        </div>
      </>
    );
  }

  const statCards = [
    {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Priorité",
      value: ticket.priority,
      iconBg: "bg-red-50 dark:bg-red-900/20",
      iconColor: "text-red-600 dark:text-red-400",
      borderActive: "border-red-300 dark:border-red-700"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: "SLA Réponse",
      value: getSLAStatusLabel(ticket.sla_prise_en_charge_status),
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      borderActive: "border-blue-300 dark:border-blue-700"
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: "SLA Résolution",
      value: getSLAStatusLabel(ticket.sla_resolution_status),
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderActive: "border-emerald-300 dark:border-emerald-700"
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Échanges",
      value: conversationCount,
      iconBg: "bg-orange-50 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      borderActive: "border-orange-300 dark:border-orange-700"
    }
  ];

  return (
    <>
      <Breadcrumb pageName={`Ticket: ${ticket.incident_number}`} />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton retour */}
        <Button
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push('/tableaudebord/support')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white -ml-2"
        >
          Retour au support technique
        </Button>

        {/* Header ticket */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Headphones className="w-6 h-6 text-[#4ba9b7]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticket.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    #{ticket.incident_number}
                  </span>
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5" />
                    {ticket.declarant_name}
                  </span>
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateShort(ticket.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(ticket.status)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(ticket.status)}`} />
                {getStatusLabel(ticket.status)}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getPriorityStyles(ticket.priority)}`}>
                <AlertTriangle className="w-3 h-3" />
                {ticket.priority}
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
                      Détails du ticket
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Numéro</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">#{ticket.incident_number}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Type</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.type}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Catégorie</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.category}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Déclaré par</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.declarant_name}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Priorité</dt>
                        <dd>
                          <Chip color={getPriorityColor(ticket.priority)} variant="flat" size="sm" startContent={<AlertTriangle className="w-3 h-3" />}>
                            {ticket.priority}{ticket.priority_label ? ` - ${ticket.priority_label}` : ''}
                          </Chip>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Impact</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.impact_label || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Domaine</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{ticket.domain || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Dernière mise à jour</dt>
                        <dd className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(ticket.updated_at)}</dd>
                      </div>
                    </div>
                  </div>
                </div>

                {ticket.description && (
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#4ba9b7]" />
                        Description de la demande
                      </h2>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{ticket.description}</p>
                    </div>
                  </div>
                )}

                {ticket.resolution_notes && (
                  <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="px-6 py-4 border-b border-emerald-100 dark:border-emerald-800">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Résolution apportée
                      </h2>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{ticket.resolution_notes}</p>
                    </div>
                  </div>
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
                        SLA Première réponse
                      </h3>
                    </div>
                    <div className="p-6">
                      <Chip color={getSLAStatusColor(ticket.sla_prise_en_charge_status)} variant="flat" size="lg">
                        {getSLAStatusLabel(ticket.sla_prise_en_charge_status)}
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
                      <Chip color={getSLAStatusColor(ticket.sla_resolution_status)} variant="flat" size="lg">
                        {getSLAStatusLabel(ticket.sla_resolution_status)}
                      </Chip>
                    </div>
                  </div>
                </div>

                {/* Agent assigné */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-[#4ba9b7]" />
                      Agent support assigné
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
                        <div className="w-10 h-10 bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-[#4ba9b7] font-bold text-sm uppercase">
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Agent #{ticket.user_id}</p>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#4ba9b7]" />
                      Historique du ticket
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">Créé le</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(ticket.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide w-32">Dernière MAJ</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(ticket.updated_at)}</span>
                    </div>
                    {ticket.status === 'resolu' && (
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

            {/* Fichiers joints */}
            <Tab
              key="files"
              title={<div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>Fichiers joints</span></div>}
            >
              <div className="p-6">
                <IncidentFiles incidentId={ticket.id} />
              </div>
            </Tab>

            {/* Projet associé */}
            {ticket.project_id && (
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
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default VoirSupport;
