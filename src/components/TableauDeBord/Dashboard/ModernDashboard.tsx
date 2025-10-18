"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";
import {
  Chip,
} from "@nextui-org/react";
import {
  Users,
  FolderOpen,
  FileText,
  AlertTriangle,
  MessageCircle,
  Shield,
  Zap,
  Target,
  Upload,
  Plus,
  RefreshCw,
  ChevronRight,
  Activity,
  Building2,
  Clock,
  ExternalLink,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { dashboardService } from "@/services/dashboard";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { ProfessionalCard, ProfessionalButton, SectionHeader, MetricCard } from "@/components/UI/Professional";

// Types pour les données du dashboard
interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    growth: number;
  };
  partners: {
    total: number;
    active: number;
    new_this_month: number;
    growth: number;
  };
  files: {
    total: number;
    size_gb: number;
    recent_uploads: number;
    growth: number;
  };
  messages: {
    total: number;
    unread: number;
    support_tickets: number;
    growth: number;
  };
  incidents?: {
    total: number;
    open: number;
    critical: number;
    resolved: number;
    growth: number;
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: "primary" | "secondary" | "success" | "warning" | "danger";
  action: () => void;
  permission?: Permission;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  user?: { name: string };
  status: string;
}

const ModernDashboard: React.FC = () => {
  const { user, isAdmin, isPartner, hasPermission, isLoading: authLoading } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const { finish } = useTopBarProgress();
  
  // États principaux
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
    partners: { total: 0, active: 0, new_this_month: 0, growth: 0 },
    files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
    messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
    incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
  });
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [partnerStats, setPartnerStats] = useState<any[]>([]);
  const [incidentPriorityStats, setIncidentPriorityStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // États pour la pagination
  const [partnerCurrentPage, setPartnerCurrentPage] = useState(0);
  const [incidentCurrentPage, setIncidentCurrentPage] = useState(0);
  const itemsPerPage = 5;

  // Fonctions de pagination
  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = currentPage * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (dataLength: number) => {
    return Math.ceil(dataLength / itemsPerPage);
  };

  const handlePartnerPageChange = (page: number) => {
    setPartnerCurrentPage(page);
  };

  const handleIncidentPageChange = (page: number) => {
    setIncidentCurrentPage(page);
  };

  // Données paginées
  const paginatedPartners = getPaginatedData(partnerStats, partnerCurrentPage);
  const paginatedIncidents = getPaginatedData(activities, incidentCurrentPage);
  const totalPartnerPages = getTotalPages(partnerStats.length);
  const totalIncidentPages = getTotalPages(activities.length);

  // Composant de pagination
  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    label 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
    label: string;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Page {currentPage + 1} sur {totalPages} • {label}
        </p>
        <div className="flex items-center gap-2">
          <ProfessionalButton
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            isDisabled={currentPage === 0}
            startContent={<ChevronLeft className="h-3 w-3" />}
          >
            Précédent
          </ProfessionalButton>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => onPageChange(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPage === i
                    ? 'bg-[#4ba9b7] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <ProfessionalButton
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            isDisabled={currentPage === totalPages - 1}
            endContent={<ChevronRight className="h-3 w-3" />}
          >
            Suivant
          </ProfessionalButton>
        </div>
      </div>
    );
  };

  // Actions rapides configurables selon le rôle
  const quickActions: QuickAction[] = [
    {
      id: "new-project",
      title: "Nouveau Projet",
      description: "Créer un nouveau projet",
      icon: <Plus className="h-5 w-5" />,
      variant: "primary",
      action: () => window.location.href = "/tableaudebord/projet/ajouter",
      permission: Permission.CREATE_PROJECTS_ALL_PARTNERS,
    },
    {
      id: "add-partner",
      title: "Ajouter Partenaire",
      description: "Inviter un nouveau partenaire",
      icon: <Users className="h-5 w-5" />,
      variant: "secondary",
      action: () => window.location.href = "/tableaudebord/partenaire/ajouter",
      permission: Permission.CREATE_PARTNERS,
    },
    {
      id: "upload-files",
      title: "Upload Fichiers",
      description: "Gérer les documents",
      icon: <Upload className="h-5 w-5" />,
      variant: "success",
      action: () => window.location.href = "/tableaudebord/lesdossiers",
    },
    {
      id: "messages",
      title: "Messages",
      description: "Centre de communication",
      icon: <MessageCircle className="h-5 w-5" />,
      variant: "warning",
      action: () => window.location.href = "/tableaudebord/messages",
    },
    {
      id: "support",
      title: "Support",
      description: "Assistance technique",
      icon: <Shield className="h-5 w-5" />,
      variant: "danger",
      action: () => window.location.href = "/tableaudebord/support",
    },
  ];

  // Filtrer les actions selon les permissions
  const availableActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  useEffect(() => {
    // Attendre que les données d'authentification soient chargées
    if (!authLoading && user) {
      // Terminer toute progress bar restante au chargement du dashboard
      finish();
      
      console.log("🚀 Auth chargé, démarrage du dashboard pour:", {
        name: user.name,
        role_id: user.role_id,
        isAdmin: isAdmin()
      });
      // Délai pour s'assurer que toutes les permissions sont calculées
      setTimeout(() => {
        loadDashboardData();
      }, 100);
    }
  }, [authLoading, user, isAdmin, isPartner, finish]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 Chargement des données dashboard...");
      console.log("👤 Utilisateur:", {
        id: user?.id,
        name: user?.name,
        role_id: user?.role_id,
        partner_id: user?.partner_id,
        username: user?.username,
        isAdmin: isAdmin(),
        isPartner: isPartner()
      });
      
      if (isAdmin()) {
        // 🚧 TEMPORAIRE: Endpoint dashboard admin non disponible sur le backend (404)
        console.log("🚧 Dashboard admin temporairement désactivé - endpoint backend retourne 404");
        console.warn("⚠️ API Dashboard Admin indisponible - /dashboard/admin/overview n'existe pas");
        
        // Utiliser des données par défaut pour les admins
        setStats({
          projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
          partners: { total: 0, active: 0, new_this_month: 0, growth: 0 },
          files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
          messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
          incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
        });
        setActivities([]);
        
        /* COMMENTÉ - À réactiver quand l'endpoint backend sera implémenté
        try {
          const adminDashboard = await dashboardService.getDashboardAdmin();
          console.log("📡 Réponse API admin dashboard:", adminDashboard);
        if (adminDashboard && ((adminDashboard as any).code === 200 || (adminDashboard as any).success === true || adminDashboard.data)) {
          const data = adminDashboard.data || adminDashboard;
          
          // Extraire les données de l'API
          const globalSummary = (data as any).global_summary || {};
          const partnerStatsData = (data as any).partner_stats || [];
          const recentIncidents = (data as any).recent_incidents || [];
          const incidentPriorityData = (data as any).incident_priority_stats || {};
          
          console.log("📊 Global Summary:", globalSummary);
          console.log("👥 Partner Stats:", partnerStatsData);
          console.log("🚨 Recent Incidents:", recentIncidents);
          console.log("🎯 Incident Priority Stats:", incidentPriorityData);

          // Stocker les données détaillées
          setPartnerStats(partnerStatsData);
          setIncidentPriorityStats(incidentPriorityData);
          
          // Convertir pour le format local
          setStats({
            projects: {
              total: globalSummary.total_projects || 0,
              active: globalSummary.active_projects || 0,
              completed: (globalSummary.total_projects || 0) - (globalSummary.active_projects || 0),
              pending: 0,
              growth: 0,
            },
            partners: {
              total: partnerStatsData.length || 0,
              active: partnerStatsData.filter((p: any) => p.active_projects > 0).length || 0,
              new_this_month: 0,
              growth: 0,
            },
            files: {
              total: globalSummary.total_files || 0,
              size_gb: 0,
              recent_uploads: 0,
              growth: 0,
            },
            messages: {
              total: recentIncidents.length || 0,
              unread: recentIncidents.filter((i: any) => !i.is_read).length || 0,
              support_tickets: recentIncidents.filter((i: any) => i.type === 'support').length || 0,
              growth: 0,
            },
            incidents: {
              total: globalSummary.total_incidents || 0,
              open: globalSummary.open_incidents || 0,
              critical: globalSummary.critical_incidents || 0,
              resolved: (globalSummary.total_incidents || 0) - (globalSummary.open_incidents || 0),
              growth: 0,
            },
          });

          // Convertir les incidents récents en activités
          const convertedActivities = recentIncidents.slice(0, 10).map((incident: any) => ({
            id: incident.id.toString(),
            type: incident.type,
            title: incident.title,
            description: incident.description,
            time: formatTimeAgo(incident.created_at),
            user: { name: `Utilisateur ${incident.created_by}` },
            status: incident.priority === 'critique' ? 'danger' : 
                   incident.priority === 'haute' ? 'warning' : 'info',
          }));
          setActivities(convertedActivities);
          
          console.log("✅ Données admin appliquées au dashboard");
        } else {
          console.error("❌ API admin a échoué");
        }
        } catch (error) {
          console.error("❌ Erreur lors du chargement des données admin:", error);
        }
        */
      } else if (isPartner()) {
        console.log("🤝 Chargement des données partenaire...");
        
        // Utiliser partner_id si disponible, sinon l'ID utilisateur comme fallback
        const partnerId = user?.partner_id || user?.id;
        
        if (!partnerId) {
          console.error("❌ Impossible de déterminer le partner_id");
          return;
        }
        
        try {
          console.log("📞 Appel API dashboard partenaire avec ID:", partnerId);
          const partnerDashboard = await dashboardService.getDashboardPartner(partnerId);
          console.log("📡 Réponse API partenaire:", partnerDashboard);
          
          if (partnerDashboard && ((partnerDashboard as any).code === 200 || (partnerDashboard as any).success) && partnerDashboard.data) {
            const data = partnerDashboard.data;
            
            // Extraire les données partenaire selon le format API réel
            const summary = (data as any).summary || {};
            const incidentStats = (data as any).incident_stats || {};
            const recentIncidents = (data as any).recent_incidents || [];
            
            console.log("📊 Données partenaire extraites:", { summary, incidentStats, recentIncidents });
            
            // Convertir les données partenaire pour le format local
            setStats({
              projects: {
                total: summary.total_projects || 0,
                active: summary.active_projects || 0,
                completed: (summary.total_projects || 0) - (summary.active_projects || 0),
                pending: 0,
                growth: 0,
              },
              partners: {
                total: 1, // Le partenaire lui-même
                active: 1,
                new_this_month: 0,
                growth: 0,
              },
              files: {
                total: summary.total_files || 0,
                size_gb: 0,
                recent_uploads: 0,
                growth: 0,
              },
              messages: {
                total: incidentStats.total || 0,
                unread: summary.open_incidents || 0,
                support_tickets: incidentStats.total || 0,
                growth: 0,
              },
              incidents: {
                total: incidentStats.total || 0,
                open: summary.open_incidents || 0,
                critical: incidentStats.by_priority?.critique || 0,
                resolved: (incidentStats.total || 0) - (summary.open_incidents || 0),
                growth: 0,
              },
            });

            // Convertir les incidents récents en activités
            const convertedActivities = recentIncidents.slice(0, 10).map((incident: any) => ({
              id: incident.id.toString(),
              type: incident.type,
              title: incident.title,
              description: incident.description,
              time: formatTimeAgo(incident.created_at),
              user: { name: `Utilisateur ${incident.created_by}` },
              status: incident.priority === 'critique' ? 'danger' : 
                     incident.priority === 'haute' ? 'warning' : 'info',
            }));
            setActivities(convertedActivities);
            
            console.log("✅ Données partenaire appliquées au dashboard");
          } else {
            console.error("❌ API partenaire a échoué");
          }
        } catch (error) {
          console.error("❌ Erreur lors du chargement des données partenaire:", error);
          
          // Afficher des données par défaut pour les partenaires
          setStats({
            projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
            partners: { total: 1, active: 1, new_this_month: 0, growth: 0 },
            files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
            messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
            incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
          });
          setActivities([]);
        }
      } else {
        console.log("⚠️ Utilisateur sans rôle admin ou partner_id manquant");
        
        // Données par défaut
        setStats({
          projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
          partners: { total: 0, active: 0, new_this_month: 0, growth: 0 },
          files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
          messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
          incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
        });
        setActivities([]);
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "Il y a moins d'1h";
    if (diffInHours < 24) return `Il y a ${Math.round(diffInHours)}h`;
    if (diffInHours < 48) return "Hier";
    return `Il y a ${Math.round(diffInHours / 24)} jours`;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    showNotification({
      type: "success",
      title: "Données actualisées",
      message: "Le dashboard a été mis à jour avec les dernières données",
      duration: 3000,
    });
  };

  if (authLoading || !user || loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <ProfessionalCard key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
            </ProfessionalCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header avec salutation et actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <SectionHeader
          title={`Bonjour, ${user?.name} 👋`}
          subtitle="Voici un aperçu de votre activité aujourd'hui"
          icon={<Activity />}
          variant="large"
        />
        
        <ProfessionalButton
          variant="outline"
          onClick={handleRefresh}
          isLoading={refreshing}
          startContent={<RefreshCw className="h-4 w-4" />}
        >
          Actualiser
        </ProfessionalButton>
      </motion.div>

      {/* Dashboard Overview - Données selon le rôle */}
      {(isAdmin() || isPartner()) && (
        <div className="space-y-8">
          {/* 1. Métriques principales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            <MetricCard
              title="Projets"
              value={stats.projects.total}
              subtitle={`${stats.projects.active} actifs`}
              icon={<FolderOpen />}
              variant="primary"
              trend="up"
              trendValue={stats.projects.growth}
            />
            
            <MetricCard
              title="Fichiers"
              value={stats.files.total}
              subtitle="documents stockés"
              icon={<FileText />}
              variant="success"
              trend="neutral"
            />
            
            <MetricCard
              title="Incidents"
              value={stats.incidents?.total || 0}
              subtitle={`${stats.incidents?.open || 0} ouverts, ${stats.incidents?.critical || 0} critiques`}
              icon={<AlertTriangle />}
              variant="danger"
              trend={stats.incidents?.open ? "down" : "neutral"}
            />
            
            {isAdmin() && (
              <MetricCard
                title="Partenaires"
                value={stats.partners.total}
                subtitle={`${stats.partners.active} actifs`}
                icon={<Users />}
                variant="secondary"
                trend="up"
                trendValue={stats.partners.growth}
              />
            )}
          </motion.div>

          {/* 2. Partner Stats - Seulement pour les admins */}
          {isAdmin() && partnerStats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ProfessionalCard>
                <SectionHeader
                  title="Statistiques des Partenaires"
                  subtitle={`${stats.partners.total} partenaires au total • Page ${partnerCurrentPage + 1} sur ${totalPartnerPages || 1}`}
                  icon={<Users />}
                  variant="compact"
                  divider
                />
                
                <div className="space-y-4 mt-6">
                  {paginatedPartners.map((partner: any, index) => (
                    <motion.div
                      key={partner.partner_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg p-4 transition-all duration-300 border-l-4 border-transparent hover:border-l-[#4ba9b7] cursor-pointer"
                      onClick={() => window.location.href = `/tableaudebord/partenaire/${partner.partner_id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4ba9b7] to-[#3a8a95] flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                                {partner.partner_name}
                              </h4>
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Actif</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Partenaire #{partner.partner_id} • Dernière activité aujourd'hui
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-[#4ba9b7] dark:text-[#7bc5cd]">
                              {partner.total_projects}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Total projets
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {partner.active_projects}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              En cours
                            </p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ExternalLink className="h-5 w-5 text-[#4ba9b7] dark:text-[#7bc5cd]" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <PaginationControls
                  currentPage={partnerCurrentPage}
                  totalPages={totalPartnerPages}
                  onPageChange={handlePartnerPageChange}
                  label={`${partnerStats.length} partenaires`}
                />
              </ProfessionalCard>
            </motion.div>
          )}

          {/* 3. Incident Priority Stats */}
          {Object.keys(incidentPriorityStats).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ProfessionalCard>
                <SectionHeader
                  title="Incidents par Priorité"
                  icon={<Target />}
                  variant="compact"
                  divider
                />
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
                  {Object.entries(incidentPriorityStats).map(([priority, count]: [string, any]) => (
                    <MetricCard
                      key={priority}
                      title={priority.charAt(0).toUpperCase() + priority.slice(1)}
                      value={count}
                      subtitle="incidents"
                      icon={<AlertTriangle />}
                      variant={
                        priority === 'critique' ? 'danger' :
                        priority === 'haute' ? 'warning' :
                        priority === 'moyenne' ? 'secondary' : 'info'
                      }
                      size="sm"
                    />
                  ))}
                </div>
              </ProfessionalCard>
            </motion.div>
          )}

          {/* 4. Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ProfessionalCard>
              <SectionHeader
                title="Incidents Récents"
                subtitle={`${activities.length} incidents récents • Page ${incidentCurrentPage + 1} sur ${totalIncidentPages || 1}`}
                icon={<AlertTriangle />}
                variant="compact"
                divider
              />
              
              <div className="space-y-3 mt-6">
                {activities.length > 0 ? (
                  paginatedIncidents.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg p-4 transition-all duration-300 cursor-pointer"
                      onClick={() => window.location.href = `/tableaudebord/incidents#incident-${activity.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.status === 'danger' ? 'bg-red-100 dark:bg-red-900/30' :
                            activity.status === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30' : 
                            'bg-[#e0f4f6] dark:bg-[#4ba9b7]/20'
                          }`}>
                            {activity.status === 'danger' ? (
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            ) : activity.status === 'warning' ? (
                              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-[#4ba9b7] dark:text-[#7bc5cd]" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {activity.title}
                            </h4>
                            <Chip 
                              size="sm" 
                              color={
                                activity.status === 'danger' ? 'danger' :
                                activity.status === 'warning' ? 'warning' : 'primary'
                              }
                              variant="flat"
                              className="flex-shrink-0"
                            >
                              {activity.type}
                            </Chip>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {activity.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span className="hidden sm:inline">{activity.time}</span>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <ExternalLink className="h-4 w-4 text-[#4ba9b7] dark:text-[#7bc5cd]" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Aucun incident récent
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                          Tout fonctionne parfaitement ! 🎉
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activities.length > 0 && (
                  <PaginationControls
                    currentPage={incidentCurrentPage}
                    totalPages={totalIncidentPages}
                    onPageChange={handleIncidentPageChange}
                    label={`${activities.length} incidents`}
                  />
                )}
              </div>
            </ProfessionalCard>
          </motion.div>

          {/* 5. Actions rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ProfessionalCard>
              <SectionHeader
                title="Actions Rapides"
                icon={<Zap />}
                variant="compact"
                divider
              />
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
                {availableActions.map((action, index) => (
                  <motion.div
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <ProfessionalCard
                      isPressable
                      onPress={action.action}
                      isHoverable
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-xl p-3 text-white shadow-lg ${
                          action.variant === 'primary' ? 'bg-[#4ba9b7]' :
                          action.variant === 'secondary' ? 'bg-purple-500' :
                          action.variant === 'success' ? 'bg-green-500' :
                          action.variant === 'warning' ? 'bg-orange-500' :
                          action.variant === 'danger' ? 'bg-red-500' : 'bg-[#4ba9b7]'
                        }`}>
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {action.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {action.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </ProfessionalCard>
                  </motion.div>
                ))}
              </div>
            </ProfessionalCard>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ModernDashboard;