"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
  Breadcrumbs,
  BreadcrumbItem,
  Progress,
} from '@nextui-org/react';
import {
  FolderOpen,
  FileText,
  ArrowLeft,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  X,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSimpleNotifications } from '@/components/UI/Notifications/SimpleNotificationSystem';
import {
  projectFilesService,
  ProjectFolder,
  ProjectFile,
  FolderStats,
} from '@/services/projectFiles';

// Types
interface Project {
  id: number;
  title: string;
  partner_name?: string;
}

interface FolderWithStats extends ProjectFolder {
  stats?: FolderStats;
  loadingStats?: boolean;
}

interface BreadcrumbPath {
  id: number | null;
  name: string;
}

interface ProjectFilesModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

// Modal principal
const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { user, isAdmin } = useAuth();
  const { showNotification } = useSimpleNotifications();

  // États principaux
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  
  // 🔍 DEBUG: Observer les changements de currentFolderId
  useEffect(() => {
    console.log('🔍 [DEBUG STATE] - currentFolderId changé:', {
      newValue: currentFolderId,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n')
    });
  }, [currentFolderId]);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbPath[]>([
    { id: null, name: project.title }
  ]);

  // États pour les modals
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // États pour l'upload
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // États pour modifier/supprimer des dossiers
  const [editFolderModal, setEditFolderModal] = useState(false);
  const [deleteFolderModal, setDeleteFolderModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<ProjectFolder | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderDescription, setEditFolderDescription] = useState('');
  const [processingFolder, setProcessingFolder] = useState(false);

  // États UI
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculer la taille du modal selon le contenu (amélioré)
  const getModalSize = useCallback(() => {
    if (isFullscreen) return 'full';
    
    const totalItems = folders.length + files.length;
    // Tailles augmentées pour une meilleure utilisation de l'espace
    if (totalItems === 0) return '4xl'; // Dossier vide = taille moyenne pour éviter l'étroitesse
    if (totalItems <= 4) return '4xl';   // Amélioration: 4xl au lieu de 2xl pour les petits contenus
    if (totalItems <= 8) return '5xl';   // Amélioration: seuil abaissé de 12 à 8
    return 'full';                       // Mode plein écran par défaut pour 9+ éléments
  }, [folders.length, files.length, isFullscreen]);

  // Calculer les colonnes de la grille (amélioré)
  const getGridColumns = useCallback(() => {
    if (isFullscreen) return 'grid-cols-6';
    
    const totalItems = folders.length + files.length;
    const modalSize = getModalSize();
    
    // Adapter les colonnes selon la taille du modal
    if (modalSize === '4xl') {
      if (totalItems === 0) return 'grid-cols-1'; // Centrer le message "dossier vide"
      if (totalItems <= 4) return 'grid-cols-3';  // Plus de colonnes pour 4xl
      return 'grid-cols-4';
    }
    
    if (modalSize === '5xl') {
      if (totalItems <= 8) return 'grid-cols-4';
      return 'grid-cols-5';
    }
    
    // Fallback pour les anciennes tailles
    if (totalItems <= 6) return 'grid-cols-3';  // Augmenté de 2 à 3
    if (totalItems <= 12) return 'grid-cols-4'; // Augmenté de 3 à 4
    return 'grid-cols-5';                       // Augmenté de 4 à 5
  }, [folders.length, files.length, isFullscreen, getModalSize]);

  // Charger les données du dossier courant (avec logs de debug)
  const loadCurrentFolder = useCallback(async () => {
    if (!isOpen) return;
    
    // 🔍 LOG: Début du chargement
    console.log('🔍 [DEBUG LOAD FOLDER] - Début chargement:', {
      currentFolderId,
      projectId: project.id,
      isOpen
    });
    
    setLoading(true);
    try {
      // Charger les dossiers
      const foldersData = await projectFilesService.getFolders(currentFolderId, project.id);
      
      // 🔍 LOG: Dossiers récupérés
      console.log('🔍 [DEBUG LOAD FOLDER] - Dossiers récupérés:', {
        count: foldersData.length,
        folders: foldersData.map(f => ({
          id: f.id,
          name: f.name,
          parent_folder_id: f.parent_folder_id,
          project_id: f.project_id
        }))
      });
      
      const foldersWithStats: FolderWithStats[] = foldersData.map(folder => ({
        ...folder,
        loadingStats: true,
      }));
      setFolders(foldersWithStats);

      // Charger les fichiers
      if (currentFolderId !== null) {
        const filesData = await projectFilesService.getFiles(currentFolderId, project.id);
        setFiles(filesData);
      } else {
        setFiles([]);
      }

      // Charger les statistiques des dossiers en arrière-plan
      foldersWithStats.forEach(async (folder, index) => {
        try {
          const stats = await projectFilesService.getFolderStats(folder.id, project.id);
          setFolders(prev => 
            prev.map((f, i) => 
              i === index 
                ? { ...f, stats, loadingStats: false }
                : f
            )
          );
        } catch (error) {
          setFolders(prev => 
            prev.map((f, i) => 
              i === index 
                ? { ...f, loadingStats: false }
                : f
            )
          );
        }
      });

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les données du dossier'
      });
    } finally {
      setLoading(false);
    }
  }, [isOpen, currentFolderId, project.id, showNotification]);

  // Charger les données au montage et changement de dossier
  useEffect(() => {
    loadCurrentFolder();
  }, [loadCurrentFolder]);

  // Recharger les données quand le dossier courant change (pour breadcrumb navigation)
  // DÉSACTIVÉ temporairement pour éviter les rechargements parasites après création
  // useEffect(() => {
  //   if (isOpen && currentFolderId !== null) {
  //     loadCurrentFolder();
  //   }
  // }, [currentFolderId, isOpen, loadCurrentFolder]);

  // Navigation vers un dossier (avec logs de debug)
  const navigateToFolder = useCallback((folder: ProjectFolder) => {
    console.log('🔍 [DEBUG NAVIGATION] - Entrée dans dossier:', {
      folder: {
        id: folder.id,
        name: folder.name,
        parent_folder_id: folder.parent_folder_id
      },
      previousCurrentFolderId: currentFolderId,
      currentBreadcrumbPath: breadcrumbPath
    });
    
    setCurrentFolderId(folder.id);
    setBreadcrumbPath(prev => [...prev, { id: folder.id, name: folder.name }]);
  }, [currentFolderId, breadcrumbPath]);

  // Navigation par breadcrumb (amélioré)
  const navigateToBreadcrumb = useCallback((index: number) => {
    // Validation des paramètres
    if (index < 0 || index >= breadcrumbPath.length) {
      console.warn('Index breadcrumb invalide:', index);
      return;
    }
    
    const newPath = breadcrumbPath.slice(0, index + 1);
    const targetFolder = newPath[newPath.length - 1];
    
    // Ne pas naviguer si on est déjà dans le dossier cible
    if (targetFolder.id === currentFolderId) {
      return;
    }
    
    // Mise à jour de l'état avec validation
    if (targetFolder && targetFolder.id !== undefined) {
      setCurrentFolderId(targetFolder.id);
      setBreadcrumbPath(newPath);
      
      // Optionnel: Log pour debug
      console.log('Navigation breadcrumb vers:', targetFolder.name, 'ID:', targetFolder.id);
    }
  }, [breadcrumbPath, currentFolderId]);

  // Retour au dossier parent (amélioré)
  const goBack = useCallback(() => {
    if (breadcrumbPath.length > 1) {
      const newPath = breadcrumbPath.slice(0, -1);
      const parentFolder = newPath[newPath.length - 1];
      
      // Validation avant navigation
      if (parentFolder && parentFolder.id !== undefined && parentFolder.id !== currentFolderId) {
        setCurrentFolderId(parentFolder.id);
        setBreadcrumbPath(newPath);
        
        // Log pour debug
        console.log('Navigation retour vers:', parentFolder.name, 'ID:', parentFolder.id);
      }
    }
  }, [breadcrumbPath, currentFolderId]);

  // Créer un nouveau dossier (avec logs de debug)
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      showNotification({
        type: 'warning',
        title: 'Attention',
        message: 'Le nom du dossier est requis'
      });
      return;
    }

    setCreatingFolder(true);
    
    // 🔍 LOG 1: État avant création
    console.log('🔍 [DEBUG CREATION DOSSIER] - État avant création:', {
      newFolderName,
      newFolderDescription,
      currentFolderId,
      projectId: project.id,
      userId: user?.id || 1,
      breadcrumbPath,
      currentPath: breadcrumbPath.map(b => b.name).join(' > ')
    });

    try {
      const newFolder = await projectFilesService.createFolder(
        newFolderName,
        newFolderDescription,
        currentFolderId,
        project.id,
        user?.id || 1
      );

      // 🔍 LOG 2: Réponse de l'API
      console.log('🔍 [DEBUG CREATION DOSSIER] - Réponse de l\'API:', {
        newFolder,
        success: !!newFolder,
        folderId: newFolder?.id,
        parentFolderId: newFolder?.parent_folder_id,
        projectId: newFolder?.project_id
      });

      if (newFolder) {
        showNotification({
          type: 'success',
          title: 'Succès',
          message: 'Dossier créé avec succès'
        });
        
        setNewFolderName('');
        setNewFolderDescription('');
        setCreateFolderModal(false);
        
        // 🔍 LOG 3: Avant rechargement (en s'assurant de rester dans le dossier parent)
        console.log('🔍 [DEBUG CREATION DOSSIER] - Avant rechargement des données...', {
          currentFolderIdAvantReload: currentFolderId,
          shouldStayInSameFolder: true
        });
        
        // Recharger sans changer de dossier courant
        await loadCurrentFolder();
        
        // 🔍 LOG 4: Après rechargement
        console.log('🔍 [DEBUG CREATION DOSSIER] - Rechargement terminé', {
          currentFolderIdApresReload: currentFolderId
        });
      } else {
        console.error('🔍 [DEBUG CREATION DOSSIER] - Échec: newFolder est null/undefined');
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('🔍 [DEBUG CREATION DOSSIER] - Exception:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de créer le dossier'
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  // Gestion de l'upload de fichiers
  const handleFileUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    if (currentFolderId === null) {
      showNotification({
        type: 'warning',
        title: 'Attention',
        message: 'Veuillez sélectionner un dossier pour uploader des fichiers'
      });
      return;
    }

    const filesArray = Array.from(selectedFiles);
    setUploadFiles(filesArray);
    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        
        const success = await projectFilesService.uploadFile(
          file,
          currentFolderId,
          user?.id || 1,
          project.id
        );

        if (!success) {
          throw new Error(`Échec de l'upload pour ${file.name}`);
        }

        setUploadProgress(((i + 1) / filesArray.length) * 100);
      }

      showNotification({
        type: 'success',
        title: 'Succès',
        message: `${filesArray.length} fichier(s) uploadé(s) avec succès`
      });

      loadCurrentFolder();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'upload des fichiers'
      });
    } finally {
      setUploading(false);
      setUploadFiles([]);
      setUploadProgress(0);
    }
  };

  // Télécharger un fichier
  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      await projectFilesService.downloadFile(file.id, file.original_name);
      showNotification({
        type: 'success',
        title: 'Succès',
        message: 'Téléchargement démarré'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de télécharger le fichier'
      });
    }
  };

  // Modifier un dossier
  const handleEditFolder = (folder: ProjectFolder) => {
    setSelectedFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderDescription(folder.description || '');
    setEditFolderModal(true);
  };

  // Supprimer un dossier
  const handleDeleteFolder = (folder: ProjectFolder) => {
    setSelectedFolder(folder);
    setDeleteFolderModal(true);
  };

  // Confirmer la modification du dossier
  const confirmEditFolder = async () => {
    if (!selectedFolder || !editFolderName.trim()) {
      showNotification({
        type: 'warning',
        title: 'Attention',
        message: 'Le nom du dossier est requis'
      });
      return;
    }

    setProcessingFolder(true);
    try {
      const success = await projectFilesService.updateFolder(
        selectedFolder.id,
        editFolderName,
        editFolderDescription,
        user?.id || 1,
        user?.email || ''
      );

      if (success) {
        showNotification({
          type: 'success',
          title: 'Succès',
          message: 'Dossier modifié avec succès'
        });
        
        setEditFolderModal(false);
        setSelectedFolder(null);
        setEditFolderName('');
        setEditFolderDescription('');
        loadCurrentFolder();
      } else {
        throw new Error('Erreur lors de la modification');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de modifier le dossier'
      });
    } finally {
      setProcessingFolder(false);
    }
  };

  // Confirmer la suppression du dossier
  const confirmDeleteFolder = async () => {
    if (!selectedFolder) return;

    setProcessingFolder(true);
    try {
      const success = await projectFilesService.deleteFolder(selectedFolder.id);

      if (success) {
        showNotification({
          type: 'success',
          title: 'Succès',
          message: 'Dossier supprimé avec succès'
        });
        
        setDeleteFolderModal(false);
        setSelectedFolder(null);
        loadCurrentFolder();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer le dossier'
      });
    } finally {
      setProcessingFolder(false);
    }
  };

  // Filtrer les éléments selon la recherche
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFiles = files.filter(file =>
    file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtenir l'icône d'un fichier selon son type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📄';
  };

  // Formater la taille d'un fichier
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return 'Taille inconnue';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={getModalSize()}
      placement="center"
      scrollBehavior="inside"
      isDismissable={!uploading}
      hideCloseButton={true}
      classNames={{
        base: isFullscreen ? "m-0 rounded-none" : "",
        wrapper: isFullscreen ? "items-stretch justify-stretch" : "",
      }}
    >
      <ModalContent className={isFullscreen ? "h-screen max-h-screen" : ""}>
        <ModalHeader className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gestionnaire de fichiers</h2>
                <p className="text-sm text-gray-600">
                  {project.title} {project.partner_name && `• ${project.partner_name}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={onClose}
                isDisabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <Breadcrumbs size="sm" className="ml-11">
            {breadcrumbPath.map((item, index) => (
              <BreadcrumbItem
                key={index}
                onPress={() => navigateToBreadcrumb(index)}
                className={index === breadcrumbPath.length - 1 ? "text-[#4ba9b7]" : "cursor-pointer"}
              >
                {item.name}
              </BreadcrumbItem>
            ))}
          </Breadcrumbs>
        </ModalHeader>

        <ModalBody className="p-6">
          {/* Barre d'actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {breadcrumbPath.length > 1 && (
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] transition-colors"
                  onClick={goBack}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>
              )}
              
              {isAdmin() && (
                <>
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#4ba9b7] text-white text-sm font-medium rounded-md hover:bg-[#4ba9b7]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] transition-colors"
                    onClick={() => setCreateFolderModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau dossier
                  </button>
                  
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
                      input.click();
                    }}
                    disabled={currentFolderId === null || uploading}
                  >
                    <Upload className="w-4 h-4" />
                    Upload fichiers
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4ba9b7] focus:border-transparent w-64"
                />
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                {filteredFolders.length + filteredFiles.length} élément(s)
              </span>
            </div>
          </div>

          {/* Barre de progression d'upload */}
          {uploading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Upload en cours... ({uploadFiles.length} fichier(s))
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress
                value={uploadProgress}
                color="primary"
                className="mb-2"
              />
            </div>
          )}

          {/* Grille des dossiers et fichiers */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" color="primary" />
            </div>
          ) : (
            <div className={`grid gap-4 ${getGridColumns()}`}>
              {/* Dossiers */}
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div 
                      className="p-3 rounded-lg bg-orange-50 cursor-pointer w-full flex justify-center"
                      onClick={() => navigateToFolder(folder)}
                    >
                      <FolderOpen className="w-6 h-6 text-orange-600" />
                    </div>
                    
                    <div className="w-full">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                        {folder.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        {folder.loadingStats ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                        ) : folder.stats ? (
                          <>
                            <div className="flex items-center gap-1">
                              <FolderOpen className="w-3 h-3" />
                              <span>{folder.stats.subfolders}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{folder.stats.files}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-400">Erreur stats</span>
                        )}
                      </div>
                    </div>
                    
                    {isAdmin() && (
                      <div className="flex items-center gap-1 w-full justify-center">
                        <button
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => handleEditFolder(folder)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          onClick={() => handleDeleteFolder(folder)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Fichiers */}
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-lg bg-gray-50">
                      <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                    </div>
                    
                    <div className="w-full">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                        {file.original_name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">
                        {formatFileSize(file.file_size)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(file.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 w-full justify-center">
                      <button
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        title="Aperçu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => handleDownloadFile(file)}
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {isAdmin() && (
                        <button
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message vide (optimisé selon la taille du modal) */}
          {!loading && filteredFolders.length === 0 && filteredFiles.length === 0 && (
            <div className={`text-center ${getModalSize() === '4xl' ? 'py-16' : getModalSize() === '5xl' ? 'py-20' : 'py-24'}`}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Aucun contenu
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                {searchTerm ? 'Aucun résultat pour cette recherche. Essayez un autre terme.' : 'Ce dossier est vide. Créez un nouveau dossier ou téléchargez des fichiers pour commencer.'}
              </p>
              {/* Suggestions d'actions */}
              {!searchTerm && (
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    color="primary"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={() => setCreateFolderModal(true)}
                    size="sm"
                  >
                    Nouveau dossier
                  </Button>
                  <Button
                    variant="bordered"
                    startContent={<Upload className="w-4 h-4" />}
                    onPress={() => document.getElementById('file-upload')?.click()}
                    size="sm"
                  >
                    Télécharger fichiers
                  </Button>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-600">
              {filteredFolders.length} dossier(s) • {filteredFiles.length} fichier(s)
            </div>
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Fermer
            </button>
          </div>
        </ModalFooter>
      </ModalContent>

      {/* Modal de création de dossier */}
      <Modal isOpen={createFolderModal} onClose={() => setCreateFolderModal(false)} size="md">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <span>Nouveau dossier</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nom du dossier"
                placeholder="Entrez le nom du dossier"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                isRequired
              />
              <Input
                label="Description (optionnel)"
                placeholder="Description du dossier"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
              />
              
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Emplacement :</strong> {breadcrumbPath.map(b => b.name).join(' > ')}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setCreateFolderModal(false)}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateFolder}
              isLoading={creatingFolder}
              isDisabled={!newFolderName.trim()}
            >
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de modification de dossier */}
      <Modal isOpen={editFolderModal} onClose={() => setEditFolderModal(false)} size="md">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Edit className="w-5 h-5 text-orange-600" />
              </div>
              <span>Modifier le dossier</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nom du dossier"
                placeholder="Entrez le nom du dossier"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                isRequired
              />
              <Input
                label="Description (optionnel)"
                placeholder="Description du dossier"
                value={editFolderDescription}
                onChange={(e) => setEditFolderDescription(e.target.value)}
              />
              
              {selectedFolder && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Dossier :</strong> {selectedFolder.name}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setEditFolderModal(false)}>
              Annuler
            </Button>
            <Button
              color="warning"
              onPress={confirmEditFolder}
              isLoading={processingFolder}
              isDisabled={!editFolderName.trim()}
            >
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de suppression de dossier */}
      <Modal isOpen={deleteFolderModal} onClose={() => setDeleteFolderModal(false)} size="md">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <span>Supprimer le dossier</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-red-100 dark:bg-red-900/40">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                      Attention : Suppression définitive
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Cette action est irréversible. Tous les fichiers et sous-dossiers contenus dans ce dossier seront également supprimés.
                    </p>
                  </div>
                </div>
              </div>
              
              {selectedFolder && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Dossier à supprimer :</strong> {selectedFolder.name}
                  </p>
                  {selectedFolder.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {selectedFolder.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteFolderModal(false)}>
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={confirmDeleteFolder}
              isLoading={processingFolder}
            >
              Supprimer définitivement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
};

export default ProjectFilesModal;