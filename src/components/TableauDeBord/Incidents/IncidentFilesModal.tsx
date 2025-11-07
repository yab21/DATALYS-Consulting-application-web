"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/react";
import { useSimpleNotifications } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { 
  IncidentFile, 
  incidentFilesService, 
  IncidentFilesListResponse,
  UploadProgressCallback 
} from "@/services/incident-files";
import {
  Upload,
  Download,
  Eye,
  File,
  FileImage,
  FileText,
  FileArchive,
  FileVideo,
  FileAudio,
  Plus,
  X,
  AlertTriangle,
  Search,
  FolderOpen,
  Maximize2,
  Minimize2,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface IncidentFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: number;
  incidentTitle: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const IncidentFilesModal: React.FC<IncidentFilesModalProps> = ({
  isOpen,
  onClose,
  incidentId,
  incidentTitle,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const { showNotification } = useSimpleNotifications();
  
  // États
  const [files, setFiles] = useState<IncidentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // États pour les modaux
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<IncidentFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États pour l'upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadModal, setUploadModal] = useState(false);
  
  // État pour la prévisualisation
  const [previewFile, setPreviewFile] = useState<IncidentFile | null>(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Charger les fichiers
  const loadFiles = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const response = await incidentFilesService.getIncidentFiles(incidentId, 1, 20);
      if (response.success && response.data) {
        setFiles(response.data.files);
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de charger les fichiers'
      });
    } finally {
      setLoading(false);
    }
  }, [incidentId, isOpen, showNotification]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Nettoyer l'URL blob au changement de fichier ou fermeture du modal
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Gestion de l'upload
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setUploadFiles(selectedFiles);
    setUploadModal(true);
    // Reset l'input
    event.target.value = '';
  };

  const uploadSelectedFiles = async () => {
    if (uploadFiles.length === 0) return;

    setIsUploading(true);
    const newProgress: Record<string, number> = {};
    
    try {
      // Initialiser le progress
      uploadFiles.forEach(file => {
        newProgress[file.name] = 0;
      });
      setUploadProgress(newProgress);

      // Callback pour mettre à jour le progress
      const onProgress: UploadProgressCallback = (progress, fileName) => {
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: progress
        }));
      };

      // Upload des fichiers
      for (const file of uploadFiles) {
        await incidentFilesService.uploadFileToIncident(incidentId, file, onProgress);
      }

      showNotification({
        type: 'success',
        title: 'Succès',
        message: `${uploadFiles.length} fichier(s) uploadé(s) avec succès`
      });

      // Recharger la liste et fermer le modal
      loadFiles();
      setUploadModal(false);
      setUploadFiles([]);
      
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'upload des fichiers'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  // Téléchargement de fichier
  const handleDownload = async (file: IncidentFile) => {
    try {
      await incidentFilesService.downloadIncidentFile(file.file_url, file.file_name);
      showNotification({
        type: 'success',
        title: 'Succès',
        message: 'Fichier téléchargé avec succès'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du téléchargement'
      });
    }
  };

  // Prévisualisation de fichier
  const handlePreview = async (file: IncidentFile) => {
    try {
      const url = await incidentFilesService.createPreviewBlob(file.file_url);
      setBlobUrl(url);
      setPreviewFile(file);
      setPreviewModal(true);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de prévisualiser le fichier'
      });
    }
  };

  // Ouvrir le modal de suppression
  const handleDeleteClick = (file: IncidentFile) => {
    setSelectedFile(file);
    setDeleteModal(true);
  };

  // Suppression de fichier
  const handleDelete = async () => {
    if (!selectedFile) return;
    
    setIsDeleting(true);
    try {
      const result = await incidentFilesService.deleteIncidentFile(selectedFile.id);
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Succès',
          message: 'Fichier supprimé avec succès'
        });
        // Recharger la liste des fichiers
        loadFiles();
        setDeleteModal(false);
        setSelectedFile(null);
      } else {
        showNotification({
          type: 'error',
          title: 'Erreur',
          message: result.message || 'Erreur lors de la suppression'
        });
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression du fichier'
      });
    } finally {
      setIsDeleting(false);
    }
  };


  // Obtenir l'icône selon le type de fichier
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <FileImage className="w-6 h-6 text-blue-600" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
      return <FileText className="w-6 h-6 text-red-600" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) {
      return <FileVideo className="w-6 h-6 text-purple-600" />;
    }
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension || '')) {
      return <FileAudio className="w-6 h-6 text-indigo-600" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <FileArchive className="w-6 h-6 text-orange-600" />;
    }
    
    return <File className="w-6 h-6 text-gray-600" />;
  };


  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return 'Taille inconnue';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filtrer les fichiers selon la recherche
  const filteredFiles = files.filter(file =>
    file.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size={isFullscreen ? "full" : "4xl"}
        scrollBehavior="inside"
        classNames={{
          base: isFullscreen ? "" : "max-h-[90vh]",
          body: "p-0"
        }}
      >
        <ModalContent>
          <ModalHeader className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-[#4ba9b7]/10">
                  <FolderOpen className="w-5 h-5 text-[#4ba9b7]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Fichiers de l'incident</h2>
                  <p className="text-sm text-gray-600">{incidentTitle}</p>
                </div>
              </div>
              {onToggleFullscreen && (
                <button
                  onClick={onToggleFullscreen}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </ModalHeader>
          
          <ModalBody className="p-6">
            {/* Barre d'actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4ba9b7] text-white text-sm font-medium rounded-md hover:bg-[#4ba9b7]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] transition-colors"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter des fichiers
                </button>
                
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un fichier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4ba9b7] focus:border-transparent w-64"
                  />
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                  {filteredFiles.length} fichier(s)
                </span>
              </div>
            </div>

            {/* Contenu */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Chargement des fichiers...</div>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchTerm ? 'Aucun fichier trouvé' : 'Aucun fichier uploadé pour cet incident'}
                </p>
              </div>
            ) : (
              <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 rounded-lg bg-gray-50">
                        {getFileIcon(file.file_name)}
                      </div>
                      
                      <div className="w-full">
                        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                          {file.file_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 w-full justify-center">
                        <button
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => handlePreview(file)}
                          title="Prévisualiser"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          onClick={() => handleDownload(file)}
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          onClick={() => handleDeleteClick(file)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModalBody>
          
          <ModalFooter className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] transition-colors"
            >
              Fermer
            </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'upload */}
      <Modal isOpen={uploadModal} onClose={() => setUploadModal(false)} size="lg">
        <ModalContent>
          <ModalHeader className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Upload de fichiers</h3>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {uploadFiles.length} fichier(s) sélectionné(s)
              </p>
              
              {uploadFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  
                  {isUploading && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{Math.round(uploadProgress[file.name] || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#4ba9b7] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress[file.name] || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => setUploadModal(false)}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={uploadSelectedFiles}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#4ba9b7] rounded-md hover:bg-[#4ba9b7]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isUploading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isUploading ? 'Upload en cours...' : 'Uploader'}
              </button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal isOpen={previewModal} onClose={() => setPreviewModal(false)} size="4xl">
        <ModalContent>
          <ModalHeader className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-50">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Aperçu du fichier</h3>
                <p className="text-sm text-gray-600">{previewFile?.file_name}</p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            {previewFile && blobUrl && (
              <div className="flex justify-center">
                {previewFile.file_type.startsWith('image/') ? (
                  <img 
                    src={blobUrl} 
                    alt={previewFile.file_name}
                    className="max-w-full max-h-96 object-contain rounded-lg border border-gray-200"
                  />
                ) : previewFile.file_type === 'application/pdf' ? (
                  <iframe
                    src={blobUrl}
                    className="w-full h-96 border border-gray-200 rounded-lg"
                    title={previewFile.file_name}
                  />
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
                    <p className="text-gray-600">Aperçu non disponible pour ce type de fichier</p>
                    <p className="text-sm text-gray-500 mt-2">Vous pouvez toujours télécharger le fichier</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => setPreviewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] transition-colors"
              >
                Fermer
              </button>
              {previewFile && (
                <button
                  onClick={() => handleDownload(previewFile)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#4ba9b7] rounded-md hover:bg-[#4ba9b7]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4ba9b7] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </button>
              )}
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de suppression */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} size="md">
        <ModalContent>
          <ModalHeader className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-red-50">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="space-y-4">
              <p className="text-gray-700">
                Êtes-vous sûr de vouloir supprimer ce fichier ?
              </p>
              {selectedFile && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white">
                      {getFileIcon(selectedFile.file_name)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.file_name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.file_size)}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>Attention :</strong> Cette action est irréversible. Le fichier sera définitivement supprimé.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default IncidentFilesModal;