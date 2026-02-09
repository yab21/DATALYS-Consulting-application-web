"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Progress,
  Tooltip,
  cn,
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  FolderOpen,
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Code, 
  FileSpreadsheet, 
  Presentation,
  Settings,
  Eye,
  Search,
  Upload,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Trash2,
  FolderPlus,
  MoreVertical,
  HardDrive
} from 'lucide-react';
import { useSimpleNotifications } from '@/components/UI/Notifications/SimpleNotificationSystem';
import { projectFilesService, FolderStats } from '@/services/projectFiles';
import { useAuth } from '@/context/AuthContext';
import { isTokenExpiredError } from "@/lib/api-interceptor";

// Types
interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  createdAt: Date;
  modifiedAt: Date;
  parentId?: string | null;
  path: string;
  thumbnail?: string;
  isShared?: boolean;
  file_url?: string;
  original_name?: string;
  folder_id?: number | null;
  stats?: FolderStats;
  loadingStats?: boolean;
}

interface ProjectFileManagerProps {
  projectId: string;
  projectName: string;
  onFileUpload?: (uploadResponse: any) => void;
  uploadedFiles?: any[];
  refreshKey?: number;
}

// Utilitaires
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIconComponent = (type: string, fileName?: string): React.ReactElement => {
  const iconProps = { className: "w-6 h-6" };
  
  if (type === 'folder') {
    return <Folder {...iconProps} className="w-6 h-6 text-blue-500" />;
  }
  
  const extension = fileName?.split('.').pop()?.toLowerCase() || '';
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return <Image {...iconProps} className="w-6 h-6 text-green-500" />;
  }
  
  // Vidéos
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return <Video {...iconProps} className="w-6 h-6 text-purple-500" />;
  }
  
  // Audio
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
    return <Music {...iconProps} className="w-6 h-6 text-pink-500" />;
  }
  
  // Documents PDF
  if (extension === 'pdf') {
    return <FileText {...iconProps} className="w-6 h-6 text-red-500" />;
  }
  
  // Documents Word
  if (['doc', 'docx'].includes(extension)) {
    return <FileText {...iconProps} className="w-6 h-6 text-blue-600" />;
  }
  
  // Excel/Spreadsheets
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return <FileSpreadsheet {...iconProps} className="w-6 h-6 text-green-600" />;
  }
  
  // Présentations
  if (['ppt', 'pptx'].includes(extension)) {
    return <Presentation {...iconProps} className="w-6 h-6 text-orange-500" />;
  }
  
  // Code
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'py', 'java', 'cpp', 'c', 'php'].includes(extension)) {
    return <Code {...iconProps} className="w-6 h-6 text-cyan-500" />;
  }
  
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return <Archive {...iconProps} className="w-6 h-6 text-amber-500" />;
  }
  
  // Fichier générique
  return <FileText {...iconProps} className="w-6 h-6 text-gray-500" />;
};

const ProjectFileManager: React.FC<ProjectFileManagerProps> = ({
  projectId,
  projectName,
  onFileUpload,
  uploadedFiles = [],
  refreshKey = 0
}) => {
  const { user } = useAuth();
  const { showNotification } = useSimpleNotifications();

  // États
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Modals
  const { isOpen: isCreateFolderOpen, onOpen: onCreateFolderOpen, onClose: onCreateFolderClose } = useDisclosure();
  const { isOpen: isEditFolderOpen, onOpen: onEditFolderOpen, onClose: onEditFolderClose } = useDisclosure();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [editingFolder, setEditingFolder] = useState<FileItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Navigation
  const [breadcrumbs, setBreadcrumbs] = useState<FileItem[]>([]);

  // Charger les statistiques d'un dossier
  const loadFolderStats = useCallback(async (folderId: string, projectId: number): Promise<FolderStats | null> => {
    try {
      console.log('📊 Chargement des statistiques du dossier:', folderId);
      const stats = await projectFilesService.getFolderStats(Number(folderId), projectId);
      console.log('✅ Statistiques chargées:', stats);
      return stats;
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      return null;
    }
  }, []);

  // Charger les fichiers et dossiers
  const loadFilesAndFolders = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des fichiers pour le dossier:', currentFolder?.id || 'racine');

      // Charger les dossiers
      const foldersData = await projectFilesService.getFolders(
        currentFolder?.id ? Number(currentFolder.id) : null, 
        Number(projectId)
      );
      console.log('📁 Dossiers chargés:', foldersData);

      const formattedFolders: FileItem[] = foldersData.map(folder => ({
        id: folder.id.toString(),
        name: folder.name,
        type: 'folder' as const,
        createdAt: new Date(folder.created_at),
        modifiedAt: new Date(folder.updated_at || folder.created_at),
        parentId: folder.parent_folder_id?.toString() || null,
        path: folder.name,
        isShared: false,
        loadingStats: true
      }));

      setFolders(formattedFolders);

      // Charger les statistiques pour chaque dossier en parallèle
      const foldersWithStats = await Promise.allSettled(
        formattedFolders.map(async (folder) => {
          const stats = await loadFolderStats(folder.id, Number(projectId));
          return {
            ...folder,
            stats: stats || undefined,
            loadingStats: false
          };
        })
      );

      // Mettre à jour les dossiers avec leurs statistiques
      const finalFolders = foldersWithStats.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // En cas d'erreur, garder le dossier sans statistiques
          console.error('Erreur stats pour dossier:', formattedFolders[index].name, result.reason);
          return {
            ...formattedFolders[index],
            loadingStats: false
          };
        }
      });

      // Charger les fichiers
      let formattedFiles: FileItem[] = [];
      if (currentFolder?.id) {
        const filesData = await projectFilesService.getFiles(Number(currentFolder.id), Number(projectId));
        console.log('📄 Fichiers chargés:', filesData);

        formattedFiles = filesData.map(file => ({
          id: file.id.toString(),
          name: file.original_name || file.name || 'Fichier sans nom',
          type: 'file' as const,
          size: 0, // La propriété size n'existe pas dans ProjectFile
          createdAt: new Date(file.created_at),
          modifiedAt: new Date(file.updated_at || file.created_at),
          parentId: file.folder_id?.toString() || null,
          path: file.original_name || file.name || 'Fichier sans nom',
          file_url: file.file_path || '', // file_path contient file_url de l'API après le mapping
          folder_id: file.folder_id,
          isShared: file.is_public || false
        }));
      }

      // Ajouter les fichiers uploadés localement s'ils correspondent au dossier actuel
      const localUploadedFiles = uploadedFiles
        .filter(file => {
          const fileFolderId = file.folder_id?.toString() || null;
          const currentFolderId = currentFolder?.id || null;
          return fileFolderId === currentFolderId;
        })
        .map(file => ({
          id: `temp-${file.id || Date.now()}-${Math.random()}`,
          name: file.original_name || file.name,
          type: 'file' as const,
          size: file.size || 0,
          createdAt: file.createdAt || new Date(),
          modifiedAt: file.modifiedAt || new Date(),
          parentId: file.folder_id?.toString() || null,
          path: file.original_name || file.name,
          file_url: file.file_url,
          folder_id: file.folder_id,
          isShared: file.is_public || false
        }));

      setFolders(finalFolders);
      setFiles([...formattedFiles, ...localUploadedFiles]);

    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors du chargement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des fichiers';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [currentFolder, projectId, uploadedFiles, showNotification]);

  // Charger au montage et lors des changements
  useEffect(() => {
    loadFilesAndFolders();
  }, [loadFilesAndFolders, refreshKey]);

  // Navigation
  const navigateToFolder = useCallback((folder: FileItem | null) => {
    setCurrentFolder(folder);
    if (folder) {
      setBreadcrumbs(prev => [...prev, folder]);
    } else {
      setBreadcrumbs([]);
    }
  }, []);

  const navigateUp = useCallback(() => {
    if (breadcrumbs.length > 0) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1] || null);
    }
  }, [breadcrumbs]);

  const navigateToBreadcrumb = useCallback((index: number) => {
    if (index === -1) {
      setCurrentFolder(null);
      setBreadcrumbs([]);
    } else {
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolder(newBreadcrumbs[index]);
    }
  }, [breadcrumbs]);

  // Créer un dossier
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    try {
      const result = await projectFilesService.createFolder(
        newFolderName.trim(),
        newFolderDescription.trim() || '', // description
        currentFolder ? Number(currentFolder.id) : null, // parentFolderId
        Number(projectId), // projectId
        user?.id || 1 // userId
      );

      // Vider le cache des statistiques car la structure a changé
      projectFilesService.clearStatsCache();

      // Utiliser le message du backend si disponible
      const successMessage = result ? `Dossier "${newFolderName}" créé avec succès` : `Dossier "${newFolderName}" créé`;
      showNotification({
        title: 'Succès',
        message: successMessage,
        type: 'success'
      });
      setNewFolderName('');
      setNewFolderDescription('');
      onCreateFolderClose();
      loadFilesAndFolders();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la création du dossier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du dossier';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
    }
  }, [newFolderName, newFolderDescription, projectId, currentFolder, showNotification, onCreateFolderClose, loadFilesAndFolders]);

  // Modifier un dossier
  const handleEditFolder = useCallback(async () => {
    if (!editingFolder || !newFolderName.trim() || isEditingFolder) return;

    try {
      setIsEditingFolder(true);
      await projectFilesService.updateFolder(
        Number(editingFolder.id),
        newFolderName.trim(),
        newFolderDescription.trim() || '',
        user?.id || 1,
        user?.email || ''
      );

      // Vider le cache des statistiques car le nom a changé
      projectFilesService.clearStatsCache();

      showNotification({
        title: 'Succès',
        message: `Dossier "${newFolderName}" modifié avec succès`,
        type: 'success'
      });
      setEditingFolder(null);
      setNewFolderName('');
      setNewFolderDescription('');
      onEditFolderClose();
      loadFilesAndFolders();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la modification du dossier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la modification du dossier';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsEditingFolder(false);
    }
  }, [editingFolder, newFolderName, newFolderDescription, user?.id, showNotification, onEditFolderClose, loadFilesAndFolders, isEditingFolder]);

  // Ouvrir le modal de confirmation de suppression
  const openDeleteModal = useCallback((item: FileItem) => {
    setItemToDelete(item);
    onDeleteModalOpen();
  }, [onDeleteModalOpen]);

  // Confirmer la suppression
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      
      if (itemToDelete.type === 'folder') {
        await projectFilesService.deleteFolder(Number(itemToDelete.id));
      } else {
        await projectFilesService.deleteFile(Number(itemToDelete.id));
      }
      
      // Vider le cache des statistiques car la structure a changé
      projectFilesService.clearStatsCache();
      
      showNotification({
        title: 'Succès',
        message: `${itemToDelete.type === 'folder' ? 'Dossier' : 'Fichier'} "${itemToDelete.name}" supprimé avec succès`,
        type: 'success'
      });
      
      onDeleteModalClose();
      setItemToDelete(null);
      loadFilesAndFolders();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  }, [itemToDelete, showNotification, onDeleteModalClose, loadFilesAndFolders]);

  // Supprimer un dossier (legacy - garder pour compatibilité avec la vue grille)
  const handleDeleteFolder = useCallback(async (folder: FileItem) => {
    openDeleteModal(folder);
  }, [openDeleteModal]);

  // Supprimer un fichier (legacy - garder pour compatibilité)
  const handleDeleteFile = useCallback(async (file: FileItem) => {
    openDeleteModal(file);
  }, [openDeleteModal]);

  // Upload de fichiers
  const handleUpload = useCallback(async () => {
    if (uploadingFiles.length === 0) return;

    try {
      setUploadProgress(0);
      
      for (let i = 0; i < uploadingFiles.length; i++) {
        const file = uploadingFiles[i];
        
        console.log(`📤 Upload ${i + 1}/${uploadingFiles.length}: ${file.name}`);
        
        const result = await projectFilesService.uploadFile(
          file,
          currentFolder ? Number(currentFolder.id) : 0, // folderId - 0 for root
          user?.id || 1, // userId
          Number(projectId) // projectId
        );

        // Progression
        const progress = ((i + 1) / uploadingFiles.length) * 100;
        setUploadProgress(progress);
        
        console.log(`✅ Upload terminé pour ${file.name}:`, result);
        
        // Notifier le parent de l'upload
        if (onFileUpload && result) {
          onFileUpload(result);
        }
      }

      // Vider le cache des statistiques car de nouveaux fichiers ont été ajoutés
      projectFilesService.clearStatsCache();

      showNotification({
        title: 'Succès',
        message: `${uploadingFiles.length} fichier${uploadingFiles.length > 1 ? 's' : ''} uploadé${uploadingFiles.length > 1 ? 's' : ''} avec succès`,
        type: 'success'
      });
      
      setUploadingFiles([]);
      setUploadProgress(0);
      onUploadClose();
      loadFilesAndFolders();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de l\'upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
      setUploadProgress(0);
    }
  }, [uploadingFiles, currentFolder, projectId, user?.id, onFileUpload, showNotification, onUploadClose, loadFilesAndFolders]);

  // Corriger l'URL d'un fichier
  const fixFileUrl = useCallback((url: string | undefined): string | undefined => {
    if (!url) return undefined;

    let fixedUrl = url;

    // Corriger /api/files/serve/ -> /files/serve/
    if (fixedUrl.includes('/api/files/serve/')) {
      fixedUrl = fixedUrl.replace('/api/files/serve/', '/files/serve/');
    }

    // S'assurer que l'URL est complète avec le domaine
    if (fixedUrl.startsWith('/files/serve/')) {
      fixedUrl = `https://applicationweb.datalysconsulting.com${fixedUrl}`;
    }

    // Convertir les anciennes URLs
    if (fixedUrl.includes('82.112.253.137:8082')) {
      fixedUrl = fixedUrl.replace('http://82.112.253.137:8082', 'https://applicationweb.datalysconsulting.com');
    }

    return fixedUrl;
  }, []);

  // Voir un fichier - ouvre dans une nouvelle fenêtre
  const handlePreview = useCallback(async (file: FileItem) => {
    try {
      console.log('📖 [PREVIEW] - Fichier:', file.name, 'URL:', file.file_url);

      if (file.file_url && file.file_url.trim() !== '') {
        const correctedUrl = fixFileUrl(file.file_url);
        console.log('📖 [PREVIEW] - URL corrigée:', correctedUrl);
        if (correctedUrl) {
          window.open(correctedUrl, '_blank');
          return;
        }
      }

      // Fallback: utiliser le service viewFile qui gère plusieurs cas
      console.log('📖 [PREVIEW] - Fallback: utilisation du service viewFile');
      await projectFilesService.viewFile(Number(file.id), file.name, file.file_url);
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      showNotification({
        title: 'Erreur',
        message: 'Impossible d\'ouvrir le fichier. Le fichier n\'existe peut-être pas sur le serveur.',
        type: 'error'
      });
    }
  }, [showNotification, fixFileUrl]);

  // Filtrer et trier les éléments
  const filteredAndSortedItems = useMemo(() => {
    const allItems = [...folders, ...files];
    
    // Filtrage par recherche
    let filtered = allItems;
    if (searchTerm.trim()) {
      filtered = allItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;

      // Toujours mettre les dossiers en premier
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = b.modifiedAt.getTime() - a.modifiedAt.getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          const aExt = a.name.split('.').pop() || '';
          const bExt = b.name.split('.').pop() || '';
          comparison = aExt.localeCompare(bExt);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [folders, files, searchTerm, sortBy, sortOrder]);

  // Statistiques
  const stats = useMemo(() => ({
    totalFolders: folders.length,
    totalFiles: files.length,
    totalSize: files.reduce((acc, file) => acc + (file.size || 0), 0)
  }), [folders, files]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[600px]">
      {/* Header harmonisé avec le modal */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#4ba9b7]/10">
              <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gestionnaire de fichiers
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {projectName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="flat"
              size="sm"
              startContent={<Upload className="w-4 h-4" />}
              onPress={onUploadOpen}
              isDisabled={!currentFolder}
              className="text-gray-700 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Uploader
            </Button>
            <Button
              size="sm"
              startContent={<FolderPlus className="w-4 h-4" />}
              onPress={onCreateFolderOpen}
              className="bg-[#4ba9b7] text-white hover:bg-[#4ba9b7]/90"
            >
              Nouveau dossier
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation et statistiques */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Breadcrumbs harmonisés */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => navigateToBreadcrumb(-1)}
                  className={cn("text-gray-600 dark:text-gray-400", !currentFolder && "bg-blue-100 dark:bg-blue-900/30")}
                >
                  <HardDrive className="w-4 h-4 mr-1" />
                  Racine
                </Button>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.id}>
                    <span className="text-gray-400">/</span>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => navigateToBreadcrumb(index)}
                      className={cn("text-gray-600 dark:text-gray-400", index === breadcrumbs.length - 1 && "bg-blue-100 dark:bg-blue-900/30")}
                    >
                      {crumb.name}
                    </Button>
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Statistiques */}
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Folder className="w-4 h-4" />
                <span>{stats.totalFolders} dossier{stats.totalFolders !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{stats.totalFiles} fichier{stats.totalFiles !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                <span>{formatFileSize(stats.totalSize)}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Barre d'outils harmonisée */}
        <div className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between gap-4">
              {/* Recherche */}
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Rechercher des fichiers et dossiers..."
                 
                  onValueChange={setSearchTerm}
                  startContent={<Search className="w-4 h-4 text-gray-400" />}
                  classNames={{
                    input: "bg-transparent",
                    inputWrapper: "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  }}
                />
              </div>

              {/* Contrôles de vue */}
              <div className="flex items-center gap-2">
                <Tooltip content="Vue grille">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'solid' : 'flat'}
                    isIconOnly
                    onPress={() => setViewMode('grid')}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </Tooltip>
                <Tooltip content="Vue liste">
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'solid' : 'flat'}
                    isIconOnly
                    onPress={() => setViewMode('list')}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </Tooltip>

                <Dropdown>
                  <DropdownTrigger>
                    <Button size="sm" variant="flat" endContent={<ArrowDown className="w-3 h-3" />} className="text-gray-600 dark:text-gray-400">
                      Trier par
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    selectedKeys={[sortBy]}
                    onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as any)}
                  >
                    <DropdownItem key="name">Nom</DropdownItem>
                    <DropdownItem key="date">Date</DropdownItem>
                    <DropdownItem key="size">Taille</DropdownItem>
                    <DropdownItem key="type">Type</DropdownItem>
                  </DropdownMenu>
                </Dropdown>

                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-gray-600 dark:text-gray-400"
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation vers le dossier parent */}
        {currentFolder && (
          <div className="mb-4">
            <Button
              variant="flat"
              size="sm"
              startContent={<ArrowUp className="w-4 h-4" />}
              onPress={navigateUp}
              className="text-gray-600 dark:text-gray-400"
            >
              Retour au dossier parent
            </Button>
          </div>
        )}

        {/* Contenu principal */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                <div className="w-full h-16 bg-gray-200 dark:bg-gray-600 rounded-lg mb-3" />
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-600 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredAndSortedItems.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'Aucun résultat' : 'Dossier vide'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm
                    ? `Aucun fichier ou dossier ne correspond à "${searchTerm}"`
                    : 'Ce dossier ne contient aucun fichier ou sous-dossier.'}
                </p>
              </div>
            ) : (
              <div className={cn(
                "gap-4",
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                  : "space-y-2"
              )}>
                <AnimatePresence mode="popLayout">
                  {filteredAndSortedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      {viewMode === 'grid' ? (
                        // Vue grille harmonisée
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group relative">
                          {/* Action buttons - Seulement au survol */}
                          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-md shadow-lg p-0.5 border border-gray-200 dark:border-gray-600">
                              {item.type === 'folder' ? (
                                <>
                                  <button
                                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingFolder(item);
                                      setNewFolderName(item.name);
                                      setNewFolderDescription('');
                                      onEditFolderOpen();
                                    }}
                                    title="Modifier"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFolder(item);
                                    }}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreview(item);
                                    }}
                                    title="Voir"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFile(item);
                                    }}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div 
                            className="text-center"
                            onClick={() => item.type === 'folder' ? navigateToFolder(item) : handlePreview(item)}
                          >
                            {item.type === 'folder' ? (
                              // Design de dossier personnalisé comme dans le modal
                              <div className="relative w-[100px] h-[80px] mx-auto mb-3 cursor-pointer group-hover:scale-105 transition-transform duration-200">
                                {/* Folder Tab */}
                                <div className="absolute top-0 left-0 w-[40px] h-[12px] bg-[#F59E0B] rounded-t-md" />
                                {/* Folder Body */}
                                <div className="absolute top-[8px] left-0 w-full h-[72px] bg-gradient-to-b from-[#FCD34D] to-[#F59E0B] rounded-lg shadow-sm" />
                                
                                {/* Inner content area with stats */}
                                <div className="absolute inset-0 top-[20px] flex items-center justify-center">
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-700/80 font-medium">
                                    {item.loadingStats ? (
                                      <div className="w-3 h-3 border-2 border-gray-600/30 border-t-transparent rounded-full animate-spin"></div>
                                    ) : item.stats ? (
                                      <>
                                        <div className="flex items-center gap-0.5">
                                          <FolderOpen className="w-3 h-3 opacity-70" />
                                          <span>{item.stats.subfolders}</span>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                          <FileText className="w-3 h-3 opacity-70" />
                                          <span>{item.stats.files}</span>
                                        </div>
                                      </>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              // Design de fichier normal
                              <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg group-hover:scale-105 transition-transform duration-200">
                                {getFileIconComponent(item.type, item.name)}
                              </div>
                            )}
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">
                              {item.name}
                            </h4>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              <p>{item.modifiedAt.toLocaleDateString('fr-FR')}</p>
                            </div>
                            {item.isShared && (
                              <Chip size="sm" color="primary" variant="flat" className="mt-2">
                                Partagé
                              </Chip>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Vue liste harmonisée
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
                          <div 
                            className="flex items-center gap-4"
                            onClick={() => item.type === 'folder' ? navigateToFolder(item) : handlePreview(item)}
                          >
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              {getFileIconComponent(item.type, item.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                {item.type === 'folder' && (
                                  <span>
                                    {item.loadingStats ? (
                                      <span className="flex items-center gap-1">
                                        <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                        Chargement...
                                      </span>
                                    ) : item.stats ? (
                                      `${item.stats.subfolders} dossier${item.stats.subfolders !== 1 ? 's' : ''} • ${item.stats.files} fichier${item.stats.files !== 1 ? 's' : ''}`
                                    ) : (
                                      'Dossier'
                                    )}
                                  </span>
                                )}
                                <span>{item.modifiedAt.toLocaleDateString('fr-FR')}</span>
                              </div>
                            </div>
                            {item.isShared && (
                              <Chip size="sm" color="primary" variant="flat">
                                Partagé
                              </Chip>
                            )}
                            <Dropdown>
                              <DropdownTrigger>
                                <Button size="sm" variant="light" isIconOnly className="text-gray-400 hover:text-gray-600">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                items={[
                                  {
                                    key: "view",
                                    label: item.type === 'folder' ? 'Ouvrir' : 'Voir',
                                    startContent: <Eye className="w-4 h-4" />,
                                    onPress: () => item.type === 'folder' ? navigateToFolder(item) : handlePreview(item)
                                  },
                                  ...(item.type === 'folder' ? [{
                                    key: "edit",
                                    label: "Modifier",
                                    startContent: <Settings className="w-4 h-4" />,
                                    onPress: () => {
                                      setEditingFolder(item);
                                      setNewFolderName(item.name);
                                      setNewFolderDescription('');
                                      onEditFolderOpen();
                                    }
                                  }] : []),
                                  {
                                    key: "delete",
                                    label: "Supprimer",
                                    startContent: <Trash2 className="w-4 h-4" />,
                                    className: "text-danger",
                                    onPress: () => openDeleteModal(item)
                                  }
                                ]}
                              >
                                {(menuItem) => (
                                  <DropdownItem
                                    key={menuItem.key}
                                    startContent={menuItem.startContent}
                                    className={menuItem.className}
                                    onPress={menuItem.onPress}
                                  >
                                    {menuItem.label}
                                  </DropdownItem>
                                )}
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de création de dossier */}
      <Modal isOpen={isCreateFolderOpen} onClose={onCreateFolderClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Créer un nouveau dossier</h3>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Nom du dossier"
              placeholder="Saisissez le nom du dossier"
              value={newFolderName}
              onValueChange={setNewFolderName}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && !newFolderDescription && handleCreateFolder()}
            />
            <Input
              label="Description (optionnel)"
              placeholder="Décrivez le contenu de ce dossier"
              value={newFolderDescription}
              onValueChange={setNewFolderDescription}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onCreateFolderClose}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateFolder}
              isDisabled={!newFolderName.trim()}
            >
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de modification de dossier */}
      <Modal isOpen={isEditFolderOpen} onClose={onEditFolderClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold">Modifier le dossier</h3>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Nom du dossier"
              placeholder="Saisissez le nom du dossier"
              value={newFolderName}
              onValueChange={setNewFolderName}
              autoFocus
            />
            <Input
              label="Description (optionnel)"
              placeholder="Décrivez le contenu de ce dossier"
              value={newFolderDescription}
              onValueChange={setNewFolderDescription}
              onKeyDown={(e) => e.key === 'Enter' && handleEditFolder()}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onEditFolderClose}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleEditFolder}
              isDisabled={!newFolderName.trim()}
              isLoading={isEditingFolder}
            >
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'upload de fichiers */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold">Upload de fichiers</h3>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {currentFolder ? (
                <>Upload dans le dossier : <strong>{currentFolder.name}</strong></>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/40">
                      <Upload className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                        Upload non disponible à la racine
                      </h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Vous devez d'abord créer un dossier ou naviguer dans un dossier existant pour uploader des fichiers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {currentFolder && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Cliquez pour sélectionner ou glissez-déposez vos fichiers
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setUploadingFiles(files);
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  as="label"
                  htmlFor="file-upload"
                  color="primary"
                  variant="flat"
                  className="cursor-pointer"
                >
                  Sélectionner des fichiers
                </Button>
              </div>
            )}

            {uploadingFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Fichiers sélectionnés :</h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {uploadingFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getFileIconComponent('file', file.name)}
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                </div>
                
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress color="primary" />
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onUploadClose}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleUpload}
              isDisabled={uploadingFiles.length === 0 || !currentFolder}
              isLoading={uploadProgress > 0 && uploadProgress < 100}
            >
              Upload ({uploadingFiles.length} fichier{uploadingFiles.length > 1 ? 's' : ''})
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de confirmation de suppression - Design identique au modal original */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <span>Supprimer {itemToDelete?.type === 'folder' ? 'le dossier' : 'le fichier'}</span>
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
                      Cette action est irréversible. {itemToDelete?.type === 'folder' && 'Tous les fichiers et sous-dossiers contenus dans ce dossier seront également supprimés.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {itemToDelete && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>{itemToDelete.type === 'folder' ? 'Dossier' : 'Fichier'} à supprimer :</strong> {itemToDelete.name}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={onDeleteModalClose}
              isDisabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={isDeleting}
            >
              Supprimer définitivement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectFileManager;