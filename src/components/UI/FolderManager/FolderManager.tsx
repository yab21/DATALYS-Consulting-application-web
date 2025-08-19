"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
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
  Breadcrumbs,
  BreadcrumbItem,
  Tooltip,
  Spinner
} from '@nextui-org/react';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit3,
  Trash2,
  Move,
  Search,
  Home,
  ArrowLeft,
  Upload,
  FileText,
  Image,
  Download
} from 'lucide-react';
import { foldersService, Folder as FolderType } from '@/services/folders';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';

interface FolderManagerProps {
  projectId: number;
  projectName: string;
  onFolderSelect?: (folder: FolderType | null) => void;
  onFileUpload?: (files: File[], folderId: number | null) => void;
  allowCreateFolder?: boolean;
  allowDeleteFolder?: boolean;
  allowMoveFolder?: boolean;
  readOnly?: boolean;
  className?: string;
}

interface BreadcrumbPath {
  id: number | null;
  name: string;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  projectId,
  projectName,
  onFolderSelect,
  onFileUpload,
  allowCreateFolder = true,
  allowDeleteFolder = true,
  allowMoveFolder = true,
  readOnly = false,
  className = ""
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  // États
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbPath[]>([
    { id: null, name: projectName }
  ]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);

  // Modales
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isMoveOpen, onOpen: onMoveOpen, onClose: onMoveClose } = useDisclosure();

  // États des formulaires
  const [newFolderName, setNewFolderName] = useState('');
  const [editFolderName, setEditFolderName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Charger les dossiers
  const loadFolders = useCallback(async (parentId: number | null = null) => {
    if (!user) return;
    
    try {
      setLoading(true);
      const foldersData = await foldersService.getFoldersByProject(
        projectId,
        parentId,
        user.id,
        searchTerm || undefined
      );
      setFolders(foldersData);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de charger les dossiers",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, user, searchTerm, addNotification]);

  // Effets
  useEffect(() => {
    loadFolders(currentFolder?.id || null);
  }, [loadFolders, currentFolder]);

  useEffect(() => {
    onFolderSelect?.(currentFolder);
  }, [currentFolder, onFolderSelect]);

  // Gestionnaires d'événements
  const handleFolderClick = (folder: FolderType) => {
    setCurrentFolder(folder);
    setBreadcrumbPath(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = breadcrumbPath.slice(0, index + 1);
    setBreadcrumbPath(newPath);
    
    const targetFolder = newPath[newPath.length - 1];
    if (targetFolder.id === null) {
      setCurrentFolder(null);
    } else {
      const folder = folders.find(f => f.id === targetFolder.id);
      setCurrentFolder(folder || null);
    }
  };

  const handleGoBack = () => {
    if (breadcrumbPath.length > 1) {
      handleBreadcrumbClick(breadcrumbPath.length - 2);
    }
  };

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    try {
      setActionLoading(true);
      
      const newFolder = await foldersService.createFolder(
        newFolderName.trim(),
        projectId,
        user.id,
        currentFolder?.id || null
      );

      addNotification({
        title: "Dossier créé",
        body: `Le dossier "${newFolderName}" a été créé avec succès`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setNewFolderName('');
      onCreateClose();
      await loadFolders(currentFolder?.id || null);
      
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de créer le dossier",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditFolder = async () => {
    if (!user || !selectedFolder || !editFolderName.trim()) return;

    try {
      setActionLoading(true);
      
      await foldersService.updateFolder(
        selectedFolder.id,
        { name: editFolderName.trim() },
        user.id
      );

      addNotification({
        title: "Dossier modifié",
        body: `Le dossier a été renommé en "${editFolderName}"`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setEditFolderName('');
      setSelectedFolder(null);
      onEditClose();
      await loadFolders(currentFolder?.id || null);
      
    } catch (error) {
      console.error('Erreur lors de la modification du dossier:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de modifier le dossier",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!user || !selectedFolder) return;

    try {
      setActionLoading(true);
      
      await foldersService.deleteFolder(selectedFolder.id, user.id);

      addNotification({
        title: "Dossier supprimé",
        body: `Le dossier "${selectedFolder.name}" a été supprimé`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setSelectedFolder(null);
      onDeleteClose();
      await loadFolders(currentFolder?.id || null);
      
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de supprimer le dossier",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (folder: FolderType) => {
    setSelectedFolder(folder);
    setEditFolderName(folder.name);
    onEditOpen();
  };

  const openDeleteModal = (folder: FolderType) => {
    setSelectedFolder(folder);
    onDeleteOpen();
  };

  const handleFileUploadClick = () => {
    // Déclencher l'upload de fichiers dans le dossier courant
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && onFileUpload) {
        onFileUpload(Array.from(target.files), currentFolder?.id || null);
      }
    };
    input.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête avec navigation et actions */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {breadcrumbPath.length > 1 && (
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={handleGoBack}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              
              <Breadcrumbs size="lg" className="hidden sm:flex">
                {breadcrumbPath.map((path, index) => (
                  <BreadcrumbItem
                    key={index}
                    onPress={() => handleBreadcrumbClick(index)}
                    className="cursor-pointer hover:text-primary"
                  >
                    <div className="flex items-center gap-1">
                      {index === 0 ? <Home className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                      {path.name}
                    </div>
                  </BreadcrumbItem>
                ))}
              </Breadcrumbs>

              {/* Version mobile - juste le dossier courant */}
              <div className="flex sm:hidden items-center gap-2">
                <Folder className="w-4 h-4" />
                <span className="font-medium">{breadcrumbPath[breadcrumbPath.length - 1].name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!readOnly && onFileUpload && (
                <Tooltip content="Uploader des fichiers">
                  <Button
                    isIconOnly
                    color="secondary"
                    variant="flat"
                    size="sm"
                    onPress={handleFileUploadClick}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
              
              {!readOnly && allowCreateFolder && (
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<FolderPlus className="w-4 h-4" />}
                  onPress={onCreateOpen}
                >
                  Nouveau dossier
                </Button>
              )}
            </div>
          </div>

          {/* Barre de recherche */}
          <Input
            placeholder="Rechercher des dossiers..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            startContent={<Search className="w-4 h-4 text-gray-400" />}
            size="sm"
            className="max-w-md"
          />
        </CardHeader>

        <CardBody className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" color="primary" />
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                {searchTerm ? 'Aucun dossier trouvé' : 'Aucun dossier'}
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-4">
                {searchTerm 
                  ? `Aucun dossier ne correspond à "${searchTerm}"`
                  : 'Ce projet ne contient pas encore de dossiers'
                }
              </p>
              {!readOnly && allowCreateFolder && !searchTerm && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={onCreateOpen}
                  startContent={<FolderPlus className="w-4 h-4" />}
                >
                  Créer le premier dossier
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <Card
                  key={folder.id}
                  isPressable
                  onPress={() => handleFolderClick(folder)}
                  className="hover:scale-[1.02] transition-transform border border-gray-200 dark:border-gray-700"
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <FolderOpen className="w-8 h-8 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {folder.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip size="sm" variant="flat" color="default">
                              {folder.file_count || 0} fichiers
                            </Chip>
                          </div>
                        </div>
                      </div>

                      {!readOnly && (
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            {allowCreateFolder && (
                              <DropdownItem
                                key="edit"
                                startContent={<Edit3 className="w-4 h-4" />}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openEditModal(folder);
                                }}
                              >
                                Renommer
                              </DropdownItem>
                            )}
                            {allowMoveFolder && (
                              <DropdownItem
                                key="move"
                                startContent={<Move className="w-4 h-4" />}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setSelectedFolder(folder);
                                  onMoveOpen();
                                }}
                              >
                                Déplacer
                              </DropdownItem>
                            )}
                            {allowDeleteFolder && (
                              <DropdownItem
                                key="delete"
                                color="danger"
                                startContent={<Trash2 className="w-4 h-4" />}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal(folder);
                                }}
                              >
                                Supprimer
                              </DropdownItem>
                            )}
                          </DropdownMenu>
                        </Dropdown>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de création de dossier */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalContent>
          <ModalHeader>Créer un nouveau dossier</ModalHeader>
          <ModalBody>
            <Input
              label="Nom du dossier"
              value={newFolderName}
              onValueChange={setNewFolderName}
              placeholder="Entrez le nom du dossier"
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onCreateClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleCreateFolder}
              isLoading={actionLoading}
              isDisabled={!newFolderName.trim()}
            >
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition de dossier */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalContent>
          <ModalHeader>Renommer le dossier</ModalHeader>
          <ModalBody>
            <Input
              label="Nouveau nom"
              value={editFolderName}
              onValueChange={setEditFolderName}
              placeholder="Entrez le nouveau nom"
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onEditClose}>
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleEditFolder}
              isLoading={actionLoading}
              isDisabled={!editFolderName.trim()}
            >
              Renommer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Supprimer le dossier</ModalHeader>
          <ModalBody>
            <p>
              Êtes-vous sûr de vouloir supprimer le dossier <strong>"{selectedFolder?.name}"</strong> ?
            </p>
            <p className="text-danger text-sm mt-2">
              Cette action est irréversible et supprimera également tous les fichiers contenus.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDeleteClose}>
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteFolder}
              isLoading={actionLoading}
            >
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default FolderManager;