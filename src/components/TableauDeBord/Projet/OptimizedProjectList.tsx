"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw 
} from "lucide-react";
import { 
  Button, 
  Chip, 
  Card, 
  CardBody, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Select, 
  SelectItem, 
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { projectsService, Project } from "@/services/projects";
import { useAuth } from "@/context/AuthContext";
import LoadingState from "@/components/UI/Loading/LoadingState";
import { useNotifications, notificationHelpers } from "@/components/UI/Notifications/NotificationSystem";
import OptimizedProjectForm from "./OptimizedProjectForm";

const OptimizedProjectList: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotifications();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // États
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [partnerNames, setPartnerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<string>("tous");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Vérifier les permissions avant de charger les données
      if (!user) {
        showNotification(notificationHelpers.error(
          "Erreur d'authentification",
          "Utilisateur non connecté"
        ));
        return;
      }

      // Vérifier si l'utilisateur peut accéder aux projets
      const projectPermissions = user.role_id === 1 ? // ADMIN
        { canRead: true, canModify: true } :
        user.role_id === 2 ? // PARTNER  
        { canRead: true, canModify: false } :
        { canRead: false, canModify: false };

      if (!projectPermissions.canRead) {
        showNotification(notificationHelpers.error(
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
        
        setPartnerNames(partnersResponse);
        setProjects(projectsResponse);
      } else if (user.role_id === 2) { // PARTNER - ne peut voir que ses projets
        // Pour les partenaires, charger tous les projets puis filtrer
        const userProjects = await projectsService.getActiveProjects();
        
        console.log("📊 Projets chargés:", userProjects.length);
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
                showNotification(notificationHelpers.info(
                  "Projets chargés",
                  `${filteredProjects.length} projet(s) trouvé(s) pour votre compte`
                ));
              }
            }
            
            // Si toujours aucun projet trouvé après la correspondance manuelle
            if (filteredProjects.length === 0) {
              console.log("💡 L'utilisateur partenaire devra contacter l'administrateur pour associer ses projets");
              showNotification(notificationHelpers.warning(
                "Aucun projet assigné", 
                "Aucun projet n'est actuellement assigné à votre compte. Contactez l'administrateur si vous devriez avoir accès à des projets."
              ));
            }
          }
        }
        
        setProjects(filteredProjects);
        
        // Pas besoin de charger tous les partenaires
        setPartnerNames([]); 
      } else {
        showNotification(notificationHelpers.error(
          "Accès refusé", 
          `Rôle non reconnu: ${user.role_id}`
        ));
        return;
      }
      
    } catch (error: any) {
      console.error("Erreur lors du chargement:", error);
      
      // Gestion spécifique de l'erreur 401 (token expiré)
      if (error.message && error.message.includes('401')) {
        showNotification(notificationHelpers.error(
          "Session expirée",
          "Votre session a expiré. Vous allez être redirigé vers la connexion."
        ));
        // Ne pas rediriger manuellement, laisser TokenExpirationHandler s'en charger
        // car il gère mieux la logique d'expiration de token
      } else {
        showNotification(notificationHelpers.error(
          "Erreur",
          "Impossible de charger les données"
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
      showNotification(notificationHelpers.error(
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

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    onEditOpen();
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!selectedProject || !user) return;
    
    try {
      setActionLoading(true);
      
      await projectsService.deleteProject(
        selectedProject.id, 
        selectedProject.title, 
        user.id
      );
      
      showNotification(notificationHelpers.success(
        "Projet supprimé",
        `Le projet "${selectedProject.title}" a été supprimé avec succès`
      ));
      
      // Recharger la liste
      await loadInitialData();
      onDeleteClose();
      
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showNotification(notificationHelpers.error(
        "Erreur",
        "Impossible de supprimer le projet"
      ));
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSuccess = async () => {
    await loadInitialData();
    onEditClose();
  };

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
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header et actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {user?.role_id === 1 ? "Gestion des Projets" : "Mes Projets"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredProjects.length} projet(s) trouvé(s)
          </p>
        </div>
        
        {/* Bouton nouveau projet uniquement pour les admins */}
        {user?.role_id === 1 && (
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => router.push("/tableaudebord/projet/ajouter")}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            Nouveau Projet
          </Button>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                startContent={<Search className="w-4 h-4 text-gray-400" />}
                variant="bordered"
              />
            </div>
            
            {/* Filtrage par partenaire uniquement pour les admins */}
            {user?.role_id === 1 && (
              <div className="w-full md:w-64">
                <Select
                  label="Filtrer par partenaire"
                  selectedKeys={[selectedPartner]}
                  onSelectionChange={handlePartnerChange}
                  variant="bordered"
                  startContent={<Filter className="w-4 h-4" />}
                  classNames={{
                    trigger: "min-h-12",
                    value: "text-left",
                    selectorIcon: "right-3"
                  }}
                  items={[{ key: "tous", label: "Tous les partenaires" }, ...partnerNames.map(name => ({ key: name, label: name }))]}
                >
                  {(item) => (
                    <SelectItem key={item.key} value={item.key}>
                      {item.label}
                    </SelectItem>
                  )}
                </Select>
              </div>
            )}
            
            <Button
              variant="flat"
              isIconOnly
              onPress={loadInitialData}
              isLoading={loading}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table des projets */}
      <Card>
        <CardBody>
          <Table aria-label="Table des projets">
            <TableHeader>
              <TableColumn>PROJET</TableColumn>
              <TableColumn>PARTENAIRE</TableColumn>
              <TableColumn>STATUT</TableColumn>
              <TableColumn>CRÉÉ LE</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody emptyContent={
              <div className="flex flex-col items-center gap-2 py-8">
                <FolderOpen className="w-12 h-12 text-gray-400" />
                <p className="text-gray-500">Aucun projet trouvé</p>
              </div>
            }>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <p className="font-medium">{project.title}</p>
                      <p className="text-sm text-gray-500">ID: {project.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{project.partner_name || "Non assigné"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={project.is_active ? "success" : "default"}
                      variant="flat"
                      size="sm"
                    >
                      {project.is_active ? "Actif" : "Inactif"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => router.push(`/tableaudebord/projet/pageprojet/${project.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Actions de modification uniquement pour les admins */}
                      {user?.role_id === 1 && (
                        <>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleEdit(project)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            color="danger"
                            onPress={() => handleDelete(project)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal d'édition */}
      <Modal
        isOpen={isEditOpen}
        onClose={onEditClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>Modifier le projet</ModalHeader>
          <ModalBody>
            {selectedProject && (
              <OptimizedProjectForm
                isModal={true}
                projectId={selectedProject.id}
                initialData={{
                  title: selectedProject.title,
                  partner_name: selectedProject.partner_name || "",
                  is_active: selectedProject.is_active
                }}
                onSuccess={handleFormSuccess}
                onClose={onEditClose}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        size="md"
      >
        <ModalContent>
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalBody>
            <p>
              Êtes-vous sûr de vouloir supprimer le projet "{selectedProject?.title}" ?
            </p>
            <p className="text-sm text-gray-500">
              Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onDeleteClose}
              isDisabled={actionLoading}
            >
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={actionLoading}
            >
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default OptimizedProjectList;