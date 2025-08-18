"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, FolderOpen, Calendar, ExternalLink, Users, Eye, Edit, Trash2, Filter } from "lucide-react";
import { Button, Chip, Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Select, SelectItem, Input } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { projectsService, Project } from "@/services/projects";
import { partnersService, Partner } from "@/services/partners";
import { dashboardService } from "@/services/dashboard";
import { useAuth } from "@/context/AuthContext";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { useNotifications } from "@/components/UI/Notifications/NotificationSystem";
import { Permission } from "@/lib/permissions";

// Helper pour les notifications
const notificationHelpers = {
  error: (title: string, message: string) => ({
    type: "error" as const,
    title,
    message,
    duration: 5000,
  }),
  success: (title: string, message: string) => ({
    type: "success" as const,
    title,
    message,
    duration: 3000,
  }),
};

const OptimizedProjectList: React.FC = () => {
  const router = useRouter();
  const { 
    user, 
    userWithPermissions,
    isAuthenticated, 
    isLoading: authLoading,
    hasPermission,
    isAdmin,
    isPartner,
    canAccessProject,
    canModify,
    canDelete,
    canCreate,
    getCRUDPermissions
  } = useAuth();
  const { showNotification } = useNotifications();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) {
        console.log("🔄 Authentification en cours de chargement...");
        return;
      }

      const token = localStorage.getItem('authToken');
      console.log("🔑 Debug état authentification projets:", {
        isAuthenticated,
        authLoading,
        token: token ? `${token.substring(0, 20)}...` : null,
      });

      if (!isAuthenticated || !token) {
        console.log("❌ Utilisateur non authentifié pour les projets");
        setError("Vous devez être connecté pour voir les projets");
        setLoading(false);
        return;
      }

      console.log("✅ Utilisateur authentifié, chargement des projets...");
      setLoading(true);
      setError(null);
      
      try {
        // Configurer le token dans les services
        projectsService.setToken(token);
        partnersService.setToken(token);

        console.log("📡 Chargement des projets et partenaires...");
        
        // Charger les partenaires d'abord
        const partnersData = await partnersService.getActivePartners();
        setPartners(partnersData);

        // Charger les projets selon les permissions utilisateur
        let projectsData: Project[];
        
        if (isAdmin()) {
          // Administrateur : peut voir tous les projets via l'ancien service
          if (selectedPartnerId === "all") {
            projectsData = await projectsService.getActiveProjects();
          } else {
            projectsData = await projectsService.getProjectsByPartner(parseInt(selectedPartnerId));
          }
        } else if (isPartner() && user?.partner_id) {
          // Partenaire : utiliser la nouvelle API dashboard
          try {
            console.log("🔄 Utilisation de l'API dashboard pour les projets partenaire");
            
            // Créer les filtres pour l'API
            const filters: any = {};
            if (searchTerm) filters.name = searchTerm;
            if (statusFilter !== "all") filters.status = statusFilter;
            if (activeFilter !== "all") filters.is_active = activeFilter === "active";
            
            const params = dashboardService.createPaginationParams(
              currentPage,
              pageSize,
              filters
            );
            
            const response = await dashboardService.getPartnerProjects(user.partner_id, params);
            
            if (response.success) {
              // Convertir les données de l'API vers le format Project
              projectsData = response.data.projects.map(project => ({
                id: project.id,
                title: project.name,
                description: project.description,
                status: project.status,
                created_at: project.created_at,
                updated_at: project.updated_at,
                partner_id: project.partner_id,
                is_active: project.is_active,
                is_deleted: false, // Par défaut non supprimé
                created_by: user?.id || 0, // ID utilisateur ou 0 par défaut
                updated_by: user?.id || 0, // ID utilisateur ou 0 par défaut
              }));
              
              console.log("✅ Projets récupérés via API dashboard:", projectsData);
            } else {
              throw new Error(response.message || "Erreur API dashboard");
            }
          } catch (dashboardError) {
            console.warn("⚠️ Erreur API dashboard, fallback vers ancien service:", dashboardError);
            // Fallback vers l'ancien service
            projectsData = await projectsService.getProjectsByPartner(user.partner_id);
          }
        } else {
          // Utilisateur sans permissions ou sans partner_id
          projectsData = [];
        }

        console.log("📋 Projets récupérés:", projectsData);
        console.log("👥 Partenaires récupérés:", partnersData);
        
        setProjects(projectsData);
      } catch (err) {
        console.error("❌ Erreur lors du chargement des données:", err);
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(`Erreur lors du chargement: ${errorMessage}`);
        showNotification(notificationHelpers.error(
          "Erreur de chargement",
          errorMessage
        ));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    isAuthenticated, 
    authLoading, 
    showNotification, 
    selectedPartnerId, 
    isAdmin, 
    isPartner, 
    user?.partner_id,
    searchTerm,
    statusFilter,
    activeFilter,
    currentPage,
    pageSize
  ]);

  // Fonction pour obtenir le nom du partenaire
  const getPartnerName = (partnerId: number): string => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.name || `Partenaire #${partnerId}`;
  };

  // Fonctions d'action sur les projets
  const handleViewProject = (projectId: number) => {
    router.push(`/tableaudebord/projet/pageprojet/${projectId}`);
  };

  const handleEditProject = (projectId: number) => {
    router.push(`/tableaudebord/projet/modifier/${projectId}`);
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      return;
    }

    setDeletingProjectId(projectId);
    
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        projectsService.setToken(token);
        await projectsService.deleteProject(projectId, user?.id);
        
        // Recharger la liste des projets
        setProjects(prev => prev.filter(p => p.id !== projectId));
        
        showNotification(notificationHelpers.success(
          "Projet supprimé",
          "Le projet a été supprimé avec succès"
        ));
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      showNotification(notificationHelpers.error(
        "Erreur de suppression",
        "Impossible de supprimer le projet"
      ));
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPartnerName(project.partner_id).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm, partners, getPartnerName]);

  // Gestion des erreurs
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Projets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Chargement des projets...
            </p>
          </div>
        </div>
        <LoadingState
          type="skeleton"
          skeletonVariant="card"
          skeletonCount={6}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion des Projets
            </h1>
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
          <div className="mb-4 text-red-500">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="mx-auto"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">
            Erreur de chargement
          </h3>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <div className="mt-4">
            <Button
              color="primary"
              onPress={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <motion.div
        className="mb-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-lg shadow-gray-100/50 dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-gray-900/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Projets
            </h1>
            <div className="flex flex-wrap gap-3">
              <Chip
                size="lg"
                variant="flat"
                color="primary"
                className="text-base font-semibold"
              >
                {filteredProjects.length} projet{filteredProjects.length > 1 ? 's' : ''} affiché{filteredProjects.length > 1 ? 's' : ''}
              </Chip>
              <Chip
                size="lg"
                variant="flat"
                color="success"
                className="text-base font-semibold"
              >
                {filteredProjects.filter((p) => p.is_active).length} actif{filteredProjects.filter((p) => p.is_active).length > 1 ? 's' : ''}
              </Chip>
            </div>
          </div>

          {canCreate() && hasPermission(Permission.CREATE_PROJECTS_ALL_PARTNERS) && (
            <Button
              color="primary"
              size="lg"
              className="bg-primary bg-gradient-to-r px-6 py-3 text-base font-semibold shadow-lg hover:from-primary-100 hover:to-primary-800"
              startContent={<Plus className="h-5 w-5" />}
              onPress={() => router.push('/tableaudebord/projet/ajouter')}
            >
              Nouveau Projet
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filtres */}
      <motion.div
        className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg shadow-gray-100/50 dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-gray-900/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md text-base"
              size="lg"
              startContent={
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gray-400"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
              }
            />
          </div>
          {isAdmin() && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Partenaire:</span>
              </div>
              <Select
                selectedKeys={selectedPartnerId ? [selectedPartnerId] : []}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setSelectedPartnerId(value || "all");
                }}
                className="min-w-[200px]"
                size="lg"
                placeholder="Tous les partenaires"
                items={[
                  { key: "all", label: "Tous les partenaires" },
                  ...partners.map(partner => ({
                    key: partner.id.toString(),
                    label: partner.name
                  }))
                ]}
              >
                {(item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Table des projets */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-100/50 dark:border-gray-700 dark:bg-gray-800/50 dark:shadow-gray-900/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-6 text-gray-400 dark:text-gray-500">
              <FolderOpen className="mx-auto h-20 w-20" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-600 dark:text-gray-300">
              Aucun projet trouvé
            </h3>
            <p className="mb-6 text-lg text-gray-500 dark:text-gray-400">
              {selectedPartnerId !== "all" 
                ? "Aucun projet pour ce partenaire" 
                : "Créez votre premier projet pour commencer"}
            </p>
            {canCreate() && hasPermission(Permission.CREATE_PROJECTS_ALL_PARTNERS) && (
              <Button
                color="primary"
                size="lg"
                startContent={<Plus className="h-5 w-5" />}
                onPress={() => router.push('/tableaudebord/projet/ajouter')}
              >
                Créer un Projet
              </Button>
            )}
          </div>
        ) : (
          <Table 
            aria-label="Table des projets"
            className="min-h-[400px]"
            removeWrapper
          >
            <TableHeader>
              <TableColumn className="bg-gray-50 dark:bg-gray-700">PROJET</TableColumn>
              <TableColumn className="bg-gray-50 dark:bg-gray-700">PARTENAIRE</TableColumn>
              <TableColumn className="bg-gray-50 dark:bg-gray-700">STATUT</TableColumn>
              <TableColumn className="bg-gray-50 dark:bg-gray-700">CRÉÉ LE</TableColumn>
              <TableColumn className="bg-gray-50 dark:bg-gray-700">MODIFIÉ LE</TableColumn>
              <TableColumn className="bg-gray-50 dark:bg-gray-700 text-center">ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                        <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {project.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {project.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getPartnerName(project.partner_id)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={project.is_active ? "success" : "warning"}
                      className="font-semibold"
                    >
                      {project.is_active ? "Actif" : "Inactif"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {project.updated_at !== project.created_at 
                        ? new Date(project.updated_at).toLocaleDateString('fr-FR')
                        : '-'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {/* Voir - Tous les utilisateurs peuvent voir leurs projets accessibles */}
                      {canAccessProject(project.partner_id) && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          isIconOnly
                          onPress={() => handleViewProject(project.id)}
                          title="Voir le projet"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Modifier - Seuls les admins peuvent modifier */}
                      {canModify() && hasPermission(Permission.MODIFY_ALL_PROJECTS) && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          isIconOnly
                          onPress={() => handleEditProject(project.id)}
                          title="Modifier le projet"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {/* Supprimer - Seuls les admins peuvent supprimer */}
                      {canDelete() && hasPermission(Permission.DELETE_PROJECTS) && (
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          isIconOnly
                          onPress={() => handleDeleteProject(project.id)}
                          isLoading={deletingProjectId === project.id}
                          title="Supprimer le projet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
};

export default OptimizedProjectList;