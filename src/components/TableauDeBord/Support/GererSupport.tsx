"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Select,
  SelectItem,
  Textarea,
  Tabs,
  Tab,
  Avatar,
} from "@heroui/react";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  UserCheck,
  Activity,
  Edit3,
  CheckCircle,
  Calendar,
  Users,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { IncidentsService, type Incident } from "@/services/incidents";
import { UsersService, type User } from "@/services/users";
import { useAuth } from "@/context/AuthContext";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { extractBackendMessage } from "@/lib/error-handler";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import LoadingState from "@/components/UI/Loading/LoadingState";
import IncidentFiles from "../Incidents/Voir/IncidentFiles";

interface GererSupportProps {
  id: string;
}

const GererSupport: React.FC<GererSupportProps> = ({ id }) => {
  const router = useRouter();
  const { } = useAuth();
  const { showNotification } = useSimpleNotifications();

  // States
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assignedUser, setAssignedUser] = useState<User | null>(null);
  const [loadingAssignedUser, setLoadingAssignedUser] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");

  const incidentId = parseInt(id);

  // Helper functions (identical to VoirIncident)
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

  const getSLAStatusLabel = (status: string) => {
    switch (status) {
      case 'respecte': return 'Respecté';
      case 'en_retard': return 'En retard';
      case 'non_applicable': return 'Non applicable';
      default: return status;
    }
  };

  // Priority options
  const priorityOptions = [
    { key: "P0", label: "P0 - Critique", color: "danger" },
    { key: "P1", label: "P1 - Élevée", color: "warning" },
    { key: "P2", label: "P2 - Moyenne", color: "primary" },
    { key: "P3", label: "P3 - Faible", color: "success" },
    { key: "P4", label: "P4 - Minimale", color: "secondary" },
  ];

  // Load incident data
  useEffect(() => {
    loadIncidentData();
  }, [id]);

  const loadIncidentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await IncidentsService.getIncidentById(incidentId);
      
      if (data) {
        setIncident(data);
        setResolutionNotes(data.resolution_notes || "");
        setSelectedUserId(data.user_id?.toString() || "");
        setSelectedPriority(data.priority || "");
        await loadUsers();
        // Charger l'utilisateur assigné séparément
        if (data.user_id) {
          try {
            setLoadingAssignedUser(true);
            const userData = await UsersService.getUserById(data.user_id);
            setAssignedUser(userData);
          } catch (error) {
            console.error("Erreur lors du chargement de l'utilisateur assigné:", error);
          } finally {
            setLoadingAssignedUser(false);
          }
        }
      } else {
        setError("Ticket non trouvé");
      }
    } catch (error) {
      const errorMessage = extractBackendMessage(error) || "Impossible de charger le ticket";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await UsersService.getUsersByCriteria({ 
        size: 100,
        data: { is_active: true }
      });
      
      if (response && response.items) {
        setUsers(response.items);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveResolutionNotes = async () => {
    if (!incident) return;

    try {
      setSaving(true);
      const result = await IncidentsService.updateIncident({
        id: incident.id,
        resolution_notes: resolutionNotes,
      });

      if (result) {
        setIncident({ ...incident, resolution_notes: resolutionNotes });
        const successMessage = extractBackendMessage(result) || result?.message || "Notes de résolution sauvegardées";
        showNotification(simpleNotificationHelpers.success(
          "Succès",
          successMessage
        ));
      }
    } catch (error) {
      const errorMessage = extractBackendMessage(error) || "Impossible de sauvegarder les notes";
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        errorMessage
      ));
    } finally {
      setSaving(false);
    }
  };

  const handleReassign = async () => {
    if (!incident || !selectedUserId) return;

    try {
      setSaving(true);
      const result = await IncidentsService.updateIncident({
        id: incident.id,
        user_id: Number(selectedUserId),
      });

      if (result) {
        const newUserId = Number(selectedUserId);
        const updatedIncident = { ...incident, user_id: newUserId };
        setIncident(updatedIncident);
        
        // Recharger les données de l'utilisateur assigné avec le nouvel ID
        if (newUserId) {
          try {
            setLoadingAssignedUser(true);
            const userData = await UsersService.getUserById(newUserId);
            setAssignedUser(userData);
          } catch (error) {
            console.error("Erreur lors du chargement du nouvel utilisateur assigné:", error);
          } finally {
            setLoadingAssignedUser(false);
          }
        }
        
        // Réinitialiser la sélection
        setSelectedUserId("");
        
        const successMessage = extractBackendMessage(result) || result?.message || "Ticket réaffecté avec succès";
        showNotification(simpleNotificationHelpers.success(
          "Succès",
          successMessage
        ));
      }
    } catch (error) {
      const errorMessage = extractBackendMessage(error) || "Impossible de réaffecter le ticket";
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        errorMessage
      ));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePriority = async () => {
    if (!incident || !selectedPriority) return;

    try {
      setSaving(true);
      const result = await IncidentsService.updateIncident({
        id: incident.id,
        priority: selectedPriority as any,
      });

      if (result) {
        const updatedIncident = { ...incident, priority: selectedPriority as any };
        setIncident(updatedIncident);
        const successMessage = extractBackendMessage(result) || result?.message || "Priorité modifiée avec succès";
        showNotification(simpleNotificationHelpers.success(
          "Succès",
          successMessage
        ));
      }
    } catch (error) {
      const errorMessage = extractBackendMessage(error) || "Impossible de modifier la priorité";
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        errorMessage
      ));
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Chargement du ticket..." />
        <LoadingState type="skeleton" skeletonVariant="profile" />
      </>
    );
  }

  // Error state
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

  // Not found state
  if (!incident) {
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
      <Breadcrumb pageName={`Gestion: ${incident.incident_number}`} />
      
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

        {/* En-tête du ticket */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4ba9b7]/5 via-transparent to-blue-500/5 dark:from-[#4ba9b7]/10 dark:to-blue-500/10"></div>
          <CardHeader className="relative pb-8 pt-8 bg-gradient-to-r from-[#4ba9b7]/10 via-transparent to-blue-500/10 dark:from-gray-800 dark:to-gray-700">
            <div className="flex flex-col gap-8 w-full">
              {/* Header principal */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                      <Settings className="w-8 h-8 text-white" />
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

              {/* Statistiques du ticket */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-blue-500" />
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
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-500" />
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
                    <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-cyan-500" />
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
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Assigné à</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ID: {incident.user_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Contenu principal avec onglets */}
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
                key="notes"
                title={
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Notes de résolution
                  </div>
                }
              >
                <div className="p-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Notes de résolution
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Documentez le processus de résolution, les diagnostics et les solutions appliquées
                      </p>
                    </div>

                    <Card className="border border-gray-200 dark:border-gray-700">
                      <CardBody className="p-6 space-y-6">
                        <Textarea
                          label="Notes de résolution"
                          placeholder="Décrivez le diagnostic effectué, les étapes de résolution, les solutions appliquées, et toute information utile pour le suivi..."
                          value={resolutionNotes}
                          onValueChange={setResolutionNotes}
                          minRows={10}
                          maxRows={20}
                          className="w-full"
                          classNames={{
                            input: "text-sm",
                            label: "text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2"
                          }}
                        />
                        
                        <div className="flex justify-end pt-4">
                          <Button
                            color="primary"
                            size="lg"
                            startContent={<Save className="h-5 w-5" />}
                            onPress={handleSaveResolutionNotes}
                            isLoading={saving}
                            isDisabled={!resolutionNotes.trim()}
                            className="px-8"
                          >
                            {saving ? "Sauvegarde..." : "Sauvegarder les notes"}
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </Tab>

              <Tab
                key="fichiers"
                title={
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Fichiers
                  </div>
                }
              >
                <div className="p-8">
                  <IncidentFiles incidentId={incident.id} />
                </div>
              </Tab>

              <Tab
                key="affectation"
                title={
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Affectation
                  </div>
                }
              >
                <div className="p-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Réaffectation du ticket
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Assignez ce ticket à une autre ressource ou équipe
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-3">
                          <h3 className="text-lg font-semibold">Assigné actuellement</h3>
                        </CardHeader>
                        <CardBody>
                          {loadingAssignedUser ? (
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Chargement...</p>
                              </div>
                            </div>
                          ) : assignedUser ? (
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <Avatar size="md" name={assignedUser.name} className="bg-primary text-white" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{assignedUser.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{assignedUser.email}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">ID: {incident.user_id}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <Avatar size="md" name={`User ${incident.user_id}`} className="bg-gray-500 text-white" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">Utilisateur ID: {incident.user_id}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Informations non disponibles</p>
                              </div>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                      
                      <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-3">
                          <h3 className="text-lg font-semibold">Réaffecter à</h3>
                        </CardHeader>
                        <CardBody className="space-y-4">
                          <Select
                            label="Sélectionner un utilisateur"
                            placeholder="Choisir un utilisateur"
                            selectedKeys={selectedUserId ? new Set([selectedUserId]) : new Set([])}
                            onSelectionChange={(keys) => {
                              const selectedKey = Array.from(keys)[0] as string;
                              setSelectedUserId(selectedKey || "");
                            }}
                            isLoading={loadingUsers}
                            size="lg"
                          >
                            {users.map((user) => (
                              <SelectItem key={user.id.toString()}>
                                {user.name} ({user.email})
                              </SelectItem>
                            ))}
                          </Select>
                          <Button
                            color="primary"
                            size="lg"
                            startContent={<UserCheck className="h-5 w-5" />}
                            onPress={handleReassign}
                            isLoading={saving}
                            isDisabled={!selectedUserId || selectedUserId === incident.user_id?.toString()}
                            className="w-full"
                          >
                            {saving ? "Réaffectation..." : "Réaffecter le ticket"}
                          </Button>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="priorite"
                title={
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Priorité
                  </div>
                }
              >
                <div className="p-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                        Modifier la priorité
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Ajustez le niveau de priorité selon l'urgence et l'impact
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-3">
                          <h3 className="text-lg font-semibold">Priorité actuelle</h3>
                        </CardHeader>
                        <CardBody>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Chip
                              startContent={<AlertTriangle className="h-4 w-4" />}
                              color={getPriorityColor(incident.priority)}
                              variant="flat"
                              size="lg"
                              className="text-base font-semibold"
                            >
                              {incident.priority} - {incident.priority_label}
                            </Chip>
                          </div>
                        </CardBody>
                      </Card>
                      
                      <Card className="border border-gray-200 dark:border-gray-700">
                        <CardHeader className="pb-3">
                          <h3 className="text-lg font-semibold">Nouvelle priorité</h3>
                        </CardHeader>
                        <CardBody className="space-y-4">
                          <Select
                            label="Sélectionner une priorité"
                            placeholder="Choisir une priorité"
                            selectedKeys={selectedPriority ? new Set([selectedPriority]) : new Set([])}
                            onSelectionChange={(keys) => {
                              const selectedKey = Array.from(keys)[0] as string;
                              setSelectedPriority(selectedKey);
                            }}
                            size="lg"
                          >
                            {priorityOptions.map((option) => (
                              <SelectItem key={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </Select>
                          <Button
                            color="primary"
                            size="lg"
                            startContent={<AlertTriangle className="h-5 w-5" />}
                            onPress={handleChangePriority}
                            isLoading={saving}
                            isDisabled={!selectedPriority || selectedPriority === incident.priority}
                            className="w-full"
                          >
                            {saving ? "Modification..." : "Modifier la priorité"}
                          </Button>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </div>
              </Tab>

              <Tab
                key="historique"
                title={
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Historique
                  </div>
                }
              >
                <div className="p-8">
                  <div className="text-center py-16 text-gray-500">
                    <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Historique des modifications</h3>
                    <p>Cette section sera bientôt disponible</p>
                    <p className="text-sm mt-2">Timeline complète des actions effectuées sur le ticket</p>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default GererSupport;