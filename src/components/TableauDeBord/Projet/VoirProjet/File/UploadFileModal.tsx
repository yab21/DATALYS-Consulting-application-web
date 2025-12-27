"use client"
import React, { useState, useContext } from "react";
import { ShowToastContext } from "@/context/ShowToastContext";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import Toast from "@/components/TableauDeBord/Projet/VoirProjet/Toast";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: () => void;
  parentFolderId: string | null;
  projectId: string;
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ isOpen, onClose, onFileUploaded, parentFolderId, projectId }) => {
  const context = useContext(ShowToastContext) as { setShowToastMsg: (msg: string) => void } | null;
  const setShowToastMsg = context?.setShowToastMsg || (() => {});
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError("Veuillez sélectionner un fichier avant de l'uploader.");
      setShowToast(true);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Simulation d'upload - remplacer par votre logique d'upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Fichier simulé uploadé:", {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        parentFolderId,
        projectId,
        createdAt: new Date().toISOString(),
      });

      // Réinitialiser le formulaire
      setSelectedFile(null);
      onFileUploaded();
      onClose();
      
      setShowToastMsg(`Fichier "${selectedFile.name}" uploadé avec succès !`);

    } catch (error) {
      console.error("Erreur de téléchargement du fichier :", error);
      setError("Erreur lors de l'upload du fichier.");
      setShowToast(true);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    return '📎';
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="2xl"
        classNames={{
          base: "bg-white dark:bg-gray-900 max-h-[90vh]",
          backdrop: "bg-black/50 backdrop-blur-sm",
          wrapper: "z-[9999]",
        }}
      >
        <ModalContent className="border border-gray-200 dark:border-gray-700">
          <ModalHeader className="relative overflow-hidden border-b border-gray-200/50 pb-6 pt-8 dark:border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-50 dark:from-cyan-900/20 dark:via-teal-900/20 dark:to-cyan-900/20"></div>
            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06B6D4] to-teal-600 shadow-xl shadow-cyan-500/25">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  📎 Télécharger un Fichier
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Ajoutez vos documents au projet
                </p>
              </div>
            </div>
          </ModalHeader>
          
          <ModalBody className="px-8 py-6">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Zone de drag & drop stylisée */}
              <div className="relative">
                <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 p-8 transition-all duration-300 hover:border-[#06B6D4] dark:hover:border-cyan-500 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-teal-50 dark:hover:from-cyan-900/20 dark:hover:to-teal-900/20">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#06B6D4] to-teal-600 shadow-lg shadow-cyan-500/25 mb-4">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        Sélectionnez un fichier
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choisissez le fichier que vous souhaitez télécharger
                      </p>
                    </div>
                    
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                      className="cursor-pointer"
                      classNames={{
                        input: "cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gradient-to-r file:from-[#06B6D4] file:to-teal-600 file:text-white file:font-medium file:shadow-lg hover:file:from-cyan-600 hover:file:to-teal-700 file:transition-all file:duration-300",
                        inputWrapper: "bg-transparent border-none shadow-none hover:bg-transparent"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Aperçu du fichier sélectionné */}
              {selectedFile && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-800">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#06B6D4] to-teal-600 text-2xl shadow-lg shadow-cyan-500/25">
                      {getFileIcon(selectedFile.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {selectedFile.name}
                      </h4>
                      <div className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Taille: {formatFileSize(selectedFile.size)}</p>
                        <p>Type: {selectedFile.type || 'Non spécifié'}</p>
                        <p>Dernière modification: {new Date(selectedFile.lastModified).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      onPress={() => setSelectedFile(null)}
                      className="shrink-0"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {/* Informations utiles */}
              <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 p-6">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-[#06B6D4] mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">💡 Informations</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>• Taille maximale: 100 MB</li>
                      <li>• Formats supportés: PDF, Images, Documents Office</li>
                      <li>• Le fichier sera ajouté au dossier courant</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          
          <ModalFooter className="border-t border-gray-200/50 pt-6 pb-8 dark:border-gray-700/50">
            <div className="flex gap-4 w-full">
              <Button
                variant="bordered"
                onPress={onClose}
                isDisabled={isUploading}
                className="flex-1 border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white text-gray-700 font-semibold shadow-lg transition-all duration-300 hover:border-gray-400 hover:from-gray-100 hover:to-gray-50 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300"
                startContent={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              >
                Annuler
              </Button>
              <Button
                color="primary"
                onPress={handleFileUpload}
                isLoading={isUploading}
                isDisabled={!selectedFile}
                className="flex-1 bg-gradient-to-r from-[#06B6D4] to-teal-600 text-white font-bold shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:from-cyan-600 hover:to-teal-700 hover:shadow-cyan-500/40 hover:-translate-y-1"
                startContent={
                  !isUploading && (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )
                }
              >
                {isUploading ? "Téléchargement..." : "🚀 Télécharger"}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {showToast && <Toast msg={error || "Une erreur est survenue"} />}
    </>
  );
}

export default UploadFileModal;
