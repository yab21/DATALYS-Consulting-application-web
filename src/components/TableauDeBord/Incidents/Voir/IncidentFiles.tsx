"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  Button,
  Chip,
  Progress,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  Input,
} from "@heroui/react";
import { ProfessionalCard, SectionHeader, ProfessionalButton } from "@/components/UI/Professional";
import LoadingState from "@/components/UI/Loading/LoadingState";
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
  Trash2,
  File,
  FileImage,
  FileText,
  FileArchive,
  FileVideo,
  FileAudio,
  Plus,
  X,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search
} from "lucide-react";
import { isTokenExpiredError } from "@/lib/api-interceptor";

interface IncidentFilesProps {
  incidentId: number;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

// Composant pour la prévisualisation des fichiers
// Vérifier si un fichier est une image par son type MIME ou son extension
const isImageFile = (file: IncidentFile): boolean => {
  if (file.file_type.includes('image')) return true;
  const ext = file.file_name.split('.').pop()?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'heic', 'heif'].includes(ext);
};

// Vérifier si un fichier est un PDF par son type MIME ou son extension
const isPdfFile = (file: IncidentFile): boolean => {
  if (file.file_type === 'application/pdf') return true;
  const ext = file.file_name.split('.').pop()?.toLowerCase() || '';
  return ext === 'pdf';
};

const PreviewContent: React.FC<{ file: IncidentFile }> = ({ file }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentBlobUrl: string | null = null;

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isImageFile(file) || isPdfFile(file)) {
          const url = await incidentFilesService.createPreviewBlob(file.file_url, file.file_name);
          currentBlobUrl = url;
          setBlobUrl(url);
        }
      } catch (err) {
        console.error('Erreur lors du chargement de la prévisualisation:', err);
        setError('Impossible de charger la prévisualisation');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    // Nettoyer l'URL du blob quand le composant se démonte
    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [file]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ba9b7]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (isImageFile(file) && blobUrl) {
    return (
      <div className="flex justify-center">
        <img
          src={blobUrl}
          alt={file.file_name}
          className="max-w-full max-h-[60vh] object-contain rounded-lg"
        />
      </div>
    );
  }

  if (isPdfFile(file) && blobUrl) {
    return (
      <div className="flex justify-center">
        <iframe
          src={blobUrl}
          className="w-full h-[60vh] rounded-lg border"
          title={file.file_name}
        />
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <File className="mx-auto mb-4 h-12 w-12 text-gray-400" />
      <p className="text-gray-600">
        Prévisualisation non disponible pour ce type de fichier
      </p>
    </div>
  );
};

const IncidentFiles: React.FC<IncidentFilesProps> = ({ incidentId }) => {
  const [files, setFiles] = useState<IncidentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<IncidentFile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<IncidentFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 12, // Réduit pour une meilleure performance en grille
    total: 0,
    total_pages: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  
  const { showNotification } = useSimpleNotifications();

  // Charger la liste des fichiers
  const loadFiles = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      console.log(`🔍 Chargement des fichiers de l'incident ${incidentId}, page ${page}`);
      
      const response: IncidentFilesListResponse = await incidentFilesService.getIncidentFiles(
        incidentId, 
        page, 
        pagination.per_page
      );
      
      console.log("📡 Réponse de l'API getIncidentFiles:", response);
      
      if (response.success) {
        const filesArray = Array.isArray(response.data.files) ? response.data.files : [];
        console.log("📄 Fichiers reçus:", filesArray);
        setFiles(filesArray);
        setPagination({
          current_page: response.data.current_page,
          per_page: response.data.per_page,
          total: response.data.total,
          total_pages: response.data.total_pages
        });
        console.log(`✅ ${filesArray.length} fichiers chargés - Total API: ${response.data.total}`);
      } else {
        console.error("❌ Erreur lors du chargement des fichiers:", response.error);
        showNotification({
          type: "error",
          title: "Erreur de chargement",
          message: response.error || "Impossible de charger les fichiers",
          duration: 5000,
        });
        setFiles([]);
      }
      
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error("❌ Erreur lors du chargement des fichiers:", error);
      showNotification({
        type: "error",
        title: "Erreur de chargement",
        message: "Impossible de charger les fichiers de l'incident",
        duration: 5000,
      });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [incidentId, showNotification]);

  // Fonction pour forcer le rechargement après upload
  const reloadFiles = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Rechargement forcé des fichiers de l'incident ${incidentId}`);
      
      const response = await incidentFilesService.getIncidentFiles(
        incidentId, 
        1, // Retourner à la première page
        20  // Taille par défaut
      );
      
      if (response.success) {
        const filesArray = Array.isArray(response.data.files) ? response.data.files : [];
        setFiles(filesArray);
        setPagination({
          current_page: response.data.current_page,
          per_page: response.data.per_page,
          total: response.data.total,
          total_pages: response.data.total_pages
        });
        console.log(`✅ ${filesArray.length} fichiers rechargés`);
      } else {
        console.error("❌ Erreur lors du rechargement des fichiers:", response.error);
        setFiles([]);
      }
      
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error("❌ Erreur lors du rechargement des fichiers:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les fichiers au montage du composant
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Gestionnaire de sélection de fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setShowUploadModal(true);
    }
  };

  // Gestionnaire d'upload de fichiers
  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const filesArray = Array.from(selectedFiles);
    const progressArray: UploadProgress[] = filesArray.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadProgress(progressArray);

    try {
      const uploadPromises = filesArray.map(async (file, index) => {
        const onProgress: UploadProgressCallback = (progress, fileName) => {
          setUploadProgress(prev => prev.map((item, i) => 
            i === index ? { ...item, progress, fileName } : item
          ));
        };

        try {
          const result = await incidentFilesService.uploadFileToIncident(
            incidentId,
            file,
            onProgress
          );

          if (result.success) {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, progress: 100, status: 'success' } : item
            ));
            return result;
          } else {
            setUploadProgress(prev => prev.map((item, i) => 
              i === index ? { ...item, status: 'error' } : item
            ));
            throw new Error(result.message);
          }
        } catch (error) {
          if (isTokenExpiredError(error)) throw error;
          setUploadProgress(prev => prev.map((item, i) =>
            i === index ? { ...item, status: 'error' } : item
          ));
          throw error;
        }
      });

      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (successful > 0) {
        showNotification({
          type: "success",
          title: "Upload terminé",
          message: `${successful} fichier(s) uploadé(s) avec succès${failed > 0 ? `, ${failed} échec(s)` : ''}`,
          duration: 5000,
        });
        
        // Recharger la liste des fichiers
        console.log("🔄 Rechargement de la liste des fichiers après upload...");
        await reloadFiles();
      }

      if (failed > 0 && successful === 0) {
        showNotification({
          type: "error",
          title: "Échec de l'upload",
          message: `Tous les uploads ont échoué (${failed} fichier(s))`,
          duration: 5000,
        });
      }

    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error("❌ Erreur lors de l'upload:", error);
      showNotification({
        type: "error",
        title: "Erreur d'upload",
        message: "Une erreur est survenue lors de l'upload des fichiers",
        duration: 5000,
      });
    } finally {
      setUploading(false);
      setShowUploadModal(false);
      setSelectedFiles(null);
      setUploadProgress([]);
      
      // Réinitialiser l'input file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  // Gestionnaire de téléchargement
  const handleDownload = async (file: IncidentFile) => {
    try {
      showNotification({
        type: "info",
        title: "Téléchargement",
        message: `Téléchargement de ${file.file_name} en cours...`,
        duration: 3000,
      });

      await incidentFilesService.downloadIncidentFile(file.file_url, file.file_name);
      
      showNotification({
        type: "success",
        title: "Téléchargement terminé",
        message: `${file.file_name} a été téléchargé avec succès`,
        duration: 3000,
      });
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error("❌ Erreur lors du téléchargement:", error);
      showNotification({
        type: "error",
        title: "Erreur de téléchargement",
        message: `Impossible de télécharger ${file.file_name}`,
        duration: 5000,
      });
    }
  };

  // Gestionnaire de prévisualisation
  const handlePreview = async (file: IncidentFile) => {
    if (isImageFile(file) || isPdfFile(file) || incidentFilesService.canPreviewFile(file.file_type)) {
      try {
        // PDF : ouvrir dans un nouvel onglet (évite les problèmes CSP avec iframe)
        if (isPdfFile(file)) {
          await incidentFilesService.viewIncidentFile(file.file_url, file.file_name);
          return;
        }
        // Images et autres : afficher dans le modal
        setPreviewFile(file);
        setShowPreviewModal(true);
      } catch (error) {
        if (isTokenExpiredError(error)) throw error;
        console.error('❌ Erreur lors de la prévisualisation:', error);
        showNotification({
          type: "error",
          title: "Erreur de prévisualisation",
          message: "Impossible de prévisualiser ce fichier",
          duration: 3000,
        });
      }
    } else {
      showNotification({
        type: "warning",
        title: "Prévisualisation non disponible",
        message: `Le type de fichier ${file.file_type} ne peut pas être prévisualisé`,
        duration: 3000,
      });
    }
  };

  // Gestionnaire d'ouverture du modal de suppression
  const handleDeleteClick = (file: IncidentFile) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  // Gestionnaire de suppression confirmée
  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setDeleting(true);
    try {
      console.log('🗑️ Suppression du fichier:', fileToDelete);
      
      const result = await incidentFilesService.deleteIncidentFile(fileToDelete.id);
      
      if (result.success) {
        showNotification({
          type: "success",
          title: "Suppression réussie",
          message: result.message || "Fichier supprimé avec succès",
          duration: 3000,
        });
        
        // Recharger la liste des fichiers
        await reloadFiles();
      } else {
        showNotification({
          type: "error",
          title: "Erreur de suppression",
          message: result.error || result.message || 'Erreur lors de la suppression',
          duration: 5000,
        });
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      console.error('❌ Erreur lors de la suppression:', error);
      showNotification({
        type: "error",
        title: "Erreur de suppression",
        message: "Une erreur est survenue lors de la suppression",
        duration: 5000,
      });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setFileToDelete(null);
    }
  };

  // Obtenir les propriétés de style pour un type de fichier
  const getFileStyle = (fileType: string) => {
    const type = (fileType || "").toLowerCase();

    if (type.includes('pdf')) return {
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500',
      gradient: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
    };
    
    if (type.includes('image')) return {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      gradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'
    };
    
    if (type.includes('word') || type.includes('doc')) return {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600',
      gradient: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'
    };
    
    if (type.includes('excel') || type.includes('sheet')) return {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600',
      gradient: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20'
    };
    
    if (type.includes('zip') || type.includes('rar')) return {
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      iconColor: 'text-orange-500',
      gradient: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
    };
    
    if (type.includes('video')) return {
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-500',
      gradient: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'
    };
    
    if (type.includes('audio')) return {
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
      iconColor: 'text-pink-500',
      gradient: 'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20'
    };
    
    // Par défaut
    return {
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-200 dark:border-gray-800',
      iconColor: 'text-gray-500',
      gradient: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20'
    };
  };

  // Obtenir l'icône du type de fichier
  const getFileIcon = (fileType: string, size: "sm" | "md" | "lg" = "md") => {
    const iconSize = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-8 w-8";
    const type = (fileType || "").toLowerCase();
    const style = getFileStyle(fileType);

    if (type.includes('image')) return <FileImage className={`${iconSize} ${style.iconColor}`} />;
    if (type.includes('pdf')) return <FileText className={`${iconSize} ${style.iconColor}`} />;
    if (type.includes('word') || type.includes('doc')) return <FileText className={`${iconSize} ${style.iconColor}`} />;
    if (type.includes('excel') || type.includes('sheet')) return <FileText className={`${iconSize} ${style.iconColor}`} />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive className={`${iconSize} ${style.iconColor}`} />;
    if (type.includes('video')) return <FileVideo className={`${iconSize} ${style.iconColor}`} />;
    if (type.includes('audio')) return <FileAudio className={`${iconSize} ${style.iconColor}`} />;
    
    return <File className={`${iconSize} ${style.iconColor}`} />;
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'upload */}
      <ProfessionalCard
        header={
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SectionHeader
              title={`Fichiers (${pagination.total})`}
              icon={<File className="h-5 w-5" />}
            />
            
            <div className="flex items-center gap-3">
              {/* Barre de recherche */}
              <Input
                placeholder="Rechercher un fichier..."
               
                onChange={(e) => setSearchTerm(e.target.value)}
                startContent={<Search className="h-4 w-4 text-gray-400" />}
                className="max-w-xs"
                size="sm"
              />
              
              {/* Bouton d'upload */}
              <div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <ProfessionalButton 
                  variant="primary" 
                  size="sm"
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={() => {
                    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                    if (fileInput) fileInput.click();
                  }}
                >
                  Ajouter
                </ProfessionalButton>
              </div>
            </div>
          </div>
        }
      >
        {loading ? (
          <LoadingState type="skeleton" skeletonVariant="card" skeletonCount={3} />
        ) : (!Array.isArray(files) || files.length === 0) ? (
          <div className="text-center py-12">
            <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Aucun fichier
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cet incident n'a pas encore de fichiers associés.
            </p>
            <ProfessionalButton 
              variant="primary"
              startContent={<Upload className="h-4 w-4" />}
              onPress={() => {
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.click();
              }}
            >
              Uploader le premier fichier
            </ProfessionalButton>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {Array.isArray(files) && files.map((file) => {
              const fileStyle = getFileStyle(file.file_type);
              return (
                <Card 
                  key={file.id} 
                  className={`hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group border-2 ${fileStyle.borderColor} ${fileStyle.bgColor}`}
                >
                  <CardBody 
                    className="p-3"
                    onClick={(e) => {
                      // Éviter le clic si on clique sur un bouton d'action
                      if ((e.target as HTMLElement).closest('button')) {
                        return;
                      }

                      if (isImageFile(file) || isPdfFile(file) || incidentFilesService.canPreviewFile(file.file_type)) {
                        handlePreview(file);
                      } else {
                        handleDownload(file);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      {/* Icône du fichier dans un conteneur avec gradient */}
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${fileStyle.gradient} flex-shrink-0`}>
                        {getFileIcon(file.file_type, "lg")}
                      </div>
                      
                      {/* Nom du fichier */}
                      <div className="w-full">
                        <Tooltip content={file.file_name}>
                          <h4 className="font-medium text-gray-900 dark:text-white text-xs leading-tight overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word'
                          }}>
                            {file.file_name}
                          </h4>
                        </Tooltip>
                      </div>
                      
                      {/* Informations du fichier */}
                      <div className="w-full text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        {file.file_size > 0 && (
                          <div className="truncate font-medium">
                            {incidentFilesService.formatFileSize(file.file_size)}
                          </div>
                        )}
                        <div className="truncate">
                          {formatDate(file.uploaded_at)}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div 
                        className="flex items-center gap-1 w-full justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(isImageFile(file) || isPdfFile(file) || incidentFilesService.canPreviewFile(file.file_type)) && (
                          <Tooltip content="Prévisualiser">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => handlePreview(file)}
                              className="h-7 w-7 min-w-7"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Tooltip>
                        )}
                        
                        <Tooltip content="Télécharger">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="default"
                            onPress={() => handleDownload(file)}
                            className="h-7 w-7 min-w-7"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                        
                        <Tooltip content="Supprimer">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => handleDeleteClick(file)}
                            className="h-7 w-7 min-w-7"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
            
            {/* Pagination si nécessaire */}
            {pagination.total_pages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-2">
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === pagination.current_page ? "solid" : "flat"}
                      color={page === pagination.current_page ? "primary" : "default"}
                      onPress={() => loadFiles(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ProfessionalCard>

      {/* Modal d'upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => !uploading && setShowUploadModal(false)}
        size="2xl"
        isDismissable={!uploading}
        scrollBehavior="inside"
        classNames={{
          wrapper: "z-[60]",
          backdrop: "z-[59]"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-[#4ba9b7]" />
              <div>
                <h3 className="text-lg font-semibold">Upload de fichiers</h3>
                <p className="text-sm text-gray-600">
                  {selectedFiles?.length || 0} fichier(s) sélectionné(s)
                </p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody>
            <div className="space-y-4">
              {selectedFiles && Array.from(selectedFiles).map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {getFileIcon(file.type, "sm")}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {incidentFilesService.formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  {uploading && uploadProgress[index] && (
                    <div className="flex items-center gap-2">
                      {uploadProgress[index].status === 'uploading' && (
                        <>
                          <Progress
                            size="sm"
                           
                            className="w-20"
                            color="primary"
                          />
                          <Clock className="h-4 w-4 text-blue-500" />
                        </>
                      )}
                      {uploadProgress[index].status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {uploadProgress[index].status === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ModalBody>
          
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setShowUploadModal(false)}
              isDisabled={uploading}
            >
              Annuler
            </Button>
            <Button
              color="primary"
              onPress={handleUpload}
              isLoading={uploading}
              startContent={!uploading ? <Upload className="h-4 w-4" /> : undefined}
            >
              {uploading ? "Upload en cours..." : "Uploader"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          wrapper: "z-[60]",
          backdrop: "z-[59]"
        }}
      >
        <ModalContent>
          {previewFile && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-[#4ba9b7]" />
                  <div>
                    <h3 className="text-lg font-semibold truncate">{previewFile.file_name}</h3>
                    <p className="text-sm text-gray-600">
                      {incidentFilesService.formatFileSize(previewFile.file_size)} • {previewFile.file_type}
                    </p>
                  </div>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <PreviewContent file={previewFile} />
              </ModalBody>
              
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => setShowPreviewModal(false)}
                >
                  Fermer
                </Button>
                <Button
                  color="primary"
                  onPress={() => handleDownload(previewFile)}
                  startContent={<Download className="h-4 w-4" />}
                >
                  Télécharger
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        size="md"
        isDismissable={!deleting}
        classNames={{
          wrapper: "z-[60]",
          backdrop: "z-[59]"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Supprimer le fichier
                </h3>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody>
            {fileToDelete && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Êtes-vous sûr de vouloir supprimer le fichier <strong>{fileToDelete.file_name}</strong> ?
                </p>
                
                <div className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Attention
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Cette action est irréversible. Le fichier sera définitivement supprimé du système.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={() => setShowDeleteModal(false)}
              isDisabled={deleting}
            >
              Annuler
            </Button>
            <Button 
              color="danger" 
              onPress={handleDeleteConfirm}
              isLoading={deleting}
              startContent={!deleting ? <Trash2 className="h-4 w-4" /> : undefined}
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default IncidentFiles;