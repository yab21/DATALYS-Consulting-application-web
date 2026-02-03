"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { SecureStorage } from '@/lib/secure-storage';
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
  Spinner,
  Select,
  SelectItem
} from '@heroui/react';
import {
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit3,
  Trash2,
  Search,
  Home,
  ArrowLeft,
  Upload,
  FileText,
  Image,
  Download,
  Files
} from 'lucide-react';
import { foldersService, Folder as FolderType } from '@/services/folders';
import { useAuth } from '@/context/AuthContext';
import { useSimpleNotifications } from '@/components/UI/Notifications/NotificationProvider';
import { validateFileImmediately, sanitizeFileName } from '@/lib/upload-security-immediate';

interface FolderManagerProps {
  projectId: number;
  projectName: string;
  onFolderSelect?: (folder: FolderType | null) => void;
  onFileUpload?: (files: File[], folderId: number | null) => void;
  onFileUploaded?: (uploadResponse: any) => void; // Nouveau callback pour les réponses d'upload
  allowCreateFolder?: boolean;
  allowDeleteFolder?: boolean;
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
  onFileUploaded,
  allowCreateFolder = true,
  allowDeleteFolder = true,
  readOnly = false,
  className = ""
}) => {
  const { user } = useAuth();
  const { addNotification } = useSimpleNotifications();
  
  // États
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [allFolders, setAllFolders] = useState<FolderType[]>([]);
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
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  // États des formulaires
  const [newFolderName, setNewFolderName] = useState('');
  const [editFolderName, setEditFolderName] = useState('');
  const [selectedParentFolder, setSelectedParentFolder] = useState<FolderType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // États pour l'upload
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadFolderName, setUploadFolderName] = useState('');
  const [uploadType, setUploadType] = useState<'single' | 'multiple'>('multiple');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // États pour les champs optionnels du fichier unique
  const [singleFileFolderName, setSingleFileFolderName] = useState('');
  const [singleFileIsPublic, setSingleFileIsPublic] = useState(false);
  const [singleFileSubfolder, setSingleFileSubfolder] = useState('files');

  // Charger les dossiers
  const loadFolders = useCallback(async (parentId: number | null = null) => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log(`🔍 Chargement des dossiers - Project: ${projectId}, Parent: ${parentId}, Search: ${searchTerm}`);
      const foldersData = await foldersService.getFoldersByProject(
        projectId,
        parentId,
        user.id,
        searchTerm || undefined
      );
      console.log(`📁 Dossiers chargés:`, foldersData);
      setFolders(foldersData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des dossiers:', error);
      addNotification({
        title: "Erreur",
        message: "Impossible de charger les dossiers",
        type: "error"      });
    } finally {
      setLoading(false);
    }
  }, [projectId, user, searchTerm]);

  // Charger tous les dossiers du projet pour la sélection parent
  const loadAllFolders = useCallback(async () => {
    if (!user) return;
    
    try {
      const allFoldersData = await foldersService.getFoldersByProject(
        projectId,
        null, // null pour récupérer tous les dossiers
        user.id
      );
      setAllFolders(allFoldersData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de tous les dossiers:', error);
    }
  }, [projectId, user]);

  // Effets
  useEffect(() => {
    loadFolders(currentFolder?.id || null);
    loadAllFolders(); // Charger aussi tous les dossiers pour la sélection
  }, [loadFolders, loadAllFolders, currentFolder]);

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
      
      await foldersService.createFolder(
        newFolderName.trim(),
        projectId,
        user.id,
        selectedParentFolder?.id || null
      );

      addNotification({
        title: "Dossier créé",
        message: `Le dossier "${newFolderName}" a été créé avec succès`,
        type: "success"      });

      setNewFolderName('');
      setSelectedParentFolder(null);
      onCreateClose();
      // Recharger les dossiers après création
      await loadFolders(currentFolder?.id || null);
      // Recharger aussi tous les dossiers pour le sélecteur parent
      await loadAllFolders();
      
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      addNotification({
        title: "Erreur",
        message: "Impossible de créer le dossier",
        type: "error"      });
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
        message: `Le dossier a été renommé en "${editFolderName}"`,
        type: "success"      });

      setEditFolderName('');
      setSelectedFolder(null);
      onEditClose();
      await loadFolders(currentFolder?.id || null);
      
    } catch (error) {
      console.error('Erreur lors de la modification du dossier:', error);
      addNotification({
        title: "Erreur",
        message: "Impossible de modifier le dossier",
        type: "error"      });
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
        message: `Le dossier "${selectedFolder.name}" a été supprimé`,
        type: "success"
      });

      setSelectedFolder(null);
      onDeleteClose();
      await loadFolders(currentFolder?.id || null);
      
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier:', error);
      addNotification({
        title: "Erreur",
        message: "Impossible de supprimer le dossier",
        type: "error"
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

  const openCreateModal = () => {
    setNewFolderName('');
    setSelectedParentFolder(currentFolder); // Par défaut, le dossier actuel comme parent
    onCreateOpen();
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

  const handleUploadMultipleFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        setPendingFiles(Array.from(target.files));
        setUploadType('multiple');
        setUploadFolderName(`Fichiers-${new Date().toISOString().split('T')[0]}`);
        onUploadOpen();
      }
    };
    input.click();
  };

  const handleUploadSingleFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.accept = '*/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        setPendingFiles([target.files[0]]);
        setUploadType('single');
        setUploadFolderName('');
        onUploadOpen();
      }
    };
    input.click();
  };

  // Upload d'un fichier unique avec /files/upload (API simple)
  const uploadSingleFile = async (file: File) => {
    if (!user) return;

    // Validation de sécurité du fichier
    const validation = validateFileImmediately(file);
    if (!validation.valid) {
      addNotification({
        title: "Fichier non autorisé",
        message: validation.error || "Le fichier ne respecte pas les critères de sécurité",
        type: "error"
      });
      return;
    }

    try {
      setUploadLoading(true);

      const formData = new FormData();
      formData.append('file', file);
      
      // Paramètres selon votre documentation - champs optionnels
      if (currentFolder?.id) {
        formData.append('folder_id', currentFolder.id.toString());
        console.log('📁 Upload dans le dossier:', currentFolder.name, 'ID:', currentFolder.id);
      } else {
        console.log('📁 Upload à la racine du projet');
      }
      
      if (singleFileFolderName.trim()) {
        formData.append('folder_name', singleFileFolderName);
      }
      
      formData.append('is_public', singleFileIsPublic.toString());
      formData.append('subfolder', singleFileSubfolder);
      
      const response = await fetch('/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SecureStorage.getItem('authToken')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Erreur lors de l\'upload');
      }

      addNotification({
        title: "Fichier uploadé",
        message: `Le fichier "${file.name}" a été uploadé avec succès`,
        type: "success"
      });

      // Appeler le callback avec la réponse d'upload pour l'affichage
      if (onFileUploaded) {
        onFileUploaded(data);
      }

      // Recharger les dossiers ET déclencher le rechargement des fichiers
      await loadFolders(currentFolder?.id || null);
      
      // Si un callback onFileUpload existe, l'appeler pour recharger les fichiers
      if (onFileUpload) {
        onFileUpload([file], currentFolder?.id || null);
      }

      // Réinitialiser les champs optionnels
      setSingleFileFolderName('');
      setSingleFileIsPublic(false);
      setSingleFileSubfolder('files');
      
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier:', error);
      addNotification({
        title: "Erreur d'upload",
        message: "Impossible d'uploader le fichier",
        type: "error"
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Upload de fichiers multiples dans un dossier avec /folders/upload
  const uploadFilesToFolder = async (files: File[]) => {
    if (!user) return;

    // Validation de sécurité de tous les fichiers
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    for (const file of files) {
      const validation = validateFileImmediately(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    }

    // Afficher les erreurs pour les fichiers invalides
    if (invalidFiles.length > 0) {
      addNotification({
        title: "Fichiers non autorisés",
        message: `${invalidFiles.length} fichier(s) rejeté(s): ${invalidFiles.join(', ')}`,
        type: "warning"
      });
    }

    // Si aucun fichier valide, arrêter
    if (validFiles.length === 0) {
      addNotification({
        title: "Aucun fichier valide",
        message: "Tous les fichiers ont été rejetés pour des raisons de sécurité",
        type: "error"
      });
      return;
    }

    try {
      setUploadLoading(true);

      const folderName = uploadFolderName.trim() || `Fichiers-${new Date().toISOString().split('T')[0]}`;
      
      const uploadResponse = await foldersService.uploadFilesToFolder(
        validFiles,
        projectId,
        user.id,
        currentFolder?.id || null,
        folderName
      );

      // Appeler le callback avec la réponse d'upload pour l'affichage
      if (onFileUploaded) {
        onFileUploaded(uploadResponse);
      }

      addNotification({
        title: "Fichiers uploadés",
        message: `${validFiles.length} fichier(s) ont été uploadés dans le dossier "${folderName}"`,
        type: "success"
      });

      setUploadFolderName('');
      await loadFolders(currentFolder?.id || null);
      await loadAllFolders();
      
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error);
      addNotification({
        title: "Erreur d'upload",
        message: "Impossible d'uploader les fichiers",
        type: "error"      });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!user || pendingFiles.length === 0) return;

    try {
      if (uploadType === 'single') {
        await uploadSingleFile(pendingFiles[0]);
      } else {
        await uploadFilesToFolder(pendingFiles);
      }
      
      setPendingFiles([]);
      onUploadClose();
    } catch (error) {
      // L'erreur est déjà gérée dans les fonctions d'upload
    }
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

              {!readOnly && (
                <Tooltip content="Uploader un fichier">
                  <Button
                    isIconOnly
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={handleUploadSingleFile}
                    isLoading={uploadLoading}
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}

              {!readOnly && (
                <Tooltip content="Uploader plusieurs fichiers dans un dossier">
                  <Button
                    isIconOnly
                    color="secondary"
                    variant="flat"
                    size="sm"
                    onPress={handleUploadMultipleFiles}
                    isLoading={uploadLoading}
                  >
                    <Files className="w-4 h-4" />
                  </Button>
                </Tooltip>
              )}
              
              {!readOnly && allowCreateFolder && (
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<FolderPlus className="w-4 h-4" />}
                  onPress={openCreateModal}
                >
                  Nouveau dossier
                </Button>
              )}
            </div>
          </div>

          {/* Barre de recherche */}
          <Input
            placeholder="Rechercher des dossiers..."
           
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
                  onPress={openCreateModal}
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
                  className="hover:scale-[1.02] transition-transform border border-gray-200 dark:border-gray-700"
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleFolderClick(folder)}
                      >
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
                              onPress={() => {}}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<Edit3 className="w-4 h-4" />}
                              onPress={() => openEditModal(folder)}
                            >
                              Renommer
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              color="danger"
                              startContent={<Trash2 className="w-4 h-4" />}
                              onPress={() => openDeleteModal(folder)}
                            >
                              Supprimer
                            </DropdownItem>
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
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-900 dark:text-gray-100">Créer un nouveau dossier</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Nom du dossier"
                  placeholder="Ex: Documents, Images, Archives..."
                 
                  onValueChange={setNewFolderName}
                  variant="bordered"
                  size="lg"
                  autoFocus
                  isRequired
                  classNames={{
                    label: "!text-gray-900 dark:!text-gray-100 !font-medium",
                    input: "!text-gray-900 dark:!text-gray-100",
                    inputWrapper: "!border-gray-300 dark:!border-gray-600"
                  }}
                />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Projet : <span className="font-semibold text-[#4ba9b7]">{projectName}</span>
                  </label>
                </div>

                <Select
                  label="Dossier parent"
                  placeholder="Sélectionner un dossier parent (optionnel)"
                  selectedKeys={selectedParentFolder ? [selectedParentFolder.id.toString()] : ["root"]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    if (selectedKey === "root" || !selectedKey) {
                      setSelectedParentFolder(null);
                    } else {
                      const folder = allFolders.find(f => f.id.toString() === selectedKey);
                      setSelectedParentFolder(folder || null);
                    }
                  }}
                  variant="bordered"
                  size="lg"
                  startContent={<Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                  classNames={{
                    label: "!text-gray-900 dark:!text-gray-100 !font-medium",
                    value: "!text-gray-900 dark:!text-gray-100",
                    trigger: "!border-gray-300 dark:!border-gray-600"
                  }}
                  items={[
                    { key: "root", label: `Racine du projet (${projectName})` },
                    ...allFolders.map(folder => ({
                      key: folder.id.toString(),
                      label: folder.name
                    }))
                  ]}
                >
                  {(item) => (
                    <SelectItem key={item.key}>
                      {item.label}
                    </SelectItem>
                  )}
                </Select>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-600">
                  <p className="text-sm text-blue-800 dark:text-blue-100">
                    <strong>Aperçu :</strong> Le dossier "{newFolderName || 'Nouveau dossier'}" sera créé dans{" "}
                    {selectedParentFolder ? (
                      <span className="font-semibold text-blue-900 dark:text-blue-50">"{selectedParentFolder.name}"</span>
                    ) : (
                      <span className="font-semibold text-blue-900 dark:text-blue-50">la racine du projet</span>
                    )}
                  </p>
                </div>

              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={actionLoading}>
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
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal d'édition de dossier */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-900 dark:text-gray-100">Renommer le dossier</ModalHeader>
              <ModalBody>
                <Input
                  label="Nouveau nom"
                  placeholder="Entrez le nouveau nom"
                 
                  onValueChange={setEditFolderName}
                  variant="bordered"
                  size="lg"
                  autoFocus
                  classNames={{
                    label: "!text-gray-900 dark:!text-gray-100 !font-medium",
                    input: "!text-gray-900 dark:!text-gray-100",
                    inputWrapper: "!border-gray-300 dark:!border-gray-600"
                  }}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={actionLoading}>
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
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-900 dark:text-gray-100">Supprimer le dossier</ModalHeader>
              <ModalBody>
                <div className="text-center">
                  <Trash2 className="mx-auto mb-4 h-16 w-16 text-red-500" />
                  <p className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Êtes-vous sûr de vouloir supprimer ce dossier ?
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Le dossier <strong className="text-gray-900 dark:text-gray-100">"{selectedFolder?.name}"</strong> sera définitivement supprimé.
                    Cette action est irréversible et supprimera également tous les fichiers contenus.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={actionLoading}>
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
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal d'upload */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-gray-900 dark:text-gray-100">
                {uploadType === 'single' ? 'Upload de fichier' : 'Upload de fichiers dans un dossier'}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {uploadType === 'single' 
                      ? `Fichier sélectionné: ${pendingFiles[0]?.name}`
                      : `${pendingFiles.length} fichier(s) sélectionné(s)`
                    }
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Fichiers à uploader:</strong>
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {pendingFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                          <span className="text-gray-500 text-xs ml-2">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {uploadType === 'multiple' && (
                  <Input
                    label="Nom du dossier de destination"
                    placeholder="Nom du dossier qui sera créé"
                   
                    onValueChange={setUploadFolderName}
                    variant="bordered"
                    size="lg"
                    autoFocus
                    isRequired
                    classNames={{
                      label: "!text-gray-900 dark:!text-gray-100 !font-medium",
                      input: "!text-gray-900 dark:!text-gray-100",
                      inputWrapper: "!border-gray-300 dark:!border-gray-600"
                    }}
                  />
                )}

                {uploadType === 'single' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Configuration de l'upload
                    </h3>
                    
                    <Input
                      label="Folder Name (optionnel)"
                      placeholder="Nom du nouveau dossier à créer"
                     
                      onValueChange={setSingleFileFolderName}
                      description="Créera un nouveau dossier si spécifié"
                      variant="bordered"
                    />
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={singleFileIsPublic}
                        onChange={(e) => setSingleFileIsPublic(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                        Fichier public (accessible sans authentification)
                      </label>
                    </div>
                    
                    <Input
                      label="Subfolder"
                      placeholder="Sous-dossier de stockage"
                     
                      onValueChange={setSingleFileSubfolder}
                      description="Défaut: files"
                      variant="bordered"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Projet : <span className="font-semibold text-[#4ba9b7]">{projectName}</span>
                  </label>
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Dossier parent : <span className="font-semibold">
                      {currentFolder ? currentFolder.name : 'Racine du projet'}
                    </span>
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-600">
                  <p className="text-sm text-blue-800 dark:text-blue-100">
                    <strong>Aperçu :</strong> 
                    {uploadType === 'single' 
                      ? ` L'archive sera extraite dans le dossier "${uploadFolderName || 'Nom du dossier'}"` 
                      : ` ${pendingFiles.length} fichier(s) seront placés dans le dossier "${uploadFolderName || 'Nom du dossier'}"`
                    }
                    {currentFolder && (
                      <span> sous "{currentFolder.name}"</span>
                    )}
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose} isDisabled={uploadLoading}>
                  Annuler
                </Button>
                <Button
                  color="primary"
                  onPress={handleConfirmUpload}
                  isLoading={uploadLoading}
                  isDisabled={uploadType === 'multiple' && !uploadFolderName.trim()}
                  startContent={<Files className="w-4 h-4" />}
                >
                  Uploader
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default FolderManager;