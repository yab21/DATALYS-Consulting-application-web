"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardBody,
  Chip,
  Button,
  Progress,
  Avatar,
  Divider,
} from "@nextui-org/react";
import {
  FolderOpen,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  MessageCircle,
  Bell,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/lib/permissions";
import { projectsService, Project } from "@/services/projects";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import LoadingState from "@/components/UI/Loading/LoadingState";
import Link from "next/link";

// Types pour les statistiques du partner
interface PartnerStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalDocuments: number;
  recentActivity: number;
  lastLogin: string;
}

interface RecentDocument {
  id: number;
  name: string;
  type: string;
  projectName: string;
  updatedAt: string;
  size: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  createdAt: string;
  isRead: boolean;
}

const MonEspacePartenaire: React.FC = () => {
  const {
    user,
    userWithPermissions,
    isAuthenticated,
    isPartner,
    hasPermission,
    canAccessProject,
  } = useAuth();

  const { showNotification } = useSimpleNotifications();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<PartnerStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalDocuments: 0,
    recentActivity: 0,
    lastLogin: new Date().toISOString(),
  });

  const [recentDocuments] = useState<RecentDocument[]>([
    {
      id: 1,
      name: "Rapport_Analyse_Q1.pdf",
      type: "PDF",
      projectName: "Projet Digital Transform",
      updatedAt: "2024-01-15T10:30:00Z",
      size: "2.4 MB",
    },
    {
      id: 2,
      name: "Specifications_Techniques.docx",
      type: "Word",
      projectName: "Migration Cloud",
      updatedAt: "2024-01-14T15:45:00Z",
      size: "1.8 MB",
    },
    {
      id: 3,
      name: "Dashboard_Metrics.xlsx",
      type: "Excel",
      projectName: "Analytics Platform",
      updatedAt: "2024-01-13T09:20:00Z",
      size: "512 KB",
    },
  ]);

  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Nouveau document ajouté",
      message: "Un rapport d'avancement a été ajouté à votre projet Digital Transform",
      type: "info",
      createdAt: "2024-01-15T11:00:00Z",
      isRead: false,
    },
    {
      id: 2,
      title: "Projet mis à jour",
      message: "Le statut de votre projet Migration Cloud a été mis à jour",
      type: "success",
      createdAt: "2024-01-14T16:30:00Z",
      isRead: false,
    },
    {
      id: 3,
      title: "Maintenance programmée",
      message: "Une maintenance est prévue ce weekend de 22h à 6h",
      type: "warning",
      createdAt: "2024-01-13T14:00:00Z",
      isRead: true,
    },
  ]);

  // Vérification des permissions
  useEffect(() => {
    if (isAuthenticated && !isPartner()) {
      showNotification({
        type: "error",
        title: "Accès refusé",
        message: "Cette section est réservée aux partenaires",
        duration: 5000,
      });
      return;
    }
  }, [isAuthenticated, isPartner, showNotification]);

  // Chargement des données du partner
  useEffect(() => {
    const loadPartnerData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          projectsService.setToken(token);
          
          // Solution similaire à celle utilisée dans OptimizedProjectList
          // Récupérer tous les projets puis filtrer selon l'utilisateur
          const allProjects = await projectsService.getActiveProjects();
          
          let userProjects: Project[] = [];
          
          // Si l'utilisateur a un partner_id, filtrer par celui-ci
          if (user.partner_id) {
            userProjects = allProjects.filter(project => 
              project.partner_id === user.partner_id
            );
          } else {
            // Utiliser la même logique de correspondance manuelle que dans OptimizedProjectList
            const manualUserPartnerMapping: Record<string, number> = {
              'beyem': 24,  // beyem correspond au partenaire Orange (ID 24)
            };
            
            const userPartnerMapping = manualUserPartnerMapping[user.name?.toLowerCase() || ''];
            if (userPartnerMapping) {
              userProjects = allProjects.filter(project => 
                project.partner_id === userPartnerMapping
              );
            } else {
              // Fallback: projets créés/modifiés par l'utilisateur
              userProjects = allProjects.filter(project => 
                project.created_by === user.id || project.updated_by === user.id
              );
            }
          }
          
          setProjects(userProjects);

          // Calculer les statistiques
          const activeProjects = userProjects.filter((p) => p.is_active).length;
          const completedProjects = userProjects.filter((p) => !p.is_active).length;

          setStats({
            totalProjects: userProjects.length,
            activeProjects,
            completedProjects,
            totalDocuments: userProjects.length * 3, // Estimation
            recentActivity: 12, // Simulation
            lastLogin: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données partner:", error);
        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message: "Impossible de charger vos données",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadPartnerData();
  }, [isAuthenticated, user, showNotification]);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄";
      case "word":
      case "docx":
        return "📝";
      case "excel":
      case "xlsx":
        return "📊";
      default:
        return "📎";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mon Espace Partenaire
          </h1>
        </div>
        <LoadingState
          type="skeleton"
          skeletonVariant="card"
          skeletonCount={6}
        />
      </div>
    );
  }

  if (!isAuthenticated || !isPartner()) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h3 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
          Accès Restreint
        </h3>
        <p className="text-red-600 dark:text-red-400">
          Cette section est réservée aux comptes partenaires.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-8 shadow-lg dark:border-gray-700 dark:from-blue-900/20 dark:via-gray-800 dark:to-cyan-900/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              size="lg"
              name={user?.name?.charAt(0) || "P"}
              className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Bienvenue, {user?.name}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Votre espace partenaire personnalisé
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                Dernière connexion : {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              color="primary"
              variant="flat"
              startContent={<MessageCircle className="h-4 w-4" />}
            >
              Contacter Support
            </Button>
            <Button
              color="success"
              variant="flat"
              startContent={<Download className="h-4 w-4" />}
            >
              Télécharger Rapport
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Statistiques rapides */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Mes Projets",
            value: stats.totalProjects,
            icon: <FolderOpen className="h-6 w-6" />,
            color: "bg-blue-500",
            change: "+2 ce mois",
          },
          {
            title: "Projets Actifs",
            value: stats.activeProjects,
            icon: <TrendingUp className="h-6 w-6" />,
            color: "bg-green-500",
            change: `${stats.activeProjects}/${stats.totalProjects}`,
          },
          {
            title: "Mes Documents",
            value: stats.totalDocuments,
            icon: <FileText className="h-6 w-6" />,
            color: "bg-purple-500",
            change: "+15 cette semaine",
          },
          {
            title: "Activités",
            value: stats.recentActivity,
            icon: <BarChart3 className="h-6 w-6" />,
            color: "bg-orange-500",
            change: "Dernières 30j",
          },
        ].map((stat, index) => (
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
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`${stat.color} rounded-xl p-3 text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Mes Projets Récents */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="h-fit">
            <CardBody className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Mes Projets Récents
                </h3>
                <Link href="/tableaudebord/projet/gerer">
                  <Button variant="flat" size="sm">
                    Voir tout
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {projects.slice(0, 3).map((project, index) => (
                  <motion.div
                    key={project.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                        <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {project.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Créé le {new Date(project.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={project.is_active ? "success" : "warning"}
                      >
                        {project.is_active ? "Actif" : "En attente"}
                      </Chip>
                      <Link href={`/tableaudebord/projet/pageprojet/${project.id}`}>
                        <Button size="sm" variant="flat" color="primary">
                          Voir
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>

              {projects.length === 0 && (
                <div className="py-12 text-center">
                  <FolderOpen className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
                  <h4 className="mb-2 text-lg font-semibold text-gray-600 dark:text-gray-300">
                    Aucun projet assigné
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400">
                    Vos projets apparaîtront ici une fois qu'ils vous seront assignés
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>

        {/* Sidebar avec notifications et documents récents */}
        <div className="space-y-6">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardBody className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  <Chip size="sm" color="primary" variant="flat">
                    {notifications.filter((n) => !n.isRead).length} nouvelles
                  </Chip>
                </div>

                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        notification.isRead
                          ? "border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30"
                          : "border-blue-100 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {notification.title}
                          </h5>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(notification.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="flat" size="sm" className="mt-4 w-full">
                  Voir toutes les notifications
                </Button>
              </CardBody>
            </Card>
          </motion.div>

          {/* Documents récents */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardBody className="p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                  Documents Récents
                </h3>

                <div className="space-y-3">
                  {recentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                    >
                      <div className="text-2xl">{getFileIcon(doc.type)}</div>
                      <div className="flex-1">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {doc.name}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {doc.projectName} • {doc.size}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        isIconOnly
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MonEspacePartenaire;