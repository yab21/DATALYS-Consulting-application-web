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
} from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/components/UI/Notifications/NotificationSystem';
import { filesService } from '@/services/files';

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
}

// Utilitaires
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string, mimeType?: string): string => {
  if (type === 'folder') return '📁';
  
  if (mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return '🗜️';
  }
  
  return '📄';
};

export const FileManager: React.FC<FileManagerProps> = ({
  projectId,
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
}) => {
  // États
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentPath, setCurrentPath] = useState(rootPath);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [selectedFiles, setSelectedFiles] = useState<Selection>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  // Modals
  const { isOpen: isCreateFolderOpen, onOpen: onCreateFolderOpen, onClose: onCreateFolderClose } = useDisclosure();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const [newFolderName, setNewFolderName] = useState('');
  const [shareSettings, setShareSettings] = useState<FileItem | null>(null);

  const { showNotification } = useNotifications();

  // Conversion des types API vers les types locaux
  const convertApiFileToLocal = (apiFile: ApiFileItem): FileItem => ({
    id: apiFile.id,
    name: apiFile.name,
    type: 'file',
    size: apiFile.file_size,
    mimeType: apiFile.mime_type,
    createdAt: new Date(apiFile.created_at),
    modifiedAt: new Date(apiFile.updated_at),
    path: apiFile.file_path,
    permissions: [{ 
      userId: apiFile.uploaded_by, 
      userName: apiFile.uploaded_by_name, 
      role: 'owner' as const 
    }],
    isShared: apiFile.is_public,
  });

  const convertFolderToLocal = (folder: FolderItem): FileItem => ({
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
      
      const filters: FileFilters = {
        folder_id: currentFolderId,
        ...(projectId && { project_id: parseInt(projectId) }),
        ...(searchQuery && { search: searchQuery })
      };

      // Charger les fichiers et dossiers en parallèle
      const [filesResponse, foldersResponse] = await Promise.all([
        filesService.getFiles(0, 100, filters),
        filesService.getFolders(0, 100, { 
          parent_id: currentFolderId, 
          ...(projectId && { project_id: parseInt(projectId) }),
          ...(searchQuery && { search: searchQuery })
        })
      ]);

      // Convertir et combiner les données
      const localFiles = filesResponse.items.map(convertApiFileToLocal);
      const localFolders = foldersResponse.items.map(convertFolderToLocal);
      
      setFiles([...localFolders, ...localFiles]);
      setFolders(foldersResponse.items);

    } catch (error) {
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

  // Effet pour charger les données initiales et à chaque changement de contexte
  React.useEffect(() => {
    loadFilesAndFolders();
  }, [projectId, currentFolderId, searchQuery]);

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
          const uploadData: UploadFileRequest = {
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

          const response = await filesService.uploadFile(uploadData);
          
          clearInterval(progressInterval);
          
          // Marquer comme terminé
          setUploads(prev => prev.map(upload =>
            upload.fileId === progressItem.fileId
              ? { ...upload, progress: 100, status: 'completed' }
              : upload
          ));

          return response;
        } catch (error) {
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
      const folderData: CreateFolderRequest = {
        name: newFolderName,
        parent_id: currentFolderId,
        ...(projectId && { project_id: parseInt(projectId) }),
        is_shared: false
      };

      await filesService.createFolder(folderData);
      
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

      // Supprimer les fichiers et dossiers via l'API
      const deletePromises = [
        ...filesToDelete.map(file => filesService.deleteFile(file.id)),
        ...foldersToDelete.map(folder => filesService.deleteFolder(folder.id))
      ];

      await Promise.allSettled(deletePromises);

      // Recharger la liste des fichiers
      await loadFilesAndFolders();

      if (onFileDelete) {
        await onFileDelete(fileIds);
      }

      showNotification({
        type: 'success',
        title: 'Fichiers supprimés',
        message: `${fileIds.length} élément${fileIds.length > 1 ? 's' : ''} supprimé${fileIds.length > 1 ? 's' : ''}`,
        duration: 3000,
      });

      setSelectedFiles(new Set());
      onDeleteClose();
    } catch (error) {
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
                    key={index}
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
                    startContent={<span>📁</span>}
                    onPress={onCreateFolderOpen}
                  >
                    Nouveau dossier
                  </Button>
                )}
                
                {allowUpload && (
                  <Button
                    size="sm"
                    color="primary"
                    startContent={<span>📤</span>}
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
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="max-w-xs"
                startContent={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                }
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
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>

                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? '📋' : '⊞'}
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
                    <Button size="sm" variant="flat" startContent={<span>🔗</span>}>
                      Partager
                    </Button>
                  )}
                  {allowDelete && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<span>🗑️</span>}
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
                />
                </motion.div>
              ))}
            </AnimatePresence>
            </div>

            {/* Message d'état vide */}
            {filteredAndSortedFiles.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📁</div>
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
              <div className="text-4xl mb-2">📤</div>
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
                      value={upload.progress} 
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
          <ModalHeader>Créer un nouveau dossier</ModalHeader>
          <ModalBody>
            <Input
              label="Nom du dossier"
              placeholder="Mon nouveau dossier"
              value={newFolderName}
              onValueChange={setNewFolderName}
              autoFocus
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
          <ModalHeader>Confirmer la suppression</ModalHeader>
          <ModalBody>
            <p>
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
}

const FileItemComponent: React.FC<FileItemComponentProps> = ({
  file,
  viewMode,
  isSelected,
  onSelect,
  onDoubleClick,
}) => {
  if (viewMode === 'grid') {
    return (
      <Card
        className={cn(
          "cursor-pointer transition-all hover:scale-105",
          isSelected && "ring-2 ring-primary"
        )}
        isPressable
        onPress={onSelect}
        onDoubleClick={onDoubleClick}
      >
        <CardBody className="p-3 text-center">
          <div className="text-3xl mb-2">{getFileIcon(file.type, file.mimeType)}</div>
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
      isPressable
      onPress={onSelect}
      onDoubleClick={onDoubleClick}
    >
      <CardBody className="p-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{getFileIcon(file.type, file.mimeType)}</div>
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
      </CardBody>
    </Card>
  );
};

export default FileManager;