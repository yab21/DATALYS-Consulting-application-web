"use client";
import moment from "moment/moment";
import Image from "next/image";
import React, { useContext, useState } from "react";
import { ShowToastContext } from "@/context/ShowToastContext";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import RenameModal from "../Common/RenameModal";
import MoveModal from "../Common/MoveModal";

interface FileItemProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    modifiedAt: number;
    imageUrl: string;
    projectId: string;
    isPrivate?: boolean;
  };
  onFileDeleted: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, onFileDeleted }) => {
  const context = useContext(ShowToastContext) as { setShowToastMsg: (msg: string) => void } | null;
  const setShowToastMsg = context?.setShowToastMsg || (() => {});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isUserAdmin] = useState(true); // Simulation - utilisateur est admin
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const deleteFile = async () => {
    try {
      // Simulation de la suppression
      console.log(`Suppression du fichier: ${file.name}`);
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowToastMsg("Fichier supprimé avec succès");
      onFileDeleted();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setShowToastMsg("Erreur lors de la suppression du fichier");
    }
  };

  const togglePrivacy = async () => {
    try {
      // Simulation du changement de visibilité
      console.log(`Changement de visibilité pour: ${file.name}`);
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setShowToastMsg(
        file.isPrivate 
          ? "Fichier rendu public avec succès" 
          : "Fichier rendu privé avec succès"
      );
    } catch (error) {
      console.error("Erreur lors du changement de visibilité:", error);
      setShowToastMsg("Erreur lors du changement de visibilité");
    }
  };

  const handleRename = async (newName: string) => {
    try {
      // Simulation du renommage
      console.log(`Renommage de ${file.name} en ${newName}`);
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowToastMsg("Fichier renommé avec succès");
    } catch (error) {
      console.error("Erreur lors du renommage:", error);
      setShowToastMsg("Erreur lors du renommage");
      throw error;
    }
  };

  const handleMove = async (newParentId: string) => {
    try {
      // Simulation du déplacement
      console.log(`Déplacement de ${file.name} vers le dossier ${newParentId}`);
      
      // Simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setShowToastMsg("Fichier déplacé avec succès");
    } catch (error) {
      console.error("Erreur lors du déplacement:", error);
      setShowToastMsg("Erreur lors du déplacement");
      throw error;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg">
            <Image
              src={file.imageUrl || "/images/icon/file-icon.png"}
              alt={file.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-medium text-dark dark:text-white">
              {file.name}
            </h4>
            <p className="text-sm text-gray-500">
              {formatFileSize(file.size)} • {moment(file.modifiedAt).format("DD/MM/YYYY HH:mm")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {file.isPrivate && (
            <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">
              Privé
            </span>
          )}
          
          <div className="flex gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => setShowRenameModal(true)}
              className="text-blue-600 hover:bg-blue-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </Button>

            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => setShowMoveModal(true)}
              className="text-green-600 hover:bg-green-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </Button>

            {isUserAdmin && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onClick={togglePrivacy}
                className="text-yellow-600 hover:bg-yellow-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  {file.isPrivate ? (
                    <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6z"/>
                  ) : (
                    <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H18c1.1 0 2 .9 2 2v10c0 1.1-.9 2 2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2z"/>
                  )}
                </svg>
              </Button>
            )}

            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={onOpen}
              className="text-red-600 hover:bg-red-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Confirmer la suppression</ModalHeader>
              <ModalBody>
                <p>Êtes-vous sûr de vouloir supprimer le fichier "{file.name}" ?</p>
                <p className="text-sm text-gray-500">Cette action est irréversible.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="danger" onPress={deleteFile}>
                  Supprimer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de renommage */}
      {showRenameModal && (
        <RenameModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          onRename={handleRename}
          currentName={file.name}
          itemType="file"
        />
      )}

      {/* Modal de déplacement */}
      {showMoveModal && (
        <MoveModal
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          onMove={handleMove}
          currentParentId={file.projectId}
          projectId={file.projectId}
          itemType="file"
          currentItemId={file.id}
          itemName={file.name}
        />
      )}
    </>
  );
};

export default FileItem;