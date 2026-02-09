"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Tab, Tabs, Spinner, Chip, Button, Avatar } from '@heroui/react';
import { 
  ArrowLeft, 
  Headphones, 
  Mail, 
  Calendar, 
  Shield, 
  Clock, 
  Eye, 
  FileText, 
  User as UserIcon,
  Building2,
  CheckCircle,
  XCircle,
  Settings,
  Activity,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { IncidentsService, Incident } from '@/services/incidents';
import { projectsService, Project } from '@/services/projects';
import { UsersService, User } from '@/services/users';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';
import LoadingState from "@/components/UI/Loading/LoadingState";
import IncidentFiles from "../../Incidents/Voir/IncidentFiles";

interface VoirSupportProps {
  id: string;
}

const VoirSupport: React.FC<VoirSupportProps> = ({ id }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<Incident | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const ticketId = parseInt(id);

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError(null);

      const ticketData = await IncidentsService.getIncidentById(ticketId);
      
      if (!ticketData) {
        setError('Ticket de support non trouvé');
        return;
      }

      setTicket(ticketData);
    } catch (error) {
      // Relancer les erreurs de token expiré pour la redirection globale
      if (isTokenExpiredError(error)) {
        throw error;
      }
      const message = extractBackendMessage(error);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!ticket || !ticket.project_id) return;

    try {
      setLoadingProject(true);
      const allProjects = await projectsService.getActiveProjects();
      const foundProject = allProjects.find(p => p.id === ticket.project_id);
      setProject(foundProject || null);
    } catch (error) {
      // Relancer les erreurs de token expiré pour la redirection globale
      if (isTokenExpiredError(error)) {
        throw error;
      }
      console.error('Erreur lors du chargement du projet:', error);
    } finally {
      setLoadingProject(false);
    }
  };

  const loadAssignedUser = async () => {
    if (!ticket || !ticket.user_id) return;

    try {
      setLoadingUser(true);
      const userData = await UsersService.getUserById(ticket.user_id);
      setAssignedUser(userData);
    } catch (error) {
      // Relancer les erreurs de token expiré pour la redirection globale
      if (isTokenExpiredError(error)) {
        throw error;
      }
      console.error('Erreur lors du chargement de l\'utilisateur assigné:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleTabChange = async (key: string) => {
    setActiveTab(key);
    
    if (key === 'project' && !project && ticket?.project_id) {
      await loadProjectData();
    }
    
    if (key === 'tracking' && !assignedUser && ticket?.user_id) {
      await loadAssignedUser();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getSLAStatusColor = (status: string): "primary" | "secondary" | "success" | "warning" | "danger" => {
    switch (status) {
      case 'respecte': return 'success';
      case 'en_retard': return 'danger';
      case 'non_applicable': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSLAStatusLabel = (status: string) => {
    switch (status) {
      case 'respecte': return 'Respecté';
      case 'en_retard': return 'En retard';
      case 'non_applicable': return 'Non applicable';
      default: return status;
    }
  };

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
        <div className="text-center py-12">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button
              onPress={loadTicketData}
              color="primary"
              variant="solid"
            >
              Réessayer
            </Button>
            <Button
              onPress={() => router.back()}
              variant="bordered"
            >
              Retour
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Breadcrumb pageName="Ticket introuvable" />
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600">Ticket introuvable</h3>
          <p className="text-gray-400 mt-2">Le ticket demandé n'existe pas ou vous n'y avez pas accès.</p>
          <Button
            onPress={() => router.back()}
            variant="bordered"
            startContent={<ArrowLeft size={16} />}
            className="mt-4"
          >
            Retour
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={`Ticket: ${ticket.incident_number}`} />
      
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton de retour */}
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.push('/tableaudebord/support')}
            className="font-medium"
          >
            Retour au support technique
          </Button>
        </div>

        {/* En-tête du ticket amélioré */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4ba9b7]/5 via-transparent to-green-500/5 dark:from-[#4ba9b7]/10 dark:to-green-500/10"></div>
          <CardHeader className="relative pb-8 pt-8 bg-gradient-to-r from-[#4ba9b7]/10 via-transparent to-green-500/10 dark:from-gray-800 dark:to-gray-700">
            <div className="flex flex-col gap-8 w-full">
              {/* Header principal */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-[#4ba9b7] rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/25">
                      <Headphones className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                      {ticket.title}
                    </h1>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">#{ticket.incident_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Créé le {formatDate(ticket.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip
                    color={getStatusColor(ticket.status)}
                    variant="flat"
                    size="lg"
                    className="text-sm font-semibold"
                    startContent={<Activity className="w-4 h-4" />}
                  >
                    {getStatusLabel(ticket.status)}
                  </Chip>
                  <Chip
                    color={getPriorityColor(ticket.priority)}
                    variant="flat"
                    size="lg"
                    className="text-sm font-semibold"
                    startContent={<Shield className="w-4 h-4" />}
                  >
                    {ticket.priority}
                  </Chip>
                </div>
              </div>

              {/* Statistiques du ticket */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Priorité</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {ticket.priority}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">SLA Réponse</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getSLAStatusLabel(ticket.sla_prise_en_charge_status)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#4ba9b7]/20 dark:bg-[#4ba9b7]/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">SLA Résolution</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getSLAStatusLabel(ticket.sla_resolution_status)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Échanges</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {ticket.refusal_count || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contenu principal avec onglets améliorés */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <CardBody className="p-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => handleTabChange(key as string)}
              className="w-full"
              size="lg"
              classNames={{
                tabList: "bg-gray-50 dark:bg-gray-700 p-3 gap-3",
                tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-600 data-[selected=true]:shadow-md transition-all duration-200 rounded-lg px-4 py-3",
                tabContent: "text-gray-600 dark:text-gray-300 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-medium text-sm"
              }}
            >
              <Tab 
                key="overview" 
                title={
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5" />
                    <span>Vue d'ensemble</span>
                  </div>
                }
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <FileText className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Numéro de ticket</p>
                          <p className="font-medium">#{ticket.incident_number}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Headphones className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="font-medium">{ticket.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Settings className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Catégorie</p>
                          <p className="font-medium">{ticket.category}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <UserIcon className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Déclaré par</p>
                          <p className="font-medium">{ticket.declarant_name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Priorité</p>
                          <Chip
                            color={getPriorityColor(ticket.priority)}
                            variant="flat"
                            size="sm"
                            startContent={<Shield className="w-3 h-3" />}
                          >
                            {ticket.priority} - {ticket.priority_label}
                          </Chip>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Activity className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Impact</p>
                          <p className="font-medium">{ticket.impact_label}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Building2 className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Domaine</p>
                          <p className="font-medium">{ticket.domain}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Dernière mise à jour</p>
                          <p className="font-medium">{formatDate(ticket.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {ticket.description && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description de la demande</h4>
                      <p className="text-gray-600 dark:text-gray-300">{ticket.description}</p>
                    </div>
                  )}

                  {ticket.resolution_notes && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Résolution apportée
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">{ticket.resolution_notes}</p>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab 
                key="tracking" 
                title={
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span>Suivi & SLA</span>
                  </div>
                }
              >
                <div className="p-6">
                  <div className="space-y-6">
                    {/* SLA Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-500" />
                          SLA Première réponse
                        </h4>
                        <Chip
                          color={getSLAStatusColor(ticket.sla_prise_en_charge_status)}
                          variant="flat"
                          size="lg"
                          startContent={<Clock className="w-4 h-4" />}
                        >
                          {getSLAStatusLabel(ticket.sla_prise_en_charge_status)}
                        </Chip>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          SLA Résolution
                        </h4>
                        <Chip
                          color={getSLAStatusColor(ticket.sla_resolution_status)}
                          variant="flat"
                          size="lg"
                          startContent={<CheckCircle className="w-4 h-4" />}
                        >
                          {getSLAStatusLabel(ticket.sla_resolution_status)}
                        </Chip>
                      </div>
                    </div>

                    {/* Agent assigné */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-[#4ba9b7]" />
                        Agent support assigné
                      </h4>
                      {loadingUser ? (
                        <div className="flex items-center gap-2">
                          <Spinner size="sm" />
                          <span className="text-gray-500">Chargement...</span>
                        </div>
                      ) : assignedUser ? (
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="sm"
                            name={assignedUser.name}
                            className="bg-[#4ba9b7] text-white"
                          />
                          <div>
                            <p className="font-medium">{assignedUser.name}</p>
                            <p className="text-sm text-gray-500">{assignedUser.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">Agent {ticket.user_id}</p>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#4ba9b7]" />
                        Historique du ticket
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-500">Créé le</span>
                          <span className="font-medium">{formatDate(ticket.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-gray-500">Dernière mise à jour</span>
                          <span className="font-medium">{formatDate(ticket.updated_at)}</span>
                        </div>
                        {ticket.status === 'resolu' && (
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-500">Résolu</span>
                            <span className="font-medium">Status: Résolu</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab 
                key="files" 
                title={
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <span>Fichiers joints</span>
                  </div>
                }
              >
                <div className="p-6">
                  <IncidentFiles incidentId={ticket.id} />
                </div>
              </Tab>

              {ticket.project_id && (
                <Tab 
                  key="project" 
                  title={
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5" />
                      <span>Projet associé</span>
                    </div>
                  }
                >
                  <div className="p-6">
                    {loadingProject ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="md" />
                      </div>
                    ) : project ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{project.title}</h4>
                              {project.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                              )}
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Building2 className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-500">Partenaire:</span>
                                  <span className="font-medium">{project.partner_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-500">Créé le:</span>
                                  <span className="font-medium">{formatDate(project.created_at)}</span>
                                </div>
                              </div>
                            </div>
                            <Chip
                              color={project.is_active ? "success" : "warning"}
                              variant="flat"
                              size="sm"
                            >
                              {project.is_active ? "Actif" : "Inactif"}
                            </Chip>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">Aucun projet associé trouvé</p>
                      </div>
                    )}
                  </div>
                </Tab>
              )}
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default VoirSupport;