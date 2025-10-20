"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Users, 
  Eye, 
  Edit, 
  Trash2, 
  Filter, 
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  MoreVertical
} from "lucide-react";
import { 
  Button, 
  Chip, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Select, 
  SelectItem, 
  Input,
  Pagination,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { projectsService, Project } from "@/services/projects";
import { useAuth } from "@/context/AuthContext";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { getContextualErrorMessage } from '@/lib/error-messages';
import { apiInterceptor } from '@/lib/api-interceptor';
import ProjectModals from "./ProjectModals";

const OptimizedProjectList: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useSimpleNotifications();
  
  // États
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [partnerNames, setPartnerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<string>("tous");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedProjects, setPaginatedProjects] = useState<Project[]>([]);

  // États pour les modals
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'edit' | 'delete' | 'view' | 'create' | null;
    project: Project | null;
  }>({
    isOpen: false,
    type: null,
    project: null
  });

  // Calculer les statistiques des projets
  const calculateProjectStats = (projects: Project[]) => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.is_active).length;
    const inactiveProjects = projects.filter(p => !p.is_active).length;
    const recentProjects = projects.filter(p => new Date(p.created_at) >= oneMonthAgo).length;
    const partnersWithProjects = new Set(projects.map(p => p.partner_id).filter(Boolean)).size;
    const avgProjectsPerPartner = partnersWithProjects > 0 ? Math.round(totalProjects / partnersWithProjects) : 0;
    
    return {
      totalProjects,
      activeProjects,
      inactiveProjects,
      recentProjects,
      partnersWithProjects,
      avgProjectsPerPartner
    };
  };

  // Charger les données initiales
  useEffect(() => {
    if (isAuthenticated && user) {
      loadInitialData();
    }
    // Suppression de la redirection automatique car elle peut interférer
    // avec le système d'authentification existant (ProtectedRoute)
  }, [isAuthenticated, user]);

  // Filtrer les projets
  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, selectedPartner]);

  // Pagination effect
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedProjects(filteredProjects.slice(startIndex, endIndex));
  }, [filteredProjects, currentPage, itemsPerPage]);

  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedPartner]);

  // Méthode de fallback pour charger les projets des partenaires
  const loadProjectsWithFallback = async (user: any): Promise<Project[]> => {
    try {
      // Pour les partenaires, charger tous les projets puis filtrer
      const userProjects = await projectsService.getActiveProjects();
      
      console.log("📊 Projets chargés (fallback):", userProjects.length);
      console.log("🔍 Premier projet (pour debug):", userProjects[0]);
      
      // Filtrer les projets par partner_id si il existe
      let filteredProjects = userProjects;
      if (user.partner_id) {
        filteredProjects = userProjects.filter(project => 
          project.partner_id === user.partner_id
        );
        console.log(`🔍 Projets filtrés par partner_id ${user.partner_id}:`, filteredProjects.length);
      } else {
        // Solution temporaire : Pour les utilisateurs partenaires sans partner_id,
        // on va d'abord essayer de trouver une correspondance dans les projets
        console.log("⚠️ Aucun partner_id trouvé dans les données utilisateur");
        console.log("🔍 Tentative de correspondance par nom d'utilisateur...");
        
        // Chercher si le nom d'utilisateur correspond à un nom de partenaire
        filteredProjects = userProjects.filter(project => {
          // Vérifier si l'utilisateur est le créateur/éditeur du projet
          if (project.created_by === user.id || project.updated_by === user.id) {
            console.log(`✅ Projet assigné par création/modification: ${project.title}`);
            return true;
          }
          
          // Vérifier si le nom du partenaire contient le nom de l'utilisateur
          if (project.partner_name && user.name) {
            const partnerNameLower = project.partner_name.toLowerCase();
            const userNameLower = user.name.toLowerCase();
            if (partnerNameLower.includes(userNameLower) || userNameLower.includes(partnerNameLower)) {
              console.log(`✅ Projet trouvé par nom correspondant: ${project.title} (partenaire: ${project.partner_name})`);
              return true;
            }
          }
          
          // Vérifier dans les données du partenaire si disponible dans la réponse API brute
          const projectWithPartner = project as any;
          if (projectWithPartner.partner && user.name) {
            const partnerData = projectWithPartner.partner;
            if ((partnerData.name && partnerData.name.toLowerCase().includes(user.name.toLowerCase())) ||
                (partnerData.email === user.email)) {
              console.log(`✅ Projet trouvé via données partenaire: ${project.title}`);
              return true;
            }
          }
          
          return false;
        });
        
        console.log(`📋 Projets trouvés par correspondance:`, filteredProjects.length);
        
        // Solution de fallback : si aucun projet trouvé par correspondance,
        if (filteredProjects.length === 0) {
          console.log("📢 Aucune correspondance automatique trouvée");
          
          // Solution temporaire : Table de correspondance manuelle pour les utilisateurs connus
          // Cette table devrait être remplacée par une vraie base de données ou une API
          const manualUserPartnerMapping: Record<string, number> = {
            'beyem': 24,  // beyem correspond au partenaire Orange (ID 24)
            // Ajouter d'autres correspondances si nécessaire
          };
          
          const userPartnerMapping = manualUserPartnerMapping[user.name.toLowerCase()];
          if (userPartnerMapping) {
            console.log(`🔧 Correspondance manuelle trouvée: ${user.name} → partner_id ${userPartnerMapping}`);
            
            // Filtrer les projets par le partner_id trouvé
            filteredProjects = userProjects.filter(project => 
              project.partner_id === userPartnerMapping
            );
            
            console.log(`✅ Projets trouvés via correspondance manuelle: ${filteredProjects.length}`);
            
            if (filteredProjects.length > 0) {
              showNotification(simpleNotificationHelpers.info(
                "Projets chargés",
                `${filteredProjects.length} projet(s) trouvé(s) pour votre compte`
              ));
            }
          }
          
          // Si toujours aucun projet trouvé après la correspondance manuelle
          if (filteredProjects.length === 0) {
            console.log("💡 L'utilisateur partenaire devra contacter l'administrateur pour associer ses projets");
            showNotification(simpleNotificationHelpers.warning(
              "Aucun projet assigné", 
              "Aucun projet n'est actuellement assigné à votre compte. Contactez l'administrateur si vous devriez avoir accès à des projets."
            ));
          }
        }
      }
      
      return filteredProjects;
    } catch (error) {
      console.error("❌ Erreur lors du chargement des projets (fallback):", error);
      return [];
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Vérifier les permissions avant de charger les données
      if (!user) {
        showNotification(simpleNotificationHelpers.error(
          "Erreur d'authentification",
          "Utilisateur non connecté"
        ));
        return;
      }

      // Vérifier si l'utilisateur peut accéder aux projets
      const projectPermissions = user.role_id === 1 ? // ADMIN
        { canRead: true, canModify: true } :
        user.role_id === 5 ? // PARTNER  
        { canRead: true, canModify: false } :
        { canRead: false, canModify: false };

      if (!projectPermissions.canRead) {
        showNotification(simpleNotificationHelpers.error(
          "Accès refusé",
          "Vous n'avez pas les permissions pour accéder aux projets"
        ));
        return;
      }
      
      // Charger les données selon le rôle
      if (user.role_id === 1) { // ADMIN - peut voir tous les projets
        const [partnersResponse, projectsResponse] = await Promise.all([
          projectsService.getPartnerNames(),
          projectsService.getActiveProjects()
        ]);
        
        // Importer le service partners pour récupérer les détails complets
        const { partnersService } = await import('@/services/partners');
        
        // Récupérer les partenaires complets avec leurs IDs
        const partnersDetails = await partnersService.getPartners({
          index: 0,
          size: 100,
          data: { is_active: true }
        });
        
        // Créer un map des partner_id vers partner_name
        const partnerIdToNameMap = new Map<number, string>();
        if (partnersDetails?.items) {
          partnersDetails.items.forEach(partner => {
            partnerIdToNameMap.set(partner.id, partner.name);
          });
        }
        
        // Mapper les partner_id avec les noms des partenaires
        const projectsWithPartnerNames = projectsResponse.map(project => ({
          ...project,
          partner_name: project.partner_id ? partnerIdToNameMap.get(project.partner_id) || undefined : undefined
        }));
        
        setPartnerNames(partnersResponse);
        setProjects(projectsWithPartnerNames);
      } else if (user.role_id === 5) { // PARTNER - ne peut voir que ses projets
        // Pour les partenaires, utiliser l'endpoint spécifique s'ils ont un partner_id
        let partnerProjects: Project[] = [];
        
        if (user.partner_id) {
          console.log(`📡 Chargement des projets via l'endpoint partenaire pour partner_id: ${user.partner_id}`);
          try {
            partnerProjects = await projectsService.getPartnerProjects(user.partner_id);
            console.log(`✅ Projets du partenaire chargés: ${partnerProjects.length}`);
          } catch (error) {
            console.warn("⚠️ Erreur avec l'endpoint partenaire, fallback vers l'endpoint général");
            // Fallback vers l'endpoint général si l'endpoint partenaire échoue
            partnerProjects = await loadProjectsWithFallback(user);
          }
        } else {
          console.log("📢 Aucun partner_id trouvé, utilisation du fallback");
          partnerProjects = await loadProjectsWithFallback(user);
        }
        
        setProjects(partnerProjects);
        
        // Pas besoin de charger tous les partenaires
        setPartnerNames([]); 
      } else {
        showNotification(simpleNotificationHelpers.error(
          "Accès refusé", 
          `Rôle non reconnu: ${user.role_id}`
        ));
        return;
      }
      
    } catch (error: any) {
      console.error("Erreur lors du chargement:", error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.message && error.message.includes('401')) {
        // Pour les partenaires, une erreur 401 peut indiquer un problème de permissions
        // plutôt qu'une session expirée
        if (user && user.role_id === 5) { // PARTNER
          console.warn("Erreur 401 pour un partenaire - possibilité de problème de permissions backend");
          showNotification(simpleNotificationHelpers.warning(
            "Problème d'accès",
            "Impossible d'accéder aux projets. Vérifiez vos permissions ou contactez l'administrateur."
          ));
          // Ne pas rediriger car l'utilisateur est connecté mais n'a peut-être pas les bonnes permissions
        } else {
          // Pour les admins, c'est probablement une session expirée
          showNotification(simpleNotificationHelpers.error(
            "Session expirée",
            "Votre session a expiré. Vous allez être redirigé vers la connexion."
          ));
          // Laisser TokenExpirationHandler gérer la redirection pour les admins
        }
      } else {
        // Vérifier d'abord si c'est une erreur de token expiré
        apiInterceptor.handleApiError(error);

        // Générer le message d'erreur approprié
        const errorMessage = getContextualErrorMessage(error, {
          operation: 'load',
          dataType: 'projects',
          fallback: "Impossible de charger les données"
        });

        showNotification(simpleNotificationHelpers.error(
          "Erreur",
          errorMessage
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];
    
    // Filtrage par recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.partner_name && project.partner_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtrage par partenaire
    if (selectedPartner !== "tous") {
      filtered = filtered.filter(project => project.partner_name === selectedPartner);
    }
    
    setFilteredProjects(filtered);
  };

  const loadProjectsByPartner = async (partnerName: string) => {
    try {
      setLoading(true);
      
      if (partnerName === "tous") {
        const allProjects = await projectsService.getActiveProjects();
        setProjects(allProjects);
      } else {
        const partnerProjects = await projectsService.getProjectsByPartner(partnerName);
        setProjects(partnerProjects);
      }
      
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
      showNotification(simpleNotificationHelpers.error(
        "Erreur",
        "Impossible de charger les projets du partenaire"
      ));
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerChange = (keys: any) => {
    const selected = Array.from(keys)[0] as string;
    setSelectedPartner(selected);
    
    // Recharger les projets si nécessaire
    if (selected !== "tous") {
      loadProjectsByPartner(selected);
    } else {
      loadProjectsByPartner("tous");
    }
  };

  const handleProjectAction = (project: Project, action: 'view' | 'edit' | 'delete') => {
    setModalState({
      isOpen: true,
      type: action,
      project
    });
  };

  // Handlers pour les callbacks des modals
  const handleModalSuccess = (message: string) => {
    showNotification(simpleNotificationHelpers.success(
      "Succès",
      message
    ));
  };

  const handleModalError = (message: string) => {
    showNotification(simpleNotificationHelpers.error(
      "Erreur",
      message
    ));
  };

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Date invalide';
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role_id === 1 ? "Gestion des Projets" : "Mes Projets"}
          </h1>
        </div>
        <LoadingState type="skeleton" skeletonVariant="table" skeletonCount={8} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête avec statistiques */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-gradient-to-br from-[#4ba9b7]/10 via-white to-[#4ba9b7]/5 p-8 shadow-lg dark:border-gray-700 dark:from-[#4ba9b7]/20 dark:via-gray-800 dark:to-[#4ba9b7]/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">
              {user?.role_id === 1 ? "Gestion des Projets" : "Mes Projets"}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Gestion et suivi de vos projets en cours
            </p>
          </div>

          {/* Bouton nouveau projet uniquement pour les admins */}
          {user?.role_id === 1 && (
            <Button
              color="primary"
              size="lg"
              startContent={<Plus className="h-5 w-5" />}
              onPress={() => setModalState({ isOpen: true, type: 'create', project: null })}
              className="bg-gradient-to-r from-[#4ba9b7] to-[#6bb6c7] px-6 py-3 font-semibold shadow-lg"
            >
              Nouveau Projet
            </Button>
          )}
        </div>
      </motion.div>

      {/* Statistiques étendues */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
        {(() => {
          const stats = calculateProjectStats(projects);
          const projectStatsCards = [
            {
              title: "Total Projets",
              value: stats.totalProjects,
              icon: <FolderOpen className="h-5 w-5" />,
              color: "bg-[#4ba9b7]",
              textColor: "text-[#4ba9b7]"
            },
            {
              title: "Projets Actifs", 
              value: stats.activeProjects,
              icon: <CheckCircle className="h-5 w-5" />,
              color: "bg-green-500",
              textColor: "text-green-600"
            },
            {
              title: "Projets Inactifs",
              value: stats.inactiveProjects,
              icon: <Clock className="h-5 w-5" />,
              color: "bg-orange-500", 
              textColor: "text-orange-600"
            },
            {
              title: "Nouveaux ce Mois",
              value: stats.recentProjects,
              icon: <Plus className="h-5 w-5" />,
              color: "bg-blue-500",
              textColor: "text-blue-600"
            },
            {
              title: "Partenaires Actifs",
              value: stats.partnersWithProjects,
              icon: <Users className="h-5 w-5" />,
              color: "bg-purple-500",
              textColor: "text-purple-600"
            },
            {
              title: "Projets/Partenaire",
              value: stats.avgProjectsPerPartner,
              icon: <Calendar className="h-5 w-5" />,
              color: "bg-indigo-500", 
              textColor: "text-indigo-600"
            }
          ];
          
          return projectStatsCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className={`text-2xl font-bold ${stat.textColor} dark:text-white`}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.color} rounded-lg p-3 text-white`}>
                      {stat.icon}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ));
        })()}
      </div>

      {/* Filtres */}
      <motion.div
        className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search className="h-4 w-4 text-gray-400" />}
              className="max-w-md"
              size="lg"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtres:</span>
            </div>
            
            {/* Filtrage par partenaire uniquement pour les admins */}
            {user?.role_id === 1 && (
              <Select
                selectedKeys={selectedPartner ? [selectedPartner] : []}
                onSelectionChange={handlePartnerChange}
                className="min-w-[180px]"
                size="sm"
                placeholder="Partenaire"
                items={[{ key: "tous", label: "Tous les partenaires" }, ...partnerNames.map(name => ({ key: name, label: name }))]}
              >
                {(item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                )}
              </Select>
            )}
            
            <Button
              variant="flat"
              isIconOnly
              onPress={loadInitialData}
              isLoading={loading}
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Table des projets */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Table 
          aria-label="Table des projets"
          selectionMode="none"
          className="w-full"
          classNames={{
            wrapper: "min-h-[400px] shadow-none border border-gray-200 dark:border-gray-700 w-full",
            table: "min-h-[200px] w-full table-fixed",
            th: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm",
            td: "py-4 px-3",
          }}
          bottomContent={
            filteredProjects.length > 0 ? (
              <div className="flex w-full justify-between items-center px-2 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredProjects.length)} sur {filteredProjects.length} projets
                </span>
                {filteredProjects.length > 10 && (
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={currentPage}
                    total={totalPages}
                    onChange={setCurrentPage}
                  />
                )}
              </div>
            ) : null
          }
        >
          <TableHeader>
            <TableColumn key="project" width="35%">PROJET</TableColumn>
            <TableColumn key="partner" width="20%">PARTENAIRE</TableColumn>
            <TableColumn key="status" width="15%">STATUT</TableColumn>
            <TableColumn key="created" width="15%">CRÉÉ LE</TableColumn>
            <TableColumn key="actions" width="15%">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody 
            items={paginatedProjects}
            emptyContent={
              <div className="flex flex-col items-center gap-2 py-8">
                <FolderOpen className="w-12 h-12 text-gray-400" />
                <p className="text-gray-500">Aucun projet trouvé</p>
              </div>
            }
          >
            {(project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="sm"
                      name={project.title.charAt(0)}
                      className="bg-blue-500 text-white"
                    />
                    <div className="flex flex-col">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{project.title}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{project.partner_name || "Non assigné"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    className="capitalize"
                    color={project.is_active ? "success" : "warning"}
                    size="sm"
                    variant="flat"
                  >
                    {project.is_active ? "Actif" : "Inactif"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formatDate(project.created_at)}
                  </span>
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button
                        isIconOnly
                        variant="light" 
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Actions du projet">
                      {[
                        <DropdownItem
                          key="view"
                          startContent={<Eye className="h-4 w-4" />}
                          onPress={() => router.push(`/tableaudebord/projet/pageprojet/${project.id}`)}
                        >
                          Voir détails
                        </DropdownItem>,
                        ...(user?.role_id === 1 ? [
                          <DropdownItem
                            key="edit"
                            startContent={<Edit className="h-4 w-4" />}
                            onPress={() => handleProjectAction(project, 'edit')}
                          >
                            Modifier
                          </DropdownItem>,
                          <DropdownItem
                            key="delete"
                            startContent={<Trash2 className="h-4 w-4" />}
                            color="danger"
                            onPress={() => handleProjectAction(project, 'delete')}
                          >
                            Supprimer
                          </DropdownItem>
                        ] : [])
                      ]}
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Modals */}
      <ProjectModals
        isOpen={modalState.isOpen}
        type={modalState.type}
        project={modalState.project}
        onClose={() => setModalState({ isOpen: false, type: null, project: null })}
        onRefresh={loadInitialData}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />
    </div>
  );
};

export default OptimizedProjectList;