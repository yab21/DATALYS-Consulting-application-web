"use client";

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner
} from '@nextui-org/react';
import {
  FileText,
  Download,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  Upload,
  Image,
  FileVideo,
  Music,
  Archive,
  File
} from 'lucide-react';
import { ProjectFile, filesService } from '@/services/files';
import { useAuth } from '@/context/AuthContext';
import { useSimpleNotifications } from '@/context/NotificationContext';

interface FileViewerProps {
  projectId: number;
  folderId: number | null;
  folderName?: string;
  onFileUpload?: (files: File[]) => void;
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowEdit?: boolean;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  projectId,
  folderId,
  folderName = "Racine",
  onFileUpload,
  allowUpload = true,
  allowDelete = true,
  allowEdit = true,
  className = ""
}) => {
  const { user } = useAuth();
  const { addNotification } = useSimpleNotifications();
  
  // États
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);

  // Modales
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  // États d'actions
  const [actionLoading, setActionLoading] = useState(false);

  // Charger les fichiers depuis l'API réelle
  const loadFiles = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Appel API réel
      const filesData = await filesService.getFilesByLocation(
        projectId, 
        folderId, 
        user.id
      );
      
      setFiles(filesData);
      console.log('Fichiers chargés depuis l\'API:', filesData);
      
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de charger les fichiers",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
      
      // En cas d'erreur API, afficher un message mais ne pas bloquer l'interface
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [projectId, folderId, user]);

  // Gestionnaires d'événements
  const handleFileUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && onFileUpload) {
        onFileUpload(Array.from(target.files));
      }
    };
    input.click();
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      await filesService.downloadFile(file.id);
      
      addNotification({
        title: "Téléchargement",
        body: `Téléchargement de "${file.name}" en cours`,
        type: "info",
        priority: "low",
        category: "project",
        read: false,
      });
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de télécharger le fichier",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    }
  };

  const handlePreview = (file: ProjectFile) => {
    setSelectedFile(file);
    onPreviewOpen();
  };

  const handleDelete = (file: ProjectFile) => {
    setSelectedFile(file);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!selectedFile || !user) return;
    
    try {
      setActionLoading(true);
      
      // Appel API réel pour supprimer
      await filesService.deleteFile(selectedFile.id, user.id);
      
      addNotification({
        title: "Fichier supprimé",
        body: `Le fichier "${selectedFile.name}" a été supprimé`,
        type: "success",
        priority: "medium",
        category: "project",
        read: false,
      });

      setSelectedFile(null);
      onDeleteClose();
      
      // Recharger la liste après suppression
      await loadFiles();
      
    } catch (error) {
      console.error('Erreur suppression:', error);
      addNotification({
        title: "Erreur",
        body: "Impossible de supprimer le fichier",
        type: "error",
        priority: "high",
        category: "system",
        read: false,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Utilitaires
  const getFileIcon = (file: ProjectFile) => {
    if (file.mime_type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (file.mime_type.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-500" />;
    if (file.mime_type.startsWith('audio/')) return <Music className="w-5 h-5 text-green-500" />;
    if (file.mime_type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
    if (file.mime_type.includes('archive') || file.mime_type.includes('zip')) return <Archive className="w-5 h-5 text-yellow-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const canPreviewFile = (file: ProjectFile): boolean => {
    return file.mime_type.startsWith('image/') || 
           file.mime_type === 'application/pdf' ||
           file.mime_type.startsWith('text/');
  };

  const formatFileDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date inconnue';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* En-tête */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardBody className="py-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                📁 Fichiers dans "{folderName}"
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Chargement...' : `${files.length} fichier${files.length > 1 ? 's' : ''}`}
              </p>
            </div>
            
            {allowUpload && onFileUpload && (
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<Upload className="w-4 h-4" />}
                onPress={handleFileUploadClick}
                isDisabled={loading}
              >
                Ajouter des fichiers
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Liste des fichiers */}
      <Card className="border border-gray-200 dark:border-gray-700">
        <CardBody className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" color="primary" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Chargement des fichiers...
              </span>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Aucun fichier
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-4">
                Ce dossier ne contient pas encore de fichiers
              </p>
              {allowUpload && onFileUpload && (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={handleFileUploadClick}
                  startContent={<Upload className="w-4 h-4" />}
                >
                  Ajouter le premier fichier
                </Button>
              )}
            </div>
          ) : (
            <Table aria-label="Fichiers" removeWrapper>
              <TableHeader>
                <TableColumn>Fichier</TableColumn>
                <TableColumn>Taille</TableColumn>
                <TableColumn>Type</TableColumn>
                <TableColumn>Modifié</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          {file.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {file.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {filesService.formatFileSize(file.size)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat" color="default">
                        {file.extension.toUpperCase()}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {formatFileDate(file.updated_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canPreviewFile(file) && (
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handlePreview(file)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onPress={() => handleDownload(file)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        {(allowEdit || allowDelete) && (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem
                                key="edit"
                                startContent={<Edit3 className="w-4 h-4" />}
                              >
                                Modifier
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                color="danger"
                                startContent={<Trash2 className="w-4 h-4" />}
                                onPress={() => handleDelete(file)}
                              >
                                Supprimer
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal de suppression */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>Supprimer le fichier</ModalHeader>
          <ModalBody>
            <p>
              Êtes-vous sûr de vouloir supprimer le fichier <strong>"{selectedFile?.name}"</strong> ?
            </p>
            <p className="text-danger text-sm mt-2">
              Cette action est irréversible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDeleteClose}>
              Annuler
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              isLoading={actionLoading}
            >
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="4xl">
        <ModalContent>
          <ModalHeader>Prévisualisation: {selectedFile?.name}</ModalHeader>
          <ModalBody>
            {selectedFile && (
              <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg">
                {selectedFile.mime_type.startsWith('image/') ? (
                  <img
                    src={filesService.getFileServeUrl(selectedFile.file_path || selectedFile.name)}
                    alt={selectedFile.name}
                    className="max-w-full max-h-[400px] object-contain"
                  />
                ) : selectedFile.mime_type === 'application/pdf' ? (
                  <iframe
                    src={filesService.getFileServeUrl(selectedFile.file_path || selectedFile.name)}
                    className="w-full h-[400px] border-0"
                    title={selectedFile.name}
                  />
                ) : (
                  <div className="text-center">
                    <File className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Aperçu non disponible pour ce type de fichier
                    </p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onPreviewClose}>
              Fermer
            </Button>
            {selectedFile && (
              <Button
                color="primary"
                onPress={() => handleDownload(selectedFile)}
                startContent={<Download className="w-4 h-4" />}
              >
                Télécharger
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default FileViewer;