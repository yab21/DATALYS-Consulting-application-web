"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardBody,
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
  Selection,
  Breadcrumbs,
  BreadcrumbItem,
  cn,
} from '@heroui/react';
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
  Download,
  Eye,
  Search,
  Upload,
  Plus,
  ArrowUp,
  ArrowDown,
  Grid,
  List,
  Share2,
  Trash2
} from 'lucide-react';
import { useSimpleNotifications } from '@/components/UI/Notifications/SimpleNotificationSystem';
import { filesService } from '@/services/files';
import { isTokenExpiredError } from '@/lib/api-interceptor';
import { useAuth } from '@/context/AuthContext';
import FilePreview from '@/components/UI/FilePreview/FilePreview';

// Types
export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  createdAt: Date;
  modifiedAt: Date;
  parentId?: string;
  path: string;
  thumbnail?: string;
  isShared?: boolean;
  permissions: FilePermission[];
  metadata?: Record<string, any>;
}

export interface FilePermission {
  userId: string;
  userName: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileManagerProps {
  projectId?: string;
  currentFolderId?: string | null;
  rootPath?: string;
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowCreateFolder?: boolean;
  allowShare?: boolean;
  maxFileSize?: number; // en MB
  acceptedTypes?: string[];
  viewMode?: 'grid' | 'list';
  onFileSelect?: (file: FileItem) => void;
  onFileUpload?: (files: File[], path: string) => Promise<void>;
  onFileDelete?: (fileIds: string[]) => Promise<void>;
  onFolderCreate?: (name: string, parentPath: string) => Promise<void>;
  className?: string;
  uploadedFiles?: any[]; // Fichiers uploadés à afficher
}

// Utilitaires
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIconComponent = (type: string, mimeType?: string, fileName?: string): React.ReactElement => {
  const iconProps = { className: "w-6 h-6" };
  
  if (type === 'folder') {
    return <Folder {...iconProps} className="w-6 h-6 text-blue-500" />;
  }
  
  if (mimeType) {
    // Images
    if (mimeType.startsWith('image/')) {
      return <Image {...iconProps} className="w-6 h-6 text-green-500" />;
    }
    
    // Vidéos
    if (mimeType.startsWith('video/')) {
      return <Video {...iconProps} className="w-6 h-6 text-purple-500" />;
    }
    
    // Audio
    if (mimeType.startsWith('audio/')) {
      return <Music {...iconProps} className="w-6 h-6 text-pink-500" />;
    }
    
    // Documents PDF
    if (mimeType.includes('pdf')) {
      return <FileText {...iconProps} className="w-6 h-6 text-red-500" />;
    }
    
    // Documents Word
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText {...iconProps} className="w-6 h-6 text-blue-600" />;
    }
    
    // Excel/Spreadsheets
    if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      return <FileSpreadsheet {...iconProps} className="w-6 h-6 text-green-600" />;
    }
    
    // PowerPoint/Presentations
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return <Presentation {...iconProps} className="w-6 h-6 text-orange-500" />;
    }
    
    // Archives
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gz')) {
      return <Archive {...iconProps} className="w-6 h-6 text-yellow-600" />;
    }
    
    // Code/Text
    if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
      return <Code {...iconProps} className="w-6 h-6 text-gray-600" />;
    }
    
    // Executables
    if (mimeType.includes('executable') || mimeType.includes('application/x-')) {
      return <Settings {...iconProps} className="w-6 h-6 text-gray-700" />;
    }
  }
  
  // Extensions en fallback si pas de mimeType
  const extension = fileName?.split('.').pop()?.toLowerCase();
  
  if (extension) {
    // Images par extension
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
      return <Image {...iconProps} className="w-6 h-6 text-green-500" />;
    }
    
    // Documents par extension
    if (['pdf'].includes(extension)) {
      return <FileText {...iconProps} className="w-6 h-6 text-red-500" />;
    }
    if (['doc', 'docx'].includes(extension)) {
      return <FileText {...iconProps} className="w-6 h-6 text-blue-600" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return <FileSpreadsheet {...iconProps} className="w-6 h-6 text-green-600" />;
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return <Presentation {...iconProps} className="w-6 h-6 text-orange-500" />;
    }
    
    // Code par extension
    if (['js', 'ts', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'php', 'rb'].includes(extension)) {
      return <Code {...iconProps} className="w-6 h-6 text-gray-600" />;
    }
    
    // Archives par extension
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(extension)) {
      return <Archive {...iconProps} className="w-6 h-6 text-yellow-600" />;
    }
    
    // Vidéo par extension
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv'].includes(extension)) {
      return <Video {...iconProps} className="w-6 h-6 text-purple-500" />;
    }
    
    // Audio par extension
    if (['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(extension)) {
      return <Music {...iconProps} className="w-6 h-6 text-pink-500" />;
    }
  }
  
  // Document générique par défaut
  return <FileText {...iconProps} className="w-6 h-6 text-gray-500" />;
};

export const FileManager: React.FC<FileManagerProps> = ({
  projectId,
  currentFolderId: initialFolderId = null,
  rootPath = '/',
  allowUpload = true,
  allowDelete = true,
  allowCreateFolder = true,
  allowShare = true,
  maxFileSize = 100,
  acceptedTypes = [],
  viewMode: initialViewMode = 'grid',
  onFileSelect,
  onFileUpload,
  onFileDelete,
  onFolderCreate,
  className,
  uploadedFiles = [],
}) => {
  // États
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState(rootPath);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [selectedFiles, setSelectedFiles] = useState<Selection>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modals
  const { isOpen: isCreateFolderOpen, onOpen: onCreateFolderOpen, onClose: onCreateFolderClose } = useDisclosure();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const [newFolderName, setNewFolderName] = useState('');
  const [shareSettings, setShareSettings] = useState<FileItem | null>(null);

  const { showNotification } = useSimpleNotifications();
  const { user } = useAuth();

  // Conversion des types API vers les types locaux
  const convertApiFileToLocal = (apiFile: any): FileItem => {
    // Déterminer le type MIME à partir de l'extension du fichier
    const fileExtension = apiFile.name.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'application/octet-stream';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
      mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    } else if (fileExtension === 'pdf') {
      mimeType = 'application/pdf';
    } else if (['zip', 'rar'].includes(fileExtension)) {
      mimeType = `application/${fileExtension}`;
    } else if (['doc', 'docx'].includes(fileExtension)) {
      mimeType = 'application/msword';
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
      mimeType = 'application/vnd.ms-excel';
    }

    return {
      id: apiFile.id.toString(),
      name: apiFile.name,
      type: 'file',
      size: 0, // L'API ne retourne pas la taille
      mimeType: mimeType,
      createdAt: new Date(apiFile.created_at),
      modifiedAt: new Date(apiFile.updated_at),
      path: apiFile.file_url, // Utiliser file_url comme path
      permissions: [{ 
        userId: apiFile.created_by?.toString() || '1', 
        userName: 'User', 
        role: 'owner' as const 
      }],
      isShared: apiFile.is_public,
    };
  };

  const convertFolderToLocal = (folder: any): FileItem => ({
    id: folder.id,
    name: folder.name,
    type: 'folder',
    createdAt: new Date(folder.created_at),
    modifiedAt: new Date(folder.updated_at),
    path: `/${folder.name}`,
    permissions: [{ 
      userId: folder.created_by, 
      userName: folder.created_by_name, 
      role: 'owner' as const 
    }],
    metadata: {
      filesCount: folder.files_count,
      subfoldersCount: folder.subfolders_count,
      totalSize: folder.total_size,
    }
  });

  // Charger les fichiers et dossiers
  const loadFilesAndFolders = async () => {
    try {
      setLoading(true);
      
      // Charger les fichiers réels depuis l'API
      let apiFiles: any[] = [];
      if (projectId && user) {
        try {
          const folderIdToUse = currentFolderId ? parseInt(currentFolderId) : null;
          console.log('🔍 Critères de recherche FileManager:', {
            project_id: parseInt(projectId),
            folder_id: folderIdToUse,
            searchQuery
          });
          
          apiFiles = await filesService.getFilesByLocation(
            parseInt(projectId),
            folderIdToUse,
            user.id,
            searchQuery
          );
          console.log('🔍 Fichiers chargés depuis l\'API:', apiFiles);
        } catch (error) {
          if (isTokenExpiredError(error)) throw error;
          console.error('❌ Erreur chargement fichiers API:', error);
        }
      }

      // Convertir les fichiers API au format FileItem
      const apiFileItems: FileItem[] = apiFiles.map(convertApiFileToLocal);

      // Convertir les fichiers uploadés localement au format FileItem
      const uploadedFileItems: FileItem[] = uploadedFiles.map((file, index) => ({
        id: file.id || `uploaded-${index}`,
        name: file.name,
        type: 'file' as const,
        size: file.size || 0,
        mimeType: file.mimeType || 'application/octet-stream',
        createdAt: file.createdAt || new Date(),
        modifiedAt: file.modifiedAt || new Date(),
        path: file.path || file.file_path || file.name,
        permissions: [{ userId: '1', userName: 'User', role: 'owner' as const }],
        isShared: file.is_public || false,
      }));

      // Combiner les fichiers API et locaux (en évitant les doublons)
      const allFileItems = [...apiFileItems];
      
      // Ajouter les fichiers uploadés localement qui ne sont pas déjà dans l'API
      uploadedFileItems.forEach(uploadedFile => {
        const existsInApi = apiFileItems.some(apiFile => 
          apiFile.id === uploadedFile.id || apiFile.name === uploadedFile.name
        );
        if (!existsInApi) {
          allFileItems.push(uploadedFile);
        }
      });

      // Les dossiers sont gérés par FolderManager séparé
      setFiles(allFileItems);
      setFolders([]);

    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur chargement fichiers:', error);

      // Fallback vers des données mockées pour la démo
      const mockFiles: FileItem[] = [
        {
          id: '1',
          name: 'Documents',
          type: 'folder',
          createdAt: new Date('2024-01-15'),
          modifiedAt: new Date('2024-01-20'),
          path: '/Documents',
          permissions: [{ userId: '1', userName: 'Admin', role: 'owner' }],
        },
        {
          id: '2',
          name: 'Images',
          type: 'folder',
          createdAt: new Date('2024-01-10'),
          modifiedAt: new Date('2024-01-25'),
          path: '/Images',
          permissions: [{ userId: '1', userName: 'Admin', role: 'owner' }],
        },
        {
          id: '3',
          name: 'rapport-analyse.pdf',
          type: 'file',
          size: 2048576,
          mimeType: 'application/pdf',
          createdAt: new Date('2024-01-18'),
          modifiedAt: new Date('2024-01-18'),
          path: '/rapport-analyse.pdf',
          permissions: [{ userId: '1', userName: 'Admin', role: 'owner' }],
          isShared: true,
        },
        {
          id: '4',
          name: 'presentation.pptx',
          type: 'file',
          size: 15728640,
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          createdAt: new Date('2024-01-20'),
          modifiedAt: new Date('2024-01-22'),
          path: '/presentation.pptx',
          permissions: [{ userId: '1', userName: 'Admin', role: 'owner' }],
        },
      ];
      setFiles(mockFiles);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour mettre à jour le currentFolderId quand la prop change
  React.useEffect(() => {
    setCurrentFolderId(initialFolderId);
  }, [initialFolderId]);

  // Effet pour charger les données initiales et à chaque changement de contexte
  React.useEffect(() => {
    loadFilesAndFolders();
  }, [projectId, currentFolderId, searchQuery, uploadedFiles, user]);

  // Filtrage et tri des fichiers
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    // Filtrage par recherche
    if (searchQuery) {
      result = result.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Tri
    result.sort((a, b) => {
      let compareResult = 0;
      
      switch (sortBy) {
        case 'name':
          compareResult = a.name.localeCompare(b.name);
          break;
        case 'date':
          compareResult = a.modifiedAt.getTime() - b.modifiedAt.getTime();
          break;
        case 'size':
          compareResult = (a.size || 0) - (b.size || 0);
          break;
        case 'type':
          compareResult = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === 'desc' ? -compareResult : compareResult;
    });

    // Les dossiers en premier
    result.sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return 0;
    });

    return result;
  }, [files, searchQuery, sortBy, sortOrder]);

  // Gestion du breadcrumb
  const pathSegments = useMemo(() => {
    return currentPath.split('/').filter(Boolean);
  }, [currentPath]);

  // Gestionnaires d'événements
  const handleFileSelect = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
      setCurrentFolderId(file.id);
    } else {
      onFileSelect?.(file);
    }
  }, [onFileSelect]);

  const handleFileDownload = useCallback(async (file: FileItem) => {
    try {
      const fileId = parseInt(file.id);
      if (isNaN(fileId)) {
        throw new Error('ID de fichier invalide');
      }
      
      await filesService.downloadFile(fileId);
      
      showNotification({
        type: 'success',
        title: 'Téléchargement',
        message: `Téléchargement de "${file.name}" démarré`,
        duration: 3000,
      });
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur téléchargement:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de télécharger le fichier',
        duration: 5000,
      });
    }
  }, [showNotification]);

  const handleFilePreview = useCallback((file: FileItem) => {
    // Convertir le FileItem en format attendu par FilePreview
    const previewData = {
      id: parseInt(file.id),
      name: file.name,
      original_name: file.name,
      file_path: file.path,
      file_url: filesService.getFileServeUrl(file.path),
      size: file.size || 0,
      mime_type: file.mimeType || '',
      extension: file.name.split('.').pop() || ''
    };
    
    setPreviewFile(previewData);
    setIsPreviewOpen(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0 && allowUpload) {
      await handleFileUpload(droppedFiles);
    }
  }, [allowUpload]);

  const handleFileUpload = useCallback(async (fileList: File[]) => {
    const validFiles = fileList.filter(file => {
      // Vérification de la taille
      if (file.size > maxFileSize * 1024 * 1024) {
        showNotification({
          type: 'warning',
          title: 'Fichier trop volumineux',
          message: `${file.name} dépasse la limite de ${maxFileSize}MB`,
          duration: 5000,
        });
        return false;
      }

      // Vérification du type
      if (acceptedTypes.length > 0 && !acceptedTypes.some(type => file.type.includes(type))) {
        showNotification({
          type: 'warning',
          title: 'Type de fichier non autorisé',
          message: `${file.name} n'est pas un type de fichier autorisé`,
          duration: 5000,
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    // Initialiser les progressions d'upload
    const uploadProgressItems: UploadProgress[] = validFiles.map(file => ({
      fileId: `upload-${Date.now()}-${Math.random()}`,
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    }));

    setUploads(prev => [...prev, ...uploadProgressItems]);

    try {
      // Upload des fichiers via l'API
      const uploadPromises = validFiles.map(async (file, index) => {
        const progressItem = uploadProgressItems[index];
        
        try {
          const uploadData: any = {
            file,
            folder_id: currentFolderId,
            ...(projectId && { project_id: parseInt(projectId) }),
            is_public: false
          };

          // Simuler la progression pendant l'upload
          const progressInterval = setInterval(() => {
            setUploads(prev => prev.map(upload =>
              upload.fileId === progressItem.fileId && upload.progress < 90
                ? { ...upload, progress: upload.progress + 10 }
                : upload
            ));
          }, 200);

          // const response = await filesService.uploadFile(uploadData); // API pas encore disponible
          const response = { data: { id: Date.now(), name: file.name } }; // Mock temporaire
          
          clearInterval(progressInterval);
          
          // Marquer comme terminé
          setUploads(prev => prev.map(upload =>
            upload.fileId === progressItem.fileId
              ? { ...upload, progress: 100, status: 'completed' }
              : upload
          ));

          return response;
        } catch (error) {
          if (isTokenExpiredError(error)) throw error;
          console.error(`Erreur upload ${file.name}:`, error);

          setUploads(prev => prev.map(upload =>
            upload.fileId === progressItem.fileId
              ? { ...upload, status: 'error', error: 'Erreur upload' }
              : upload
          ));

          throw error;
        }
      });

      await Promise.allSettled(uploadPromises);

      // Recharger la liste des fichiers
      await loadFilesAndFolders();

      if (onFileUpload) {
        await onFileUpload(validFiles, currentPath);
      }

      // Supprimer les progressions terminées après 3 secondes
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => 
          !uploadProgressItems.some(item => item.fileId === upload.fileId)
        ));
      }, 3000);

      showNotification({
        type: 'success',
        title: 'Upload terminé',
        message: `${validFiles.length} fichier${validFiles.length > 1 ? 's' : ''} uploadé${validFiles.length > 1 ? 's' : ''}`,
        duration: 3000,
      });

    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur upload:', error);
      showNotification({
        type: 'error',
        title: 'Erreur d\'upload',
        message: 'Une erreur est survenue lors de l\'upload',
        duration: 5000,
      });
    }
  }, [maxFileSize, acceptedTypes, currentPath, currentFolderId, projectId, onFileUpload, showNotification, loadFilesAndFolders]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderData: any = {
        name: newFolderName,
        parent_id: currentFolderId,
        ...(projectId && { project_id: parseInt(projectId) }),
        is_shared: false
      };

      // await filesService.createFolder(folderData); // API pas encore disponible
      
      // Recharger la liste des fichiers
      await loadFilesAndFolders();

      if (onFolderCreate) {
        await onFolderCreate(newFolderName, currentPath);
      }

      showNotification({
        type: 'success',
        title: 'Dossier créé',
        message: `Le dossier "${newFolderName}" a été créé`,
        duration: 3000,
      });

      setNewFolderName('');
      onCreateFolderClose();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur création dossier:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de créer le dossier',
        duration: 5000,
      });
    }
  }, [newFolderName, currentPath, currentFolderId, projectId, onFolderCreate, showNotification, onCreateFolderClose, loadFilesAndFolders]);

  const handleDeleteFiles = useCallback(async () => {
    const fileIds = Array.from(selectedFiles as Set<string>);
    
    try {
      // Séparer les fichiers et les dossiers
      const selectedItems = files.filter(file => fileIds.includes(file.id));
      const filesToDelete = selectedItems.filter(item => item.type === 'file');
      const foldersToDelete = selectedItems.filter(item => item.type === 'folder');

      // Supprimer les fichiers via l'API
      if (filesToDelete.length > 0) {
        const fileIdsToDelete = filesToDelete
          .map(file => parseInt(file.id))
          .filter(id => !isNaN(id)); // Filtrer les IDs valides
        
        if (fileIdsToDelete.length > 0) {
          await filesService.deleteFiles(fileIdsToDelete);
        }
      }

      // Les dossiers sont gérés par FolderManager - pour l'instant on ignore
      if (foldersToDelete.length > 0) {
        console.warn('Suppression de dossiers non implémentée dans FileManager');
      }

      // Recharger la liste des fichiers
      await loadFilesAndFolders();

      if (onFileDelete) {
        await onFileDelete(fileIds);
      }

      showNotification({
        type: 'success',
        title: 'Fichiers supprimés',
        message: `${filesToDelete.length} fichier${filesToDelete.length > 1 ? 's' : ''} supprimé${filesToDelete.length > 1 ? 's' : ''}`,
        duration: 3000,
      });

      setSelectedFiles(new Set());
      onDeleteClose();
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('Erreur suppression:', error);
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de supprimer les fichiers',
        duration: 5000,
      });
    }
  }, [selectedFiles, files, onFileDelete, showNotification, onDeleteClose, loadFilesAndFolders]);

  return (
    <div className={cn("w-full", className)}>
      {/* Barre d'outils */}
      <Card className="mb-4">
        <CardBody className="p-4">
          <div className="flex flex-col gap-4">
            {/* Navigation et actions principales */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Breadcrumbs>
                <BreadcrumbItem onPress={() => setCurrentPath(rootPath)}>
                  Racine
                </BreadcrumbItem>
                {pathSegments.map((segment, index) => (
                  <BreadcrumbItem
                    key={`segment-${index}-${segment}`}
                    onPress={() => {
                      const newPath = '/' + pathSegments.slice(0, index + 1).join('/');
                      setCurrentPath(newPath);
                    }}
                  >
                    {segment}
                  </BreadcrumbItem>
                ))}
              </Breadcrumbs>

              <div className="flex gap-2">
                {allowCreateFolder && (
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={onCreateFolderOpen}
                  >
                    Nouveau dossier
                  </Button>
                )}
                
                {allowUpload && (
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<Upload className="w-4 h-4" />}
                    onPress={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      if (acceptedTypes.length > 0) {
                        input.accept = acceptedTypes.join(',');
                      }
                      input.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        handleFileUpload(files);
                      };
                      input.click();
                    }}
                  >
                    Upload
                  </Button>
                )}
              </div>
            </div>

            {/* Recherche et tri */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Input
                size="sm"
                placeholder="Rechercher des fichiers..."
               
                onValueChange={setSearchQuery}
                className="max-w-xs"
                startContent={<Search className="w-4 h-4 text-gray-400" />}
              />

              <div className="flex gap-2">
                <Dropdown>
                  <DropdownTrigger>
                    <Button size="sm" variant="flat">
                      Trier par: {sortBy}
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
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Actions sur la sélection */}
            {selectedFiles !== 'all' && selectedFiles.size > 0 && (
              <div className="flex items-center gap-4 p-3 bg-primary-50 dark:bg-primary-950/20 rounded-lg">
                <span className="text-sm">
                  {selectedFiles.size} fichier{selectedFiles.size > 1 ? 's' : ''} sélectionné{selectedFiles.size > 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  {allowShare && (
                    <Button size="sm" variant="flat" startContent={<Share2 className="w-4 h-4" />}>
                      Partager
                    </Button>
                  )}
                  {allowDelete && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<Trash2 className="w-4 h-4" />}
                      onPress={onDeleteOpen}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Zone de drop */}
      <div
        className={cn(
          "relative min-h-96 border-2 border-dashed rounded-lg transition-colors",
          dragOver ? "border-primary bg-primary-50 dark:bg-primary-950/20" : "border-default-300",
          allowUpload && "hover:border-primary hover:bg-default-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* État de chargement */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-default-500">Chargement des fichiers...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Affichage des fichiers */}
            <div className={cn(
              "p-4",
              viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                : "space-y-2"
            )}>
              <AnimatePresence>
                {filteredAndSortedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <FileItemComponent
                  file={file}
                  viewMode={viewMode}
                  isSelected={selectedFiles === 'all' || (selectedFiles as Set<string>).has(file.id)}
                  onSelect={() => {
                    const newSelection = new Set(selectedFiles as Set<string>);
                    if (newSelection.has(file.id)) {
                      newSelection.delete(file.id);
                    } else {
                      newSelection.add(file.id);
                    }
                    setSelectedFiles(newSelection);
                  }}
                  onDoubleClick={() => handleFileSelect(file)}
                  onDownload={() => handleFileDownload(file)}
                  onPreview={() => handleFilePreview(file)}
                />
                </motion.div>
              ))}
            </AnimatePresence>
            </div>

            {/* Message d'état vide */}
            {filteredAndSortedFiles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 flex justify-center">
                    <Folder className="w-16 h-16 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium text-default-400 mb-2">
                    {searchQuery ? 'Aucun fichier trouvé' : 'Dossier vide'}
                  </h3>
                  {allowUpload && !searchQuery && (
                    <p className="text-sm text-default-300">
                      Glissez-déposez des fichiers ici ou cliquez sur Upload
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Overlay de drop */}
        {dragOver && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Upload className="w-12 h-12 text-primary" />
              </div>
              <p className="text-lg font-medium text-primary">
                Déposez vos fichiers ici
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progression des uploads */}
      {uploads.length > 0 && (
        <Card className="mt-4">
          <CardBody className="p-4">
            <h4 className="font-medium mb-3">Uploads en cours</h4>
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div key={upload.fileId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{upload.fileName}</span>
                      <span>{upload.progress}%</span>
                    </div>
                    <Progress 
                      
                      color={upload.status === 'error' ? 'danger' : 'primary'}
                      size="sm"
                    />
                  </div>
                  <Chip
                    size="sm"
                    color={
                      upload.status === 'completed' ? 'success' :
                      upload.status === 'error' ? 'danger' : 'primary'
                    }
                    variant="flat"
                  >
                    {upload.status === 'completed' ? '✓' :
                     upload.status === 'error' ? '✗' : '⏳'}
                  </Chip>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal création de dossier */}
      <Modal isOpen={isCreateFolderOpen} onClose={onCreateFolderClose}>
        <ModalContent>
          <ModalHeader className="text-gray-900 dark:text-gray-100">Créer un nouveau dossier</ModalHeader>
          <ModalBody>
            <Input
              label="Nom du dossier"
              placeholder="Mon nouveau dossier"
             
              onValueChange={setNewFolderName}
              autoFocus
              variant="bordered"
              classNames={{
                label: "!text-gray-900 dark:!text-gray-100 !font-medium",
                input: "!text-gray-900 dark:!text-gray-100",
                inputWrapper: "!border-gray-300 dark:!border-gray-600"
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCreateFolderClose}>
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

      {/* Modal suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader className="text-gray-900 dark:text-gray-100">Confirmer la suppression</ModalHeader>
          <ModalBody>
            <p className="text-gray-900 dark:text-gray-100">
              Êtes-vous sûr de vouloir supprimer {selectedFiles === 'all' ? 'tous les fichiers' : `${(selectedFiles as Set<string>).size} fichier${(selectedFiles as Set<string>).size > 1 ? 's' : ''}`} ?
            </p>
            <p className="text-sm text-danger">
              Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              Annuler
            </Button>
            <Button color="danger" onPress={handleDeleteFiles}>
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Composant de prévisualisation de fichiers */}
      <FilePreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
        baseUrl={filesService.getBaseUrl()}
      />
    </div>
  );
};

// Composant pour un élément de fichier
interface FileItemComponentProps {
  file: FileItem;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onDownload?: () => void;
  onPreview?: () => void;
}

const FileItemComponent: React.FC<FileItemComponentProps> = ({
  file,
  viewMode,
  isSelected,
  onSelect,
  onDoubleClick,
  onDownload,
  onPreview,
}) => {
  if (viewMode === 'grid') {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:scale-105",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <CardBody className="p-3 text-center">
          <div 
            className="cursor-pointer"
            onClick={onSelect}
            onDoubleClick={onDoubleClick}
          >
            <div className="mb-2 flex justify-center">{getFileIconComponent(file.type, file.mimeType, file.name)}</div>
            <Tooltip content={file.name}>
              <p className="text-sm font-medium truncate">{file.name}</p>
            </Tooltip>
            {file.type === 'file' && file.size && (
              <p className="text-xs text-default-400">{formatFileSize(file.size)}</p>
            )}
            {file.isShared && (
              <Chip size="sm" color="primary" variant="flat" className="mt-1">
                Partagé
              </Chip>
            )}
          </div>
          
          {/* Actions pour les fichiers */}
          {file.type === 'file' && (
            <div className="flex gap-1 mt-2 justify-center" onClick={(e) => e.stopPropagation()}>
              {onPreview && (
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => {
                    onPreview();
                  }}
                  title="Prévisualiser"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {onDownload && (
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => {
                    onDownload();
                  }}
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-default-50",
        isSelected && "bg-primary-50 dark:bg-primary-950/20"
      )}
    >
      <CardBody className="p-3">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={onSelect}
            onDoubleClick={onDoubleClick}
          >
            <div className="flex items-center">{getFileIconComponent(file.type, file.mimeType, file.name)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-4 text-xs text-default-400">
                <span>{file.modifiedAt.toLocaleDateString()}</span>
                {file.type === 'file' && file.size && (
                  <span>{formatFileSize(file.size)}</span>
                )}
                {file.isShared && (
                  <Chip size="sm" color="primary" variant="flat">
                    Partagé
                  </Chip>
                )}
              </div>
            </div>
          </div>
          
          {/* Actions pour les fichiers */}
          {file.type === 'file' && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {onPreview && (
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => {
                    onPreview();
                  }}
                  title="Prévisualiser"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {onDownload && (
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => {
                    onDownload();
                  }}
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default FileManager;