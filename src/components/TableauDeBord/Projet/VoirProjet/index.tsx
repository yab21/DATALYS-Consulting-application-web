"use client";

import React, { useEffect, useState } from "react";
import { Chip, Button, Card, CardBody, CardHeader, Tabs, Tab } from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import FolderManager from "@/components/UI/FolderManager/FolderManager";
import FileViewer from "@/components/UI/FileViewer/FileViewer";
import { foldersService, Folder as FolderType } from "@/services/folders";
import { filesService } from "@/services/files";
import { ProjectPartner } from "@/services/projectPartners";
import AnalyticsDashboard from "@/components/UI/Analytics/Dashboard";
import ProjectPartnerManager from "@/components/UI/ProjectPartnerManager/ProjectPartnerManager";
import { useNotifications } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";
import { useParams, useSearchParams } from "next/navigation";
import LoadingState from "@/components/UI/Loading/LoadingState";

// Interfaces
interface Partner {
  id: string;
  nom: string;
  logo: string;
  secteur: string;
  description: string;
  email: string;
  telephone: string;
  responsable: string;
  statut: "actif" | "inactif" | "suspendu";
}

interface Project {
  id: string;
  intitule: string;
  societe: string;
  chefDeProjet: string;
  domaine: string[];
  createdAt: Date;
  statut: "en_cours" | "termine" | "en_attente" | "suspendu";
  progression?: number;
  budget?: number;
  description?: string;
  visibilite: "public" | "prive" | "restreint";
}

interface VoirProjetProps {
  id?: string;
}

const VoirProjet: React.FC<VoirProjetProps> = ({ id }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = id || (params.id as string);
  const [project, setProject] = useState<Project | null>(null);
  const [projectPartners, setProjectPartners] = useState<ProjectPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "files");
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  // TEMPORAIRE: Désactiver l'API project pour tester uniquement les folders
  useEffect(() => {
    const loadProject = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        console.log('🚧 Mode test folders - API project désactivée');
        
        // Projet par défaut pour les tests de folders
        setProject({
          id: projectId,
          intitule: `Test Projet ${projectId}`,
          societe: "Test Partner",
          chefDeProjet: "Test Manager",
          domaine: ["Test"],
          createdAt: new Date(),
          statut: "en_cours",
          progression: 75,
          budget: 50000,
          description: "Projet de test pour les APIs folders",
          visibilite: "public",
        });
        
      } catch (error) {
        console.error('Erreur lors du chargement du projet:', error);
        
        // Projet par défaut en cas d'erreur
        setProject({
          id: projectId,
          intitule: `Test Projet ${projectId}`,
          societe: "Test Partner",
          chefDeProjet: "Test Manager",
          domaine: ["Test"],
          createdAt: new Date(),
          statut: "en_cours",
          progression: 0,
          budget: 0,
          description: "Erreur lors du chargement depuis l'API",
          visibilite: "public",
        });
        
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, user, addNotification]);

  // Gestionnaires pour FolderManager et FileManager
  const handleFolderSelect = (folder: FolderType | null) => {
    setSelectedFolder(folder);
  };

  const handleFileUpload = async (files: File[], folderId: number | null = null) => {
    if (!project || !files.length || !user) return;

    try {
      const projectIdNum = parseInt(projectId);

      // Gestionnaire de progression
      const onProgress = (progress: number, fileName: string) => {
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: progress
        }));
      };

      // Upload des fichiers via le service
      const uploadedFiles = await filesService.uploadFiles(
        files,
        projectIdNum,
        user.id,
        folderId,
        `Fichiers uploadés dans le projet ${project.intitule}`,
        onProgress
      );

      // Nettoyer le state de progression
      setUploadProgress({});
      
      addNotification({
        title: "Upload réussi",
        body: `${uploadedFiles.length} fichier${uploadedFiles.length > 1 ? 's' : ''} uploadé${uploadedFiles.length > 1 ? 's' : ''} avec succès`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      console.log("Fichiers uploadés:", uploadedFiles);
      
    } catch (error) {
      console.error("Erreur upload:", error);
      setUploadProgress({});
      
      addNotification({
        title: "Erreur d'upload",
        body: "Une erreur est survenue lors de l'upload",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    }
  };

  const handleFileDelete = async (fileIds: string[]) => {
    try {
      console.log("Suppression de fichiers:", fileIds);
      
      addNotification({
        title: "Fichiers supprimés",
        body: `${fileIds.length} fichier${fileIds.length > 1 ? 's' : ''} supprimé${fileIds.length > 1 ? 's' : ''}`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const handleFolderCreate = async (name: string, parentPath: string) => {
    try {
      console.log("Création de dossier:", name, "dans:", parentPath);
      
      addNotification({
        title: "Dossier créé",
        body: `Le dossier "${name}" a été créé avec succès`,
        type: "success",
        priority: "low",
        category: "project",
        read: false,
      });
    } catch (error) {
      console.error("Erreur création dossier:", error);
    }
  };

  // TEMPORAIRE: Gestionnaire désactivé pour les tests folders
  const handlePartnersUpdate = (updatedPartners: ProjectPartner[]) => {
    console.log('🚧 Mode test folders - Gestion partenaires désactivée');
  };

  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_cours": return "primary";
      case "termine": return "success";
      case "en_attente": return "warning";
      case "suspendu": return "danger";
      default: return "default";
    }
  };

  // Fonction pour obtenir la couleur de la visibilité
  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public": return "success";
      case "prive": return "warning";
      case "restreint": return "danger";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb pageName="Chargement du projet..." />
        <LoadingState type="skeleton" skeletonVariant="profile" />
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Breadcrumb pageName="Projet introuvable" />
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-600">Projet introuvable</h3>
          <p className="text-gray-400 mt-2">Le projet demandé n'existe pas ou vous n'y avez pas accès.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb pageName={`Projet: ${project.intitule}`} />
      
      <div className="mx-auto max-w-7xl space-y-6">
        {/* En-tête du projet */}
        <Card className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900/20 border-0 dark:border dark:border-gray-700">
          <CardHeader className="pb-6 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-t-large">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {project.intitule}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">{project.societe}</p>
                </div>
                
                <div className="flex gap-3">
                  <Chip
                    color={getStatusColor(project.statut)}
                    variant="shadow"
                    size="lg"
                    className="font-semibold"
                  >
                    {project.statut.replace("_", " ")}
                  </Chip>
                  <Chip
                    color={getVisibilityColor(project.visibilite)}
                    variant="shadow"
                    size="lg"
                    className="font-semibold"
                  >
                    {project.visibilite}
                  </Chip>
                </div>
              </div>

              {/* Informations du projet */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Chef de projet</p>
                  <p className="text-gray-900 dark:text-white font-medium">{project.chefDeProjet}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Domaines</p>
                  <div className="flex flex-wrap gap-1">
                    {project.domaine.map((domain, index) => (
                      <Chip key={index} size="sm" variant="flat" color="secondary" className="text-xs">
                        {domain}
                      </Chip>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Progression</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${project.progression || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{project.progression || 0}%</span>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">Budget</p>
                  <p className="text-gray-900 dark:text-white font-bold text-lg">
                    {project.budget ? `${project.budget.toLocaleString('fr-FR')} €` : "Non défini"}
                  </p>
                </div>
              </div>

              {project.description && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-6 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Description du projet</p>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{project.description}</p>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Contenu principal avec onglets */}
        <Card className="bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900/20 border-0 dark:border dark:border-gray-700">
          <CardBody className="p-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              className="w-full"
              size="lg"
              classNames={{
                tabList: "bg-gray-50 dark:bg-gray-700 p-2 rounded-t-large",
                tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-600 data-[selected=true]:shadow-lg",
                tabContent: "text-gray-600 dark:text-gray-300 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-semibold"
              }}
            >
              <Tab key="files" title="📁 Fichiers & Dossiers">
                <div className="p-6 bg-gray-50 dark:bg-gray-800 min-h-[500px] space-y-6">
                  {/* Gestionnaire de dossiers */}
                  <FolderManager
                    projectId={parseInt(projectId)}
                    projectName={project.intitule}
                    onFolderSelect={handleFolderSelect}
                    onFileUpload={handleFileUpload}
                    allowCreateFolder={true}
                    allowDeleteFolder={true}
                    allowMoveFolder={true}
                    className="mb-6"
                  />

                  {/* Affichage du dossier sélectionné */}
                  {selectedFolder && (
                    <FileViewer
                      projectId={parseInt(projectId)}
                      folderId={selectedFolder.id}
                      folderName={selectedFolder.name}
                      onFileUpload={(files) => handleFileUpload(files, selectedFolder.id)}
                      allowUpload={true}
                      allowDelete={true}
                      allowEdit={true}
                    />
                  )}

                  {/* Affichage des fichiers racine si aucun dossier sélectionné */}
                  {!selectedFolder && (
                    <FileViewer
                      projectId={parseInt(projectId)}
                      folderId={null}
                      folderName="Racine du projet"
                      onFileUpload={(files) => handleFileUpload(files, null)}
                      allowUpload={true}
                      allowDelete={true}
                      allowEdit={true}
                    />
                  )}

                  {/* Informations sur l'upload en cours */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                        Upload en cours...
                      </h4>
                      {Object.entries(uploadProgress).map(([fileName, progress]) => (
                        <div key={fileName} className="mb-2">
                          <div className="flex justify-between text-sm text-blue-700 dark:text-blue-300 mb-1">
                            <span>{fileName}</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Tab>

              {/* TEMPORAIRE: Onglets désactivés pour tester les folders */}
              {/*
              <Tab key="analytics" title="📊 Analytics">
                <div className="p-6 bg-gray-50 dark:bg-gray-800 min-h-[500px]">
                  <p className="text-center text-gray-500">Onglet Analytics désactivé pour les tests folders</p>
                </div>
              </Tab>

              <Tab key="partners" title="🤝 Partenaires">
                <div className="p-6 bg-gray-50 dark:bg-gray-800 min-h-[500px]">
                  <p className="text-center text-gray-500">Onglet Partenaires désactivé pour les tests folders</p>
                </div>
              </Tab>
              */}

              <Tab key="settings" title="⚙️ Paramètres">
                <div className="p-6 bg-gray-50 dark:bg-gray-800 min-h-[500px]">
                  <div className="space-y-6 max-w-4xl">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Paramètres du projet</h3>
                      <div className="grid gap-6">
                        <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Notifications</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Recevoir des notifications pour ce projet
                            </p>
                          </div>
                          <Button size="md" variant="flat" color="primary" className="font-semibold">
                            Activer
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Sauvegarde automatique</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Sauvegarder automatiquement les modifications
                            </p>
                          </div>
                          <Button size="md" variant="flat" color="success" className="font-semibold">
                            Activé
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Collaboration</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Permettre la collaboration en temps réel
                            </p>
                          </div>
                          <Button size="md" variant="flat" color="secondary" className="font-semibold">
                            Configurer
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Archiver le projet</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Archiver ce projet (action réversible)
                            </p>
                          </div>
                          <Button size="md" variant="flat" color="warning" className="font-semibold">
                            Archiver
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default VoirProjet;