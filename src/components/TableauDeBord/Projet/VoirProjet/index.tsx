"use client";

import React, { useEffect, useState } from "react";
import { Chip, Button, Card, CardBody, CardHeader, Tabs, Tab } from "@nextui-org/react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import FileManager from "@/components/UI/FileManager/FileManager";
import AnalyticsDashboard from "@/components/UI/Analytics/Dashboard";
import { useNotifications } from "@/context/NotificationContext";
import { useParams } from "next/navigation";
import LoadingState from "@/components/UI/Loading/LoadingState";

// Interface pour le projet
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

const VoirProjet = () => {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("files");
  const { addNotification } = useNotifications();

  // Charger les données du projet
  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler chargement

      // Données mockées du projet
      const mockProject: Project = {
        id: projectId,
        intitule: "Migration Cloud AWS",
        societe: "TechCorp Solutions",
        chefDeProjet: "Marie Martin",
        domaine: ["itcloud", "security"],
        createdAt: new Date("2024-01-15"),
        statut: "en_cours",
        progression: 65,
        budget: 150000,
        description: "Migration complète de l'infrastructure vers AWS avec optimisation des coûts et amélioration de la sécurité.",
        visibilite: "public",
      };

      setProject(mockProject);
      setLoading(false);
    };

    loadProject();
  }, [projectId]);

  // Gestionnaires pour FileManager
  const handleFileUpload = async (files: File[], path: string) => {
    try {
      console.log("Upload de fichiers:", files, "vers:", path);
      
      addNotification({
        title: "Upload réussi",
        body: `${files.length} fichier${files.length > 1 ? 's' : ''} uploadé${files.length > 1 ? 's' : ''} avec succès`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });
    } catch (error) {
      console.error("Erreur upload:", error);
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
      
      <div className="mt-5 space-y-6">
        {/* En-tête du projet */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-dark dark:text-white">
                    {project.intitule}
                  </h1>
                  <p className="text-default-400 mt-1">{project.societe}</p>
                </div>
                
                <div className="flex gap-2">
                  <Chip
                    color={getStatusColor(project.statut)}
                    variant="flat"
                    size="sm"
                  >
                    {project.statut.replace("_", " ")}
                  </Chip>
                  <Chip
                    color={getVisibilityColor(project.visibilite)}
                    variant="flat"
                    size="sm"
                  >
                    {project.visibilite}
                  </Chip>
                </div>
              </div>

              {/* Informations du projet */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-small font-medium text-default-600">Chef de projet</p>
                  <p className="text-default-800">{project.chefDeProjet}</p>
                </div>
                
                <div>
                  <p className="text-small font-medium text-default-600">Domaines</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.domaine.map((domain, index) => (
                      <Chip key={index} size="sm" variant="flat" color="secondary">
                        {domain}
                      </Chip>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-small font-medium text-default-600">Progression</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${project.progression || 0}%` }}
                      />
                    </div>
                    <span className="text-small">{project.progression || 0}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-small font-medium text-default-600">Budget</p>
                  <p className="text-default-800">
                    {project.budget ? `${project.budget.toLocaleString('fr-FR')} €` : "Non défini"}
                  </p>
                </div>
              </div>

              {project.description && (
                <div>
                  <p className="text-small font-medium text-default-600 mb-2">Description</p>
                  <p className="text-default-700">{project.description}</p>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Contenu principal avec onglets */}
        <Card>
          <CardBody className="p-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              className="w-full"
              size="lg"
            >
              <Tab key="files" title="📁 Fichiers">
                <div className="p-6">
                  <FileManager
                    projectId={project.id}
                    rootPath={`/projets/${project.id}`}
                    allowUpload={true}
                    allowDelete={true}
                    allowCreateFolder={true}
                    allowShare={true}
                    maxFileSize={100}
                    acceptedTypes={[]}
                    onFileUpload={handleFileUpload}
                    onFileDelete={handleFileDelete}
                    onFolderCreate={handleFolderCreate}
                  />
                </div>
              </Tab>

              <Tab key="analytics" title="📊 Analytics">
                <div className="p-6">
                  <AnalyticsDashboard
                    compactMode={true}
                    showExportButton={true}
                    onExport={(data) => {
                      console.log("Export analytics:", data);
                      addNotification({
                        title: "Export terminé",
                        body: "Les données analytics ont été exportées avec succès",
                        type: "success",
                        priority: "low",
                        category: "project",
                        read: false,
                      });
                    }}
                  />
                </div>
              </Tab>

              <Tab key="settings" title="⚙️ Paramètres">
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Paramètres du projet</h3>
                      <div className="grid gap-4">
                        <div className="flex justify-between items-center p-4 bg-default-50 rounded-lg">
                          <div>
                            <p className="font-medium">Notifications</p>
                            <p className="text-small text-default-400">
                              Recevoir des notifications pour ce projet
                            </p>
                          </div>
                          <Button size="sm" variant="flat">
                            Activer
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-default-50 rounded-lg">
                          <div>
                            <p className="font-medium">Sauvegarde automatique</p>
                            <p className="text-small text-default-400">
                              Sauvegarder automatiquement les modifications
                            </p>
                          </div>
                          <Button size="sm" variant="flat" color="success">
                            Activé
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center p-4 bg-default-50 rounded-lg">
                          <div>
                            <p className="font-medium">Collaboration</p>
                            <p className="text-small text-default-400">
                              Permettre la collaboration en temps réel
                            </p>
                          </div>
                          <Button size="sm" variant="flat">
                            Configurer
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