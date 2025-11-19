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
} from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
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
  Share2,
  Trash2,
  FolderPlus,
  MoreVertical,
  HardDrive
} from 'lucide-react';
import { useSimpleNotifications } from '@/components/UI/Notifications/SimpleNotificationSystem';
import { projectFilesService } from '@/services/projectFiles';
import { useAuth } from '@/context/AuthContext';

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
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [editingFolder, setEditingFolder] = useState<FileItem | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Navigation
  const [breadcrumbs, setBreadcrumbs] = useState<FileItem[]>([]);

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
        isShared: false
      }));

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
          file_url: (file as any).file_url || '', // Cast temporaire
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

      setFolders(formattedFolders);
      setFiles([...formattedFiles, ...localUploadedFiles]);

    } catch (error) {
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
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      await projectFilesService.updateFolder(
        Number(editingFolder.id),
        newFolderName.trim(),
        newFolderDescription.trim() || '',
        user?.id || 1,
        user?.email || ''
      );

      showNotification({
        title: 'Succès',
        message: `Dossier modifié avec succès`,
        type: 'success'
      });
      setEditingFolder(null);
      setNewFolderName('');
      setNewFolderDescription('');
      onEditFolderClose();
      loadFilesAndFolders();
    } catch (error) {
      console.error('Erreur lors de la modification du dossier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la modification du dossier';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
    }
  }, [editingFolder, newFolderName, newFolderDescription, user?.id, showNotification, onEditFolderClose, loadFilesAndFolders]);

  // Supprimer un dossier
  const handleDeleteFolder = useCallback(async (folder: FileItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${folder.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await projectFilesService.deleteFolder(Number(folder.id));
      
      showNotification({
        title: 'Succès',
        message: `Dossier "${folder.name}" supprimé avec succès`,
        type: 'success'
      });
      loadFilesAndFolders();
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du dossier';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
    }
  }, [showNotification, loadFilesAndFolders]);

  // Supprimer un fichier
  const handleDeleteFile = useCallback(async (file: FileItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${file.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await projectFilesService.deleteFile(Number(file.id));
      
      showNotification({
        title: 'Succès',
        message: `Fichier "${file.name}" supprimé avec succès`,
        type: 'success'
      });
      loadFilesAndFolders();
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du fichier';
      showNotification({
        title: 'Erreur',
        message: errorMessage,
        type: 'error'
      });
    }
  }, [showNotification, loadFilesAndFolders]);

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

  // Voir un fichier - ouvre dans une nouvelle fenêtre
  const handlePreview = useCallback(async (file: FileItem) => {
    try {
      if (file.file_url) {
        // Ouvrir directement l'URL du fichier
        window.open(file.file_url, '_blank');
      } else {
        // Utiliser l'API viewFile - cette fonction ouvre directement le fichier
        await projectFilesService.viewFile(Number(file.id), file.name, file.file_url);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du fichier:', error);
      showNotification({
        title: 'Erreur',
        message: 'Impossible d\'ouvrir le fichier',
        type: 'error'
      });
    }
  }, [showNotification]);

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
      {/* Header harmonisé */}
      <div className="bg-gradient-to-r from-[#4ba9b7] to-[#3d8b96] p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Gestionnaire de fichiers
              </h1>
              <p className="text-blue-100 text-sm">
                Organisez vos fichiers et dossiers pour {projectName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              color="default"
              variant="solid"
              startContent={<Upload className="w-4 h-4" />}
              onPress={onUploadOpen}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              Uploader
            </Button>
            <Button
              color="default"
              variant="solid"
              startContent={<FolderPlus className="w-4 h-4" />}
              onPress={onCreateFolderOpen}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
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
                  value={searchTerm}
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
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
                          <div 
                            className="text-center"
                            onClick={() => item.type === 'folder' ? navigateToFolder(item) : handlePreview(item)}
                          >
                            <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg group-hover:scale-105 transition-transform duration-200">
                              {getFileIconComponent(item.type, item.name)}
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">
                              {item.name}
                            </h4>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              {item.type === 'file' && (
                                <p>{formatFileSize(item.size || 0)}</p>
                              )}
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
                                <span>{item.type === 'folder' ? 'Dossier' : formatFileSize(item.size || 0)}</span>
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
                              <DropdownMenu>
                                <DropdownItem 
                                  key="view"
                                  startContent={<Eye className="w-4 h-4" />}
                                  onPress={() => item.type === 'folder' ? navigateToFolder(item) : handlePreview(item)}
                                >
                                  {item.type === 'folder' ? 'Ouvrir' : 'Voir'}
                                </DropdownItem>
                                {item.type === 'folder' ? (
                                  <DropdownItem 
                                    key="edit"
                                    startContent={<Settings className="w-4 h-4" />}
                                    onPress={() => {
                                      setEditingFolder(item);
                                      setNewFolderName(item.name);
                                      setNewFolderDescription('');
                                      onEditFolderOpen();
                                    }}
                                  >
                                    Modifier
                                  </DropdownItem>
                                ) : (
                                  <DropdownItem key="edit-disabled" className="hidden">
                                    Hidden
                                  </DropdownItem>
                                )}
                                <DropdownItem key="share" startContent={<Share2 className="w-4 h-4" />}>
                                  Partager
                                </DropdownItem>
                                <DropdownItem 
                                  key="delete"
                                  startContent={<Trash2 className="w-4 h-4" />}
                                  className="text-danger"
                                  onPress={() => item.type === 'folder' ? handleDeleteFolder(item) : handleDeleteFile(item)}
                                >
                                  Supprimer
                                </DropdownItem>
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
                <>Upload dans le dossier racine du projet</>
              )}
            </div>
            
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
                    <Progress value={uploadProgress} color="primary" />
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
              isDisabled={uploadingFiles.length === 0}
              isLoading={uploadProgress > 0 && uploadProgress < 100}
            >
              Upload ({uploadingFiles.length} fichier{uploadingFiles.length > 1 ? 's' : ''})
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectFileManager;