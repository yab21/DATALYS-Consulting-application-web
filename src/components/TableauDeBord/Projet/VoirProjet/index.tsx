"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody, Tabs, Tab, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Textarea } from "@heroui/react";
import {
  FolderOpen,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Eye,
  Dot,
  Lock,
  Unlock,
  XCircle,
} from "lucide-react";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";
import { projectsService } from "@/services/projects";
import { useAuth } from "@/context/AuthContext";
import { isTokenExpiredError } from "@/lib/api-interceptor";
import { extractBackendMessage } from "@/lib/error-handler";
import { useSimpleNotifications, simpleNotificationHelpers } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import LoadingState from "@/components/UI/Loading/LoadingState";
import ProjectOverview from "./ProjectOverview";
import ProjectFileManager from "./ProjectFileManager";

interface Project {
  id: string;
  intitule: string;
  societe: string;
  chefDeProjet: string;
  domaine: string[];
  createdAt: Date;
  statut: "en_cours" | "termine" | "en_attente" | "suspendu" | "cloture";
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
  const { user, isAdmin } = useAuth();
  const { showNotification } = useSimpleNotifications();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const projectsData = await projectsService.getActiveProjects();
        const currentProject = projectsData.find(p => p.id.toString() === projectId);

        if (currentProject) {
          const projectClosed = !!currentProject.closed_at;
          setIsClosed(projectClosed);
          setProject({
            id: projectId,
            intitule: currentProject.title,
            societe: currentProject.partner_name || "Aucun partenaire assigné",
            chefDeProjet: "Non défini",
            domaine: [],
            createdAt: new Date(currentProject.created_at),
            statut: projectClosed ? "cloture" : (currentProject.is_active ? "en_cours" : "suspendu"),
            progression: 0,
            budget: 0,
            description: "",
            visibilite: "public",
          });
        } else {
          throw new Error('Projet non trouvé');
        }
      } catch (error) {
        if (isTokenExpiredError(error)) throw error;
        console.error('Erreur lors du chargement du projet:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [projectId, user]);

  const handleFileUploaded = (uploadResponse: any) => {
    if (uploadResponse.files && Array.isArray(uploadResponse.files)) {
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
    } else if (uploadResponse.data?.db_record) {
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
    } else if (uploadResponse.status === 'success' && uploadResponse.data?.name) {
      const fileData = uploadResponse.data;
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
    }

    setFileRefreshKey(prev => prev + 1);
    setTimeout(() => { setUploadedFiles([]); }, 2000);
  };

  const handleCloseProject = async () => {
    if (!user || !closureReason.trim()) return;
    try {
      setIsClosing(true);
      const result = await projectsService.closeProject(
        parseInt(projectId),
        closureReason.trim(),
        user.id,
        user.email,
      );
      const successMessage = extractBackendMessage(result) || result?.message?.message;
      showNotification(simpleNotificationHelpers.success("Succès", successMessage));
      setShowCloseModal(false);
      setClosureReason("");
      setIsClosed(true);
      if (project) {
        setProject({ ...project, statut: "cloture" });
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      const errorMessage = extractBackendMessage(error);
      showNotification(simpleNotificationHelpers.error("Erreur", errorMessage));
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopenProject = async () => {
    if (!user) return;
    try {
      setIsReopening(true);
      const result = await projectsService.reopenProject(
        parseInt(projectId),
        user.id,
        user.email,
      );
      const successMessage = extractBackendMessage(result) || result?.message?.message;
      showNotification(simpleNotificationHelpers.success("Succès", successMessage));
      setShowReopenModal(false);
      setIsClosed(false);
      if (project) {
        setProject({ ...project, statut: "en_cours" });
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      const errorMessage = extractBackendMessage(error);
      showNotification(simpleNotificationHelpers.error("Erreur", errorMessage));
    } finally {
      setIsReopening(false);
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
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Projet introuvable</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Le projet demandé n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
          <Button
            variant="flat"
            className="mt-6"
            onPress={() => router.push('/tableaudebord/projet/gerer')}
          >
            Retour aux projets
          </Button>
        </div>
      </>
    );
  }

  const projectAge = Math.floor((new Date().getTime() - project.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <Breadcrumb pageName={project.intitule} />

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Bouton retour */}
        <Button
          variant="light"
          size="sm"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push('/tableaudebord/projet/gerer')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white -ml-2"
        >
          Retour aux projets
        </Button>

        {/* En-tête projet */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#4ba9b7]/10 dark:bg-[#4ba9b7]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-[#4ba9b7]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {project.intitule}
                </h1>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {project.societe}
                  </span>
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {project.createdAt.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <Dot className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {projectAge} jour{projectAge !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                project.statut === 'en_cours'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : project.statut === 'cloture'
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  project.statut === 'en_cours' ? 'bg-emerald-500' : project.statut === 'cloture' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                {project.statut === 'en_cours' ? 'Actif' : project.statut === 'cloture' ? 'Clôturé' : 'Suspendu'}
              </span>

              {/* Boutons clôturer / réouvrir (admin uniquement) */}
              {isAdmin() && !isClosed && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<Lock className="w-3.5 h-3.5" />}
                  onPress={() => setShowCloseModal(true)}
                >
                  Clôturer
                </Button>
              )}
              {isAdmin() && isClosed && (
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  startContent={<Unlock className="w-3.5 h-3.5" />}
                  onPress={() => setShowReopenModal(true)}
                >
                  Réouvrir
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardBody className="p-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              className="w-full"
              size="md"
              classNames={{
                tabList: "bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 pt-2 gap-2",
                tab: "data-[selected=true]:bg-white dark:data-[selected=true]:bg-gray-700 data-[selected=true]:border data-[selected=true]:border-gray-200 dark:data-[selected=true]:border-gray-600 data-[selected=true]:border-b-0 rounded-t-lg px-4 py-2.5 transition-colors",
                tabContent: "text-gray-500 dark:text-gray-400 data-[selected=true]:text-gray-900 dark:data-[selected=true]:text-white font-medium text-sm"
              }}
            >
              <Tab
                key="overview"
                title={
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Vue d&apos;ensemble</span>
                  </div>
                }
              >
                <ProjectOverview project={project} onTabChange={setActiveTab} />
              </Tab>

              <Tab
                key="files"
                title={
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>Dossiers & Fichiers</span>
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

      {/* Modal de clôture du projet */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => {
          setShowCloseModal(false);
          setClosureReason("");
        }}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-danger/10 p-2">
                <Lock className="h-5 w-5 text-danger" />
              </div>
              <h3 className="text-xl font-bold">Clôturer le projet</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Vous êtes sur le point de clôturer le projet{" "}
                <span className="font-semibold">{project?.intitule}</span>.
                Cette action désactivera le projet.
              </p>
              <Textarea
                label="Raison de la clôture"
                placeholder="Décrivez pourquoi vous souhaitez clôturer ce projet..."
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                minRows={3}
                isRequired
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => {
                setShowCloseModal(false);
                setClosureReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              color="danger"
              startContent={<Lock className="h-4 w-4" />}
              onPress={handleCloseProject}
              isDisabled={!closureReason.trim()}
              isLoading={isClosing}
            >
              Clôturer le projet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de réouverture du projet */}
      <Modal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        size="md"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Unlock className="h-5 w-5 text-success" />
              </div>
              <h3 className="text-xl font-bold">Réouvrir le projet</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600 dark:text-gray-400">
              Confirmez-vous la réouverture du projet{" "}
              <span className="font-semibold">{project?.intitule}</span> ?
              Le projet redeviendra actif.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowReopenModal(false)}>
              Annuler
            </Button>
            <Button
              color="success"
              startContent={<Unlock className="h-4 w-4" />}
              onPress={handleReopenProject}
              isLoading={isReopening}
            >
              Réouvrir le projet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VoirProjet;
