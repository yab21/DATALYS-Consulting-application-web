"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Progress,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderOpen,
  FileText,
  AlertTriangle,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Activity,
  Target,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import LoadingState from "@/components/UI/Loading/LoadingState";

// Types pour les analytics
interface GlobalStats {
  totalPartners: number;
  activePartners: number;
  totalProjects: number;
  activeProjects: number;
  totalDocuments: number;
  totalIncidents: number;
  openIncidents: number;
  criticalIncidents: number;
}

interface PartnerActivity {
  id: number;
  name: string;
  email: string;
  projects: number;
  documents: number;
  lastActivity: string;
  status: "active" | "inactive";
  activityScore: number;
}

interface ProjectPerformance {
  id: number;
  title: string;
  partnerName: string;
  progress: number;
  status: "on_track" | "at_risk" | "delayed" | "completed";
  documentsCount: number;
  lastUpdate: string;
}

interface MonthlyActivity {
  month: string;
  projects: number;
  documents: number;
  incidents: number;
  newPartners: number;
}

const DashboardAdmin: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    hasPermission,
  } = useAuth();

  const { showNotification } = useSimpleNotifications();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalPartners: 0,
    activePartners: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalDocuments: 0,
    totalIncidents: 0,
    openIncidents: 0,
    criticalIncidents: 0,
  });

  const [partnerActivities, setPartnerActivities] = useState<PartnerActivity[]>([]);
  const [projectPerformances, setProjectPerformances] = useState<ProjectPerformance[]>([]);
  const [monthlyActivities, setMonthlyActivities] = useState<MonthlyActivity[]>([]);

  // Vérification des permissions d'accès
  useEffect(() => {
    if (isAuthenticated && !isAdmin()) {
      showNotification({
        type: "error",
        title: "Accès refusé",
        message: "Seuls les administrateurs peuvent accéder aux analytics globales",
        duration: 5000,
      });
      return;
    }
  }, [isAuthenticated, isAdmin, showNotification]);

  // Chargement des données analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!isAuthenticated || !isAdmin()) return;

      setLoading(true);
      try {
        // Simulation de données analytics globales
        const mockGlobalStats: GlobalStats = {
          totalPartners: 15,
          activePartners: 12,
          totalProjects: 38,
          activeProjects: 25,
          totalDocuments: 245,
          totalIncidents: 23,
          openIncidents: 5,
          criticalIncidents: 2,
        };

        const mockPartnerActivities: PartnerActivity[] = [
          {
            id: 1,
            name: "TechCorp Solutions",
            email: "contact@techcorp.com",
            projects: 8,
            documents: 45,
            lastActivity: "2024-01-15T10:30:00Z",
            status: "active",
            activityScore: 95,
          },
          {
            id: 2,
            name: "Innovate Inc",
            email: "hello@innovate.com",
            projects: 5,
            documents: 32,
            lastActivity: "2024-01-14T16:20:00Z",
            status: "active",
            activityScore: 87,
          },
          {
            id: 3,
            name: "StartupXYZ",
            email: "info@startupxyz.fr",
            projects: 3,
            documents: 18,
            lastActivity: "2024-01-10T09:15:00Z",
            status: "inactive",
            activityScore: 45,
          },
          {
            id: 4,
            name: "Digital Solutions",
            email: "contact@digital.com",
            projects: 6,
            documents: 38,
            lastActivity: "2024-01-15T14:45:00Z",
            status: "active",
            activityScore: 92,
          },
        ];

        const mockProjectPerformances: ProjectPerformance[] = [
          {
            id: 1,
            title: "Migration Cloud AWS",
            partnerName: "TechCorp Solutions",
            progress: 75,
            status: "on_track",
            documentsCount: 15,
            lastUpdate: "2024-01-15T11:30:00Z",
          },
          {
            id: 2,
            title: "Application Mobile",
            partnerName: "Innovate Inc",
            progress: 45,
            status: "at_risk",
            documentsCount: 8,
            lastUpdate: "2024-01-14T15:20:00Z",
          },
          {
            id: 3,
            title: "Digital Transform",
            partnerName: "StartupXYZ",
            progress: 30,
            status: "delayed",
            documentsCount: 5,
            lastUpdate: "2024-01-10T08:45:00Z",
          },
          {
            id: 4,
            title: "Security Audit",
            partnerName: "Digital Solutions",
            progress: 100,
            status: "completed",
            documentsCount: 22,
            lastUpdate: "2024-01-15T16:00:00Z",
          },
        ];

        const mockMonthlyActivities: MonthlyActivity[] = [
          {
            month: "Décembre 2023",
            projects: 8,
            documents: 45,
            incidents: 3,
            newPartners: 2,
          },
          {
            month: "Janvier 2024",
            projects: 12,
            documents: 67,
            incidents: 5,
            newPartners: 3,
          },
        ];

        setGlobalStats(mockGlobalStats);
        setPartnerActivities(mockPartnerActivities);
        setProjectPerformances(mockProjectPerformances);
        setMonthlyActivities(mockMonthlyActivities);

      } catch (error) {
        console.error("Erreur lors du chargement des analytics:", error);
        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message: "Impossible de charger les données analytics",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [isAuthenticated, isAdmin, showNotification, selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulation du rafraîchissement
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    showNotification({
      type: "success",
      title: "Données mises à jour",
      message: "Les analytics ont été actualisées",
      duration: 3000,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track": return "success";
      case "at_risk": return "warning";
      case "delayed": return "danger";
      case "completed": return "primary";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on_track": return "En bonne voie";
      case "at_risk": return "À risque";
      case "delayed": return "En retard";
      case "completed": return "Terminé";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Analytics Admin
          </h1>
        </div>
        <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={8} />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin()) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <BarChart3 className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h3 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
          Accès Administrateur Requis
        </h3>
        <p className="text-red-600 dark:text-red-400">
          Seuls les administrateurs peuvent accéder aux analytics globales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec contrôles */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 shadow-lg dark:border-gray-700 dark:from-blue-900/20 dark:via-gray-800 dark:to-purple-900/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Analytics
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Vue d'ensemble des performances et activités de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              selectedKeys={selectedPeriod ? [selectedPeriod] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                setSelectedPeriod(value || "30d");
              }}
              className="min-w-[150px]"
              size="lg"
              placeholder="Période"
            >
              <SelectItem key="7d" value="7d">7 derniers jours</SelectItem>
              <SelectItem key="30d" value="30d">30 derniers jours</SelectItem>
              <SelectItem key="90d" value="90d">90 derniers jours</SelectItem>
              <SelectItem key="1y" value="1y">1 an</SelectItem>
            </Select>
            <Button
              color="primary"
              variant="flat"
              size="lg"
              startContent={<RefreshCw className="h-5 w-5" />}
              onPress={handleRefresh}
              isLoading={refreshing}
            >
              Actualiser
            </Button>
            <Button
              color="success"
              variant="flat"
              size="lg"
              startContent={<Download className="h-5 w-5" />}
            >
              Exporter
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Métriques globales */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Partenaires",
            value: globalStats.totalPartners,
            subtitle: `${globalStats.activePartners} actifs`,
            icon: <Users className="h-6 w-6" />,
            color: "bg-blue-500",
            change: "+2 ce mois",
          },
          {
            title: "Projets",
            value: globalStats.totalProjects,
            subtitle: `${globalStats.activeProjects} en cours`,
            icon: <FolderOpen className="h-6 w-6" />,
            color: "bg-green-500",
            change: "+5 ce mois",
          },
          {
            title: "Documents",
            value: globalStats.totalDocuments,
            subtitle: "Tous projets confondus",
            icon: <FileText className="h-6 w-6" />,
            color: "bg-purple-500",
            change: "+23 cette semaine",
          },
          {
            title: "Incidents",
            value: globalStats.totalIncidents,
            subtitle: `${globalStats.openIncidents} ouverts`,
            icon: <AlertTriangle className="h-6 w-6" />,
            color: globalStats.criticalIncidents > 0 ? "bg-red-500" : "bg-orange-500",
            change: `${globalStats.criticalIncidents} critiques`,
          },
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {metric.subtitle}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                      {metric.change}
                    </p>
                  </div>
                  <div className={`${metric.color} rounded-xl p-3 text-white`}>
                    {metric.icon}
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Activité des partenaires */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardBody className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Activité des Partenaires
                </h3>
                <Button variant="flat" size="sm" startContent={<Eye className="h-4 w-4" />}>
                  Voir tout
                </Button>
              </div>

              <div className="space-y-4">
                {partnerActivities.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {partner.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {partner.projects} projets • {partner.documents} documents
                        </p>
                        <p className="text-xs text-gray-400">
                          Dernière activité: {new Date(partner.lastActivity).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={partner.status === "active" ? "success" : "warning"}
                      >
                        {partner.status === "active" ? "Actif" : "Inactif"}
                      </Chip>
                      <div className="mt-2 w-20">
                        <Progress
                          value={partner.activityScore}
                          size="sm"
                          color={
                            partner.activityScore >= 80 ? "success" :
                            partner.activityScore >= 60 ? "warning" : "danger"
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">{partner.activityScore}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Performance des projets */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardBody className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Performance des Projets
                </h3>
                <Button variant="flat" size="sm" startContent={<Target className="h-4 w-4" />}>
                  Détails
                </Button>
              </div>

              <div className="space-y-4">
                {projectPerformances.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-xl border border-gray-100 p-4 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {project.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {project.partnerName}
                        </p>
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getStatusColor(project.status)}
                      >
                        {getStatusLabel(project.status)}
                      </Chip>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progression</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress
                        value={project.progress}
                        size="sm"
                        color={getStatusColor(project.status)}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{project.documentsCount} documents</span>
                      <span>MAJ: {new Date(project.lastUpdate).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Activité mensuelle */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-transparent shadow-none">
          <CardBody className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Activité Mensuelle
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="h-4 w-4" />
                <span>Évolution sur les derniers mois</span>
              </div>
            </div>

            <Table aria-label="Activité mensuelle" removeWrapper>
              <TableHeader>
                <TableColumn>MOIS</TableColumn>
                <TableColumn>PROJETS</TableColumn>
                <TableColumn>DOCUMENTS</TableColumn>
                <TableColumn>INCIDENTS</TableColumn>
                <TableColumn>NOUVEAUX PARTENAIRES</TableColumn>
              </TableHeader>
              <TableBody>
                {monthlyActivities.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {activity.month}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <span>{activity.projects}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-500" />
                        <span>{activity.documents}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>{activity.incidents}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>+{activity.newPartners}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardAdmin;