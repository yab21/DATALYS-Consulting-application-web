"use client";

import React, { useState, useEffect } from "react";
import {
  Chip,
  Tabs,
  Tab,
} from "@heroui/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import Image from "next/image";
import Link from "next/link";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { ProfessionalCard, MetricCard, SectionHeader, ProfessionalButton } from "@/components/UI/Professional";
import { partnersService } from "@/services/partners";
import { projectsService } from "@/services/projects";
import { dashboardService } from "@/services/dashboard";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import CreateIncidentModal from "../Incidents/CreateIncidentModal";
import { Building2, FolderOpen, Calendar, Users, TrendingUp, AlertTriangle, Mail, Phone, MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import { getContextualErrorMessage } from '@/lib/error-messages';
import { apiInterceptor } from '@/lib/api-interceptor';

// Types utilisant les vraies interfaces des services API
interface Partner {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  is_deleted: boolean;
}

interface Project {
  id: number;
  title: string;
  partner_name?: string;
  partner_id?: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

// Interface pour les incidents du partenaire (utilise any pour plus de flexibilité)
interface PartnerIncident {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  created_at: string;
  updated_at: string;
  partner_id: number;
}

interface VoirPartenaireProps {
  partnerId: string;
}

const VoirPartenaire: React.FC<VoirPartenaireProps> = ({ partnerId }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [incidents, setIncidents] = useState<PartnerIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [activeTab, setActiveTab] = useState("projets");
  const [incidentStats, setIncidentStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    critical: 0
  });
  const { showNotification } = useSimpleNotifications();

  // Charger les données du partenaire
  useEffect(() => {
    const loadPartnerData = async () => {
      try {
        setLoading(true);
        console.log("🔍 Chargement des données du partenaire:", partnerId);
        
        // Obtenir les données du partenaire
        const response = await partnersService.getPartners();
        
        let partnersData: Partner[] = [];
        if (response.code === 200 && response.items) {
          partnersData = response.items;
        } else if (Array.isArray(response)) {
          partnersData = response;
        }
        
        // Trouver le partenaire spécifique
        const foundPartner = partnersData.find((p: Partner) => p.id.toString() === partnerId);
        
        if (foundPartner) {
          setPartner(foundPartner);
          console.log("✅ Partenaire trouvé:", foundPartner);
          
          // Charger les projets et incidents de ce partenaire en parallèle
          await Promise.all([
            loadPartnerProjects(foundPartner.name),
            loadPartnerIncidents(foundPartner.id)
          ]);
        } else {
          console.error("❌ Partenaire non trouvé avec l'ID:", partnerId);
          
          // Trouver un partenaire alternatif (le premier disponible)
          const alternativePartner = partnersData.length > 0 ? partnersData[0] : null;
          
          if (alternativePartner) {
            showNotification({
              type: "warning",
              title: "Partenaire non trouvé",
              message: `Le partenaire ID ${partnerId} n'existe pas. Redirection vers ${alternativePartner.name}`,
              duration: 5000,
            });
            
            // Rediriger vers le partenaire alternatif après 2 secondes
            setTimeout(() => {
              window.location.href = `/tableaudebord/partenaire/${alternativePartner.id}`;
            }, 2000);
          } else {
            showNotification({
              type: "error",
              title: "Aucun partenaire disponible",
              message: "Aucun partenaire n'est disponible dans le système.",
              duration: 5000,
            });
            
            // Rediriger vers le dashboard après 2 secondes
            setTimeout(() => {
              window.location.href = "/tableaudebord";
            }, 2000);
          }
        }
        
      } catch (error) {
        console.error("❌ Erreur lors du chargement du partenaire:", error);
        
        // Vérifier d'abord si c'est une erreur de token expiré
        apiInterceptor.handleApiError(error);
        
        // Générer le message d'erreur approprié
        const errorMessage = getContextualErrorMessage(error, {
          operation: 'load',
          dataType: 'partners',
          fallback: "Impossible de charger les données du partenaire"
        });
        
        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message: errorMessage,
          duration: 5000,
        });
        
        // Rediriger vers le dashboard en cas d'erreur
        setTimeout(() => {
          window.location.href = "/tableaudebord";
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    if (partnerId) {
      loadPartnerData();
    }
  }, [partnerId, showNotification]);

  // Charger les incidents du partenaire
  const loadPartnerIncidents = async (partnerId: number) => {
    try {
      setLoadingIncidents(true);
      console.log("📋 Chargement des incidents pour le partenaire:", partnerId);
      
      // Utiliser dashboardService pour récupérer les incidents du partenaire
      const params = dashboardService.createPaginationParams(0, 50);
      const response = await dashboardService.getPartnerIncidents(partnerId, params);
      
      if (response.success && response.data.incidents) {
        setIncidents(response.data.incidents);
        
        // Calcul des statistiques avec cast approprié
        const incidentsData = response.data.incidents as PartnerIncident[];
        const stats = {
          total: incidentsData.length,
          open: incidentsData.filter(i => i.status === 'open').length,
          resolved: incidentsData.filter(i => i.status === 'resolved').length,
          critical: incidentsData.filter(i => i.priority === 'critical').length
        };
        setIncidentStats(stats);
        
        console.log("✅ Incidents chargés:", response.data.incidents);
      } else {
        setIncidents([]);
        setIncidentStats({ total: 0, open: 0, resolved: 0, critical: 0 });
      }
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des incidents:", error);
      showNotification({
        type: "warning",
        title: "Incidents non disponibles",
        message: "Impossible de charger les incidents de ce partenaire",
        duration: 3000,
      });
      setIncidents([]);
      setIncidentStats({ total: 0, open: 0, resolved: 0, critical: 0 });
    } finally {
      setLoadingIncidents(false);
    }
  };

  // Charger les projets du partenaire
  const loadPartnerProjects = async (partnerName: string) => {
    try {
      setLoadingProjects(true);
      console.log("📁 Chargement des projets pour:", partnerName);
      
      // Méthode 1: Essayer l'API spécifique au partenaire
      let partnerProjects = await projectsService.getProjectsByPartner(partnerName);
      console.log("✅ Projets chargés (méthode 1):", partnerProjects);
      console.log("🔍 Nombre de projets trouvés (méthode 1):", partnerProjects?.length || 0);
      
      // Méthode 2: Si pas de résultats, essayer de récupérer tous les projets et filtrer
      if (!partnerProjects || partnerProjects.length === 0) {
        console.log("🔄 Tentative méthode 2: récupération de tous les projets...");
        try {
          const allProjects = await projectsService.getActiveProjects();
          console.log("📋 Tous les projets actifs:", allProjects);
          
          // Debug: voir tous les noms de partenaires
          const partnerNames = allProjects.map(p => p.partner_name).filter(Boolean);
          console.log("👥 Noms de partenaires dans les projets:", partnerNames);
          console.log("🔍 Recherche pour:", `"${partnerName}"`);
          
          // Filtrer par nom de partenaire (recherche flexible)
          partnerProjects = allProjects.filter(project => {
            if (!project.partner_name) return false;
            
            const projectPartnerName = project.partner_name.toLowerCase().trim();
            const searchName = partnerName.toLowerCase().trim();
            
            return (
              projectPartnerName === searchName ||
              projectPartnerName.includes(searchName) ||
              searchName.includes(projectPartnerName)
            );
          });
          console.log("🎯 Projets filtrés pour", partnerName, ":", partnerProjects);
          
          // Si toujours pas de résultats, essayer une recherche très permissive
          if (partnerProjects.length === 0) {
            console.log("🔄 Recherche permissive...");
            partnerProjects = allProjects.filter(project => {
              if (!project.partner_name) return false;
              const projectPartnerName = project.partner_name.toLowerCase();
              const searchName = partnerName.toLowerCase();
              
              // Recherche de mots communs
              const projectWords = projectPartnerName.split(/\s+/);
              const searchWords = searchName.split(/\s+/);
              
              return searchWords.some(searchWord => 
                projectWords.some(projectWord => 
                  projectWord.includes(searchWord) || searchWord.includes(projectWord)
                )
              );
            });
            console.log("🔍 Résultats recherche permissive:", partnerProjects);
          }
        } catch (error2) {
          console.error("❌ Erreur méthode 2:", error2);
        }
      }
      
      console.log("🏢 Recherche finale pour partenaire:", partnerName);
      console.log("📊 Résultat final:", partnerProjects?.length || 0, "projets trouvés");
      
      setProjects(partnerProjects || []);
      
    } catch (error) {
      console.error("❌ Erreur lors du chargement des projets:", error);
      showNotification({
        type: "warning",
        title: "Projets non disponibles",
        message: "Impossible de charger les projets de ce partenaire",
        duration: 3000,
      });
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Helper functions
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "success" : "danger";
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? "Actif" : "Inactif";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper functions pour les incidents
  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case "open": return "danger";
      case "in_progress": return "warning";
      case "resolved": return "success";
      case "closed": return "default";
      default: return "default";
    }
  };

  const getIncidentPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "danger";
      case "high": return "warning";
      case "medium": return "primary";
      case "low": return "success";
      default: return "default";
    }
  };

  const getIncidentStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <XCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Détail Partenaire" />
        <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={4} />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="space-y-6">
        <Breadcrumb pageName="Détail Partenaire" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ba9b7] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Redirection en cours...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName={`Partenaire - ${partner.name}`} />
      
      {/* Header avec informations principales */}
      <ProfessionalCard>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Informations principales */}
          <div className="flex items-start gap-6">
            {/* Logo du partenaire */}
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 flex-shrink-0">
              {partner.logo_url ? (
                <Image
                  src={partner.logo_url}
                  alt={`Logo ${partner.name}`}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-[#4ba9b7]" />
              )}
            </div>
            
            {/* Détails */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {partner.name}
                </h1>
                <Chip
                  size="sm"
                  color={getStatusColor(partner.is_active)}
                  variant="flat"
                >
                  {getStatusLabel(partner.is_active)}
                </Chip>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{partner.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{partner.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{partner.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Créé le {formatDate(partner.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/tableaudebord/partenaire/liste">
              <ProfessionalButton variant="outline" size="sm">
                Retour à la liste
              </ProfessionalButton>
            </Link>
          </div>
        </div>
      </ProfessionalCard>

      {/* Statistiques du partenaire */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Projets"
          value={projects.length}
          subtitle="projets associés"
          icon={<FolderOpen className="h-6 w-6" />}
          variant="primary"
        />
        
        <MetricCard
          title="Projets Actifs"
          value={projects.filter(p => p.is_active && !p.is_deleted).length}
          subtitle="en cours d'exécution"
          icon={<TrendingUp className="h-6 w-6" />}
          variant="success"
        />
        
        <MetricCard
          title="Total Incidents"
          value={incidentStats.total}
          subtitle="incidents signalés"
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
        />
        
        <MetricCard
          title="Incidents Critiques"
          value={incidents.filter(i => i.priority === 'critique' || i.priority === 'haute').length}
          subtitle="priorité élevée"
          icon={<XCircle className="h-6 w-6" />}
          variant="danger"
        />
      </div>

      {/* Onglets pour les différentes sections */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
        color="primary"
      >
        <Tab key="projets" title="Projets">
          <ProfessionalCard
            header={
              <SectionHeader
                title={`Projets (${projects.length})`}
                icon={<FolderOpen className="h-5 w-5" />}
              />
            }
          >
            {loadingProjects ? (
              <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={3} />
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <FolderOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Aucun projet trouvé
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ce partenaire n'a pas encore de projets associés.
                </p>
                <Link href="/tableaudebord/projet/ajouter">
                  <ProfessionalButton variant="primary">
                    Créer un projet
                  </ProfessionalButton>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {project.title}
                          </h4>
                          <Chip
                            size="sm"
                            color={getStatusColor(project.is_active)}
                            variant="flat"
                          >
                            {getStatusLabel(project.is_active)}
                          </Chip>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Créé le {formatDate(project.created_at)}</span>
                          </div>
                          {project.updated_at !== project.created_at && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>Modifié le {formatDate(project.updated_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Link href={`/tableaudebord/projet/pageprojet/${project.id}`}>
                        <ProfessionalButton variant="outline" size="sm">
                          Voir détails
                        </ProfessionalButton>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ProfessionalCard>
        </Tab>
        
        <Tab key="informations" title="Informations">
          <ProfessionalCard
            header={
              <SectionHeader
                title="Informations détaillées"
                icon={<Building2 className="h-5 w-5" />}
              />
            }
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom du partenaire
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {partner.name}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {partner.email}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Téléphone
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {partner.phone}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Adresse
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {partner.address}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Statut
                  </label>
                  <div className="mt-1">
                    <Chip
                      size="sm"
                      color={getStatusColor(partner.is_active)}
                      variant="flat"
                    >
                      {getStatusLabel(partner.is_active)}
                    </Chip>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date de création
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(partner.created_at)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dernière mise à jour
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(partner.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </ProfessionalCard>
        </Tab>
        
        <Tab key="incidents" title="Incidents">
          <ProfessionalCard
            header={
              <div className="flex items-center justify-between">
                <SectionHeader
                  title={`Incidents (${incidents.length})`}
                  icon={<AlertTriangle className="h-5 w-5" />}
                />
                {partner && (
                  <CreateIncidentModal
                    partnerId={partnerId}
                    partnerName={partner.name}
                    projects={projects}
                    onIncidentCreated={() => loadPartnerIncidents(partner.id)}
                  />
                )}
              </div>
            }
          >
            {loadingIncidents ? (
              <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={3} />
            ) : incidents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Aucun incident trouvé
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ce partenaire n'a pas d'incidents signalés. C'est une bonne nouvelle !
                </p>
                {partner && projects.length > 0 && (
                  <CreateIncidentModal
                    partnerId={partnerId}
                    partnerName={partner.name}
                    projects={projects}
                    onIncidentCreated={() => loadPartnerIncidents(partner.id)}
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Statistiques des incidents */}
                <div className="grid gap-4 sm:grid-cols-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total</p>
                        <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                          {incidentStats.total}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400">Ouverts</p>
                        <p className="text-xl font-bold text-red-800 dark:text-red-200">
                          {incidentStats.open}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Résolus</p>
                        <p className="text-xl font-bold text-green-800 dark:text-green-200">
                          {incidentStats.resolved}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-orange-600 dark:text-orange-400">Critiques</p>
                        <p className="text-xl font-bold text-orange-800 dark:text-orange-200">
                          {incidentStats.critical}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liste des incidents */}
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {incident.title}
                          </h4>
                          <div className="flex gap-2">
                            <Chip
                              size="sm"
                              color={getIncidentStatusColor(incident.status)}
                              variant="flat"
                              startContent={getIncidentStatusIcon(incident.status)}
                            >
                              {incident.status}
                            </Chip>
                            <Chip
                              size="sm"
                              color={getIncidentPriorityColor(incident.priority)}
                              variant="flat"
                            >
                              {incident.priority}
                            </Chip>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {incident.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Créé le {formatDate(incident.created_at)}</span>
                          </div>
                          {incident.updated_at !== incident.created_at && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              <span>Modifié le {formatDate(incident.updated_at)}</span>
                            </div>
                          )}
                          {incident.type && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span>{incident.type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Link href="/tableaudebord/incidents">
                        <ProfessionalButton variant="outline" size="sm">
                          Gérer incident
                        </ProfessionalButton>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ProfessionalCard>
        </Tab>
      </Tabs>
    </div>
  );
};

export default VoirPartenaire;