"use client";

import { useMemo } from "react";
import { Button, Card, CardBody, CardHeader, Chip, Progress } from "@heroui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  useDashboardCache, 
  useProjectCache,
  LazyImage,
  SkeletonDashboard
} from "@/components/Optimizations";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "draft" | "archived";
  created_at: string;
  updated_at: string;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  collaborators_count: number;
  files_count: number;
  progress: number;
  priority: "low" | "medium" | "high";
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalFiles: number;
  teamMembers: number;
  pendingTasks: number;
  revenueThisMonth: number;
  clientsSatisfaction: number;
}

interface RecentFile {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  type: string;
  size: string;
}

const OptimizedDashboard: React.FC = () => {
  // Pour le moment, utilisons les données mockées directement pour éviter les erreurs API
  const stats = null;
  const statsLoading = false;
  const statsStale = false;
  const recentProjects: Project[] = [];
  const projectsLoading = false; 
  const recentFiles: RecentFile[] = [];
  const filesLoading = false;

  // Mémoisation des helpers pour éviter les recalculs
  const helpers = useMemo(() => ({
    getStatusColor: (status: string) => {
      const statusMap = {
        active: "primary",
        completed: "success", 
        draft: "warning",
        archived: "default"
      } as const;
      return statusMap[status as keyof typeof statusMap] || "default";
    },

    getStatusText: (status: string) => {
      const statusMap = {
        active: "Actif",
        completed: "Terminé",
        draft: "Brouillon", 
        archived: "Archivé"
      };
      return statusMap[status as keyof typeof statusMap] || status;
    },

    getPriorityColor: (priority: string) => {
      const priorityMap = {
        high: "danger",
        medium: "warning",
        low: "success"
      } as const;
      return priorityMap[priority as keyof typeof priorityMap] || "default";
    },

    getPriorityText: (priority: string) => {
      const priorityMap = {
        high: "Haute",
        medium: "Moyenne", 
        low: "Basse"
      };
      return priorityMap[priority as keyof typeof priorityMap] || priority;
    },

    getFileIcon: (type: string) => {
      const iconMap = {
        pdf: "📄",
        figma: "🎨", 
        document: "📝",
        code: "💻",
        image: "🖼️",
        excel: "📊"
      };
      return iconMap[type as keyof typeof iconMap] || "📎";
    },

    truncateFileName: (fileName: string, maxLength: number = 20) => {
      return fileName.length <= maxLength 
        ? fileName 
        : `${fileName.substring(0, maxLength)}...`;
    }
  }), []);

  // Mock data par défaut pour simuler l'API
  const defaultStats: DashboardStats = {
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 4,
    totalFiles: 84,
    teamMembers: 15,
    pendingTasks: 23,
    revenueThisMonth: 125000,
    clientsSatisfaction: 94
  };

  const mockRecentProjects: Project[] = [
    {
      id: "1",
      name: "Migration Cloud AWS",
      description: "Migration complète vers AWS avec optimisation des coûts",
      status: "active",
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-20T14:30:00Z",
      owner: {
        id: "user1",
        name: "Marie Martin",
        avatar: "/avatars/marie.jpg"
      },
      collaborators_count: 5,
      files_count: 12,
      progress: 75,
      priority: "high"
    },
    {
      id: "2", 
      name: "Application Mobile Banking",
      description: "Application mobile pour services bancaires",
      status: "active",
      created_at: "2024-01-10T09:00:00Z",
      updated_at: "2024-01-19T16:45:00Z",
      owner: {
        id: "user2",
        name: "Pierre Durand",
        avatar: "/avatars/pierre.jpg"
      },
      collaborators_count: 8,
      files_count: 28,
      progress: 45,
      priority: "high"
    },
    {
      id: "3",
      name: "Dashboard Analytics BI", 
      description: "Tableau de bord pour l'analyse business intelligence",
      status: "active",
      created_at: "2024-01-08T11:15:00Z",
      updated_at: "2024-01-18T13:20:00Z",
      owner: {
        id: "user3", 
        name: "Sophie Bernard",
        avatar: "/avatars/sophie.jpg"
      },
      collaborators_count: 3,
      files_count: 15,
      progress: 90,
      priority: "medium"
    },
    {
      id: "4",
      name: "Site E-commerce",
      description: "Plateforme e-commerce complète avec paiement",
      status: "completed",
      created_at: "2024-01-05T08:30:00Z",
      updated_at: "2024-01-17T17:00:00Z",
      owner: {
        id: "user4",
        name: "Jean Dupont", 
        avatar: "/avatars/jean.jpg"
      },
      collaborators_count: 4,
      files_count: 20,
      progress: 100,
      priority: "low"
    }
  ];

  const mockRecentFiles: RecentFile[] = [
    {
      id: "1",
      name: "Architecture_AWS_v2.pdf",
      projectId: "1", 
      projectName: "Migration Cloud AWS",
      createdAt: "2024-01-16T14:30:00Z",
      type: "pdf",
      size: "2.4 MB"
    },
    {
      id: "2",
      name: "UI_Wireframes_Mobile.fig",
      projectId: "2",
      projectName: "Application Mobile Banking", 
      createdAt: "2024-01-12T11:20:00Z",
      type: "figma",
      size: "8.7 MB"
    },
    {
      id: "3",
      name: "Requirements_BI_Dashboard.docx",
      projectId: "3",
      projectName: "Dashboard Analytics BI",
      createdAt: "2024-01-09T16:45:00Z", 
      type: "document",
      size: "456 KB"
    },
    {
      id: "4",
      name: "Database_Schema.sql",
      projectId: "4",
      projectName: "Site E-commerce",
      createdAt: "2024-01-07T09:15:00Z",
      type: "code", 
      size: "12 KB"
    }
  ];

  // Utiliser les données par défaut si l'API n'est pas disponible
  const displayStats = stats || defaultStats;
  const displayProjects = (recentProjects && recentProjects.length > 0) ? recentProjects : mockRecentProjects;
  const displayFiles = (recentFiles && recentFiles.length > 0) ? recentFiles : mockRecentFiles;

  return (
    <div className="space-y-8">
      {/* En-tête avec bienvenue */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06B6D4] via-teal-500 to-cyan-600 p-1 shadow-2xl shadow-cyan-500/25"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="rounded-3xl bg-white p-8 dark:bg-gray-900/95">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h1 className="mb-2 bg-gradient-to-r from-[#06B6D4] to-teal-600 bg-clip-text text-4xl font-black text-transparent">
                🚀 Tableau de Bord
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Bienvenue sur votre espace de gestion DATALYS Consulting
                {statsStale && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400 text-sm">
                    (Données mises à jour...)
                  </span>
                )}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                as={Link}
                href="/tableaudebord/projet/ajouter"
                size="lg"
                className="bg-gradient-to-r from-[#06B6D4] to-teal-600 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                startContent={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                Nouveau Projet
              </Button>
              <Button
                as={Link}
                href="/tableaudebord/partenaire/ajouter"
                variant="bordered"
                size="lg"
                className="border-2 border-[#06B6D4] text-[#06B6D4] font-semibold hover:bg-[#06B6D4] hover:text-white transition-all duration-300"
                startContent={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              >
                Nouveau Partenaire
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistiques avec animation optimisée */}
      <motion.div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Cartes de statistiques avec lazy loading des icônes */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/10">
          <CardBody className="text-center p-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06B6D4] to-blue-600 mx-auto shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-4H5m14 8H5m14-4H5" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{displayStats.totalProjects}</h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Projets Total</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 shadow-xl shadow-green-500/10">
          <CardBody className="text-center p-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mx-auto shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{displayStats.activeProjects}</h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Projets Actifs</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 shadow-xl shadow-purple-500/10">
          <CardBody className="text-center p-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 mx-auto shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{displayStats.completedProjects}</h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Projets Terminés</p>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 shadow-xl shadow-orange-500/10">
          <CardBody className="text-center p-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 mx-auto shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white">{displayStats.totalFiles}</h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Fichiers</p>
          </CardBody>
        </Card>
      </motion.div>

      {/* Contenu principal avec lazy loading */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Projets récents optimisés */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border border-gray-200 dark:border-gray-700 shadow-2xl shadow-gray-200/20 dark:shadow-gray-900/40">
            <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06B6D4] to-teal-600 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-4H5m14 8H5m14-4H5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Projets Récents</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Vos derniers projets actifs</p>
                  </div>
                </div>
                <Button
                  as={Link}
                  href="/tableaudebord/projet/gerer"
                  variant="bordered"
                  size="sm"
                  className="border-[#06B6D4] text-[#06B6D4] hover:bg-[#06B6D4] hover:text-white transition-all duration-300"
                >
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="space-y-0">
                {displayProjects.slice(0, 4).map((project, index) => (
                  <motion.div
                    key={project.id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate">
                            {project.name}
                          </h4>
                          <Chip
                            size="sm"
                            color={helpers.getStatusColor(project.status)}
                            variant="flat"
                            className="flex-shrink-0"
                          >
                            {helpers.getStatusText(project.status)}
                          </Chip>
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-500">{project.collaborators_count} membres</span>
                          </div>
                          <Chip
                            size="sm"
                            color={helpers.getPriorityColor(project.priority)}
                            variant="dot"
                            className="text-xs"
                          >
                            {helpers.getPriorityText(project.priority)} priorité
                          </Chip>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progression</span>
                            <span className="text-xs font-bold text-[#06B6D4]">{project.progress}%</span>
                          </div>
                          <Progress
                           
                            color="primary"
                            className="max-w-full"
                            classNames={{
                              track: "bg-gray-200 dark:bg-gray-700",
                              indicator: "bg-gradient-to-r from-[#06B6D4] to-teal-600",
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        as={Link}
                        href={`/tableaudebord/projet/pageprojet/${project.id}`}
                        size="sm"
                        className="bg-gradient-to-r from-[#06B6D4] to-teal-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex-shrink-0"
                      >
                        Voir
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Fichiers récents avec lazy loading */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border border-gray-200 dark:border-gray-700 shadow-2xl shadow-gray-200/20 dark:shadow-gray-900/40">
            <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fichiers Récents</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Derniers documents ajoutés</p>
                  </div>
                </div>
                <Button
                  as={Link}
                  href="/tableaudebord/lesdossiers"
                  variant="bordered"
                  size="sm"
                  className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300"
                >
                  Voir tout
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <div className="space-y-0">
                {displayFiles.map((file, index) => (
                  <motion.div
                    key={file.id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-2xl shadow-md">
                        {helpers.getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate mb-1" title={file.name}>
                          {helpers.truncateFileName(file.name)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 truncate">
                          {file.projectName}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(file.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {file.size}
                          </span>
                        </div>
                      </div>
                      <Button
                        as={Link}
                        href={`/tableaudebord/projet/pageprojet/${file.projectId}`}
                        size="sm"
                        variant="bordered"
                        className="border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all duration-300 flex-shrink-0"
                      >
                        Voir
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default OptimizedDashboard;