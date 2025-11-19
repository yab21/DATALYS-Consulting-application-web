"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Avatar, 
  Button, 
  Chip,
  Input,
  Select,
  SelectItem,
  Pagination
} from "@nextui-org/react";
import { 
  Activity, 
  Search, 
  Filter,
  Calendar,
  User,
  FileText,
  FolderOpen,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Download,
  Upload,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { dashboardService, DashboardAdminResponse, RecentActivity } from "@/services/dashboard";
import LoadingState from "@/components/UI/Loading/LoadingState";

interface ProjectActivityProps {
  projectId: string;
  projectName: string;
}

const ProjectActivity: React.FC<ProjectActivityProps> = ({ projectId, projectName }) => {
  const { user, isAdmin } = useAuth();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("tous");
  const [dateFilter, setDateFilter] = useState("tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const itemsPerPage = 10;

  // Types d'actions disponibles dans les données
  const availableActions = React.useMemo(() => {
    return [...new Set(activities.map(a => a.action_type))].filter(Boolean);
  }, [activities]);

  // Charger les activités
  useEffect(() => {
    loadProjectActivities();
  }, [projectId]);

  // Filtrer les activités
  useEffect(() => {
    let filtered = [...activities];

    // Filtrage par recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(activity =>
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.action_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par type d'action
    if (actionFilter !== "tous") {
      filtered = filtered.filter(activity => activity.action_type === actionFilter);
    }

    // Filtrage par date
    if (dateFilter !== "tous") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      if (dateFilter !== "tous") {
        filtered = filtered.filter(activity => 
          new Date(activity.created_at) >= filterDate
        );
      }
    }

    setFilteredActivities(filtered);
    setTotalActivities(filtered.length);
    setCurrentPage(1); // Reset à la page 1 quand on filtre
  }, [activities, searchTerm, actionFilter, dateFilter]);

  const loadProjectActivities = async () => {
    try {
      setLoading(true);
      
      if (user?.id) {
        // Récupérer toutes les activités via le dashboard admin
        const dashboardData = await dashboardService.getDashboardAdmin();
        
        if (dashboardData.code === 200 && dashboardData.data.recent_activity) {
          // Filtrer les activités liées au projet (par entity_id si possible)
          const projectActivities = dashboardData.data.recent_activity.filter(activity => {
            // Si l'activité a un entity_id qui correspond au projectId
            if (activity.entity_id && activity.entity_id.toString() === projectId) {
              return true;
            }
            
            // Ou si la description contient des références au projet
            if (activity.description?.includes(`projet ${projectId}`) || 
                activity.description?.includes(`project ${projectId}`)) {
              return true;
            }
            
            // Ou si le type d'entité est lié aux projets
            if (activity.entity_type === 'project' && activity.entity_id?.toString() === projectId) {
              return true;
            }
            
            return false;
          });
          
          // Si aucune activité spécifique au projet, prendre les plus récentes
          const activitiesToShow = projectActivities.length > 0 
            ? projectActivities 
            : dashboardData.data.recent_activity.slice(0, 20);
          
          setActivities(activitiesToShow);
        } else {
          setActivities([]);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'create':
      case 'created':
        return <FileText className="w-4 h-4" />;
      case 'update':
      case 'updated':
      case 'edit':
        return <Edit className="w-4 h-4" />;
      case 'delete':
      case 'deleted':
        return <Trash2 className="w-4 h-4" />;
      case 'upload':
      case 'uploaded':
        return <Upload className="w-4 h-4" />;
      case 'download':
      case 'downloaded':
        return <Download className="w-4 h-4" />;
      case 'login':
        return <User className="w-4 h-4" />;
      case 'logout':
        return <Settings className="w-4 h-4" />;
      case 'folder':
        return <FolderOpen className="w-4 h-4" />;
      case 'team':
      case 'member':
        return <Users className="w-4 h-4" />;
      case 'incident':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'create':
      case 'created':
      case 'upload':
      case 'uploaded':
        return "success";
      case 'update':
      case 'updated':
      case 'edit':
        return "warning";
      case 'delete':
      case 'deleted':
        return "danger";
      case 'login':
        return "primary";
      case 'incident':
        return "danger";
      case 'resolved':
      case 'completed':
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(totalActivities / itemsPerPage);

  // Préparer les éléments du Select
  const actionSelectItems = React.useMemo(() => {
    const items = [<SelectItem key="tous">Toutes les actions</SelectItem>];
    availableActions.forEach((action) => {
      items.push(<SelectItem key={action}>{action}</SelectItem>);
    });
    return items;
  }, [availableActions]);

  if (loading) {
    return <LoadingState type="skeleton" skeletonVariant="table" />;
  }


  // Calcul des statistiques
  const stats = {
    total: activities.length,
    today: activities.filter(a => {
      const today = new Date();
      const activityDate = new Date(a.created_at);
      return activityDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: activities.filter(a => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(a.created_at) >= weekAgo;
    }).length,
    users: [...new Set(activities.map(a => a.user_id))].length
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 min-h-[600px] space-y-8">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Activité du projet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Journal complet des actions et événements du projet "{projectName}"
          </p>
        </div>
        <Button
          variant="flat"
          startContent={<RefreshCw className="w-4 h-4" />}
          onPress={loadProjectActivities}
        >
          Actualiser
        </Button>
      </div>

      {/* Statistiques de l'activité */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Activités totales</p>
          </CardBody>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.today}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">Aujourd'hui</p>
          </CardBody>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.thisWeek}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Cette semaine</p>
          </CardBody>
        </Card>
        
        <Card className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
          <CardBody className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.users}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Utilisateurs actifs</p>
          </CardBody>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-white dark:bg-gray-800">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Rechercher une activité..."
              startContent={<Search className="w-4 h-4 text-gray-400" />}
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex-1"
            />
            
            <Select
              placeholder="Type d'action"
              selectedKeys={[actionFilter]}
              onSelectionChange={(keys) => setActionFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              {actionSelectItems}
            </Select>
            
            <Select
              placeholder="Période"
              selectedKeys={[dateFilter]}
              onSelectionChange={(keys) => setDateFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="tous">Toutes les dates</SelectItem>
              <SelectItem key="today">Aujourd'hui</SelectItem>
              <SelectItem key="week">Cette semaine</SelectItem>
              <SelectItem key="month">Ce mois-ci</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Timeline d'activités */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Journal d'activité
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {filteredActivities.length} activité{filteredActivities.length !== 1 ? 's' : ''} trouvée{filteredActivities.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {paginatedActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Aucune activité trouvée
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Aucune activité ne correspond à vos critères de recherche.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                >
                  {/* Icône d'action */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    getActionColor(activity.action_type) === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                    getActionColor(activity.action_type) === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                    getActionColor(activity.action_type) === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                    getActionColor(activity.action_type) === 'primary' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                    {getActionIcon(activity.action_type)}
                  </div>

                  {/* Contenu de l'activité */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {activity.user_name || 'Utilisateur inconnu'}
                          </p>
                          <Chip
                            color={getActionColor(activity.action_type) as any}
                            size="sm"
                            variant="flat"
                            className="font-medium"
                          >
                            {activity.action_type}
                          </Chip>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {activity.description || 'Aucune description disponible'}
                        </p>
                        
                        {/* Métadonnées */}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(activity.created_at)}</span>
                          </div>
                          
                          {activity.ip_address && (
                            <div className="flex items-center gap-1">
                              <span>IP: {activity.ip_address}</span>
                            </div>
                          )}
                          
                          {activity.entity_type && activity.entity_id && (
                            <div className="flex items-center gap-1">
                              <span>{activity.entity_type} #{activity.entity_id}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                showShadow
                color="primary"
                size="lg"
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ProjectActivity;