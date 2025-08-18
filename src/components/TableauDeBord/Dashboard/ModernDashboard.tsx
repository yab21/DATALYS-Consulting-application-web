"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  Button,
  Chip,
} from "@nextui-org/react";
import {
  Users,
  FolderOpen,
  FileText,
  AlertTriangle,
  BarChart3,
  Calendar,
  MessageCircle,
  Shield,
  Zap,
  Target,
  Upload,
  Plus,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { dashboardService } from "@/services/dashboard";
import { useNotifications } from "@/components/UI/Notifications/NotificationSystem";

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
  color: string;
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
  const { user, userWithPermissions, isAdmin, isPartner, hasPermission, isLoading: authLoading } = useAuth();
  const { showNotification } = useNotifications();
  
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

  // Actions rapides configurables selon le rôle
  const quickActions: QuickAction[] = [
    {
      id: "new-project",
      title: "Nouveau Projet",
      description: "Créer un nouveau projet",
      icon: <Plus className="h-5 w-5" />,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      action: () => window.location.href = "/tableaudebord/projet/ajouter",
      permission: Permission.CREATE_PROJECTS_ALL_PARTNERS,
    },
    {
      id: "add-partner",
      title: "Ajouter Partenaire",
      description: "Inviter un nouveau partenaire",
      icon: <Users className="h-5 w-5" />,
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      action: () => window.location.href = "/tableaudebord/partenaire/ajouter",
      permission: Permission.CREATE_PARTNERS,
    },
    {
      id: "upload-files",
      title: "Upload Fichiers",
      description: "Gérer les documents",
      icon: <Upload className="h-5 w-5" />,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      action: () => window.location.href = "/tableaudebord/lesdossiers",
    },
    {
      id: "messages",
      title: "Messages",
      description: "Centre de communication",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "bg-gradient-to-r from-orange-500 to-orange-600",
      action: () => window.location.href = "/tableaudebord/messages",
    },
    {
      id: "support",
      title: "Support",
      description: "Assistance technique",
      icon: <Shield className="h-5 w-5" />,
      color: "bg-gradient-to-r from-red-500 to-red-600",
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
  }, [authLoading, user, isAdmin, isPartner]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 Chargement des données dashboard...");
      console.log("👤 Utilisateur:", {
        id: user?.id,
        name: user?.name,
        role_id: user?.role_id,
        partner_id: user?.partner_id,
        isAdmin: isAdmin(),
        isPartner: isPartner()
      });
      
      if (isAdmin()) {
        // Charger les données admin
        const adminDashboard = await dashboardService.getDashboardAdmin();
        console.log("📡 Réponse API admin:", adminDashboard);
        
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
      } else if (isPartner()) {
        console.log("🤝 Chargement des données partenaire...");
        
        // Utiliser l'ID utilisateur comme partner_id temporairement
        // car partner_id n'est pas fourni dans la réponse de connexion
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

  if (authLoading || !user || loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardBody className="p-6">
                <div className="h-20 bg-gray-200 rounded dark:bg-gray-700"></div>
              </CardBody>
            </Card>
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
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Bonjour, {user?.name} 👋
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Voici un aperçu de votre activité aujourd'hui
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            isIconOnly
            onPress={async () => {
              setRefreshing(true);
              await loadDashboardData();
              setRefreshing(false);
              showNotification({
                type: "success",
                title: "Données actualisées",
                message: "Le dashboard a été mis à jour avec les dernières données",
                duration: 3000,
              });
            }}
            isLoading={refreshing}
            className="bg-white/70 dark:bg-slate-800/70"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Dashboard Overview - Données selon le rôle */}
      {(isAdmin() || isPartner()) && (
        <div className="space-y-8">
          {/* 1. Global Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isAdmin() ? "Résumé Global" : "Mes Statistiques"}
                  </h3>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Projets</p>
                        <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">{stats.projects.total}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{stats.projects.active} actifs</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">Total Fichiers</p>
                        <p className="text-2xl font-bold text-green-800 dark:text-green-200">{stats.files.total}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">documents stockés</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm text-red-600 dark:text-red-400">Total Incidents</p>
                        <p className="text-2xl font-bold text-red-800 dark:text-red-200">{stats.incidents?.total}</p>
                        <p className="text-xs text-red-600 dark:text-red-400">{stats.incidents?.open} ouverts, {stats.incidents?.critical} critiques</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* 2. Partner Stats - Seulement pour les admins */}
          {isAdmin() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Statistiques des Partenaires ({stats.partners.total} total)
                  </h3>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {partnerStats.map((partner: any) => (
                    <div key={partner.partner_id} className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-purple-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-purple-800 dark:text-purple-200">{partner.partner_name}</p>
                          <p className="text-sm text-purple-600 dark:text-purple-400">ID: {partner.partner_id}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              Total projets: <span className="font-medium">{partner.total_projects}</span>
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              Projets actifs: <span className="font-medium">{partner.active_projects}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
          )}

          {/* 3. Incident Priority Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="h-5 w-5 text-orange-600" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Incidents par Priorité
                  </h3>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(incidentPriorityStats).map(([priority, count]: [string, any]) => (
                    <div key={priority} className={`p-4 rounded-lg ${
                      priority === 'critique' ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20' :
                      priority === 'haute' ? 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20' :
                      priority === 'moyenne' ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20' :
                      'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-6 w-6 ${
                          priority === 'critique' ? 'text-red-600' :
                          priority === 'haute' ? 'text-orange-600' :
                          priority === 'moyenne' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                        <div>
                          <p className={`font-semibold capitalize ${
                            priority === 'critique' ? 'text-red-800 dark:text-red-200' :
                            priority === 'haute' ? 'text-orange-800 dark:text-orange-200' :
                            priority === 'moyenne' ? 'text-yellow-800 dark:text-yellow-200' :
                            'text-gray-800 dark:text-gray-200'
                          }`}>{priority}</p>
                          <p className={`text-2xl font-bold ${
                            priority === 'critique' ? 'text-red-800 dark:text-red-200' :
                            priority === 'haute' ? 'text-orange-800 dark:text-orange-200' :
                            priority === 'moyenne' ? 'text-yellow-800 dark:text-yellow-200' :
                            'text-gray-800 dark:text-gray-200'
                          }`}>{count}</p>
                          <p className={`text-xs ${
                            priority === 'critique' ? 'text-red-600 dark:text-red-400' :
                            priority === 'haute' ? 'text-orange-600 dark:text-orange-400' :
                            priority === 'moyenne' ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>incidents</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* 4. Recent Incidents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Incidents Récents ({activities.length})
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'danger' ? 'bg-red-500' :
                          activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white">{activity.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{activity.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{activity.time}</p>
                        </div>
                        <Chip 
                          size="sm" 
                          color={
                            activity.status === 'danger' ? 'danger' :
                            activity.status === 'warning' ? 'warning' : 'primary'
                          }
                          variant="flat"
                        >
                          {activity.type}
                        </Chip>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                      Aucun incident récent
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* 5. Actions rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/70 backdrop-blur-sm dark:bg-slate-800/70">
              <CardBody className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Actions Rapides
                  </h3>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {availableActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card 
                        isPressable
                        onPress={action.action}
                        className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800"
                      >
                        <CardBody className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`${action.color} rounded-xl p-3 text-white shadow-lg`}>
                              {action.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 dark:text-white">
                                {action.title}
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {action.description}
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default ModernDashboard;