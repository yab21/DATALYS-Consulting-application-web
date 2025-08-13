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
import { useNotifications } from '@/context/NotificationContext';

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
  const [currentPath, setCurrentPath] = useState(rootPath);
  const [selectedFiles, setSelectedFiles] = useState<Selection>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Modals
  const { isOpen: isCreateFolderOpen, onOpen: onCreateFolderOpen, onClose: onCreateFolderClose } = useDisclosure();
  const { isOpen: isShareOpen, onOpen: onShareOpen, onClose: onShareClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const [newFolderName, setNewFolderName] = useState('');
  const [shareSettings, setShareSettings] = useState<FileItem | null>(null);

  const { addNotification } = useNotifications();

  // Données mockées pour démonstration
  React.useEffect(() => {
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
  }, []);

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
        addNotification({
          title: 'Fichier trop volumineux',
          body: `${file.name} dépasse la limite de ${maxFileSize}MB`,
          type: 'warning',
          priority: 'medium',
          category: 'system',
          read: false,
        });
        return false;
      }

      // Vérification du type
      if (acceptedTypes.length > 0 && !acceptedTypes.some(type => file.type.includes(type))) {
        addNotification({
          title: 'Type de fichier non autorisé',
          body: `${file.name} n'est pas un type de fichier autorisé`,
          type: 'warning',
          priority: 'medium',
          category: 'system',
          read: false,
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
      // Simuler l'upload avec progression
      for (const item of uploadProgressItems) {
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploads(prev => prev.map(upload =>
            upload.fileId === item.fileId
              ? { ...upload, progress }
              : upload
          ));
        }

        setUploads(prev => prev.map(upload =>
          upload.fileId === item.fileId
            ? { ...upload, status: 'completed' }
            : upload
        ));
      }

      if (onFileUpload) {
        await onFileUpload(validFiles, currentPath);
      }

      // Supprimer les progressions terminées après 2 secondes
      setTimeout(() => {
        setUploads(prev => prev.filter(upload => 
          !uploadProgressItems.some(item => item.fileId === upload.fileId)
        ));
      }, 2000);

      addNotification({
        title: 'Upload terminé',
        body: `${validFiles.length} fichier${validFiles.length > 1 ? 's' : ''} uploadé${validFiles.length > 1 ? 's' : ''}`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        read: false,
      });

    } catch (error) {
      console.error('Erreur upload:', error);
      addNotification({
        title: 'Erreur d\'upload',
        body: 'Une erreur est survenue lors de l\'upload',
        type: 'error',
        priority: 'high',
        category: 'system',
        read: false,
      });
    }
  }, [maxFileSize, acceptedTypes, currentPath, onFileUpload, addNotification]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    try {
      if (onFolderCreate) {
        await onFolderCreate(newFolderName, currentPath);
      }

      addNotification({
        title: 'Dossier créé',
        body: `Le dossier "${newFolderName}" a été créé`,
        type: 'success',
        priority: 'low',
        category: 'system',
        read: false,
      });

      setNewFolderName('');
      onCreateFolderClose();
    } catch (error) {
      console.error('Erreur création dossier:', error);
      addNotification({
        title: 'Erreur',
        body: 'Impossible de créer le dossier',
        type: 'error',
        priority: 'medium',
        category: 'system',
        read: false,
      });
    }
  }, [newFolderName, currentPath, onFolderCreate, addNotification, onCreateFolderClose]);

  const handleDeleteFiles = useCallback(async () => {
    const fileIds = Array.from(selectedFiles as Set<string>);
    
    try {
      if (onFileDelete) {
        await onFileDelete(fileIds);
      }

      addNotification({
        title: 'Fichiers supprimés',
        body: `${fileIds.length} fichier${fileIds.length > 1 ? 's' : ''} supprimé${fileIds.length > 1 ? 's' : ''}`,
        type: 'success',
        priority: 'medium',
        category: 'system',
        read: false,
      });

      setSelectedFiles(new Set());
      onDeleteClose();
    } catch (error) {
      console.error('Erreur suppression:', error);
      addNotification({
        title: 'Erreur',
        body: 'Impossible de supprimer les fichiers',
        type: 'error',
        priority: 'medium',
        category: 'system',
        read: false,
      });
    }
  }, [selectedFiles, onFileDelete, addNotification, onDeleteClose]);

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