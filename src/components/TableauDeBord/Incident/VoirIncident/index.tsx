"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Tab, Tabs, Spinner, Chip, Button, Avatar } from '@heroui/react';
import { 
  ArrowLeft, 
  AlertTriangle, 
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
  Activity
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

interface VoirIncidentProps {
  id: string;
}

const VoirIncident: React.FC<VoirIncidentProps> = ({ id }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const incidentId = parseInt(id);

  useEffect(() => {
    loadIncidentData();
  }, [id]);

  const loadIncidentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const incidentData = await IncidentsService.getIncidentById(incidentId);
      
      if (!incidentData) {
        setError('Incident non trouvé');
        return;
      }

      setIncident(incidentData);
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
    if (!incident || !incident.project_id) return;

    try {
      setLoadingProject(true);
      const allProjects = await projectsService.getActiveProjects();
      const foundProject = allProjects.find(p => p.id === incident.project_id);
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
    if (!incident || !incident.user_id) return;

    try {
      setLoadingUser(true);
      const userData = await UsersService.getUserById(incident.user_id);
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
    
    if (key === 'project' && !project && incident?.project_id) {
      await loadProjectData();
    }
    
    if (key === 'tracking' && !assignedUser && incident?.user_id) {
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
        <Breadcrumb pageName="Chargement de l'incident..." />
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
              onPress={loadIncidentData}
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

  if (!incident) {
    return (
      <>
        <Breadcrumb pageName="Incident introuvable" />
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600">Incident introuvable</h3>
          <p className="text-gray-400 mt-2">L'incident demandé n'existe pas ou vous n'y avez pas accès.</p>
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
      <Breadcrumb pageName={`Incident: ${incident.incident_number}`} />
      
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton de retour */}
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.push('/tableaudebord/incidents')}
            className="font-medium"
          >
            Retour à la gestion des incidents
          </Button>
        </div>

        {/* En-tête de l'incident amélioré */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4ba9b7]/5 via-transparent to-red-500/5 dark:from-[#4ba9b7]/10 dark:to-red-500/10"></div>
          <CardHeader className="relative pb-8 pt-8 bg-gradient-to-r from-[#4ba9b7]/10 via-transparent to-red-500/10 dark:from-gray-800 dark:to-gray-700">
            <div className="flex flex-col gap-8 w-full">
              {/* Header principal */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/25">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                      {incident.title}
                    </h1>
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">#{incident.incident_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Créé le {formatDate(incident.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Chip
                    color={getStatusColor(incident.status)}
                    variant="flat"
                    size="lg"
                    className="text-sm font-semibold"
                    startContent={<Activity className="w-4 h-4" />}
                  >
                    {getStatusLabel(incident.status)}
                  </Chip>
                  <Chip
                    color={getPriorityColor(incident.priority)}
                    variant="flat"
                    size="lg"
                    className="text-sm font-semibold"
                    startContent={<AlertTriangle className="w-4 h-4" />}
                  >
                    {incident.priority}
                  </Chip>
                </div>
              </div>

              {/* Statistiques de l'incident */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Priorité</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {incident.priority}
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">SLA Prise en charge</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getSLAStatusLabel(incident.sla_prise_en_charge_status)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">SLA Résolution</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {getSLAStatusLabel(incident.sla_resolution_status)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Refus</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {incident.refusal_count || 0}
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
                          <p className="text-sm text-gray-500">Numéro d'incident</p>
                          <p className="font-medium">#{incident.incident_number}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Type</p>
                          <p className="font-medium">{incident.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Settings className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Catégorie</p>
                          <p className="font-medium">{incident.category}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <UserIcon className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Déclaré par</p>
                          <p className="font-medium">{incident.declarant_name}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Shield className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Priorité</p>
                          <Chip
                            color={getPriorityColor(incident.priority)}
                            variant="flat"
                            size="sm"
                            startContent={<AlertTriangle className="w-3 h-3" />}
                          >
                            {incident.priority} - {incident.priority_label}
                          </Chip>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Activity className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Impact</p>
                          <p className="font-medium">{incident.impact_label}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Building2 className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Domaine</p>
                          <p className="font-medium">{incident.domain}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Calendar className="text-gray-400 mt-1" size={20} />
                        <div>
                          <p className="text-sm text-gray-500">Dernière mise à jour</p>
                          <p className="font-medium">{formatDate(incident.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {incident.description && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                      <p className="text-gray-600 dark:text-gray-300">{incident.description}</p>
                    </div>
                  )}

                  {incident.resolution_notes && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Notes de résolution
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">{incident.resolution_notes}</p>
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
                          SLA Prise en charge
                        </h4>
                        <Chip
                          color={getSLAStatusColor(incident.sla_prise_en_charge_status)}
                          variant="flat"
                          size="lg"
                          startContent={<Clock className="w-4 h-4" />}
                        >
                          {getSLAStatusLabel(incident.sla_prise_en_charge_status)}
                        </Chip>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          SLA Résolution
                        </h4>
                        <Chip
                          color={getSLAStatusColor(incident.sla_resolution_status)}
                          variant="flat"
                          size="lg"
                          startContent={<CheckCircle className="w-4 h-4" />}
                        >
                          {getSLAStatusLabel(incident.sla_resolution_status)}
                        </Chip>
                      </div>
                    </div>

                    {/* Assigné à */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-purple-500" />
                        Utilisateur assigné
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
                            className="bg-purple-500 text-white"
                          />
                          <div>
                            <p className="font-medium">{assignedUser.name}</p>
                            <p className="text-sm text-gray-500">{assignedUser.email}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">Expert {incident.user_id}</p>
                      )}
                    </div>

                    {/* Timeline */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#4ba9b7]" />
                        Timeline
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-500">Créé le</span>
                          <span className="font-medium">{formatDate(incident.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-gray-500">Dernière mise à jour</span>
                          <span className="font-medium">{formatDate(incident.updated_at)}</span>
                        </div>
                        {incident.status === 'resolu' && (
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
                    <span>Fichiers</span>
                  </div>
                }
              >
                <div className="p-6">
                  <IncidentFiles incidentId={incident.id} />
                </div>
              </Tab>

              {incident.project_id && (
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
                        <Building2 className="mx-auto text-gray-400 mb-3" size={48} />
                        <p className="text-gray-500">Aucun projet associé à cet incident</p>
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

export default VoirIncident;