"use client";

import React, { useEffect, useState } from "react";
import { Chip, Card, CardBody, CardHeader, Tabs, Tab, Button, Avatar, Progress } from "@heroui/react";
import { 
  FolderOpen, 
  Users, 
  Calendar, 
  Clock,
  ArrowLeft,
  Eye
} from "lucide-react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { projectsService } from "@/services/projects";
import { useAuth } from "@/context/AuthContext";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import LoadingState from "@/components/UI/Loading/LoadingState";
import ProjectOverview from "./ProjectOverview";
import ProjectFileManager from "./ProjectFileManager";

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
  const router = useRouter();
  const projectId = id || (params.id as string);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { user } = useAuth();

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
        
        // Afficher une erreur plutôt qu'un projet factice
        console.error('Projet non trouvé, redirection vers la liste des projets');
        // Ne pas créer de projet factice
        
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, user]);


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
        {/* Bouton de retour */}
        <div className="flex items-center gap-4">
          <Button
            variant="flat"
            startContent={<ArrowLeft className="w-4 h-4" />}
            onPress={() => router.push('/tableaudebord/projet/gerer')}
            className="font-medium"
          >
            Retour à la gestion des projets
          </Button>
        </div>

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
              </div>

              {/* Statistiques du projet simplifiées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Durée</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {Math.floor((new Date().getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24))} jours
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#4ba9b7]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Partenaire</p>
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
                tabList: "bg-gray-50 dark:bg-gray-700 p-3 gap-3",
                tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-600 data-[selected=true]:shadow-md transition-all duration-200 rounded-lg px-4 py-3",
                tabContent: "text-gray-600 dark:text-gray-300 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-medium text-sm"
              }}
            >
              <Tab 
                key="overview" 
                title={
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5" />
                    <span>Vue d'ensemble</span>
                  </div>
                }
              >
                <ProjectOverview project={project} />
              </Tab>

              <Tab 
                key="files" 
                title={
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-5 h-5" />
                    <span>Gestion des Dossiers</span>
                  </div>
                }
              >
                <ProjectFileManager 
                  projectId={projectId}
                  projectName={project.intitule}
                  onFileUpload={handleFileUploaded}
                  uploadedFiles={uploadedFiles}
                  refreshKey={fileRefreshKey}
                />
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default VoirProjet;