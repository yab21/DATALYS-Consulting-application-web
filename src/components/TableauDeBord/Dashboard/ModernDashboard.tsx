"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";
import { useRouter } from 'next/navigation';
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
  Eye,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { dashboardService } from "@/services/dashboard";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { ProfessionalCard } from "@/components/UI/Professional";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Pagination,
} from "@heroui/react";

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
  const router = useRouter();
  
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
  const [adminData, setAdminData] = useState<any>(null);
  
  // États pour la pagination des tables
  const [partnersPage, setPartnersPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const partnersPerPage = 8;
  const activitiesPerPage = 10;
  


  // Actions rapides configurables selon le rôle (non utilisées pour le moment)
  /* const quickActions: QuickAction[] = [
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
  ]; */

  // Filtrer les actions selon les permissions (non utilisé pour le moment)
  /* const availableActions = quickActions.filter(action => 
    !action.permission || hasPermission(action.permission)
  ); */

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
        // ✅ Nouvelle API admin disponible sur /dashboard/admin (POST)
        
        try {
          const adminDashboard = await dashboardService.getDashboardAdmin();
          
          if (adminDashboard && adminDashboard.code === 200 && adminDashboard.data) {
            const data = adminDashboard.data;
            
            // Extraire les données de la nouvelle API
            const partnerStatsData = data.partner_stats || [];
            const recentIncidents = data.recent_incidents || [];
            const recentActivity = data.recent_activity || [];
            const incidentPriorityData = data.incident_priority_stats || {};
            const globalActivityStats = data.global_activity_stats || {};
            
            // Calculer les totaux à partir des données partenaires
            const totalProjects = partnerStatsData.reduce((sum: number, p: any) => sum + (p.total_projects || 0), 0);
            const activeProjects = partnerStatsData.reduce((sum: number, p: any) => sum + (p.active_projects || 0), 0);
            const completedProjects = totalProjects - activeProjects;
            
            // Calculer les totaux incidents par priorité
            const totalIncidents = Object.values(incidentPriorityData).reduce((sum: number, count: any) => sum + (count || 0), 0);
            const criticalIncidents = incidentPriorityData.critique || 0;
            const openIncidents = recentIncidents.filter((i: any) => ['nouveau', 'ouvert', 'en_cours'].includes(i.status)).length;
            const resolvedIncidents = recentIncidents.filter((i: any) => ['resolu', 'ferme'].includes(i.status)).length;
            
            // Convertir pour le format local
            setStats({
              projects: {
                total: totalProjects,
                active: activeProjects,
                completed: completedProjects,
                pending: 0,
                growth: 0,
              },
              partners: {
                total: partnerStatsData.length,
                active: partnerStatsData.filter((p: any) => p.active_projects > 0).length,
                new_this_month: 0,
                growth: 0,
              },
              files: {
                total: globalActivityStats.total_actions || 0,
                size_gb: 0,
                recent_uploads: recentActivity.filter((a: any) => a.action_type === 'CREATE' && a.entity_type === 'file').length,
                growth: 0,
              },
              messages: {
                total: recentActivity.filter((a: any) => ['message', 'notification'].includes(a.entity_type)).length,
                unread: recentIncidents.filter((i: any) => !i.is_read).length,
                support_tickets: recentIncidents.filter((i: any) => i.type === 'support').length,
                growth: 0,
              },
              incidents: {
                total: totalIncidents,
                open: openIncidents,
                critical: criticalIncidents,
                resolved: resolvedIncidents,
                growth: 0,
              },
            });

            // Stocker toutes les données admin pour usage ultérieur
            const adminDataToStore = {
              partnerStats: partnerStatsData,
              recentIncidents: recentIncidents,
              recentActivity: recentActivity,
              incidentPriorityStats: incidentPriorityData,
              globalActivityStats: globalActivityStats
            };
            
            console.log('📊 Données admin stockées:', adminDataToStore);
            setAdminData(adminDataToStore);
            
          } else {
            console.warn('⚠️ Réponse API admin invalide ou vide');
            // Fallback sur des données par défaut
            setStats({
              projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
              partners: { total: 0, active: 0, new_this_month: 0, growth: 0 },
              files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
              messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
              incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
            });
            setAdminData(null);
          }
          
        } catch (error) {
          console.error('❌ Erreur lors du chargement du dashboard admin:', error);
          // Fallback sur des données par défaut en cas d'erreur
          setStats({
            projects: { total: 0, active: 0, completed: 0, pending: 0, growth: 0 },
            partners: { total: 0, active: 0, new_this_month: 0, growth: 0 },
            files: { total: 0, size_gb: 0, recent_uploads: 0, growth: 0 },
            messages: { total: 0, unread: 0, support_tickets: 0, growth: 0 },
            incidents: { total: 0, open: 0, critical: 0, resolved: 0, growth: 0 },
          });
          setAdminData(null);
        }
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

  const handleViewPartner = (partnerId: number) => {
    router.push(`/tableaudebord/partenaire/details/${partnerId}`);
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
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions rapides skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Activity skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
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
          className="relative overflow-hidden rounded-lg bg-white p-6 mb-6 shadow-sm border border-gray-200"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  DATALYS Dashboard
                </h1>
              </div>
              <p className="text-gray-600">
                Bonjour, <span className="font-medium">{user?.name}</span> • {isAdmin() ? 'Administrateur' : 'Partenaire'}
              </p>
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 text-sm bg-green-50 text-green-700 rounded-md border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Système Opérationnel</span>
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
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-[#4ba9b7] flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {partnerData.partner.name}
                      </h2>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        partnerData.partner.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {partnerData.partner.is_active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span>{partnerData.partner.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Tél:</span>
                        <span>{partnerData.partner.phone_formatted}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Pays:</span>
                        <span>{partnerData.partner.country_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span>ID #{partnerData.partner.id}</span>
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
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                    <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{partnerData.projectStats.total}</div>
                    <div className="text-xs text-gray-500 uppercase">Projets</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Actifs</span>
                    <span className="text-gray-900 font-medium">{partnerData.projectStats.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Terminés</span>
                    <span className="text-gray-900 font-medium">{partnerData.projectStats.completed}</span>
                  </div>
                </div>
              </div>

              {/* Carte Incidents */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-red-50">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{partnerData.incidentStats.total}</div>
                    <div className="text-xs text-gray-500 uppercase">Incidents</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ouverts</span>
                    <span className="text-gray-900 font-medium">
                      {(partnerData.incidentStats.by_status?.nouveau || 0) + (partnerData.incidentStats.by_status?.en_cours || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Critiques</span>
                    <span className="text-red-600 font-medium">{partnerData.incidentStats.by_priority?.P0 || 0}</span>
                  </div>
                </div>
              </div>

              {/* Carte Performance */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-green-50">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">98.5%</div>
                    <div className="text-xs text-gray-500 uppercase">Uptime</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ce mois</span>
                    <span className="text-gray-900 font-medium">99.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">SLA</span>
                    <span className="text-green-600 font-medium">Respecté</span>
                  </div>
                </div>
              </div>

              {/* Carte Activité */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-purple-50">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{partnerData.activitySummary.active_sessions || 12}</div>
                    <div className="text-xs text-gray-500 uppercase">Sessions</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Utilisateurs</span>
                    <span className="text-gray-900 font-medium">{partnerData.activitySummary.active_users || 8}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pics</span>
                    <span className="text-gray-900 font-medium">15</span>
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
                            onClick={() => window.location.href = `/tableaudebord/projet/gerer`}
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

        {/* Dashboard Admin avec données API réelles */}
        {isAdmin() && adminData && (
          <div className="space-y-8">
            {/* 1. Métriques Exécutives Admin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            >
              {/* Carte Projets */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                    <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.projects.total}</div>
                    <div className="text-xs text-gray-500 uppercase">Projets</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Actifs</span>
                    <span className="text-gray-900 font-medium">{stats.projects.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Terminés</span>
                    <span className="text-gray-900 font-medium">{stats.projects.completed}</span>
                  </div>
                </div>
              </div>

              {/* Carte Partenaires */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-green-50">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.partners.total}</div>
                    <div className="text-xs text-gray-500 uppercase">Partenaires</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Actifs</span>
                    <span className="text-gray-900 font-medium">{stats.partners.active}</span>
                  </div>
                </div>
              </div>

              {/* Carte Incidents */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-red-50">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.incidents?.total || 0}</div>
                    <div className="text-xs text-gray-500 uppercase">Incidents</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ouverts</span>
                    <span className="text-gray-900 font-medium">{stats.incidents?.open || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Critiques</span>
                    <span className="text-red-600 font-medium">{stats.incidents?.critical || 0}</span>
                  </div>
                </div>
              </div>

              {/* Carte Messages */}
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-purple-50">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{stats.messages.total}</div>
                    <div className="text-xs text-gray-500 uppercase">Messages</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Non lus</span>
                    <span className="text-gray-900 font-medium">{stats.messages.unread}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Vue d'ensemble des Partenaires - Table Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                      <Building2 className="w-6 h-6 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Partenaires & Projets</h3>
                      <p className="text-sm text-gray-600">Vue d'ensemble de tous les partenaires</p>
                    </div>
                  </div>
                </div>
                  
                  <Table aria-label="Table des partenaires" className="min-h-[400px]">
                    <TableHeader>
                      <TableColumn>PARTENAIRE</TableColumn>
                      <TableColumn>STATUT</TableColumn>
                      <TableColumn>PROJETS TOTAL</TableColumn>
                      <TableColumn>PROJETS ACTIFS</TableColumn>
                      <TableColumn>TAUX D'ACTIVITÉ</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Aucun partenaire trouvé">
                      {adminData.partnerStats
                        .slice((partnersPage - 1) * partnersPerPage, partnersPage * partnersPerPage)
                        .map((partner: any) => (
                        <TableRow key={partner.partner_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={partner.partner_name}
                                size="sm"
                                className="bg-[#4ba9b7] text-white"
                              />
                              <div>
                                <p 
                                  className="font-semibold text-gray-900 cursor-pointer hover:text-[#4ba9b7] transition-colors"
                                  onClick={() => handleViewPartner(partner.partner_id)}
                                >
                                  {partner.partner_name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              color={partner.active_projects > 0 ? "success" : "default"}
                              startContent={
                                partner.active_projects > 0 ? 
                                <div className="w-2 h-2 rounded-full bg-green-500"></div> :
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              }
                            >
                              {partner.active_projects > 0 ? 'Actif' : 'Inactif'}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FolderOpen className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-blue-600">{partner.total_projects}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-green-500" />
                              <span className="font-medium text-green-600">{partner.active_projects}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-[#4ba9b7] h-2 rounded-full" 
                                  style={{ 
                                    width: `${partner.total_projects > 0 ? (partner.active_projects / partner.total_projects) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600">
                                {partner.total_projects > 0 ? Math.round((partner.active_projects / partner.total_projects) * 100) : 0}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination des partenaires */}
                  {adminData.partnerStats.length > partnersPerPage && (
                    <div className="flex justify-center mt-6">
                      <Pagination
                        total={Math.ceil(adminData.partnerStats.length / partnersPerPage)}
                        page={partnersPage}
                        onChange={setPartnersPage}
                        showControls
                        showShadow
                        color="primary"
                      />
                    </div>
                  )}
              </div>
            </motion.div>

            {/* 3. Journal d'Activité - Table Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-purple-50">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Journal d'Activité</h3>
                      <p className="text-sm text-gray-600">Activités récentes du système</p>
                    </div>
                  </div>
                </div>
                  
                  <Table aria-label="Table des activités" className="min-h-[400px]">
                    <TableHeader>
                      <TableColumn>ACTION</TableColumn>
                      <TableColumn>UTILISATEUR</TableColumn>
                      <TableColumn>DESCRIPTION</TableColumn>
                      <TableColumn>TYPE</TableColumn>
                      <TableColumn>DATE</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Aucune activité trouvée">
                      {adminData.recentActivity
                        .slice((activitiesPage - 1) * activitiesPerPage, activitiesPage * activitiesPerPage)
                        .map((activity: any) => (
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                activity.action_type === 'CREATE' ? 'bg-green-50 text-green-600' :
                                activity.action_type === 'UPDATE' ? 'bg-blue-50 text-blue-600' :
                                'bg-purple-50 text-purple-600'
                              }`}>
                                {activity.action_type === 'CREATE' ? <Plus className="w-4 h-4" /> :
                                 activity.action_type === 'UPDATE' ? <RefreshCw className="w-4 h-4" /> :
                                 <MessageCircle className="w-4 h-4" />}
                              </div>
                              <div>
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={activity.action_type === 'CREATE' ? 'success' :
                                        activity.action_type === 'UPDATE' ? 'primary' : 'secondary'}
                                >
                                  {activity.action_type}
                                </Chip>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar
                                name={activity.user_name}
                                size="sm"
                                className="bg-[#4ba9b7] text-white"
                              />
                              <span className="font-medium text-gray-800">{activity.user_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-800 line-clamp-2">{activity.description}</p>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              variant="flat"
                              color="default"
                            >
                              {activity.entity_type}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {new Date(activity.created_at).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(activity.created_at).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination des activités */}
                  {adminData.recentActivity.length > activitiesPerPage && (
                    <div className="flex justify-center mt-6">
                      <Pagination
                        total={Math.ceil(adminData.recentActivity.length / activitiesPerPage)}
                        page={activitiesPage}
                        onChange={setActivitiesPage}
                        showControls
                        showShadow
                        color="primary"
                      />
                    </div>
                  )}
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ModernDashboard;
