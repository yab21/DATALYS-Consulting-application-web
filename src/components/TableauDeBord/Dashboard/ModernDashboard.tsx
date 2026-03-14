"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";
import { useRouter } from 'next/navigation';
import {
  Users,
  FolderOpen,
  AlertTriangle,
  Zap,
  Target,
  RefreshCw,
  Activity,
  Building2,
  Clock,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpiredError } from "@/lib/api-interceptor";
import { dashboardService } from "@/services/dashboard";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
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

const ModernDashboard: React.FC = () => {
  const { user, isAdmin, isPartner, isLoading: authLoading } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const { finish } = useTopBarProgress();
  const router = useRouter();

  // Fonction utilitaire pour corriger les URLs d'images (adaptée pour HTTPS backend direct)
  const fixImageUrl = useCallback((url: string | undefined): string | undefined => {
    if (!url || url.trim() === '') return undefined;

    // Nettoyer l'URL
    const cleanUrl = url.trim();

    // Ignorer les URLs placeholder ou de test (validation par hostname exact)
    try {
      const urlObj = new URL(cleanUrl, 'https://placeholder.local');
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'example.com' || hostname === 'test.com' || hostname.includes('placeholder')) {
        return undefined;
      }
    } catch {
      // URL relative, continuer le traitement
    }

    // Nouveau format d'upload via /files/serve/ avec backend HTTPS direct
    if (cleanUrl.includes('/files/serve/')) {
      // Si c'est déjà une URL complète HTTPS, la garder telle quelle
      if (cleanUrl.startsWith('https://applicationweb.datalysconsulting.com/files/serve/')) {
        return cleanUrl;
      }

      // Si c'est un chemin /files/serve/, le convertir en URL complète HTTPS
      if (cleanUrl.startsWith('/files/serve/')) {
        return `https://applicationweb.datalysconsulting.com${cleanUrl}`;
      }

      // Si c'est un chemin files/serve/ relatif, ajouter le domaine
      if (cleanUrl.startsWith('files/serve/')) {
        return `https://applicationweb.datalysconsulting.com/${cleanUrl}`;
      }

      // Si c'est une URL complète avec /files/serve/, la convertir vers HTTPS
      if (cleanUrl.includes('/files/serve/')) {
        const pathMatch = cleanUrl.match(/\/files\/serve\/(.+)$/);
        if (pathMatch) {
          return `https://applicationweb.datalysconsulting.com/files/serve/${pathMatch[1]}`;
        }
      }
    }

    // Ancien format avec serveur d'images statiques - convertir vers HTTPS
    if (cleanUrl.includes('82.112.253.137:8082')) {
      return cleanUrl.replace('http://82.112.253.137:8082', 'https://applicationweb.datalysconsulting.com/api');
    }

    // URLs avec ancien localhost - convertir vers HTTPS
    if (cleanUrl.includes('localhost:8081') || cleanUrl.includes('82.112.253.137:8081')) {
      const pathMatch = cleanUrl.match(/\/uploads\/logos\/(.+)$/);
      if (pathMatch) {
        const filename = pathMatch[1];
        return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
      }
    }

    // URLs relatives /uploads/ - utiliser l'ancien système d'images statiques
    if (cleanUrl.startsWith('/uploads/logos/')) {
      const filename = cleanUrl.replace('/uploads/logos/', '');
      return `${process.env.NEXT_PUBLIC_IMAGES_BASE_URL || 'https://applicationweb.datalysconsulting.com/static'}/uploads/logos/${filename}`;
    }

    // URLs relatives backend - convertir vers URL complète HTTPS
    if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('/uploads/') && !cleanUrl.startsWith('/files/serve/')) {
      return `https://applicationweb.datalysconsulting.com${cleanUrl}`;
    }

    // Si c'est une URL absolue HTTPS valide, la retourner telle quelle
    if (cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    // Convertir les URLs HTTP vers HTTPS
    if (cleanUrl.startsWith('http://')) {
      return cleanUrl.replace('http://', 'https://');
    }

    // Pour les autres URLs relatives, les préfixer avec le domaine HTTPS
    if (cleanUrl.startsWith('/')) {
      return `https://applicationweb.datalysconsulting.com${cleanUrl}`;
    }

    return cleanUrl;
  }, []);

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
  const partnersPerPage = 8;
  


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

            // Calculer les partenaires actifs (basé sur is_active, pas sur active_projects)
            const activePartners = partnerStatsData.filter((p: any) => p.is_active === true).length;

            // Calculer les totaux incidents depuis recent_incidents
            const totalIncidents = recentIncidents.length;
            // Incidents critiques = priorité P0 ou P1
            const criticalIncidents = recentIncidents.filter((i: any) => ['P0', 'P1'].includes(i.priority)).length;
            const openIncidents = recentIncidents.filter((i: any) => ['nouveau', 'ouvert', 'en_cours'].includes(i.status)).length;
            const resolvedIncidents = recentIncidents.filter((i: any) => ['resolu', 'ferme'].includes(i.status)).length;

            // Calculer les messages depuis recent_activity
            const totalMessages = recentActivity.filter((a: any) => a.entity_type === 'message').length;
            const unreadMessages = recentIncidents.filter((i: any) => !i.is_read && i.type === 'message').length;

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
                active: activePartners,
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
                total: totalMessages,
                unread: unreadMessages,
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
          if (isTokenExpiredError(error)) throw error;
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
          if (isTokenExpiredError(error)) throw error;

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
      if (isTokenExpiredError(error)) throw error;
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
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions rapides skeleton */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4 animate-pulse"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Activity skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4 animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
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
          className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 mb-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  DATALYS Dashboard
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Bonjour, <span className="font-medium">{user?.name}</span> • {isAdmin() ? 'Administrateur' : 'Partenaire'}
              </p>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-1">
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 text-sm bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Système Opérationnel</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Partenaire */}
        {isPartner() && partnerData && (
          <div className="space-y-8">
            {/* 1. Métriques Exécutives */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {/* Carte Projets */}
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                    <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{partnerData.projectStats.total}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Projets</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Actifs</span>
                    <span className="text-gray-900 dark:text-white font-medium">{partnerData.projectStats.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Terminés</span>
                    <span className="text-gray-900 dark:text-white font-medium">{partnerData.projectStats.completed}</span>
                  </div>
                </div>
              </div>

              {/* Carte Incidents */}
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/30">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{partnerData.incidentStats.total}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Incidents</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ouverts</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {(partnerData.incidentStats.by_status?.nouveau || 0) + (partnerData.incidentStats.by_status?.en_cours || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Critiques</span>
                    <span className="text-red-600 font-medium">{partnerData.incidentStats.by_priority?.P0 || 0}</span>
                  </div>
                </div>
              </div>

              {/* Carte Performance */}
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/30">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">98.5%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Uptime</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ce mois</span>
                    <span className="text-gray-900 dark:text-white font-medium">99.2%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">SLA</span>
                    <span className="text-green-600 font-medium">Respecté</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. Analytics Avancées */}
            {partnerData.incidentStats.total > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid gap-6 lg:grid-cols-3"
              >
                {/* Statut des Incidents */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                      <Target className="w-5 h-5 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Incidents par Statut</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{partnerData.incidentStats.total} au total</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(partnerData.incidentStats.by_status || {}).map(([status, count]: [string, any]) => (
                      <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'nouveau' ? 'bg-blue-500' :
                            status === 'en_cours' ? 'bg-orange-500' :
                            status === 'resolu' ? 'bg-green-500' : 'bg-gray-500'
                          }`}></div>
                          <span className="text-gray-800 dark:text-gray-200 font-medium capitalize">{status.replace('_', ' ')}</span>
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

                {/* Priorités */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/30">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Par Priorité</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Classification SLA</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(partnerData.incidentStats.by_priority || {}).map(([priority, count]: [string, any]) => (
                      <div key={priority} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            priority === 'P0' ? 'bg-red-500' :
                            priority === 'P1' ? 'bg-orange-500' :
                            priority === 'P2' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-gray-800 dark:text-gray-200 font-medium">{priority}</span>
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

                {/* Types */}
                <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-900/30">
                      <XCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Par Catégorie</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Types d'incidents</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(partnerData.incidentStats.by_type || {}).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="text-gray-800 dark:text-gray-200 font-medium capitalize">{type}</span>
                        </div>
                        <div className="px-3 py-1 rounded-lg text-sm font-bold bg-purple-100 text-purple-700">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. Section Portfolio */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Projets Récents */}
              {partnerData.recentProjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                        <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Projets Récents</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{partnerData.recentProjects.length} projets actifs</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {partnerData.recentProjects.slice(0, 3).map((project: any) => (
                        <div
                          key={project.id}
                          className="group flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-[#4ba9b7] transition-all duration-300 cursor-pointer"
                          onClick={() => window.location.href = `/tableaudebord/projet/pageprojet/${project.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                              <FolderOpen className="w-4 h-4 text-[#4ba9b7]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#4ba9b7] transition-colors text-sm">
                                {project.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(project.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              project.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {project.is_active ? "Actif" : "Inactif"}
                            </span>
                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#4ba9b7] transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {partnerData.recentProjects.length > 3 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          +{partnerData.recentProjects.length - 3} projets supplémentaires
                        </p>
                      </div>
                    )}
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
                  <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/30">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Incidents Récents</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{partnerData.recentIncidents.length} incidents récents</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {partnerData.recentIncidents.slice(0, 3).map((incident: any) => (
                        <div
                          key={incident.id}
                          className="group flex items-start justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-red-400 transition-all duration-300 cursor-pointer"
                          onClick={() => window.location.href = `/tableaudebord/incidents/${incident.id}`}
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`mt-0.5 p-2 rounded-md ${
                              incident.priority === 'P0' ? 'bg-red-50 dark:bg-red-900/30' :
                              incident.priority === 'P1' ? 'bg-orange-50 dark:bg-orange-900/30' :
                              'bg-yellow-50 dark:bg-yellow-900/30'
                            }`}>
                              <AlertTriangle className={`w-4 h-4 ${
                                incident.priority === 'P0' ? 'text-red-600' :
                                incident.priority === 'P1' ? 'text-orange-600' : 'text-yellow-600'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-red-600 transition-colors text-sm truncate">
                                {incident.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  incident.priority === 'P0' ? 'bg-red-100 text-red-700' :
                                  incident.priority === 'P1' ? 'bg-orange-100 text-orange-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>{incident.priority}</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  incident.status === 'nouveau' ? 'bg-blue-100 text-blue-700' :
                                  incident.status === 'en_cours' ? 'bg-orange-100 text-orange-700' :
                                  'bg-green-100 text-green-700'
                                }`}>{incident.status}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimeAgo(incident.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors ml-2 flex-shrink-0" />
                        </div>
                      ))}
                    </div>

                    {partnerData.recentIncidents.length > 3 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          +{partnerData.recentIncidents.length - 3} incidents supplémentaires
                        </p>
                      </div>
                    )}
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
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {/* Carte Projets */}
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                    <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.projects.total}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Projets</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Actifs</span>
                    <span className="text-gray-900 dark:text-white font-medium">{stats.projects.active}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Terminés</span>
                    <span className="text-gray-900 dark:text-white font-medium">{stats.projects.completed}</span>
                  </div>
                </div>
              </div>

              {/* Carte Partenaires */}
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/30">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.partners.total}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Partenaires</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Actifs</span>
                    <span className="text-gray-900 dark:text-white font-medium">{stats.partners.active}</span>
                  </div>
                </div>
              </div>

              {/* Carte Incidents */}
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/30">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.incidents?.total || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Incidents</div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Ouverts</span>
                    <span className="text-gray-900 dark:text-white font-medium">{stats.incidents?.open || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Critiques</span>
                    <span className="text-red-600 font-medium">{stats.incidents?.critical || 0}</span>
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
              <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                      <Building2 className="w-6 h-6 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Partenaires & Projets</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Vue d'ensemble de tous les partenaires</p>
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
                              {fixImageUrl(partner.logo_url) ? (
                                <div className="w-12 h-12 rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center p-1 shadow-sm flex-shrink-0">
                                  <img
                                    src={fixImageUrl(partner.logo_url)!}
                                    alt={`Logo ${partner.partner_name}`}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-lg font-bold text-white">${partner.partner_name?.charAt(0) || 'P'}</span>`;
                                      (e.target as HTMLImageElement).parentElement!.className = 'w-12 h-12 rounded-md bg-[#4ba9b7] flex items-center justify-center flex-shrink-0';
                                    }}
                                  />
                                </div>
                              ) : (
                                <Avatar
                                  name={partner.partner_name}
                                  size="md"
                                  className="bg-[#4ba9b7] text-white font-bold flex-shrink-0"
                                  showFallback
                                />
                              )}
                              <div>
                                <p
                                  className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-[#4ba9b7] transition-colors"
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
                              color={partner.is_active ? "success" : "default"}
                              startContent={
                                partner.is_active ?
                                <div className="w-2 h-2 rounded-full bg-green-500"></div> :
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                              }
                            >
                              {partner.is_active ? 'Actif' : 'Inactif'}
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
                              <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div 
                                  className="bg-[#4ba9b7] h-2 rounded-full" 
                                  style={{ 
                                    width: `${partner.total_projects > 0 ? (partner.active_projects / partner.total_projects) * 100 : 0}%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
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


          </div>
        )}
      </div>
    </div>
  );
};

export default ModernDashboard;
