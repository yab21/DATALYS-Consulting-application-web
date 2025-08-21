"use client";

import React, { useEffect, useState } from "react";
import { Chip, Card, CardBody, CardHeader, Tabs, Tab, Button, Avatar, Progress } from "@nextui-org/react";
import { 
  FolderOpen, 
  Users, 
  Calendar, 
  Activity, 
  Settings, 
  Download,
  Share2,
  BarChart3,
  Clock
} from "lucide-react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import FolderManager from "@/components/UI/FolderManager/FolderManager";
import FileManager from "@/components/UI/FileManager/FileManager";
import { Folder as FolderType } from "@/services/folders";
import { projectsService } from "@/services/projects";
import { useAuth } from "@/context/AuthContext";
import { useParams, useSearchParams } from "next/navigation";
import LoadingState from "@/components/UI/Loading/LoadingState";

// Interfaces

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "files");
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { user, isAdmin } = useAuth();

  // Charger les données réelles du projet
  useEffect(() => {
    const loadProject = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        console.log('🔄 Chargement du projet réel:', projectId);
        
        // Utiliser projectsService pour récupérer les vraies données
        const projectsData = await projectsService.getActiveProjects();
        const currentProject = projectsData.find(p => p.id.toString() === projectId);
        
        // Debug: afficher la structure exacte de l'API
        console.log('🔍 Données complètes du projet depuis l\'API:', currentProject);
        console.log('🔍 Partner name spécifique:', currentProject?.partner_name);
        console.log('🔍 Toutes les clés disponibles:', Object.keys(currentProject || {}));
        
        if (currentProject) {
          // UNIQUEMENT les vraies données de l'API - pas d'invention
          setProject({
            id: projectId,
            intitule: currentProject.title,
            societe: currentProject.partner_name || "Aucun partenaire assigné",
            chefDeProjet: "Non défini", // Pas dans l'API
            domaine: [], // Pas dans l'API 
            createdAt: new Date(currentProject.created_at),
            statut: currentProject.is_active ? "en_cours" : "suspendu",
            progression: 0, // Pas dans l'API
            budget: 0, // Pas dans l'API
            description: "", // Pas dans l'API
            visibilite: "public", // Valeur par défaut minimale
          });
        } else {
          throw new Error('Projet non trouvé');
        }
        
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
  }, [projectId, user]);

  // Gestionnaire pour FolderManager uniquement
  const handleFolderSelect = (folder: FolderType | null) => {
    console.log('Dossier sélectionné:', folder);
    setSelectedFolder(folder);
  };

  // Gestionnaire pour l'upload de fichiers (FileManager)
  const handleFileManagerUpload = async (files: File[], path: string): Promise<void> => {
    console.log('Fichiers uploadés via FileManager:', files, 'dans le chemin:', path);
    // Rafraîchir les fichiers après upload
    setFileRefreshKey(prev => prev + 1);
  };

  // Gestionnaire pour l'upload de fichiers (FolderManager)
  const handleFolderManagerUpload = (files: File[], folderId: number | null): void => {
    console.log('Fichiers uploadés via FolderManager:', files, 'dans le dossier:', folderId);
    // Rafraîchir les fichiers après upload
    setFileRefreshKey(prev => prev + 1);
  };

  // Gestionnaire pour capturer les fichiers uploadés et les ajouter à la liste
  const handleFileUploaded = (uploadResponse: any) => {
    console.log('🔍 Réponse upload reçue - Structure complète:', {
      response: uploadResponse,
      keys: Object.keys(uploadResponse || {}),
      status: uploadResponse?.status,
      data: uploadResponse?.data,
      files: uploadResponse?.files
    });
    
    // Gérer les différents formats de réponse
    if (uploadResponse.files && Array.isArray(uploadResponse.files)) {
      // Upload multiple : {files: [...], folder_id: 24, ...}
      console.log('📤 Traitement upload multiple - Files:', uploadResponse.files);
      const newFiles = uploadResponse.files.map((file: any) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'file',
        path: file.path,
        folder_id: file.folder_id,
        createdAt: new Date(),
        modifiedAt: new Date()
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      console.log('✅ Fichiers ajoutés à uploadedFiles:', newFiles);
    } else if (uploadResponse.data?.db_record) {
      // Upload simple : {data: {db_record: {...}, file_id: 21, ...}}
      console.log('📤 Traitement upload simple - DB Record:', uploadResponse.data.db_record);
      const dbRecord = uploadResponse.data.db_record;
      const newFile = {
        id: dbRecord.id,
        name: dbRecord.name,
        type: 'file',
        file_url: uploadResponse.data.file_url,
        file_path: uploadResponse.data.file_path,
        is_public: dbRecord.is_public,
        created_at: dbRecord.created_at,
        createdAt: new Date(dbRecord.created_at),
        modifiedAt: new Date(dbRecord.updated_at),
        folder_id: dbRecord.folder_id || null
      };
      setUploadedFiles(prev => [...prev, newFile]);
      console.log('✅ Fichier ajouté à uploadedFiles:', newFile);
    } else {
      console.warn('⚠️ Format de réponse upload non reconnu:', uploadResponse);
      // Essayer de traiter d'autres formats possibles
      if (uploadResponse.status === 'success' && uploadResponse.data) {
        console.log('🔄 Tentative de traitement format alternatif...');
        // Peut-être que l'API renvoie directement le fichier dans .data
        const fileData = uploadResponse.data;
        if (fileData.name) {
          const newFile = {
            id: fileData.id || `temp-${Date.now()}-${Math.random()}`,
            name: fileData.name,
            type: 'file',
            file_url: fileData.file_url,
            file_path: fileData.file_path,
            is_public: fileData.is_public,
            created_at: fileData.created_at,
            createdAt: new Date(fileData.created_at || Date.now()),
            modifiedAt: new Date(fileData.updated_at || Date.now()),
            folder_id: fileData.folder_id || null
          };
          setUploadedFiles(prev => [...prev, newFile]);
          console.log('✅ Fichier ajouté avec format alternatif:', newFile);
        }
      }
    }
    
    // Force le rechargement des fichiers depuis l'API
    setFileRefreshKey(prev => prev + 1);
    
    // Vider les fichiers uploadés localement après 2 secondes car ils seront rechargés via l'API
    setTimeout(() => {
      setUploadedFiles([]);
    }, 2000);
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
        {/* En-tête du projet amélioré */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#4ba9b7]/5 via-transparent to-blue-500/5 dark:from-[#4ba9b7]/10 dark:to-blue-500/10"></div>
          <CardHeader className="relative pb-8 pt-8 bg-gradient-to-r from-[#4ba9b7]/10 via-transparent to-blue-500/10 dark:from-gray-800 dark:to-gray-700">
            <div className="flex flex-col gap-8 w-full">
              {/* Header principal */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#4ba9b7] to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-[#4ba9b7]/25">
                      <FolderOpen className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
                      {project.intitule}
                    </h1>
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">{project.societe}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Créé le {project.createdAt.toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 lg:flex-col lg:items-end">
                  <Chip
                    color={project.statut === "en_cours" ? "success" : "default"}
                    variant="shadow"
                    size="lg"
                    className="font-bold text-base px-4 py-2"
                    startContent={<Activity className="w-4 h-4" />}
                  >
                    {project.statut === "en_cours" ? "🟢 Projet Actif" : "⚪ Projet Inactif"}
                  </Chip>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="flat"
                      color="secondary"
                      size="sm"
                      startContent={<Share2 className="w-4 h-4" />}
                      className="font-medium"
                    >
                      Partager
                    </Button>
                    <Button
                      variant="flat"
                      color="primary"
                      size="sm"
                      startContent={<Settings className="w-4 h-4" />}
                      className="font-medium"
                    >
                      Gérer
                    </Button>
                  </div>
                </div>
              </div>

              {/* Statistiques du projet */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">ID Projet</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">#{project.id}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Durée</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {Math.floor((new Date().getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24))} jours
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statut</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {project.statut === "en_cours" ? "🟢 Actif" : "⚪ Inactif"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-600 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Partenaire</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {project.societe}
                      </p>
                    </div>
                  </div>
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

        {/* Contenu principal avec onglets améliorés */}
        <Card className="bg-white dark:bg-gray-800 shadow-2xl dark:shadow-gray-900/30 border-0 dark:border dark:border-gray-700 overflow-hidden">
          <CardBody className="p-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              className="w-full"
              size="lg"
              classNames={{
                tabList: "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-3 gap-3",
                tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-600 data-[selected=true]:shadow-xl data-[selected=true]:scale-105 transition-all duration-300 rounded-xl px-4 py-3",
                tabContent: "text-gray-600 dark:text-gray-300 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-bold text-base"
              }}
            >
              <Tab 
                key="files" 
                title={
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5" />
                    <span>Gestion des Dossiers</span>
                  </div>
                }
              >
                <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 min-h-[600px] space-y-8">
                  {/* En-tête de section */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Arborescence du projet
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Organisez vos fichiers et dossiers pour ce projet
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="flat"
                        color="secondary"
                        startContent={<Download className="w-4 h-4" />}
                        className="font-medium"
                      >
                        Exporter
                      </Button>
                    </div>
                  </div>

                  {/* Gestionnaire de dossiers avec design amélioré */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <FolderManager
                      projectId={parseInt(projectId)}
                      projectName={project.intitule}
                      onFolderSelect={handleFolderSelect}
                      onFileUpload={handleFolderManagerUpload}
                      onFileUploaded={handleFileUploaded}
                      allowCreateFolder={isAdmin()}
                      allowDeleteFolder={isAdmin()}
                      className="p-6"
                    />
                  </div>

                  {/* Gestionnaire de fichiers du projet (niveau racine) */}
                  {!selectedFolder && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Fichiers du projet
                        </h3>
                      </div>
                      <div className="p-6">
                        <FileManager
                          key={`root-${fileRefreshKey}`}
                          projectId={projectId}
                          currentFolderId={null}
                          rootPath="/"
                          allowUpload={isAdmin()}
                          allowDelete={isAdmin()}
                          allowCreateFolder={isAdmin()}
                          onFileUpload={handleFileManagerUpload}
                          uploadedFiles={uploadedFiles}
                        />
                      </div>
                    </div>
                  )}

                  {/* Gestionnaire de fichiers pour le dossier sélectionné */}
                  {selectedFolder && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Fichiers dans "{selectedFolder.name}"
                        </h3>
                      </div>
                      <div className="p-6">
                        <FileManager
                          key={`${selectedFolder.id}-${fileRefreshKey}`}
                          projectId={projectId}
                          currentFolderId={selectedFolder.id.toString()}
                          rootPath={`/${selectedFolder.name}`}
                          allowUpload={isAdmin()}
                          allowDelete={isAdmin()}
                          allowCreateFolder={isAdmin()}
                          onFileUpload={handleFileManagerUpload}
                          uploadedFiles={uploadedFiles.filter(file => file.folder_id === selectedFolder.id)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Conseils d'utilisation améliorés */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-[#4ba9b7]/10 to-blue-500/10 dark:from-[#4ba9b7]/20 dark:to-blue-500/20 p-6 rounded-2xl border border-[#4ba9b7]/20 dark:border-[#4ba9b7]/30">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#4ba9b7] rounded-xl flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                            Organisation des dossiers
                          </h4>
                          <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-[#4ba9b7] font-bold">•</span>
                              <span>Créez des dossiers pour organiser vos fichiers</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#4ba9b7] font-bold">•</span>
                              <span>Utilisez des sous-dossiers pour une meilleure hiérarchie</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-[#4ba9b7] font-bold">•</span>
                              <span>Renommez et réorganisez facilement</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">
                            Actions rapides
                          </h4>
                          <ul className="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-green-500 font-bold">•</span>
                              <span>Upload de fichiers multiples en un clic</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500 font-bold">•</span>
                              <span>Extraction automatique d'archives ZIP</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-500 font-bold">•</span>
                              <span>Navigation par breadcrumbs intuitive</span>
                            </li>
                          </ul>
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