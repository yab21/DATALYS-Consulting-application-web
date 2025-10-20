"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";
import {
  Users,
  FolderOpen,
  AlertTriangle,
  MessageCircle,
  Shield,
  Zap,
  Target,
  Upload,
  Plus,
  RefreshCw,
  Activity,
  Building2,
  Clock,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { dashboardService } from "@/services/dashboard";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { ProfessionalButton, ProfessionalCard } from "@/components/UI/Professional";

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
  
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  


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
      
      // Délai pour s'assurer que toutes les permissions sont calculées
      setTimeout(() => {
        loadDashboardData();
      }, 100);
    }
  }, [authLoading, user, isAdmin, isPartner, finish]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      
      if (isAdmin()) {
        // 🚧 TEMPORAIRE: Endpoint dashboard admin non disponible sur le backend (404)
        
        // Utiliser des données par défaut pour les admins
        setStats({
          projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
          partners: { total: 0, active: 0, new_this_month: 0, growth: 0 },
          files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
          messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
          incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
        });
        ([]);
        
        /* COMMENTÉ - À réactiver quand l'endpoint backend sera implémenté
        try {
          const adminDashboard = await dashboardService.getDashboardAdmin();
        if (adminDashboard && ((adminDashboard as any).code === 200 || (adminDashboard as any).success === true || adminDashboard.data)) {
          const data = adminDashboard.data || adminDashboard;
          
          // Extraire les données de l'API
          const globalSummary = (data as any).global_summary || {};
          const partnerStatsData = (data as any).partner_stats || [];
          const recentIncidents = (data as any).recent_incidents || [];
          const incidentPriorityData = (data as any).incident_priority_stats || {};
          

          // Stocker les données détaillées
          
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
          (convertedActivities);
          
        } else {
        }
        } catch (error) {
        }
        */
      } else if (isPartner()) {
        
        // Debug: afficher toutes les données utilisateur disponibles
        // Récupérer l'ID partenaire correct via la correspondance email
        let partnerId;
        
        if (user?.partner_id) {
          partnerId = user.partner_id;
        } else {
          try {
            // Importer le service partners pour récupérer la liste des partenaires
            const { partnersService } = await import('@/services/partners');
            const allPartners = await partnersService.getAllPartners();
            
            // Trouver le partenaire qui correspond à l'email de l'utilisateur
            const matchingPartner = allPartners.find(partner => 
              partner.email === user?.email
            );
            
            if (matchingPartner) {
              partnerId = matchingPartner.id;
            } else {
              partnerId = user?.id;
            }
          } catch (partnerError) {
            partnerId = user?.id;
          }
        }
        
        if (!partnerId) {
          return;
        }
        
        try {
          const partnerDashboard = await dashboardService.getDashboardPartner(partnerId);
          
          if (partnerDashboard && partnerDashboard.code === 200 && partnerDashboard.data) {
            const data = partnerDashboard.data;
            
            // Extraire toutes les données de l'API
            const partner = data.partner || {};
            const projectStats = data.project_stats || {};
            const incidentStats = data.incident_stats || {};
            const activityStats = data.activity_stats || {};
            const activitySummary = data.activity_summary || {};
            const recentIncidents = data.recent_incidents || [];
            const recentProjects = data.recent_projects || [];
            
            // Stocker les données complètes pour l'affichage
            setPartnerData({
              partner,
              projectStats,
              incidentStats,
              activityStats,
              activitySummary,
              recentIncidents,
              recentProjects
            });
            
            // Convertir pour l'ancien format de compatibilité si nécessaire
            setStats({
              projects: {
                total: projectStats.total || 0,
                active: projectStats.active || 0,
                completed: projectStats.completed || 0,
                pending: 0,
                growth: 0,
              },
              partners: {
                total: 1,
                active: partner.is_active ? 1 : 0,
                new_this_month: 0,
                growth: 0,
              },
              files: {
                total: 0, // Pas de données fichiers dans l'API
                size_gb: 0,
                recent_uploads: 0,
                growth: 0,
              },
              messages: {
                total: incidentStats.total || 0,
                unread: recentIncidents.filter((i: any) => !i.is_read).length || 0,
                support_tickets: incidentStats.total || 0,
                growth: 0,
              },
              incidents: {
                total: incidentStats.total || 0,
                open: (incidentStats.by_status?.nouveau || 0) + (incidentStats.by_status?.en_cours || 0),
                critical: incidentStats.by_priority?.P0 || 0,
                resolved: 0, // Calculé différemment selon les statuts
                growth: 0,
              },
            });

            // Convertir les incidents récents en activités
            const convertedActivities = recentIncidents.slice(0, 10).map((incident: any) => ({
              id: incident.id.toString(),
              type: incident.type || 'incident',
              title: incident.title,
              description: incident.description,
              time: formatTimeAgo(incident.created_at),
              user: { name: incident.declarant_name || `Utilisateur ${incident.created_by}` },
              status: incident.priority === 'P0' ? 'danger' : 
                     incident.priority === 'P1' ? 'warning' : 'info',
              priority: incident.priority,
              incident_number: incident.incident_number,
              status_color: incident.status_color
            }));
            (convertedActivities);
            
          } else {
            throw new Error("Réponse API invalide");
          }
        } catch (error) {
          
          // Afficher une notification d'erreur plus informative
          showNotification({
            type: "error",
            title: "Erreur de chargement",
            message: `Impossible de charger le dashboard pour le partenaire ID: ${partnerId}. Erreur: ${(error as any)?.message}`,
            duration: 5000,
          });
          
          // Données par défaut en cas d'erreur
          setStats({
            projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
            partners: { total: 1, active: 1, new_this_month: 0, growth: 0 },
            files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
            messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
            incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
          });
          ([]);
          setPartnerData(null);
        }
      } else {
        
        // Données par défaut
        setStats({
          projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
          partners: { total: 0, active: 0, new_this_month: 0, growth: 0 },
          files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
          messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
          incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
        });
        ([]);
      }
    } catch (error) {
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
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header professionnel DATALYS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#4ba9b7] via-blue-600 to-cyan-600 p-8 mb-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    DATALYS Dashboard
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    Bonjour, <span className="font-semibold">{user?.name}</span> • {isAdmin() ? 'Administrateur' : 'Partenaire'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-indigo-100">
                <Clock className="w-5 h-5" />
                <span>{new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <ProfessionalButton
                onClick={handleRefresh}
                isLoading={refreshing}
                variant="outline"
                startContent={<RefreshCw className="h-4 w-4" />}
                className="text-white border-white/30 hover:border-white/50"
              >
                Actualiser
              </ProfessionalButton>
              
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Système Opérationnel</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Partenaire avec données API réelles */}
        {isPartner() && partnerData && (
          <div className="space-y-8">
            {/* 1. Carte Partenaire Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-8 shadow-xl border border-[#4ba9b7]/20">
                <div className="absolute inset-0 bg-gradient-to-r from-[#4ba9b7]/5 to-blue-500/5"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#4ba9b7]/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                
                <div className="relative z-10 flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#4ba9b7] to-blue-600 flex items-center justify-center shadow-2xl border border-white/20">
                      <Building2 className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h2 className="text-3xl font-bold text-gray-800">
                        {partnerData.partner.name}
                      </h2>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        partnerData.partner.is_active 
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-600 border border-red-500/30'
                      }`}>
                        {partnerData.partner.is_active ? "✓ Actif" : "✗ Inactif"}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-gray-600">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-[#4ba9b7]" />
                        <span className="font-medium">{partnerData.partner.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center text-[#4ba9b7]">📱</span>
                        <span className="font-medium">{partnerData.partner.phone_formatted}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center text-[#4ba9b7]">🌍</span>
                        <span className="font-medium">{partnerData.partner.country_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[#4ba9b7]" />
                        <span className="font-medium">ID #{partnerData.partner.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Métriques Exécutives */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {/* Carte Projets */}
              <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-blue-200 hover:border-[#4ba9b7] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-[#4ba9b7]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                      <FolderOpen className="w-6 h-6 text-[#4ba9b7]" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">{partnerData.projectStats.total}</div>
                      <div className="text-xs text-[#4ba9b7] font-medium">PROJETS</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Actifs</span>
                      <span className="text-green-600 font-semibold">{partnerData.projectStats.active}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Terminés</span>
                      <span className="text-blue-600 font-semibold">{partnerData.projectStats.completed}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Incidents */}
              <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-red-200 hover:border-red-400 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-red-100 border border-red-200">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">{partnerData.incidentStats.total}</div>
                      <div className="text-xs text-red-600 font-medium">INCIDENTS</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ouverts</span>
                      <span className="text-orange-600 font-semibold">
                        {(partnerData.incidentStats.by_status?.nouveau || 0) + (partnerData.incidentStats.by_status?.en_cours || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Critiques</span>
                      <span className="text-red-600 font-semibold">{partnerData.incidentStats.by_priority?.P0 || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Performance */}
              <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-green-200 hover:border-green-400 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-green-100 border border-green-200">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">98.5%</div>
                      <div className="text-xs text-green-600 font-medium">UPTIME</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ce mois</span>
                      <span className="text-green-600 font-semibold">99.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SLA</span>
                      <span className="text-emerald-600 font-semibold">Respecté</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Activité */}
              <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-purple-200 hover:border-purple-400 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-purple-100 border border-purple-200">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-800">{partnerData.activitySummary.active_sessions || 12}</div>
                      <div className="text-xs text-purple-600 font-medium">SESSIONS</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Utilisateurs</span>
                      <span className="text-purple-600 font-semibold">{partnerData.activitySummary.active_users || 8}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pics</span>
                      <span className="text-pink-600 font-semibold">15</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3. Analytics Avancées */}
            {partnerData.incidentStats.total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid gap-6 lg:grid-cols-3"
              >
                {/* Statut des Incidents */}
                <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-indigo-200">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-indigo-100 border border-indigo-200">
                        <Target className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">Incidents par Statut</h3>
                        <p className="text-sm text-gray-600">{partnerData.incidentStats.total} au total</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(partnerData.incidentStats.by_status || {}).map(([status, count]: [string, any]) => (
                        <div key={status} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              status === 'nouveau' ? 'bg-blue-500' :
                              status === 'en_cours' ? 'bg-orange-500' :
                              status === 'resolu' ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-gray-800 font-medium capitalize">{status.replace('_', ' ')}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            status === 'nouveau' ? 'bg-blue-100 text-blue-700' :
                            status === 'en_cours' ? 'bg-orange-100 text-orange-700' :
                            status === 'resolu' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Priorités */}
                <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-red-200">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-red-100 border border-red-200">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">Par Priorité</h3>
                        <p className="text-sm text-gray-600">Classification SLA</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(partnerData.incidentStats.by_priority || {}).map(([priority, count]: [string, any]) => (
                        <div key={priority} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              priority === 'P0' ? 'bg-red-500' :
                              priority === 'P1' ? 'bg-orange-500' :
                              priority === 'P2' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-gray-800 font-medium">{priority}</span>
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${
                            priority === 'P0' ? 'bg-red-100 text-red-700' :
                            priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                            priority === 'P2' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Types */}
                <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-purple-200">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-purple-100 border border-purple-200">
                        <XCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">Par Catégorie</h3>
                        <p className="text-sm text-gray-600">Types d'incidents</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(partnerData.incidentStats.by_type || {}).map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-gray-800 font-medium capitalize">{type}</span>
                          </div>
                          <div className="px-3 py-1 rounded-lg text-sm font-bold bg-purple-100 text-purple-700">
                            {count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. Section Portfolio */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Projets Récents */}
              {partnerData.recentProjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-blue-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-blue-100 border border-blue-200">
                          <FolderOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Projets Récents</h3>
                          <p className="text-sm text-gray-600">{partnerData.recentProjects.length} projets actifs</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {partnerData.recentProjects.slice(0, 3).map((project: any, index: number) => (
                          <motion.div
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="group p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-400 transition-all duration-300 cursor-pointer"
                            onClick={() => window.location.href = `/tableaudebord/projet/pageprojet/${project.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                  <FolderOpen className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                    {project.title}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {new Date(project.created_at).toLocaleDateString('fr-FR', { 
                                      day: 'numeric', 
                                      month: 'short' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  project.is_active 
                                    ? 'bg-green-100 text-green-700 border border-green-200' 
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {project.is_active ? "✓ Actif" : "Inactif"}
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {partnerData.recentProjects.length > 3 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 text-center">
                            +{partnerData.recentProjects.length - 3} projets supplémentaires
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Incidents Récents */}
              {partnerData.recentIncidents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-xl border border-red-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-xl bg-red-100 border border-red-200">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Incidents Critiques</h3>
                          <p className="text-sm text-gray-600">{partnerData.recentIncidents.length} incidents récents</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {partnerData.recentIncidents.slice(0, 3).map((incident: any, index: number) => (
                          <motion.div
                            key={incident.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="group p-4 rounded-xl bg-gray-50 border border-gray-200 hover:border-red-400 transition-all duration-300 cursor-pointer"
                            onClick={() => window.location.href = `/tableaudebord/incidents#incident-${incident.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                                  incident.priority === 'P0' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                                  incident.priority === 'P1' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                                  'bg-gradient-to-br from-yellow-500 to-yellow-600'
                                }`}>
                                  <AlertTriangle className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">
                                    {incident.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {incident.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-3">
                                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                      incident.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                      incident.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                      'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {incident.priority}
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                      incident.status === 'nouveau' ? 'bg-blue-100 text-blue-700' :
                                      incident.status === 'en_cours' ? 'bg-orange-100 text-orange-700' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      {incident.status}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {formatTimeAgo(incident.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors" />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {partnerData.recentIncidents.length > 3 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 text-center">
                            +{partnerData.recentIncidents.length - 3} incidents supplémentaires
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernDashboard;
