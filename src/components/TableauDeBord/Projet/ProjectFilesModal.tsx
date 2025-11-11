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
    if (isFullscreen) return 'grid-cols-7 xl:grid-cols-9';
    
    const totalItems = folders.length + files.length;
    const modalSize = getModalSize();
    
    // Adapter les colonnes selon la taille du modal
    if (modalSize === '4xl') {
      if (totalItems === 0) return 'grid-cols-1'; // Centrer le message "dossier vide"
      return 'grid-cols-4 lg:grid-cols-5';
    }
    
    if (modalSize === '5xl') {
      return 'grid-cols-5 lg:grid-cols-6';
    }
    
    // Full mode
    return 'grid-cols-6 lg:grid-cols-7 xl:grid-cols-8';
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
        console.log('🔍 [DEBUG LOAD FILES] - Chargement des fichiers pour le dossier:', {
          currentFolderId,
          projectId: project.id
        });
        
        const filesData = await projectFilesService.getFiles(currentFolderId, project.id);
        
        console.log('🔍 [DEBUG LOAD FILES] - Fichiers récupérés:', {
          count: filesData.length,
          files: filesData.map(f => ({
            id: f.id,
            name: f.original_name,
            folder_id: f.folder_id,
            project_id: f.project_id,
            incident_id: f.incident_id
          }))
        });
        
        setFiles(filesData);
      } else {
        console.log('🔍 [DEBUG LOAD FILES] - Pas de fichiers à charger (dossier racine)');
        setFiles([]);
      }

      // 🔄 RÉACTIVATION DES STATISTIQUES avec correction de hiérarchie
      console.log('🔄 [DEBUG] - Chargement des statistiques avec hiérarchie corrigée');
      
      // Charger les statistiques de manière séquentielle pour éviter les conflits
      const foldersWithStatsPromises = foldersWithStats.map(async (folder) => {
        try {
          console.log('📊 [DEBUG LOADING STATS] - Chargement stats pour:', {
            folderId: folder.id,
            folderName: folder.name,
            parentFolderId: folder.parent_folder_id,
            projectId: project.id
          });
          
          // ⚡ IMPORTANT: On utilise l'ID du dossier (pas currentFolderId) pour ses propres stats
          const stats = await projectFilesService.getFolderStats(folder.id, project.id);
          
          console.log('✅ [DEBUG LOADING STATS] - Stats chargées pour:', {
            folderId: folder.id,
            folderName: folder.name,
            stats
          });
          
          return {
            ...folder,
            loadingStats: false,
            stats
          };
        } catch (error) {
          console.error(`❌ [DEBUG LOADING STATS] - Erreur stats pour dossier ${folder.name} (ID: ${folder.id}):`, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            folder: {
              id: folder.id,
              name: folder.name,
              parent_folder_id: folder.parent_folder_id
            }
          });
          
          return {
            ...folder,
            loadingStats: false,
            stats: { subfolders: 0, files: 0, timestamp: Date.now() }
          };
        }
      });
      
      // Traiter les stats en parallèle mais de manière contrôlée
      Promise.allSettled(foldersWithStatsPromises).then(results => {
        const foldersWithCompleteStats = results.map((result, index) => {
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            console.error(`❌ [DEBUG PROMISE] - Échec du chargement des stats pour le dossier ${foldersWithStats[index].name}:`, result.reason);
            return {
              ...foldersWithStats[index],
              loadingStats: false,
              stats: { subfolders: 0, files: 0, timestamp: Date.now() }
            };
          }
        });
        
        setFolders(foldersWithCompleteStats);
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;
        
        console.log(`✅ [DEBUG PROMISE] - Statistiques traitées: ${successCount} succès, ${failCount} échecs`);
      }).catch(error => {
        console.error('❌ [DEBUG PROMISE] - Erreur critique lors du chargement des statistiques:', error);
        // Fallback avec stats vides en cas d'erreur critique
        setFolders(prev => 
          prev.map(f => ({ 
            ...f, 
            loadingStats: false,
            stats: { subfolders: 0, files: 0, timestamp: Date.now() }
          }))
        );
      });

    } catch (error) {
      console.error('❌ [DEBUG LOAD FOLDER] - Erreur lors du chargement:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        currentFolderId,
        projectId: project.id
      });
      
      // Déterminer le type d'erreur pour un message plus précis
      const isServerError = error instanceof Error && error.message.includes('500');
      const isNetworkError = error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'));
      
      let errorMessage = 'Impossible de charger les données du dossier';
      if (isServerError) {
        errorMessage = 'Erreur serveur temporaire. Veuillez réessayer dans quelques instants.';
      } else if (isNetworkError) {
        errorMessage = 'Problème de connexion. Vérifiez votre connexion internet.';
      }
      
      showNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: errorMessage
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
          shouldStayInSameFolder: true,
          newFolderInfo: {
            id: newFolder.id,
            name: newFolder.name,
            parent_folder_id: newFolder.parent_folder_id,
            project_id: newFolder.project_id
          }
        });
        
        // Vider le cache des statistiques pour forcer le rechargement
        projectFilesService.clearStatsCache();
        
        // Recharger sans changer de dossier courant avec un délai pour s'assurer que le backend a bien sauvegardé
        setTimeout(async () => {
          await loadCurrentFolder();
          
          // 🔍 LOG 4: Après rechargement
          console.log('🔍 [DEBUG CREATION DOSSIER] - Rechargement terminé', {
            currentFolderIdApresReload: currentFolderId,
            foldersCount: folders.length,
            newFolderVisible: folders.some(f => f.id === newFolder.id)
          });
        }, 500);
      } else {
        console.error('🔍 [DEBUG CREATION DOSSIER] - Échec: newFolder est null/undefined');
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('🔍 [DEBUG CREATION DOSSIER] - Exception:', error);
      
      // Analyser le type d'erreur pour afficher un message approprié
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const isPermissionError = errorMessage.includes('permissions') || errorMessage.includes('Permission denied');
      
      showNotification({
        type: 'error',
        title: isPermissionError ? 'Erreur de permissions' : 'Erreur',
        message: isPermissionError 
          ? 'Problème de permissions sur le serveur. Contactez l\'administrateur système pour corriger les droits d\'écriture du répertoire de fichiers.'
          : 'Impossible de créer le dossier. Vérifiez que le dossier parent existe.'
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

  // Visualiser un fichier
  const handleViewFile = (file: ProjectFile) => {
    if (file.id) {
      // Utiliser l'endpoint de téléchargement de l'API avec l'ID du fichier
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const fileUrl = `${apiBaseUrl}/files/download/${file.id}`;
      
      console.log('🔍 [DEBUG VIEW FILE] - Ouverture du fichier via API:', {
        file_id: file.id,
        file_name: file.original_name,
        api_base_url: apiBaseUrl,
        download_endpoint: fileUrl
      });
      
      window.open(fileUrl, '_blank');
    } else {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'ID du fichier non disponible'
      });
    }
  };

  // Télécharger un fichier
  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      if (file.id) {
        // Utiliser l'endpoint de téléchargement de l'API avec l'ID du fichier
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const downloadUrl = `${apiBaseUrl}/files/download/${file.id}`;
        
        console.log('🔍 [DEBUG DOWNLOAD FILE] - Téléchargement via API:', {
          file_id: file.id,
          file_name: file.original_name,
          api_base_url: apiBaseUrl,
          download_endpoint: downloadUrl
        });
        
        // Créer un lien de téléchargement avec l'endpoint API
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.original_name || 'fichier';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification({
          type: 'success',
          title: 'Succès',
          message: 'Téléchargement démarré'
        });
      } else {
        throw new Error('ID du fichier non disponible');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de télécharger le fichier'
      });
    }
  };

  // Supprimer un fichier
  const handleDeleteFile = async (file: ProjectFile) => {
    try {
      const success = await projectFilesService.deleteFile(file.id);
      if (success) {
        // Recharger la vue courante
        loadCurrentFolder();
        showNotification({
          type: 'success',
          title: 'Succès',
          message: 'Fichier supprimé avec succès'
        });
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer le fichier'
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
    file.original_name && file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
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
        wrapper: isFullscreen ? "items-stretch justify-stretch z-[100000]" : "z-[100000]",
        backdrop: "z-[99998]"
      }}
    >
      <ModalContent className={isFullscreen ? "h-screen max-h-screen" : ""}>
        <ModalHeader className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col space-y-3">
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
            <div className="flex items-center gap-2 ml-11">
              <Breadcrumbs 
                size="sm" 
                separator="/"
                className="text-sm"
              >
                {breadcrumbPath.map((item, index) => (
                  <BreadcrumbItem
                    key={index}
                    onPress={() => navigateToBreadcrumb(index)}
                    className={`${index === breadcrumbPath.length - 1 ? "text-[#4ba9b7] font-medium" : "text-gray-600 hover:text-gray-900 cursor-pointer"}`}
                  >
                    {item.name}
                  </BreadcrumbItem>
                ))}
              </Breadcrumbs>
            </div>
          </div>
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
            <div className={`grid gap-6 ${getGridColumns()}`}>
              {/* Dossiers */}
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="relative group flex flex-col items-center"
                >
                  {/* Folder Container */}
                  <div className="relative">
                    {/* Folder Icon Design */}
                    <div 
                      className="cursor-pointer relative w-[100px] h-[80px]"
                      onClick={() => navigateToFolder(folder)}
                    >
                      {/* Folder Tab */}
                      <div className="absolute top-0 left-0 w-[40px] h-[12px] bg-[#F59E0B] rounded-t-md" />
                      {/* Folder Body */}
                      <div className="absolute top-[8px] left-0 w-full h-[72px] bg-gradient-to-b from-[#FCD34D] to-[#F59E0B] rounded-lg shadow-sm" />
                      
                      {/* Inner content area */}
                      <div className="absolute inset-0 top-[20px] flex items-center justify-center">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-700/80 font-medium">
                          {folder.loadingStats ? (
                            <div className="w-3 h-3 border-2 border-gray-600/30 border-t-transparent rounded-full animate-spin"></div>
                          ) : folder.stats ? (
                            <>
                              <div className="flex items-center gap-0.5">
                                <FolderOpen className="w-3 h-3 opacity-70" />
                                <span>{folder.stats.subfolders}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <FileText className="w-3 h-3 opacity-70" />
                                <span>{folder.stats.files}</span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons - Only visible on hover for admins */}
                    {isAdmin() && (
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="flex items-center gap-0.5 bg-white rounded-md shadow-lg p-0.5">
                          <button
                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditFolder(folder);
                            }}
                            title="Modifier"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFolder(folder);
                            }}
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Folder name - Below the icon */}
                  <h3 className="font-medium text-xs text-gray-800 line-clamp-2 text-center mt-1 max-w-[100px] px-1">
                    {folder.name}
                  </h3>
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
                      <span className="text-2xl">{getFileIcon(file.mime_type || 'application/octet-stream')}</span>
                    </div>
                    
                    <div className="w-full">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                        {file.original_name || 'Fichier sans nom'}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">
                        {formatFileSize(file.file_size)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.created_at ? new Date(file.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 w-full justify-center">
                      <button
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => handleViewFile(file)}
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
                          onClick={() => handleDeleteFile(file)}
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
      <Modal 
        isOpen={createFolderModal} 
        onClose={() => setCreateFolderModal(false)} 
        size="md"
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
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
                  <strong>Emplacement :</strong> {breadcrumbPath.length > 1 ? breadcrumbPath.map(b => b.name).join(' > ') : `${project.title} (Racine)`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Le nouveau dossier sera créé dans {breadcrumbPath.length > 1 ? `le dossier "${breadcrumbPath[breadcrumbPath.length - 1].name}"` : 'la racine du projet'}
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
      <Modal 
        isOpen={editFolderModal} 
        onClose={() => setEditFolderModal(false)} 
        size="md"
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
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
      <Modal 
        isOpen={deleteFolderModal} 
        onClose={() => setDeleteFolderModal(false)} 
        size="md"
        classNames={{
          wrapper: "z-[100000]",
          backdrop: "z-[99998]"
        }}
      >
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